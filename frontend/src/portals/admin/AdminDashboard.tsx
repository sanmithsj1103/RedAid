import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Users, Landmark, Heart, Activity, Settings, LogOut, ArrowRight, CheckCircle2, ChevronRight, BarChart2, BellRing, ClipboardList, LayoutDashboard } from 'lucide-react';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-650 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Operations Control...</p>
        </div>
      </div>
    );
  }

  const { kpis, demandByGroup, recentActivity } = analytics;

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-6">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Red<span className="text-purple-500">Aid</span></h1>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-slate-400">
            <Link 
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview KPIs</span>
            </Link>
            <Link 
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>User Directories</span>
            </Link>
            <Link 
              to="/admin/fraud"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <span>Fraud Monitor</span>
            </Link>
            <Link 
              to="/admin/broadcast"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <BellRing className="w-4 h-4 text-slate-500" />
              <span>Broadcast Center</span>
            </Link>
            <Link 
              to="/admin/logs"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>Audit Logs</span>
            </Link>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 hover:bg-red-950/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-red-900/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Admin Logout</span>
        </button>
      </aside>

      {/* Main dashboard console */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-white">Platform Operations Center</h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">Root Access Active</p>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto max-w-6xl w-full">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Registered Donors</span>
              <p className="text-2xl font-black text-white mt-2">{kpis.totalDonors}</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Verified Hospitals</span>
              <p className="text-2xl font-black text-white mt-2">{kpis.totalHospitals}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Dispatched Outreaches</span>
              <p className="text-2xl font-black text-white mt-2">{kpis.totalRequests}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Average Donor Trust</span>
              <p className="text-2xl font-black text-green-400 mt-2">{kpis.averageTrustScore}%</p>
            </div>
          </div>

          {/* Graphics & Logs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Blood Group Demand Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <BarChart2 className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Blood Type Demand Distribution</h3>
              </div>

              {/* Simple CSS-based bar chart */}
              <div className="space-y-3 pt-3">
                {Object.keys(demandByGroup).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 font-semibold">No demand data available.</p>
                ) : (
                  Object.entries(demandByGroup).map(([group, units]) => {
                    const unitCount = units as number;
                    // Max units representation for scaling
                    const scalePct = Math.min(100, (unitCount / 10) * 100);
                    return (
                      <div key={group} className="flex items-center gap-4 text-xs font-bold">
                        <span className="w-8 text-slate-400">{group}</span>
                        <div className="flex-1 bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-purple-600 h-full rounded-full transition-all" 
                            style={{ width: `${scalePct}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-right">{unitCount} Units</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Col: Recent System Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <ClipboardList className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live System Logs</h3>
              </div>

              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {recentActivity.map((log: any) => (
                  <div key={log.id} className="text-[10px] leading-relaxed border-b border-slate-800/40 pb-3 last:border-0">
                    <div className="flex justify-between items-center text-slate-500 font-bold mb-1">
                      <span>Action: {log.action}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-350">
                      Entity: <strong className="text-white">{log.entityType} ({log.entityId.substring(0, 8)})</strong>
                    </p>
                    <p className="text-slate-400 font-semibold mt-0.5">Actor: {log.actorRole.toUpperCase()}</p>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6 font-semibold">No audit logs logged today.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
