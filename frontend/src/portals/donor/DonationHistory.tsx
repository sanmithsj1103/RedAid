import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Map, Calendar, User, Heart, Award, FileText, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

export const DonationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: '6.0L',
    totalDonations: '12',
    rank: 'HERO'
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorDonationHistory();
      setHistory(data);
      
      const donor = await api.getDonorProfile();
      if (donor) {
        setStats({
          totalUnits: `${(donor.totalDonations * 0.5).toFixed(1)}L`,
          totalDonations: donor.totalDonations < 10 ? `0${donor.totalDonations}` : `${donor.totalDonations}`,
          rank: donor.totalDonations >= 10 ? 'HERO' : 'CHAMPION'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3.5 flex items-center gap-4 sticky top-0 z-30 shadow-sm shrink-0">
        <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Donation Journey</h2>
          <span className="text-[9px] uppercase tracking-widest text-[#ba1a1a] font-bold">Timeline and achievements</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 space-y-5 overflow-y-auto">
        
        {/* Top Stats Display Widget matching his.png */}
        <div className="bg-[#ba1a1a] text-white rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-white/70 font-black">Rank Level</span>
              <h3 className="text-xl font-black tracking-tight mt-0.5">{stats.rank} RANK</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <Award className="w-5.5 h-5.5 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-white/70 font-black block">Total Infusions</span>
              <span className="text-2xl font-black tracking-tight">{stats.totalDonations}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-widest text-white/70 font-black block">Volume Saved</span>
              <span className="text-2xl font-black tracking-tight">{stats.totalUnits}</span>
            </div>
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest">Donation Timeline</h4>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#ba1a1a] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-[#ba1a1a]">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Begin Your Journey</h4>
              <p className="text-[10.5px] text-slate-450 font-bold leading-relaxed max-w-xs mx-auto">
                No blood donations have been certified on your timeline yet. Your impact will list here dynamically.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-[#ffdad6] ml-3.5 pl-6.5 space-y-6.5 py-2">
              {history.map((item) => (
                <div key={item.response.id} className="relative">
                  
                  {/* Vertical Timeline Dot */}
                  <span className="absolute -left-[37px] top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#ba1a1a] text-white border-2 border-white ring-4 ring-[#ffdad6] shadow-sm z-15">
                    <Heart className="w-2 h-2 fill-white" />
                  </span>

                  {/* Timeline Card */}
                  <div className="bg-white border border-[#eae7e7] rounded-3xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">{item.request?.hospitalName || 'Emergency Center'}</h4>
                        <p className="text-[9.5px] text-slate-450 font-bold mt-1">
                          {new Date(item.response.donatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-xl text-center shrink-0 flex flex-col justify-center">
                        <span className="text-[7px] text-slate-400 font-black uppercase">GROUP</span>
                        <span className="text-xs leading-none font-black text-slate-700 mt-0.5">{item.request?.bloodGroup}</span>
                      </div>
                    </div>

                    {item.response.hospitalFeedback && (
                      <p className="text-[10.5px] text-slate-650 bg-slate-50 border border-slate-100 p-2.5 rounded-2xl italic leading-relaxed">
                        "{item.response.hospitalFeedback}"
                      </p>
                    )}

                    <div className="flex justify-between items-center border-t border-slate-100/80 pt-3 mt-1.5">
                      <span className="text-[8.5px] text-[#ba1a1a] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#ba1a1a] fill-[#ba1a1a]/10" />
                        1 Unit Certified
                      </span>
                      
                      <button
                        onClick={() => navigate(`/donor/certificate/${item.response.id}`)}
                        className="text-[10px] font-black text-[#ba1a1a] uppercase tracking-widest bg-[#ffdad6]/20 hover:bg-[#ffdad6]/40 border border-[#ffdad6] px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Award</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation Bar */}
      <nav className="bg-white border-t border-[#eae7e7] py-2 px-4 flex justify-around items-center sticky bottom-0 z-30 shadow-md shrink-0">
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => navigate('/donor/map')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Map className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">Map</span>
        </button>

        <button 
          onClick={() => navigate('/donor/history')}
          className="flex flex-col items-center gap-1.5 text-white"
        >
          <div className="w-10 h-10 bg-[#ba1a1a] rounded-full flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-[8.5px] font-black uppercase tracking-wider text-[#ba1a1a] -mt-0.5">History</span>
        </button>

        <button 
          onClick={() => navigate('/donor/profile')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">Profile</span>
        </button>
      </nav>

    </div>
  );
};
