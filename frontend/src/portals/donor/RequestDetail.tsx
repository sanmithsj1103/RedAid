import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, AlertTriangle, Check } from 'lucide-react';
import { api, BloodRequest, DonationResponse } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const DonorRequestDetail: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [response, setResponse] = useState<DonationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
      setToast({ message: 'Error loading request details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!response || !request) return;
    setActionLoading(true);
    try {
      if (response.id.startsWith('resp_sim_')) {
        const currentResponses = JSON.parse(localStorage.getItem('redaid_responses') || '[]');
        if (!currentResponses.some((r: any) => r.id === response.id)) {
          currentResponses.push(response);
          localStorage.setItem('redaid_responses', JSON.stringify(currentResponses));
        }
      }

      await api.respondToRequest(response.id, action);
      
      setToast({
        message: action === 'accept' ? 'Emergency Request Accepted! Heading to Hospital.' : 'Emergency Request Declined.',
        type: action === 'accept' ? 'success' : 'info'
      });

      setTimeout(() => {
        if (action === 'decline') {
          navigate('/donor/dashboard');
        } else {
          // Immediately redirect to route navigation workflow
          navigate(`/donor/navigation/${request.id}`);
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
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center max-w-md mx-auto border-x border-[#eae7e7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ba1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Details...</p>
        </div>
      </div>
    );
  }

  if (!request || !response) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] p-6 flex flex-col justify-center items-center max-w-md mx-auto text-center border-x border-[#eae7e7]">
        <AlertTriangle className="w-12 h-12 text-[#ba1a1a] mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Request Details Missing</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs font-bold">
          This alert has either expired or been completed by another donor.
        </p>
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="mt-6 border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf8f7] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-x-hidden font-sans">
      
      {/* Red Header styled exactly like Image 2 */}
      <header className="bg-[#a61717] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-xl text-white hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h2 className="text-base font-black tracking-tight">Request Detail</h2>
        </div>
        
        {/* Urgent Badge */}
        <div className="bg-[#ba1a1a]/40 border border-[#ffdad6]/25 rounded-lg px-2 py-1 flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider">
          <span className="text-[10px]">⚠️</span>
          <span>URGENT</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto pb-4">
        
        {/* Grid Map Background with route illustration matching Image 2 */}
        <div className="relative h-56 bg-[#ffebeb]/40 border-b border-slate-100 overflow-hidden flex items-center justify-center">
          {/* Custom Pink Gridlines */}
          <svg className="absolute inset-0 w-full h-full stroke-[#ffdad6]/45 stroke-[1.2]" fill="none">
            <line x1="10%" y1="0" x2="10%" y2="100%" />
            <line x1="20%" y1="0" x2="20%" y2="100%" />
            <line x1="30%" y1="0" x2="30%" y2="100%" />
            <line x1="40%" y1="0" x2="40%" y2="100%" />
            <line x1="50%" y1="0" x2="50%" y2="100%" />
            <line x1="60%" y1="0" x2="60%" y2="100%" />
            <line x1="70%" y1="0" x2="70%" y2="100%" />
            <line x1="80%" y1="0" x2="80%" y2="100%" />
            <line x1="90%" y1="0" x2="90%" y2="100%" />
            
            <line x1="0" y1="10%" x2="100%" y2="10%" />
            <line x1="0" y1="20%" x2="100%" y2="20%" />
            <line x1="0" y1="30%" x2="100%" y2="30%" />
            <line x1="0" y1="40%" x2="100%" y2="40%" />
            <line x1="0" y1="50%" x2="100%" y2="50%" />
            <line x1="0" y1="60%" x2="100%" y2="60%" />
            <line x1="0" y1="70%" x2="100%" y2="70%" />
            <line x1="0" y1="80%" x2="100%" y2="80%" />
            <line x1="0" y1="90%" x2="100%" y2="90%" />

            {/* Red dotted road path */}
            <path d="M 40,150 C 120,150 180,80 340,80" stroke="#a61717" strokeWidth="3.5" strokeDasharray="6 5" strokeLinecap="round" />
          </svg>

          {/* Start indicator dot (green) */}
          <div className="absolute left-[30px] top-[140px] flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></div>
            </div>
          </div>

          {/* Location details bubble */}
          <div className="absolute left-[140px] top-[105px] bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 z-10">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#a61717] stroke-[3.5] -rotate-45">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wide">2.4 km away</span>
          </div>

          {/* Hospital indicator badge (red square plus) */}
          <div className="absolute left-[340px] top-[80px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-10 h-10 bg-[#a61717] text-white border-2 border-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer">
              <span className="text-lg font-bold leading-none -mt-0.5">+</span>
            </div>
          </div>

          {/* Overlapping Hospital Card exactly like Image 2 */}
          <div className="absolute bottom-[-24px] inset-x-4 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-lg flex items-center justify-between gap-3.5 z-20">
            <div className="flex items-center gap-3.5">
              {/* O+ group box */}
              <div className="w-14 h-14 bg-[#ba1a1a] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-b-4 border-b-[#8c1214] shrink-0">
                O+
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">{request.hospitalName}</h3>
                <p className="text-[10.5px] text-slate-500 font-bold leading-normal">{request.hospitalAddress.split(',')[0]}, New Delhi</p>
                <p className="text-[9.5px] text-slate-400 font-semibold">{request.searchRadiusKm / 5} km • Verified ✓</p>
              </div>
            </div>
            
            {/* Units needed tag */}
            <div className="bg-[#ffdad6] text-[#ba1a1a] px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase text-center tracking-wide shrink-0 border border-[#ffdad6]/85">
              <span>{request.unitsRequired} units<br/>needed</span>
            </div>
          </div>

        </div>

        {/* Details Table & Information */}
        <div className="mt-10 px-4 space-y-4">
          
          {/* Table Container exactly like Image 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
            
            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Blood group</span>
              <span className="font-black text-slate-800">O Positive ({request.bloodGroup})</span>
            </div>

            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Units required</span>
              <span className="font-black text-slate-800">{request.unitsRequired} units</span>
            </div>

            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Urgency</span>
              <span className="bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                {request.priority === 'critical' ? 'CRITICAL' : 'URGENT'}
              </span>
            </div>

            {/* Donors Responded with segment indicator bar */}
            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">Donors responded</span>
                <span className="font-black text-[#1b855e]">2 of {request.unitsRequired} joined</span>
              </div>
              {/* Green Segment progress bar */}
              <div className="flex gap-1.5 pt-0.5">
                <div className="flex-1 h-2 bg-emerald-600 rounded-full"></div>
                <div className="flex-1 h-2 bg-emerald-600 rounded-full"></div>
                <div className="flex-1 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>

            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Expires in</span>
              <span className="font-black text-[#ba1a1a]">4h 22m</span>
            </div>

          </div>

          {/* Contact Person Card block */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              <span className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider">Contact Person</span>
              <h4 className="text-xs font-black text-slate-800 mt-1">
                Dr. Ramesh <span className="text-slate-400 font-bold">- +91 98100 00000</span>
              </h4>
            </div>
            <a 
              href="tel:+919810000000" 
              className="w-10 h-10 bg-slate-100 border border-slate-200/60 rounded-full flex items-center justify-center text-slate-650 hover:bg-slate-200 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>

        </div>

      </main>

      {/* Sticky footer action bar exactly like Image 2 */}
      <div className="bg-white border-t border-slate-200 p-4 flex gap-3.5 sticky bottom-0 z-30 shadow-md shrink-0 items-center justify-between">
        
        {/* Decline Button (Right) */}
        <button
          onClick={() => handleRespond('decline')}
          disabled={actionLoading}
          className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors text-center"
        >
          Decline
        </button>

        {/* I'll Donate Button (Left) */}
        <button
          onClick={() => handleRespond('accept')}
          disabled={actionLoading}
          className="flex-[2] bg-[#a61717] hover:bg-[#8c1214] text-white py-3 px-5 rounded-3xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center"
        >
          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
            <span>I'll Donate</span>
            <Check className="w-4 h-4" />
          </span>
          <span className="text-[8.5px] text-[#ffdad6]/80 font-bold lowercase tracking-normal mt-0.5">
            Confirm your donation
          </span>
        </button>

      </div>

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
