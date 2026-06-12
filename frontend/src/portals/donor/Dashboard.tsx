import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  ChevronRight, 
  Home, 
  Map as MapIcon, 
  Calendar, 
  User, 
  X, 
  BookOpen,
  LayoutDashboard
} from 'lucide-react';
import { api, Donor, BloodRequest } from '../../services/api';

export const DonorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const profile = await api.getDonorProfile();
      setDonor(profile);

      const notifications = await api.getDonorNotifications();
<<<<<<< HEAD
      // Filter responses that are 'notified' to show as active alerts
      const activeAlerts = notifications.filter(n => n.response.status === 'notified');
=======
      // Backend returns donation_response rows with joined bloodRequests
      // Transform into { response, request } shape for the template
      const transformed = (notifications || []).map((n: any) => {
        const req = n.bloodRequests || {};
        const hospital = req.hospitals || {};
        return {
          response: {
            id: n.id,
            status: n.status,
            notifiedAt: n.notifiedAt || n.notified_at,
          },
          request: {
            id: req.id || n.requestId || n.request_id,
            hospitalName: hospital.name || '',
            hospitalAddress: hospital.address || '',
            hospitalPhone: hospital.phone || '',
            bloodGroup: req.bloodGroup || req.blood_group || '',
            unitsRequired: req.unitsRequired || req.units_required || 0,
            priority: req.priority || 'urgent',
            status: req.status || '',
          },
        };
      });
      const activeAlerts = transformed.filter((n: any) => n.response.status === 'notified');
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4
      setAlerts(activeAlerts);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      navigate('/donor/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !donor) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ba1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic donation stats
  const lastDonatedDate = donor.lastDonatedAt ? new Date(donor.lastDonatedAt) : null;
  const daysSinceLast = lastDonatedDate 
    ? Math.floor((Date.now() - lastDonatedDate.getTime()) / (1000 * 60 * 60 * 24)) 
    : 120; // Default to 120 if never donated
  const daysRemaining = Math.max(0, 90 - daysSinceLast);
  const progressPercent = Math.min(100, Math.floor((daysSinceLast / 90) * 100));
  const isEligible = daysRemaining === 0;

  // Static mock nearby requests matching Dash.png
  const nearbyRequests = [
    {
      id: 'req_apollo',
      hospitalName: 'Apollo Clinic',
      distance: '3.1 km',
      units: '2 units',
      time: '5m ago',
      bloodGroup: 'A-',
      priority: 'Urgent',
      borderClass: 'border-l-red-500',
      bgClass: 'bg-red-50/40 text-red-700'
    },
    {
      id: 'req_st_mary',
      hospitalName: "St. Mary's Hospital",
      distance: '5.8 km',
      units: '1 unit',
      time: '18m ago',
      bloodGroup: 'O+',
      priority: 'Standard',
      borderClass: 'border-l-orange-500',
      bgClass: 'bg-orange-50/40 text-orange-700'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-x-hidden font-sans">
      
      {/* ================= LEFT SLIDER DRAWER (image 3) ================= */}
      {menuOpen && (
        <div className="absolute inset-0 bg-slate-900/60 z-50 transition-opacity flex">
          {/* Drawer content */}
          <div className="w-[75%] bg-white h-full p-5 flex flex-col space-y-6 shadow-2xl animate-slide-in relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-base font-black text-[#ba1a1a] tracking-wider uppercase">REDAID MENU</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-3 flex-1 pt-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/donor/dashboard');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 bg-[#ffdad6]/40 text-[#ba1a1a] rounded-xl text-sm font-black transition-all"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/donor/guide');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-black transition-all"
              >
                <BookOpen className="w-5 h-5 text-slate-400" />
                <span>Donation Guide</span>
              </button>
            </nav>

            {/* Logout button in drawer - rounded-full outline matching Image 4 */}
            <div className="pt-4 border-t border-slate-100/50">
              <button
                onClick={async () => {
                  await api.logout();
                  navigate('/donor/login');
                }}
                className="w-full py-3.5 border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/5 rounded-full text-xs font-black uppercase tracking-widest transition-colors text-center"
              >
                LOGOUT
              </button>
            </div>
          </div>

          {/* Click away area */}
          <div className="flex-1" onClick={() => setMenuOpen(false)}></div>
        </div>
      )}

      {/* Main content pane */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-4">
        
        {/* Red header area */}
        <div className="bg-[#ba1a1a] text-white p-5 rounded-b-[2rem] space-y-4 shadow relative shrink-0">
          {/* Top row */}
          <div className="flex justify-between items-center">
            <button onClick={() => setMenuOpen(true)} className="text-white hover:opacity-80 transition-opacity">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-black tracking-wider uppercase">REDAID</span>
            <button 
              onClick={() => navigate('/donor/notifications')} 
              className="text-white relative hover:opacity-80 transition-opacity"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#ba1a1a] rounded-full text-[9px] font-black flex items-center justify-center border border-[#ba1a1a]">
                2
              </span>
            </button>
          </div>

          {/* User welcome */}
          <div className="space-y-1.5 pt-2 pb-6">
            <h2 className="text-xl font-bold tracking-tight">
              Good morning, {donor.fullName.split(' ')[0]} 👋
            </h2>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {isEligible ? 'Eligible' : 'Not Eligible'}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                {donor.bloodGroup}
              </span>
            </div>
          </div>
        </div>

        {/* Overlapping Floating Banner Card */}
        <div className="px-4 -mt-6 relative z-10">
          <div className="bg-white border-l-4 border-l-[#ba1a1a] border border-[#eae7e7] rounded-2xl p-4 shadow-md flex justify-between items-center gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#ba1a1a]">⚠️ Urgent</span>
              <h3 className="text-base font-black text-slate-850 tracking-tight">{donor.bloodGroup} Blood Needed</h3>
              <p className="text-[10px] font-bold text-slate-450">City General Hospital • 2.4 km</p>
            </div>
            
            <button
              onClick={() => navigate('/donor/request/REQ-8291')}
              className="bg-[#ba1a1a] hover:bg-[#93000a] text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm hover:shadow shrink-0"
            >
              Respond Now &rarr;
            </button>
          </div>
        </div>

        {/* Your Activity metrics */}
        <div className="px-4 pt-6 space-y-3">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Your Activity</h4>
          <div className="grid grid-cols-3 gap-3">
            
            {/* Donations lifetime */}
            <div className="bg-white border-t-2 border-t-[#ba1a1a] border border-[#eae7e7] rounded-2xl p-3 text-center shadow-sm flex flex-col justify-between">
              <span className="text-2xl font-black text-[#ba1a1a]">{donor.totalDonations}</span>
              <span className="text-[8.5px] font-black uppercase text-slate-450 leading-tight mt-1">Donations Lifetime</span>
            </div>

            {/* Days since last */}
            <div className="bg-white border-t-2 border-t-[#ba1a1a] border border-[#eae7e7] rounded-2xl p-3 text-center shadow-sm flex flex-col justify-between">
              <span className="text-2xl font-black text-[#ba1a1a]">{daysSinceLast}</span>
              <span className="text-[8.5px] font-black uppercase text-slate-455 leading-tight mt-1">Days Since Last</span>
            </div>

            {/* Lives saved */}
            <div className="bg-white border-t-2 border-t-[#ba1a1a] border border-[#eae7e7] rounded-2xl p-3 text-center shadow-sm flex flex-col justify-between">
              <span className="text-2xl font-black text-[#ba1a1a]">{donor.totalDonations * 3}</span>
              <span className="text-[8.5px] font-black uppercase text-slate-455 leading-tight mt-1">Lives Saved Est. Impact</span>
            </div>

          </div>
        </div>

        {/* Nearby Requests list */}
        <div className="px-4 pt-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nearby Requests</h4>
            <button 
              onClick={() => navigate('/donor/map')}
              className="text-xs font-black text-[#ba1a1a] hover:underline"
            >
              See all
            </button>
          </div>

          <div className="space-y-3">
            {nearbyRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/donor/request/REQ-8291`)}
                className={`bg-white border border-[#eae7e7] rounded-2xl p-3.5 shadow-sm border-l-4 ${req.borderClass} flex items-center justify-between cursor-pointer hover:shadow transition-shadow`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${req.bgClass}`}>
                    {req.bloodGroup}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-850">{req.hospitalName}</h5>
                    <p className="text-[10px] font-bold text-slate-450 mt-0.5">{req.distance} • {req.units} • {req.time}</p>
                    <span className="text-[9px] font-semibold text-slate-400 italic">Tap card to respond</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                    req.priority === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {req.priority}
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility Progress card */}
        <div className="px-4 pt-6">
          <div className="bg-[#ffdad6]/20 border border-[#ffdad6]/50 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-baseline text-[10px] font-black uppercase tracking-wider text-slate-650">
              <span>Next eligible to donate in</span>
              <span>{progressPercent}%</span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-[#ba1a1a]">
                {isEligible ? 'Eligible Now!' : `${daysRemaining} days`}
              </span>
              <span className="text-[10px] font-black text-slate-450">
                Gap requirement: 90 days
              </span>
            </div>

            <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#ba1a1a] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= FOOTER NAVIGATION SYSTEM ================= */}
      <nav className="bg-white border-t border-[#eae7e7] py-2 px-4 flex justify-around items-center sticky bottom-0 z-30 shadow-md">
        
        {/* Home active tab */}
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="flex flex-col items-center gap-1 text-[#ba1a1a]"
        >
          <Home className="w-5 h-5 fill-current" />
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

        {/* Overlapping Donate tab */}
        <button 
          onClick={() => navigate('/donor/donate')}
          className="relative -mt-6 w-14 h-14 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-all transform active:scale-95"
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
