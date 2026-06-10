import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Award, Download, ArrowLeft, Heart, Settings, ShieldAlert, Award as BadgeIcon } from 'lucide-react';
import { api } from '../../services/api';

export const DonationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorDonationHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Loading History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between max-w-md mx-auto relative border-x border-surface-container-high shadow-xl">
      {/* Header */}
      <header className="bg-white border-b border-surface-container-high p-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-on-surface">Donation History</h2>
          <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Your Contributions</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {history.length === 0 ? (
          <div className="bg-white border border-surface-container-high rounded-2xl p-8 text-center text-on-surface-variant text-xs font-semibold mt-8">
            <BadgeIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-on-surface mb-1">No Donations Yet</h4>
            <p className="leading-relaxed">
              Your donation records will appear here once verified by a hospital. Let's make your first donation soon!
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-3.5 pl-6 space-y-6 py-2">
            {history.map((item, idx) => (
              <div key={item.response.id} className="relative">
                {/* Timeline Dot */}
                <span className="absolute -left-[32px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white border-2 border-white ring-4 ring-primary/10">
                  <Heart className="w-2.5 h-2.5 fill-white" />
                </span>

                {/* Donation Card */}
                <div className="bg-white border border-surface-container-high rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-extrabold text-on-surface">{item.request?.hospitalName || 'Emergency Center'}</h4>
                      <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
                        {new Date(item.response.donatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1.5 rounded-lg flex flex-col items-center">
                      <span className="text-[8px] text-primary/60 font-semibold uppercase">Group</span>
                      <span className="text-sm leading-none font-extrabold">{item.request?.bloodGroup}</span>
                    </span>
                  </div>

                  {item.response.hospitalFeedback && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                      Hospital note: "{item.response.hospitalFeedback}"
                    </p>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                      1 Unit Certified
                    </span>
                    
                    <button
                      onClick={() => navigate(`/donor/certificate/${item.response.id}`)}
                      className="text-xs font-bold text-primary flex items-center gap-1 hover:underline bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Certificate</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-surface-container-high py-2.5 px-6 flex justify-around sticky bottom-0 z-30 shadow-md">
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Heart className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Dashboard</span>
        </button>
        <button 
          onClick={() => navigate('/donor/history')}
          className="flex flex-col items-center gap-1.5 text-primary"
        >
          <Calendar className="w-5 h-5 fill-primary/15" />
          <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
        </button>
        <button 
          onClick={() => navigate('/donor/settings')}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
        </button>
      </nav>
    </div>
  );
};
