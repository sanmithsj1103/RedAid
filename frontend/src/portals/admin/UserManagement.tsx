import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Users, Landmark, Heart, Activity, LogOut, ArrowLeft, Search, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react';
import { api, Donor, Hospital } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'donors' | 'hospitals'>('donors');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchDirectories();
  }, []);

  const fetchDirectories = async () => {
    setLoading(true);
    try {
      const donorList = await api.getDonorsAdminList();
      setDonors(donorList);

      const hospList = await api.getHospitalsAdminList();
      setHospitals(hospList);
    } catch (err) {
      console.error(err);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyHospital = async (id: string) => {
    setActionLoading(true);
    try {
      await api.verifyHospital(id);
      setToast({ message: 'Hospital coordinates verified and activated on platform!', type: 'success' });
      fetchDirectories();
    } catch (err: any) {
      setToast({ message: err.message || 'Verification failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlacklistDonor = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      await api.blacklistDonor(id, !currentStatus);
      setToast({ 
        message: !currentStatus ? 'Donor blacklisted. Matching allocations disabled.' : 'Donor unblacklisted.',
        type: 'info' 
      });
      fetchDirectories();
    } catch (err: any) {
      setToast({ message: err.message || 'Action failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlacklistHospital = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      await api.blacklistHospital(id, !currentStatus);
      setToast({ 
        message: !currentStatus ? 'Hospital blacklisted. Requests disabled.' : 'Hospital unblacklisted.',
        type: 'info' 
      });
      fetchDirectories();
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
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading User Directories...</p>
        </div>
      </div>
    );
  }

  // Filter lists based on search query
  const filteredDonors = donors.filter(d => 
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.phone.includes(searchQuery) || 
    d.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <Users className="w-4 h-4" />
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
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-white">User Management Directories</h2>
              <p className="text-[10px] text-slate-500 font-medium">Verify credentials and manage blacklists</p>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-w-6xl w-full">
          {/* Tab Selector & Search bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2.5">
              <button
                onClick={() => { setTab('donors'); setSearchQuery(''); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  tab === 'donors' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                }`}
              >
                Donor Directory
              </button>
              <button
                onClick={() => { setTab('hospitals'); setSearchQuery(''); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  tab === 'hospitals' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                }`}
              >
                Hospital Directory
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-550" />
              </div>
              <input
                type="text"
                placeholder={tab === 'donors' ? "Search donor by name, blood, or phone..." : "Search hospital name or registration number..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Directory Listings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
            {tab === 'donors' ? (
              /* Donors Table */
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-800">
                      <th className="p-4">Donor Name</th>
                      <th className="p-4 text-center">Blood Group</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4 text-center">Trust Index</th>
                      <th className="p-4">Blacklist Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {filteredDonors.map((donor) => (
                      <tr key={donor.id} className="hover:bg-slate-950/20 transition-colors text-xs font-semibold">
                        <td className="p-4 font-bold text-white">{donor.fullName}</td>
                        <td className="p-4 text-center text-red-400 font-extrabold">{donor.bloodGroup}</td>
                        <td className="p-4 text-slate-400">{donor.phone}</td>
                        <td className="p-4 text-center">{donor.trustScore.toFixed(0)}%</td>
                        <td className="p-4">
                          {donor.isBlacklisted ? (
                            <span className="text-[9px] bg-red-900/20 text-red-400 border border-red-900/30 px-2 py-0.5 rounded font-black">
                              Blacklisted
                            </span>
                          ) : (
                            <span className="text-[9px] bg-green-900/20 text-green-400 border border-green-900/30 px-2 py-0.5 rounded font-black">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleBlacklistDonor(donor.id, donor.isBlacklisted)}
                              disabled={actionLoading}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all ${
                                donor.isBlacklisted
                                  ? 'bg-green-650 hover:bg-green-700 text-white'
                                  : 'bg-red-650 hover:bg-red-750 text-white'
                              }`}
                            >
                              {donor.isBlacklisted ? 'Activate User' : 'Blacklist User'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Hospitals Table */
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-800">
                      <th className="p-4">Hospital Name</th>
                      <th className="p-4">Registration No.</th>
                      <th className="p-4">State/Verification</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Outreach Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {filteredHospitals.map((hosp) => (
                      <tr key={hosp.id} className="hover:bg-slate-950/20 transition-colors text-xs font-semibold">
                        <td className="p-4 font-bold text-white">{hosp.name}</td>
                        <td className="p-4 text-slate-400">{hosp.registrationNumber}</td>
                        <td className="p-4">
                          {hosp.isVerified ? (
                            <span className="text-[9px] bg-green-900/20 text-green-400 border border-green-900/30 px-2.5 py-0.5 rounded font-black">
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyHospital(hosp.id)}
                              disabled={actionLoading}
                              className="text-[9px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-0.5 rounded shadow-sm"
                            >
                              Verify Account
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          {hosp.isActive && hosp.isVerified ? (
                            <span className="text-[9px] text-green-500">Active</span>
                          ) : (
                            <span className="text-[9px] text-slate-500">Suspended</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleBlacklistHospital(hosp.id, !hosp.isActive)}
                              disabled={actionLoading}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all ${
                                hosp.isActive
                                  ? 'bg-red-650 hover:bg-red-750 text-white'
                                  : 'bg-green-650 hover:bg-green-700 text-white'
                              }`}
                            >
                              {hosp.isActive ? 'Suspend Portal' : 'Unsuspend Portal'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
