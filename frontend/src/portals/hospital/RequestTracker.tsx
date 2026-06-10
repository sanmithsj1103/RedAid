import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Landmark, LayoutDashboard, PlusCircle, Database, Activity, LogOut, ArrowLeft, Heart, Compass, Star, Check, AlertOctagon } from 'lucide-react';
import { api, BloodRequest, DonationResponse } from '../../services/api';
import { MapPlaceholder } from '../../components/MapPlaceholder';
import { Toast, ToastType } from '../../components/Toast';

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

  // Simulated live updates (poll every 3 seconds)
  useEffect(() => {
    fetchTracker();
    const interval = setInterval(fetchTracker, 3000);
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

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  if (loading || !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Live Tracker...</p>
        </div>
      </div>
    );
  }

  // Find active en route donor
  const activeEnRoute = responses.find(r => r.status === 'en_route' || r.status === 'arrived');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Red<span className="text-blue-500">Aid</span></h1>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Hospital Console</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <Link 
              to="/hospital"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/hospital/create"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              <span>Create Request</span>
            </Link>
            <Link 
              to="/hospital/inventory"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Database className="w-4 h-4 text-slate-400" />
              <span>Blood Inventory</span>
            </Link>
            <Link 
              to="/hospital/coordination"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Activity className="w-4 h-4 text-slate-400" />
              <span>Surplus Exchange</span>
            </Link>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-red-900/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Console Logout</span>
        </button>
      </aside>

      {/* Main content body */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/hospital" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Live Request Tracker</h2>
              <p className="text-[10px] text-slate-400 font-medium">Outreach tracking & status dispatching</p>
            </div>
          </div>
          
          {request.status !== 'completed' && request.status !== 'cancelled' && (
            <button 
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-red-50 transition-all"
            >
              Cancel Request
            </button>
          )}
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto max-w-6xl w-full">
          
          {/* Main Grid: Map & Details + Donor Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Request Specs & Live Map */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Request Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Request Identifier: {request.id}</span>
                    <h3 className="text-base font-extrabold text-slate-800 mt-1">
                      Needs {request.unitsRequired} unit(s) of {request.bloodGroup} Blood
                    </h3>
                  </div>
                  <span className={`text-[10px] font-black uppercase border px-2.5 py-0.5 rounded-full ${
                    request.status === 'completed'
                      ? 'bg-green-50 border-green-250 text-green-700'
                      : request.status === 'cancelled'
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'bg-blue-50 border-blue-150 text-blue-700'
                  }`}>
                    {request.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-b border-slate-100 py-3 text-xs font-bold text-slate-700">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block">Priority</span>
                    <span className="text-red-650 uppercase mt-0.5 block">{request.priority}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block">Notified</span>
                    <span className="mt-0.5 block">{request.donorsNotified} eligible donors</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block">Accepted</span>
                    <span className="mt-0.5 block">{request.donorsAccepted} committed</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase block">Fulfilled</span>
                    <span className="text-green-600 mt-0.5 block">{request.unitsFulfilled} units</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{request.notes}"
                </p>
              </div>

              {/* Live Map (Only if accepted/en_route/arrived) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Live Proximity Tracking
                </h4>
                <MapPlaceholder 
                  hospitalName={request.hospitalName} 
                  hospitalLocation={request.hospitalLocation}
                  status={activeEnRoute ? activeEnRoute.status : 'dispatched'}
                />
              </div>
            </div>

            {/* Right Col: Notified Donors List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outreach Donor Responses</h3>
              
              <div className="space-y-3">
                {responses.map(item => (
                  <div 
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{item.donorName}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Reliability index: {item.donorTrustScore.toFixed(0)}%</span>
                      </div>
                      
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                        item.status === 'donated'
                          ? 'bg-green-50 text-green-700 border border-green-150'
                          : item.status === 'no_show'
                          ? 'bg-red-50 text-red-700 border border-red-150'
                          : item.status === 'accepted' || item.status === 'en_route' || item.status === 'arrived'
                          ? 'bg-blue-50 text-blue-700 border border-blue-150 animate-pulse'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Arrived status interaction controls */}
                    {item.status === 'arrived' && (
                      <div className="flex gap-2 border-t border-slate-100 pt-3 mt-3">
                        <button
                          onClick={() => handleMarkNoShow(item.id)}
                          disabled={actionLoading}
                          className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold py-2 shadow-sm transition-all"
                        >
                          Mark No-Show
                        </button>
                        <button
                          onClick={() => handleMarkComplete(item.id)}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold py-2 shadow-sm transition-all"
                        >
                          Verify Donation
                        </button>
                      </div>
                    )}

                    {/* Donated status review prompt */}
                    {item.status === 'donated' && !item.hospitalRating && (
                      <button
                        onClick={() => setFeedbackResponseId(item.id)}
                        className="w-full text-center text-xs font-bold text-blue-650 hover:underline border-t border-slate-100 pt-3 mt-3 block"
                      >
                        Submit Performance Review &rarr;
                      </button>
                    )}
                  </div>
                ))}

                {responses.length === 0 && (
                  <p className="text-xs text-slate-400 text-center font-semibold py-8">
                    No active donor allocations match compatibility requirements currently.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Donor Review Modal */}
      {feedbackResponseId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-scale-up">
            <div className="text-center">
              <Star className="w-10 h-10 text-amber-500 fill-amber-500/20 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">Donor Performance Review</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Rate this donation to help compute the platform donor reliability index score.
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Star selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
                  Overall Rating
                </label>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${
                        rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Input */}
              <div>
                <label htmlFor="review" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Public Feedback (optional)
                </label>
                <textarea
                  id="review"
                  rows={3}
                  placeholder="e.g. Prompt arrival, polite donor, fit and ready."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackResponseId(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Skip Review
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast */}
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
