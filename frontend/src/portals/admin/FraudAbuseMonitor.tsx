import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Users, Landmark, Activity, LogOut, ArrowLeft, AlertTriangle, UserCheck, LayoutDashboard } from 'lucide-react';
import { api, Donor } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const FraudAbuseMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [flaggedDonors, setFlaggedDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchAbuseLogs();
  }, []);

  const fetchAbuseLogs = async () => {
    setLoading(true);
    try {
      const donorsList = await api.getDonorsAdminList();
      // Filter flagged donors: trust score below 90 or blacklisted
      const flagged = donorsList.filter(d => d.trustScore < 90 || d.isBlacklisted);
      setFlaggedDonors(flagged);
    } catch (err) {
      console.error(err);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleWarn = (name: string) => {
    setToast({ message: `Warning dispatch notification sent to donor: ${name}`, type: 'success' });
  };

  const handleBlacklist = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      await api.blacklistDonor(id, !currentStatus);
      setToast({
        message: !currentStatus ? 'Donor blacklisted. Matching disabled.' : 'Donor unblacklisted.',
        type: 'info'
      });
      fetchAbuseLogs();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-650 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Fraud Monitor...</p>
        </div>
      </div>
    );
  }

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
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
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
              className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Fraud Monitor</span>
            </Link>
            <Link 
              to="/admin/broadcast"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Activity className="w-4 h-4 text-slate-500" />
              <span>Broadcast Center</span>
            </Link>
            <Link 
              to="/admin/logs"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Activity className="w-4 h-4 text-slate-500" />
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

      {/* Main content body */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm text-slate-800">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Fraud & Abuse Monitor</h2>
              <p className="text-[10px] text-slate-400 font-medium">Verify suspicious donor no-shows and coordinate warnings</p>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-w-6xl w-full">
          
          {/* Flagged donors table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
              Flagged Donor Accounts
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-800">
                    <th className="p-4">Donor Name</th>
                    <th className="p-4 text-center">Trust Index</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Outreach Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-350">
                  {flaggedDonors.map(donor => (
                    <tr key={donor.id} className="hover:bg-slate-950/20 transition-colors text-xs font-semibold">
                      <td className="p-4 font-bold text-white">{donor.fullName}</td>
                      <td className={`p-4 text-center font-extrabold ${donor.trustScore <= 75 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                        {donor.trustScore.toFixed(0)}%
                      </td>
                      <td className="p-4 text-slate-400">{donor.phone}</td>
                      <td className="p-4 text-center">
                        {donor.isBlacklisted ? (
                          <span className="text-[9px] bg-red-950/20 text-red-400 border border-red-900/30 px-2 py-0.5 rounded font-black">
                            Blacklisted
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-900/20 text-amber-500 border border-amber-900/30 px-2 py-0.5 rounded font-black">
                            Low Trust Flag
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleWarn(donor.fullName)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-750"
                          >
                            Send Warning Alert
                          </button>
                          
                          <button
                            onClick={() => handleBlacklist(donor.id, donor.isBlacklisted)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all ${
                              donor.isBlacklisted
                                ? 'bg-green-650 hover:bg-green-700 text-white'
                                : 'bg-red-650 hover:bg-red-755 text-white'
                            }`}
                          >
                            {donor.isBlacklisted ? 'Verify & Restore' : 'Blacklist User'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {flaggedDonors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-xs text-slate-500 font-semibold">
                        <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        No low trust scores or blacklisted donors registered. Platform health optimal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

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
