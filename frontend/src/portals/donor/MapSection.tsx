import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Map as MapIcon, 
  Calendar, 
  User, 
  Plus, 
  Minus, 
  Crosshair, 
  Bell,
  Heart,
  ChevronRight,
  Star
} from 'lucide-react';

export const DonorMap: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  const filters = ['All', 'Open Now', '● Critical Need', '< 5km'];

  const hospitals = [
    {
      id: 'hosp_st_jude',
      name: 'St. Jude Medical',
      status: 'CRITICAL',
      distance: '1.2 km',
      units: '3 units O+ needed',
      bgClass: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      id: 'hosp_general',
      name: 'City General Hospital',
      status: 'URGENT',
      distance: '2.4 km',
      units: '1 unit O+ needed',
      bgClass: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      id: 'hosp_city_heart',
      name: 'City Heart Clinic',
      status: 'STANDARD',
      distance: '4.8 km',
      units: '2 units A- needed',
      bgClass: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-x-hidden font-sans">
      
      {/* Top bar */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 100 100" className="w-6 h-6 fill-[#ba1a1a]">
            <path d="M50,5 C30,35 25,60 30,75 C35,90 50,95 50,95 C50,95 65,90 70,75 C75,60 70,35 50,5 Z" />
            <rect x="46" y="50" width="8" height="18" rx="1.5" fill="white" />
            <rect x="41" y="55" width="18" height="8" rx="1.5" fill="white" />
          </svg>
          <span className="font-black text-slate-800 tracking-tight text-sm uppercase">REDAID</span>
        </div>
        <button onClick={() => navigate('/donor/notifications')} className="text-slate-650 hover:text-[#ba1a1a] transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#ba1a1a] rounded-full border border-white"></span>
        </button>
      </header>      {/* Horizontal pill filters */}
      <div className="bg-white px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none border-b border-[#eae7e7]/50 shrink-0 z-20">
        {filters.map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-xs font-black shrink-0 transition-all border flex items-center justify-center min-w-[3.5rem] ${
                isActive 
                  ? 'bg-[#ba1a1a] border-[#ba1a1a] text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Map display pane (Teal/Green SVG Map layout) */}
      <div className="flex-1 relative bg-[#d6ece4] overflow-hidden z-10">
        
        {/* Custom SVG gridlines and streets */}
        <svg className="absolute inset-0 w-full h-full stroke-white/55 stroke-[1.5]" fill="none">
          {/* Gridlines */}
          <line x1="50" y1="0" x2="50" y2="1000" strokeDasharray="4 4" />
          <line x1="150" y1="0" x2="150" y2="1000" strokeDasharray="4 4" />
          <line x1="250" y1="0" x2="250" y2="1000" strokeDasharray="4 4" />
          <line x1="350" y1="0" x2="350" y2="1000" strokeDasharray="4 4" />
          
          <line x1="0" y1="100" x2="500" y2="100" strokeDasharray="4 4" />
          <line x1="0" y1="250" x2="500" y2="250" strokeDasharray="4 4" />
          <line x1="0" y1="400" x2="500" y2="400" strokeDasharray="4 4" />
          <line x1="0" y1="550" x2="500" y2="550" strokeDasharray="4 4" />

          {/* Streets */}
          <path d="M 200,0 C 200,200 150,300 200,450 C 250,600 220,700 220,1000" strokeWidth="8" className="stroke-[#c8e2d9]" />
          <path d="M 0,320 L 500,380" strokeWidth="6" className="stroke-[#c8e2d9]" />
          <path d="M 0,680 Q 200,600 500,750" strokeWidth="6" className="stroke-[#c8e2d9]" />

          {/* Route path to active request */}
          {selectedHospital === 'hosp_general' && (
            <path d="M 210,335 C 210,280 230,220 280,210" stroke="#ba1a1a" strokeWidth="3" strokeDasharray="5 5" className="animate-pulse" />
          )}
        </svg>

        {/* Central blue location dot */}
        <div className="absolute left-[210px] top-[335px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-500/25 animate-ping absolute"></div>
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md relative z-10"></div>
        </div>

        {/* Marker 1: St. Jude CRITICAL (Medical Plus Star) */}
        <div 
          onClick={() => setSelectedHospital('hosp_st_jude')}
          style={{ transform: 'translate(-50%, -16px)' }}
          className="absolute left-[280px] top-[210px] flex flex-col items-center cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${selectedHospital === 'hosp_st_jude' ? 'ring-4 ring-red-400/50' : ''}`}>
            <Star className="w-3.5 h-3.5 fill-white text-white" />
          </div>
          <span className="bg-white border border-[#eae7e7] text-[#ba1a1a] font-black text-[9px] uppercase px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            St. Jude - CRITICAL
          </span>
        </div>

        {/* Marker 2: General Care Plus marker */}
        <div 
          onClick={() => setSelectedHospital('hosp_general')}
          style={{ transform: 'translate(-50%, -14px)' }}
          className="absolute left-[150px] top-[500px] flex flex-col items-center cursor-pointer group"
        >
          <div className={`w-7 h-7 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-lg border border-white transition-transform group-hover:scale-110 ${selectedHospital === 'hosp_general' ? 'ring-4 ring-red-400/50' : ''}`}>
            <Plus className="w-4 h-4" />
          </div>
          <span className="bg-white border border-[#eae7e7] text-slate-800 font-black text-[9px] uppercase px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            General Care
          </span>
        </div>

        {/* Marker 3: Hospital Plus marker top right */}
        <div 
          onClick={() => alert("Simulated: Hospital 3 Details")}
          style={{ transform: 'translate(-50%, -14px)' }}
          className="absolute left-[340px] top-[120px] flex flex-col items-center cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-lg border border-white transition-transform group-hover:scale-110">
            <Plus className="w-4 h-4" />
          </div>
        </div>

        {/* Marker 4: Exclamation Mark Pin (City Heart) */}
        <div 
          onClick={() => setSelectedHospital('hosp_city_heart')}
          style={{ transform: 'translate(-50%, -14px)' }}
          className="absolute left-[360px] top-[470px] flex flex-col items-center cursor-pointer group"
        >
          <div className={`w-7 h-7 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-lg border border-white transition-transform group-hover:scale-110 ${selectedHospital === 'hosp_city_heart' ? 'ring-4 ring-red-400/50' : ''}`}>
            <span className="font-black text-xs">!</span>
          </div>
          <span className="bg-white border border-[#eae7e7] text-[#ba1a1a] font-black text-[9px] uppercase px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
            City Heart
          </span>
        </div>

        {/* Floating map controls on the right */}
        <div className="absolute right-4 top-1/3 flex flex-col gap-2 z-20">
          <button onClick={() => alert("Find my location")} className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-650 shadow-md hover:bg-slate-50">
            <Crosshair className="w-5.5 h-5.5" />
          </button>
          
          <div className="bg-white border border-slate-200 rounded-full flex flex-col shadow-md overflow-hidden">
            <button onClick={() => alert("Zoom In")} className="w-9 h-9 flex items-center justify-center text-slate-655 hover:bg-slate-50 border-b border-slate-100">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => alert("Zoom Out")} className="w-9 h-9 flex items-center justify-center text-slate-655 hover:bg-slate-50">
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom sheet slider */}
        <div className="absolute bottom-4 inset-x-4 bg-white border border-[#eae7e7] rounded-3xl p-4 shadow-2xl space-y-3 z-20">
          {/* Header */}
          <div className="flex justify-between items-baseline">
            <div>
              <h3 className="text-sm font-black text-slate-800">7 Hospitals Nearby</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Click markers for details</p>
            </div>
            <div className="w-10 h-1 bg-slate-205 rounded-full mx-auto self-start -mt-1"></div>
          </div>

          {/* Horizontal scroll list of hospitals */}
          <div className="flex gap-3 overflow-x-auto py-1 scrollbar-none">
            {hospitals.map((h) => {
              const isSelected = selectedHospital === h.id;
              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospital(h.id)}
                  className={`w-44 p-3 border rounded-2xl shrink-0 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'border-[#ba1a1a] bg-[#ffdad6]/10 shadow' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8.5px] font-black uppercase text-slate-400">{h.distance}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase border ${h.bgClass}`}>
                        {h.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 leading-tight">{h.name}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/55">
                    <span className="text-[9px] font-bold text-slate-500">{h.units}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ================= FOOTER MAP NAVIGATION (Active Map Tab) ================= */}
      <nav className="bg-white border-t border-[#eae7e7] py-2 px-4 flex justify-around items-center sticky bottom-0 z-30 shadow-md">
        
        {/* Home tab */}
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[8.5px] font-black uppercase tracking-wider">Home</span>
        </button>

        {/* Map active tab (rounded solid red circle icon) */}
        <button 
          onClick={() => navigate('/donor/map')}
          className="flex flex-col items-center gap-1.5 text-white"
        >
          <div className="w-10 h-10 bg-[#ba1a1a] rounded-full flex items-center justify-center shadow-lg">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[8.5px] font-black uppercase tracking-wider text-[#ba1a1a] -mt-0.5">Map</span>
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
