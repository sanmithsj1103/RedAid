import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, LayoutDashboard, PlusCircle, Database, Activity, LogOut, ArrowLeft, Heart, Plus, Share2, ClipboardCheck } from 'lucide-react';
import { api, HospitalSurplus, BloodGroup } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const CrossHospitalCoordination: React.FC = () => {
  const navigate = useNavigate();
  const [surplusList, setSurplusList] = useState<HospitalSurplus[]>([]);
  const [currentHospitalId, setCurrentHospitalId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Form states
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsAvailable, setUnitsAvailable] = useState(1);
  const [hoursValid, setHoursValid] = useState(24);

  useEffect(() => {
    fetchSurplus();
  }, []);

  const fetchSurplus = async () => {
    setLoading(true);
    try {
      const activeUser = await api.getActiveUser();
      if (activeUser) setCurrentHospitalId(activeUser.id);
      
      const data = await api.getSurplusBloodListings();
      setSurplusList(data);
    } catch (err) {
      console.error(err);
      navigate('/hospital/login');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.publishSurplusBlood(bloodGroup, unitsAvailable, hoursValid);
      setToast({ message: 'Surplus listing published to coordination pool.', type: 'success' });
      
      // Reset form
      setUnitsAvailable(1);
      setHoursValid(24);
      
      // Re-fetch listings
      const data = await api.getSurplusBloodListings();
      setSurplusList(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Publishing failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async (surplusId: string) => {
    setActionLoading(true);
    try {
      await api.claimSurplusBlood(surplusId);
      setToast({ message: 'Surplus claimed! Proceeding to dispatch transfer courier.', type: 'success' });
      
      // Re-fetch listings
      const data = await api.getSurplusBloodListings();
      setSurplusList(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Claim failed', type: 'error' });
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Surplus Exchange...</p>
        </div>
      </div>
    );
  }

  // Filter listings: other hospitals vs mine
  const otherSurplus = surplusList.filter(s => s.hospitalId !== currentHospitalId);
  const mySurplus = surplusList.filter(s => s.hospitalId === currentHospitalId);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Red<span className="text-blue-500">Aid</span></h1>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Hospital Console</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <Link 
              to="/hospital"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/hospital/create"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              <span>Create Request</span>
            </Link>
            <Link 
              to="/hospital/inventory"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Database className="w-4 h-4 text-slate-400" />
              <span>Blood Inventory</span>
            </Link>
            <Link 
              to="/hospital/coordination"
              className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Surplus Exchange</span>
            </Link>
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-red-900/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Console Logout</span>
        </button>
      </aside>

      {/* Main content body */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/hospital" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Cross-Hospital Surplus exchange</h2>
              <p className="text-[10px] text-slate-400 font-medium">Flag and request surplus resources from nearby centers</p>
            </div>
          </div>
        </header>

        {/* Content grid */}
        <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto max-w-6xl w-full">
          
          {/* Left Columns: Surplus Pools */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pool list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Surplus Pool</h3>
              
              {otherSurplus.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm font-semibold">
                  <ClipboardCheck className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                  <p>No active surplus listings available from nearby hospitals right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {otherSurplus.map(item => (
                    <div 
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{item.hospitalName}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-bold">
                          <span>Group: {item.bloodGroup}</span>
                          <span>&bull;</span>
                          <span>Available: {item.unitsAvailable} units</span>
                          <span>&bull;</span>
                          <span className="text-amber-500">
                            Expires: {new Date(item.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaim(item.id)}
                        disabled={actionLoading || item.isClaimed}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                          item.isClaimed
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {item.isClaimed ? 'Claimed' : 'Claim Surplus'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My listings */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Published Surplus</h3>
              <div className="space-y-3">
                {mySurplus.map(item => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex justify-between items-center text-xs">
                    <div className="font-semibold text-slate-700">
                      <span>Group: <strong className="text-slate-850 font-black">{item.bloodGroup}</strong></span>
                      <span className="mx-2">|</span>
                      <span>Units: <strong className="text-slate-850 font-black">{item.unitsAvailable}</strong></span>
                      <span className="mx-2">|</span>
                      <span>Expires: {new Date(item.expiresAt).toLocaleTimeString()}</span>
                    </div>
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                      item.isClaimed ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.isClaimed ? 'Claimed by partner' : 'Active'}
                    </span>
                  </div>
                ))}
                {mySurplus.length === 0 && (
                  <p className="text-xs text-slate-400 font-semibold text-center py-4 bg-white border border-dashed border-slate-200 rounded-2xl">
                    You have not published any surplus listings today.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Publish Form */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-blue-600" />
                Publish Surplus Blood
              </h3>

              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label htmlFor="blood" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Blood Group
                  </label>
                  <select
                    id="blood"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="surplusUnits" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                      Units
                    </label>
                    <input
                      id="surplusUnits"
                      type="number"
                      min="1"
                      value={unitsAvailable}
                      onChange={(e) => setUnitsAvailable(parseInt(e.target.value) || 1)}
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="hours" className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                      Hours Valid
                    </label>
                    <select
                      id="hours"
                      value={hoursValid}
                      onChange={(e) => setHoursValid(parseInt(e.target.value) || 24)}
                      className="block w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="12">12 Hours</option>
                      <option value="24">24 Hours</option>
                      <option value="48">48 Hours</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-blue-650 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all mt-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Offer</span>
                </button>
              </form>
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
