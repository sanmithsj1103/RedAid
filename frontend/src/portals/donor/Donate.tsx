import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map as MapIcon, 
  Calendar, 
  User, 
  Activity,
  Heart
} from 'lucide-react';

export const DonorDonate: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-x-hidden font-sans">
      
      {/* Blurred background content mimicking dashboard underneath */}
      <div className="flex-1 opacity-25 filter blur-[2px] pointer-events-none select-none flex flex-col justify-between p-4">
        <div className="bg-[#ba1a1a] p-4 rounded-b-2xl h-36"></div>
        <div className="flex-1 space-y-6 pt-8">
          <div className="bg-white h-24 rounded-2xl border border-slate-200"></div>
          <div className="bg-white h-32 rounded-2xl border border-slate-200"></div>
        </div>
      </div>

      {/* Pop-up Live Urgent Request Card (Centered) */}
      <div className="absolute inset-x-4 top-[25%] z-20">
        <div className="bg-white border border-[#eae7e7] rounded-3xl p-5 shadow-2xl space-y-5 border-t-4 border-t-[#ba1a1a] animate-scale-up">
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#ba1a1a] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
                Live Urgent Request
              </span>
              <h2 className="text-lg font-black text-slate-850 tracking-tight">O+ Blood Needed</h2>
              <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-450 mt-1">
                <span>📍</span>
                <span>City General Hospital • 2.4 km</span>
              </div>
            </div>
            
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#ba1a1a] flex items-center justify-center border border-red-100 shrink-0">
              <span className="text-2xl font-bold leading-none">*</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/donor/request/REQ-8291')}
            className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>Respond Now</span>
            <span>&rarr;</span>
          </button>

          <p className="text-[9px] text-center font-bold text-slate-400">
            Accepting is a commitment to arrive at the facility within 1 hour.
          </p>

        </div>
      </div>

      {/* ================= FOOTER NAVIGATION SYSTEM ================= */}
      <nav className="bg-white border-t border-[#eae7e7] py-2 px-4 flex justify-around items-center sticky bottom-0 z-30 shadow-md">
        
        {/* Home tab */}
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">Home</span>
        </button>

        {/* Map tab */}
        <button 
          onClick={() => navigate('/donor/map')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">Map</span>
        </button>

        {/* Overlapping active Donate tab */}
        <button 
          onClick={() => navigate('/donor/donate')}
          className="relative -mt-6 w-14 h-14 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all transform active:scale-95 ring-4 ring-[#ba1a1a]/30 animate-pulse"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Donate</span>
        </button>

        {/* History tab */}
        <button 
          onClick={() => navigate('/donor/history')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">History</span>
        </button>

        {/* Profile tab */}
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
