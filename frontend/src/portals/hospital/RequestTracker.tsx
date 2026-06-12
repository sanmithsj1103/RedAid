import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Compass, Star, Check, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { api, BloodRequest, DonationResponse } from '../../services/api';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { Toast, ToastType } from '../../components/Toast';
import { HospitalLayout } from './HospitalLayout';

export const RequestTracker: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [responses, setResponses] = useState<DonationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Feedback Form states
  const [feedbackResponseId, setFeedbackResponseId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Simulated live updates (poll every 4 seconds)
  useEffect(() => {
    fetchTracker();
    const interval = setInterval(fetchTracker, 4000);
    return () => clearInterval(interval);
  }, [requestId]);

  const fetchTracker = async () => {
    if (!requestId) return;
    try {
      const data = await api.getLiveRequestTracker(requestId);
      setRequest(data.request);
      setResponses(data.responses);
      if (loading) setLoading(false);
    } catch (err) {
      console.error(err);
      if (loading) {
        setToast({ message: 'Request tracker failed to load.', type: 'error' });
        setLoading(false);
      }
    }
  };

  const handleCancel = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await api.cancelRequest(requestId);
      setToast({ message: 'Emergency Blood Request has been cancelled.', type: 'info' });
      fetchTracker();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkComplete = async (responseId: string) => {
    setActionLoading(true);
    try {
      await api.markDonationComplete(responseId);
      setToast({ message: 'Donation verified successfully! Certifying donor...', type: 'success' });
      setFeedbackResponseId(responseId); // Open feedback submission form
      fetchTracker();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async (responseId: string) => {
    setActionLoading(true);
    try {
      await api.markDonorNoShow(responseId);
      setToast({ message: 'Donor registered as No-Show. Reliability index updated.', type: 'warning' });
      fetchTracker();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackResponseId) return;
    setActionLoading(true);
    try {
      await api.submitDonorFeedback(feedbackResponseId, rating, feedback);
      setToast({ message: 'Donor rating and reviews submitted successfully!', type: 'success' });
      setFeedbackResponseId(null);
      setFeedback('');
      setRating(5);
      fetchTracker();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to submit feedback', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !request) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Live Tracker...</p>
        </div>
      </div>
    );
  }

  // Find active en route donor
  const activeEnRoute = responses.find(r => r.status === 'en_route' || r.status === 'arrived');

  const getRequestStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'cancelled':
        return 'bg-slate-50 border-slate-200 text-slate-500';
      default:
        return 'bg-[#fff5f5] border-primary text-primary';
    }
  };

  return (
    <HospitalLayout searchPlaceholder="Search donors or tracking items...">
      <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
        
        {/* Back Link & Page Title */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <Link 
              to="/hospital/requests" 
              className="p-2 border border-[#eae7e7] bg-white rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-slate-650" />
            </Link>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Live Request Tracker</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Outreach tracking & status dispatching</p>
            </div>
          </div>
          
          {request.status !== 'completed' && request.status !== 'cancelled' && (
            <button 
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-white border border-[#ffdad6] text-primary hover:bg-[#fff5f5] px-4 py-2 rounded-lg text-xs font-black shadow-sm transition-colors"
            >
              Cancel Request
            </button>
          )}
        </div>

        {/* Main Grid content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (2/3 width) - Map & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Request Details Info Card */}
            <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Request Identifier: #{request.id}</span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1">
                    Needs {request.unitsRequired} unit(s) of {request.bloodGroup} Blood
                  </h3>
                </div>
                <span className={`text-[9px] font-black uppercase border px-2.5 py-0.5 rounded-full ${getRequestStatusStyles(request.status)}`}>
                  {request.status === 'dispatched' ? 'notified' : request.status}
                </span>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-b border-slate-100 py-4 text-xs font-bold text-slate-600">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Priority</span>
                  <span className="text-primary uppercase mt-0.5 block font-black">{request.priority}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Notified</span>
                  <span className="mt-0.5 block text-slate-800">{request.donorsNotified} matching donors</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Accepted</span>
                  <span className="mt-0.5 block text-slate-800">{request.donorsAccepted} committed</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Fulfilled</span>
                  <span className="text-green-600 mt-0.5 block font-black">{request.unitsFulfilled} units</span>
                </div>
              </div>

              {/* Patient details & Notes */}
              <div className="bg-[#fcf9f8] p-4 rounded-xl border border-[#eae7e7]/60">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Case specifications</span>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {request.notes}
                </p>
              </div>
            </div>

            {/* Live Map Card */}
            <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Compass className="w-4.5 h-4.5 text-primary" />
                Live Proximity Tracking
              </h4>
              
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <MapPlaceholder 
                  hospitalName={request.hospitalName} 
                  hospitalLocation={request.hospitalLocation}
                  status={activeEnRoute ? activeEnRoute.status : 'dispatched'}
                />
              </div>
            </div>

          </div>

          {/* Right Column (1/3 width) - Outreach Donors list */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">Outreach Donor Responses</h3>
            
            <div className="space-y-4">
              {responses.map(item => (
                <div 
                  key={item.id}
                  className="bg-white border border-[#eae7e7] rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{item.donorName}</h4>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">Reliability Index: {item.donorTrustScore.toFixed(0)}%</span>
                    </div>
                    
                    <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                      item.status === 'donated'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : item.status === 'no_show'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : item.status === 'accepted' || item.status === 'en_route' || item.status === 'arrived'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Operational controls */}
                  {item.status === 'arrived' && (
                    <div className="flex gap-2.5 border-t border-slate-100 pt-3.5 mt-2">
                      <button
                        onClick={() => handleMarkNoShow(item.id)}
                        disabled={actionLoading}
                        className="flex-1 bg-white border border-[#ffdad6] hover:bg-[#fff5f5] text-primary rounded-lg text-xs font-bold py-2 shadow-sm transition-colors"
                      >
                        Mark No-Show
                      </button>
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        disabled={actionLoading}
                        className="flex-1 bg-[#22c55e] hover:bg-[#166534] text-white rounded-lg text-xs font-bold py-2 shadow-sm transition-colors"
                      >
                        Verify Donation
                      </button>
                    </div>
                  )}

                  {/* Performance review trigger link */}
                  {item.status === 'donated' && !item.hospitalRating && (
                    <button
                      onClick={() => setFeedbackResponseId(item.id)}
                      className="w-full text-center text-xs font-bold text-primary hover:underline border-t border-slate-100 pt-3 block"
                    >
                      Submit Performance Review &rarr;
                    </button>
                  )}
                </div>
              ))}

              {responses.length === 0 && (
                <div className="bg-white border border-[#eae7e7] rounded-2xl p-8 text-center text-slate-400 text-xs font-semibold">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No active donor responses matched yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Review Dialog Modal */}
      {feedbackResponseId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-scale-up">
            <div className="text-center">
              <div className="w-10 h-10 bg-[#fefce8] text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 fill-amber-500" />
              </div>
              <h3 className="text-base font-black text-slate-800">Donor Performance Review</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Rate this donation response to help calculate the donor reliability index.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Star controls */}
              <div className="flex justify-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star className={`w-6 h-6 ${
                      rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                    }`} />
                  </button>
                ))}
              </div>

              {/* Feedback Notes */}
              <div>
                <label htmlFor="fb" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Public Feedback (optional)
                </label>
                <textarea
                  id="fb"
                  rows={2}
                  placeholder="e.g. Prompt arrival, polite donor, fit and ready."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-xs focus:outline-none focus:border-primary/45 focus:bg-white transition-all"
                />
              </div>

              {/* Dialog Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeedbackResponseId(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 py-2 rounded-lg text-xs font-bold transition-all"
                >
                  Skip Review
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-primary hover:bg-[#c0392b] text-white py-2 rounded-lg text-xs font-black shadow transition-all"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Alerts */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </HospitalLayout>
  );
};
