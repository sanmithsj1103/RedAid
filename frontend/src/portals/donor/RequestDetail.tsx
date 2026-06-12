import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, MessageSquare, AlertTriangle, CheckCircle, Navigation, Award, Heart } from 'lucide-react';
import { api, BloodRequest, DonationResponse } from '../../services/api';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { Toast, ToastType } from '../../components/Toast';

export const DonorRequestDetail: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [response, setResponse] = useState<DonationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [requestId]);

  const fetchDetail = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const donorNotifications = await api.getDonorNotifications();
      // Backend returns joined data: each notification has bloodRequests (joined) and flat fields
      const match = donorNotifications.find((n: any) => {
        const reqId = n.requestId || n.request_id || n.bloodRequests?.id || n.request?.id;
        return reqId === requestId;
      });
      if (match) {
        // Transform the backend shape into the component's expected shape
        const req = match.bloodRequests || match.request;
        if (req) {
          // Build a BloodRequest-like object from joined data
          const hospital = req.hospitals || {};
          const requestObj = {
            id: req.id,
            hospitalId: req.hospitalId || req.hospital_id,
            hospitalName: hospital.name || '',
            hospitalPhone: hospital.phone || '',
            hospitalAddress: hospital.address || '',
            hospitalLocation: hospital.location || { lat: 0, lng: 0, city: hospital.city || '' },
            bloodGroup: req.bloodGroup || req.blood_group,
            unitsRequired: req.unitsRequired || req.units_required || 0,
            unitsFulfilled: req.unitsFulfilled || req.units_fulfilled || 0,
            priority: req.priority,
            status: req.status,
            notes: req.notes || '',
            searchRadiusKm: req.searchRadiusKm || 15,
            donorsNotified: req.donorsNotified || 0,
            donorsAccepted: req.donorsAccepted || 0,
            expiresAt: req.expiresAt || req.expires_at || '',
            createdAt: req.createdAt || req.created_at || '',
          };
          setRequest(requestObj as any);
          // The response (donation_response) is the notification itself
          setResponse({
            id: match.id,
            requestId: requestObj.id,
            donorId: match.donorId || match.donor_id || '',
            donorName: match.donorName || '',
            donorPhone: match.donorPhone || '',
            donorBloodGroup: match.donorBloodGroup || match.donor_blood_group || '',
            donorTrustScore: match.donorTrustScore || 0,
            status: match.status,
            notifiedAt: match.notifiedAt || match.notified_at || '',
            respondedAt: match.respondedAt,
            arrivedAt: match.arrivedAt,
            donatedAt: match.donatedAt,
          } as any);
        }
      } else {
        // Fallback for checking directly active requests
        const active = await api.getDonorActiveRequest();
        if (active && (active.request?.id === requestId || active.requestId === requestId)) {
          setRequest(active.request || null);
          setResponse(active.response || active);
        } else {
          setToast({ message: 'Request not found', type: 'error' });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!response) return;
    setActionLoading(true);
    try {
      await api.respondToRequest(response.id, action);
      setToast({
        message: action === 'accept' ? 'Emergency Request Accepted! Heading to Hospital.' : 'Emergency Request Declined.',
        type: action === 'accept' ? 'success' : 'info'
      });
      // Re-fetch details to update UI state
      setTimeout(() => {
        if (action === 'decline') {
          navigate('/donor/dashboard');
        } else {
          fetchDetail();
        }
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'en_route' | 'arrived') => {
    if (!response) return;
    setActionLoading(true);
    try {
      await api.updateDonorResponseStatus(response.id, status);
      setToast({
        message: status === 'en_route' ? 'Status updated to: En Route!' : 'You have arrived at the hospital!',
        type: 'success'
      });
      setTimeout(fetchDetail, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Note: In production, donation completion is handled by the hospital.
  // This is kept for development/testing only.
  const handleSimulateCompletion = async () => {
    if (!response || !requestId) return;
    setToast({ message: 'Waiting for hospital staff to verify your donation...', type: 'info' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Loading Request Details...</p>
        </div>
      </div>
    );
  }

  if (!request || !response) {
    return (
      <div className="min-h-screen bg-surface p-6 flex flex-col justify-center items-center max-w-md mx-auto text-center">
        <AlertTriangle className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-lg font-bold text-on-surface">Emergency Request Missing</h3>
        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-xs">
          This alert has either expired, been cancelled, or is not allocated to your donor profile.
        </p>
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="mt-6 border border-surface-container-high bg-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const priorityColors = {
    critical: 'bg-red-500 text-white',
    urgent: 'bg-amber-500 text-white',
    scheduled: 'bg-blue-500 text-white',
  }[request.priority];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between max-w-md mx-auto relative border-x border-surface-container-high shadow-xl pb-6">
      {/* Header */}
      <header className="bg-white border-b border-surface-container-high p-4 flex items-center sticky top-0 z-30 shadow-sm gap-4">
        <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-on-surface">Emergency Request</h2>
          <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Details & Navigation</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Priority Banner */}
        <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-bold ${priorityColors}`}>
          <span className="uppercase tracking-wider">{request.priority} Emergency Alert</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Active</span>
        </div>

        {/* Hospital Card */}
        <div className="bg-white border border-surface-container-high rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-extrabold text-on-surface">{request.hospitalName}</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {request.hospitalAddress}
              </p>
            </div>
            
            <div className="bg-primary/5 text-primary border border-primary/10 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold">
              <span className="text-[8px] uppercase font-semibold text-primary/60">Needed</span>
              <span className="text-sm leading-tight font-black">{request.bloodGroup}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-3 text-xs font-semibold text-on-surface-variant">
            <a href={`tel:${request.hospitalPhone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span>Call Hospital</span>
            </a>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-500" />
              <span>4.2 km away (12 mins)</span>
            </span>
          </div>
        </div>

        {/* Notes from Hospital */}
        <div className="bg-white border border-surface-container-high rounded-2xl p-4 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            Message from Coordinates
          </h4>
          <p className="text-xs text-on-surface leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            "{request.notes || 'No special notes provided. Please proceed immediately.'}"
          </p>
        </div>

        {/* Map Section */}
        {response.status !== 'notified' && response.status !== 'declined' && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Live Route Map</h4>
            <MapPlaceholder 
              hospitalName={request.hospitalName} 
              hospitalLocation={request.hospitalLocation}
              status={response.status}
            />
          </div>
        )}

        {/* Action Controls based on status */}
        <div className="border-t border-slate-100 pt-4 mt-6">
          {response.status === 'notified' && (
            <div className="space-y-3">
              <p className="text-[10px] text-center text-on-surface-variant font-medium leading-relaxed">
                By accepting, you commit to travel to the medical center within 30 minutes. Your coordinates will be shared with the hospital staff.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRespond('decline')}
                  disabled={actionLoading}
                  className="flex-1 border border-surface-container-high bg-white text-on-surface-variant hover:bg-slate-50 py-3.5 px-4 rounded-xl text-sm font-bold transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleRespond('accept')}
                  disabled={actionLoading}
                  className="flex-1 bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Accept & Travel
                </button>
              </div>
            </div>
          )}

          {response.status === 'accepted' && (
            <button
              onClick={() => handleUpdateStatus('en_route')}
              disabled={actionLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4 text-white animate-pulse" />
              <span>Tap to start journey (Set En Route)</span>
            </button>
          )}

          {response.status === 'en_route' && (
            <button
              onClick={() => handleUpdateStatus('arrived')}
              disabled={actionLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Tapped: I have Arrived at Hospital</span>
            </button>
          )}

          {response.status === 'arrived' && (
            <div className="bg-white border border-surface-container-high rounded-2xl p-4 text-center space-y-4 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Arrival Verified</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  You are registered as arrived. Please coordinate with the medical staff to complete the donation.
                </p>
              </div>

              {/* Simulation Helper */}
              <div className="border-t border-dashed border-slate-200 pt-3 mt-3 space-y-2">
                <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block">Simulation Console</span>
                <button
                  onClick={handleSimulateCompletion}
                  disabled={actionLoading}
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-2 px-4 rounded-lg text-xs font-bold transition-all"
                >
                  Simulate Hospital Completing Donation
                </button>
              </div>
            </div>
          )}

          {response.status === 'donated' && (
            <div className="bg-white border border-surface-container-high rounded-2xl p-4 text-center space-y-3 shadow-sm">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <Award className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Donation Successful!</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  Thank you for your generous contribution. You have saved a life. Your certificate is generated and ready to download!
                </p>
              </div>
              <button
                onClick={() => navigate('/donor/history')}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm"
              >
                View Certificate
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Global Toast component */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};
