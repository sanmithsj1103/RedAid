import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Calendar, 
  User, 
  Settings, 
  ShieldCheck, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  Heart,
  Power,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { api, Donor } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const DonorProfile: React.FC = () => {
  const navigate = useNavigate();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorProfile();
      setDonor(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!donor) return;
    try {
      const nextStatus = donor.availability === 'active' ? 'unavailable' : 'active';
      const updated = await api.setAvailability(nextStatus);
      setDonor(updated);
      setToast({ 
        message: `Availability updated to: ${nextStatus.toUpperCase()}`, 
        type: 'success' 
      });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center max-w-md mx-auto border-x border-[#eae7e7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ba1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] p-6 flex flex-col justify-center items-center max-w-md mx-auto text-center border-x border-[#eae7e7]">
        <h3 className="text-lg font-black text-slate-850 uppercase">Session Expired</h3>
        <button 
          onClick={() => navigate('/donor/login')}
          className="mt-6 bg-[#ba1a1a] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#ba1a1a] fill-[#ba1a1a]" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Donor Profile</h2>
        </div>
        <button 
          onClick={() => navigate('/donor/settings')}
          className="p-1 rounded-xl text-slate-650 hover:text-[#ba1a1a] transition-colors"
        >
          <Settings className="w-5.5 h-5.5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 space-y-6 overflow-y-auto">
        
        {/* Profile Card Frame matching prof.png */}
        <div className="flex flex-col items-center text-center space-y-3.5">
          {/* Avatar Photo Frame with blood group badge */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden font-black text-2xl text-slate-500">
              {donor.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            
            {/* Blood Type corner badge */}
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#ba1a1a] border-2 border-white text-white flex items-center justify-center font-black text-xs shadow-md">
              {donor.bloodGroup}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-850 tracking-tight leading-none">{donor.fullName}</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Verified Hero Donor
            </p>
          </div>
        </div>

        {/* Triple Stat Boxes row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#eae7e7] rounded-2.5xl p-3.5 text-center shadow-sm">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Donations</span>
            <span className="text-lg font-black text-slate-800 block mt-1">{donor.totalDonations}</span>
          </div>
          <div className="bg-white border border-[#eae7e7] rounded-2.5xl p-3.5 text-center shadow-sm">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Trust Score</span>
            <span className="text-lg font-black text-slate-800 block mt-1">{donor.trustScore}%</span>
          </div>
          <div className="bg-white border border-[#eae7e7] rounded-2.5xl p-3.5 text-center shadow-sm">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Badges</span>
            <span className="text-lg font-black text-[#ba1a1a] block mt-1">{donor.badges.length}</span>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="bg-white border border-[#eae7e7] rounded-3xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Unlocked Awards</h4>
          <div className="flex flex-wrap gap-2">
            {donor.badges.map((b) => (
              <span 
                key={b} 
                className="bg-[#ffdad6]/15 text-[#ba1a1a] border border-[#ffdad6]/60 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl"
              >
                🏆 {b.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Action Menu List */}
        <div className="bg-white border border-[#eae7e7] rounded-3xl p-1.5 shadow-sm divide-y divide-slate-100">
          
          {/* Availability Toggle item */}
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800">My Availability</h4>
              <p className="text-[9.5px] text-slate-450 font-bold uppercase tracking-wide">
                Status: {donor.availability.toUpperCase()}
              </p>
            </div>
            <button 
              onClick={handleToggleAvailability}
              className="text-[#ba1a1a] hover:opacity-80 transition-opacity"
            >
              {donor.availability === 'active' ? (
                <ToggleRight className="w-10 h-10 text-[#ba1a1a]" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>

          {/* Donation Guide Link */}
          <div 
            onClick={() => navigate('/donor/guide')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-black text-slate-700">Donation Rules & Guide</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Settings Link */}
          <div 
            onClick={() => navigate('/donor/settings')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-black text-slate-700">Account Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

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
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">History</span>
        </button>

        <button 
          onClick={() => navigate('/donor/profile')}
          className="flex flex-col items-center gap-1.5 text-white"
        >
          <div className="w-10 h-10 bg-[#ba1a1a] rounded-full flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-[8.5px] font-black uppercase tracking-wider text-[#ba1a1a] -mt-0.5">Profile</span>
        </button>
      </nav>

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
