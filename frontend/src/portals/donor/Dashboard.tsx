import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Shield, Award, Calendar, Bell, Settings, LogOut, CheckCircle, Power, Zap, MapPin } from 'lucide-react';
import { api, Donor, AvailabilityStatus } from '../../services/api';

export const DonorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const profile = await api.getDonorProfile();
      setDonor(profile);

      const notifications = await api.getDonorNotifications();
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
      setAlerts(activeAlerts);

      const active = await api.getDonorActiveRequest();
      setActiveRequest(active);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      navigate('/donor/login');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (status: AvailabilityStatus, snoozeHours?: number) => {
    let snoozeUntil: string | null = null;
    if (status === 'snoozed' && snoozeHours) {
      snoozeUntil = new Date(Date.now() + snoozeHours * 60 * 60 * 1000).toISOString();
    }
    
    try {
      const updated = await api.setAvailability(status, snoozeUntil);
      setDonor(updated);
      setSnoozeOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  if (loading || !donor) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine availability styling
  const statusConfig = {
    active: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'Active & Available', dot: 'bg-green-500' },
    snoozed: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Snoozed', dot: 'bg-amber-500' },
    unavailable: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'Unavailable', dot: 'bg-slate-400' },
  }[donor.availability];

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between max-w-md mx-auto relative border-x border-surface-container-high shadow-xl">
      {/* Header */}
      <header className="bg-white border-b border-surface-container-high p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Red<span className="text-primary">Aid</span></h2>
            <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Donor App</span>
          </div>
        </div>
        
        {/* Profile/Menu Triggers */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/donor/settings')}
            className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-500" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-white border border-surface-container-high rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full flex items-center justify-center">
            <span className="text-2xl font-black text-primary/30 mt-[-10px] mr-[-10px]">{donor.bloodGroup}</span>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {donor.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-on-surface">{donor.fullName}</h3>
              <p className="text-xs text-on-surface-variant font-semibold mt-0.5">Blood Type {donor.bloodGroup} Donor</p>
            </div>
          </div>

          {/* Availability Status Indicator */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
            <div className={`flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-semibold ${statusConfig.bg}`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`}></div>
              <span>{statusConfig.text}</span>
            </div>
            <button 
              onClick={() => setSnoozeOpen(!snoozeOpen)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Change Status</span>
            </button>
          </div>

          {/* Snooze Options Dialog */}
          {snoozeOpen && (
            <div className="border-t border-dashed border-slate-200 mt-4 pt-4 space-y-2 animate-fade-in">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Select availability status</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleToggleAvailability('active')}
                  className="px-3 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
                >
                  Available
                </button>
                <button 
                  onClick={() => handleToggleAvailability('snoozed', 24)}
                  className="px-3 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Snooze 24h
                </button>
                <button 
                  onClick={() => handleToggleAvailability('unavailable')}
                  className="px-3 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Unavailable
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Emergency Accepted Job (If en route/accepted) */}
        {activeRequest && (
          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 shadow-sm pulse-urgent">
            <span className="text-[9px] uppercase tracking-wider text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
              Active Commited Request
            </span>
            <h4 className="text-base font-extrabold text-on-surface mt-2">{activeRequest.request.hospitalName}</h4>
            <div className="flex justify-between items-center mt-1 text-xs text-on-surface-variant font-semibold">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {activeRequest.request.hospitalAddress.split(',')[0]}
              </span>
              <span>Blood Needed: {activeRequest.request.bloodGroup}</span>
            </div>
            
            <button 
              onClick={() => navigate(`/donor/request/${activeRequest.request.id}`)}
              className="w-full bg-primary hover:bg-primary-container text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all mt-4 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-white fill-white" />
              <span>Open Navigation / Live Tracker</span>
            </button>
          </div>
        )}

        {/* Emergency Alerts Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-primary" />
              Active Emergency Alerts ({alerts.length})
            </h4>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-white border border-surface-container-high rounded-2xl p-6 text-center text-on-surface-variant text-xs font-semibold">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span>No incoming emergency requests for your blood type nearby right now.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(item => (
                <div 
                  key={item.response.id}
                  className="bg-white border border-red-100 hover:border-red-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-colors cursor-pointer"
                  onClick={() => navigate(`/donor/request/${item.request.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                        {item.request.priority.toUpperCase()}
                      </span>
                      <h5 className="text-sm font-bold text-on-surface mt-2">{item.request.hospitalName}</h5>
                      <p className="text-xs text-on-surface-variant mt-1 leading-normal font-semibold">
                        Requires {item.request.unitsRequired} unit(s) of compatible blood.
                      </p>
                    </div>
                    <div className="bg-red-50 text-primary font-bold text-xs px-2.5 py-1.5 rounded-lg border border-red-100 flex flex-col items-center">
                      <span className="text-[9px] text-red-400 font-semibold uppercase">Need</span>
                      <span className="text-base leading-none font-black">{item.request.bloodGroup}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3 text-xs font-semibold text-on-surface-variant">
                    <span>Proximity: 4.2 km</span>
                    <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">
                      Respond &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats & Badges Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-surface-container-high rounded-2xl p-4 shadow-sm text-center">
            <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Reliability Score</span>
            <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto my-3">
              <span className="text-base font-extrabold text-on-surface">{donor.trustScore.toFixed(0)}%</span>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-normal">
              Keep commitments to maintain a high priority matching score.
            </p>
          </div>

          <div className="bg-white border border-surface-container-high rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="text-center">
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Total Donations</span>
              <p className="text-3xl font-black text-primary my-2">{donor.totalDonations}</p>
            </div>
            
            {/* Gamification badges */}
            <div className="border-t border-slate-100 pt-2 mt-2">
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Badges Earned</span>
              <div className="flex gap-1.5 justify-center">
                {donor.badges.slice(0, 3).map(b => (
                  <div key={b} className="p-1 bg-amber-50 rounded-lg border border-amber-200" title={b}>
                    <Award className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  </div>
                ))}
                {donor.badges.length === 0 && (
                  <span className="text-[9px] text-on-surface-variant font-medium">None yet. Donate to unlock!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-surface-container-high py-2.5 px-6 flex justify-around sticky bottom-0 z-30 shadow-md">
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="flex flex-col items-center gap-1.5 text-primary"
        >
          <Heart className="w-5 h-5 fill-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Dashboard</span>
        </button>
        <button 
          onClick={() => navigate('/donor/history')}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Calendar className="w-5 h-5" />
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
