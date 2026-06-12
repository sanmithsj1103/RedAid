import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Gift, Heart, Calendar, Award, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { api, BloodRequest, DonationResponse } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const DonorNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'donations' | 'certificates'>('all');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (responseId: string, action: 'accept' | 'decline', reqId: string) => {
    try {
      await api.respondToRequest(responseId, action);
      setToast({
        message: action === 'accept' ? 'Emergency Request Accepted! Starting navigation...' : 'Request declined.',
        type: action === 'accept' ? 'success' : 'info'
      });
      // Re-fetch notifications
      fetchNotifications();
      if (action === 'accept') {
        setTimeout(() => {
          navigate(`/donor/navigation/${reqId}`);
        }, 1200);
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    }
  };

  // Filter local listings
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'requests') {
      return n.response.status === 'notified' || n.response.status === 'accepted' || n.response.status === 'declined';
    }
    if (activeTab === 'donations') {
      return n.response.status === 'en_route' || n.response.status === 'arrived';
    }
    if (activeTab === 'certificates') {
      return n.response.status === 'donated';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3.5 flex items-center gap-4 sticky top-0 z-30 shadow-sm shrink-0">
        <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Notifications</h2>
          <span className="text-[9px] uppercase tracking-widest text-[#ba1a1a] font-bold">Activity and dispatch alerts</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-[#eae7e7]/50 shrink-0">
        {(['all', 'requests', 'donations', 'certificates'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-black shrink-0 transition-all border capitalize ${
                isActive 
                  ? 'bg-[#ba1a1a] border-[#ba1a1a] text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main List */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#ba1a1a] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider mt-3">Syncing notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-slate-100 rounded-3xl space-y-3">
            <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">All caught up</h4>
            <p className="text-[10.5px] text-slate-450 font-bold max-w-xs mx-auto leading-relaxed">
              No notifications matching the selected tab are currently available. Check back soon for urgent dispatches.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const { response: resp, request: req } = notif;
            if (!req) return null;

            const isUrgentPending = resp.status === 'notified';
            const isCompleted = resp.status === 'donated';

            if (isUrgentPending) {
              return (
                <div key={resp.id} className="bg-white border border-red-100 rounded-3xl p-4 shadow-sm space-y-3.5 border-l-4 border-l-[#ba1a1a]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                        CRITICAL DISPATCH
                      </span>
                      <h4 className="text-xs font-black text-slate-850 pt-1 leading-tight">
                        Emergency {req.bloodGroup} Needed at {req.hospitalName}
                      </h4>
                      <p className="text-[9.5px] text-slate-450 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        Expires soon (radius {req.searchRadiusKm}km)
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-[#ba1a1a] shrink-0 border border-red-100">
                      <Heart className="w-4 h-4 fill-[#ba1a1a]" />
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-650 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                    "{req.notes}"
                  </p>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => handleRespond(resp.id, 'decline', req.id)}
                      className="flex-1 bg-white border border-slate-200 text-slate-500 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespond(resp.id, 'accept', req.id)}
                      className="flex-1 bg-[#ba1a1a] hover:bg-[#a61717] text-white py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              );
            }

            if (isCompleted) {
              // Certificate release - pink container banner style matching image 2
              return (
                <div 
                  key={resp.id} 
                  onClick={() => navigate(`/donor/certificate/${resp.id}`)}
                  className="bg-[#ffe4e6]/45 border border-[#fda4af]/40 hover:bg-[#ffe4e6]/60 rounded-3xl p-4 shadow-sm space-y-3 cursor-pointer transition-all border-l-4 border-l-rose-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                        CERTIFICATE RELEASED
                      </span>
                      <h4 className="text-xs font-black text-slate-850 pt-1 leading-tight">
                        Donation Certificate CERT-{resp.id.substring(5, 11).toUpperCase()} Available
                      </h4>
                      <p className="text-[9.5px] text-slate-450 font-bold">
                        Thank you for donating 1 unit of {req.bloodGroup} blood at {req.hospitalName}.
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 shrink-0 border border-rose-200 shadow-sm">
                      <Award className="w-5 h-5 fill-rose-500/25" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-rose-600 uppercase tracking-widest pt-1 border-t border-rose-200/50">
                    <span>View appreciation award</span>
                    <ChevronRight className="w-4 h-4 text-rose-500" />
                  </div>
                </div>
              );
            }

            // Other dispatch updates
            return (
              <div key={resp.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-slate-50 text-slate-500 border border-slate-150 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                      DISPATCH STATUS: {resp.status.toUpperCase()}
                    </span>
                    <h4 className="text-xs font-black text-slate-800 mt-1 leading-tight">
                      Accepted Route to {req.hospitalName}
                    </h4>
                  </div>
                  <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/donor/navigation/${req.id}`)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors block text-center"
                >
                  Resume Routing Live
                </button>
              </div>
            );
          })
        )}
      </main>
      
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
