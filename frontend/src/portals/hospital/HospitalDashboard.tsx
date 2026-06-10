import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, Activity, Heart, Award, PlusCircle, LayoutDashboard, Database, HelpCircle, LogOut, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react';
import { api, Hospital, BloodRequest, BloodInventoryItem } from '../../services/api';

export const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const profile = await api.getHospitalProfile();
      setHospital(profile);

      const reqs = await api.getHospitalRequests();
      setRequests(reqs);

      const inv = await api.getHospitalInventory();
      setInventory(inv);
    } catch (err) {
      console.error(err);
      navigate('/hospital/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  if (loading || !hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Hospital Console...</p>
        </div>
      </div>
    );
  }

  const lowStockItems = inventory.filter(i => i.unitsAvailable <= i.lowStockThreshold);

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
              className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
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
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Activity className="w-4 h-4 text-slate-400" />
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

      {/* Main Dashboard body */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{hospital.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-green-50 text-green-700 font-bold border border-green-150 px-2 py-0.5 rounded-full uppercase">
                Verified Center
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Department: Emergency Blood Bank</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/hospital/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Create Blood Request</span>
          </button>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto max-w-6xl w-full">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Active Requests</span>
              <p className="text-2xl font-black text-slate-800 mt-2">
                {requests.filter(r => r.status === 'dispatched' || r.status === 'accepted' || r.status === 'en_route' || r.status === 'arrived').length}
              </p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Low Stock Warning</span>
              <p className={`text-2xl font-black mt-2 ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
                {lowStockItems.length} groups
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Dispatched</span>
              <p className="text-2xl font-black text-slate-800 mt-2">{requests.length}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Fulfillments</span>
              <p className="text-2xl font-black text-green-600 mt-2">
                {requests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Requests List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Outward Requests</h3>

              {requests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm font-semibold">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p>No blood requests registered yet. Tap "Create Request" above to dispatch notifications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(req => {
                    const percent = Math.min(100, Math.round((req.unitsFulfilled / req.unitsRequired) * 100));
                    return (
                      <div 
                        key={req.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/hospital/request/${req.id}`)}
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              req.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {req.priority}
                            </span>
                            <span className="text-xs text-slate-400 font-bold uppercase">Req ID: {req.id}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800">
                              Requires {req.unitsRequired} unit(s) of compatible blood for {req.bloodGroup}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium truncate mt-0.5 max-w-lg">
                              "{req.notes}"
                            </p>
                          </div>

                          {/* Progress bar */}
                          <div className="max-w-md">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                              <span>Fulfillment Progress</span>
                              <span>{req.unitsFulfilled} / {req.unitsRequired} units ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 ml-6">
                          <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                            req.status === 'completed' 
                              ? 'bg-green-50 border-green-250 text-green-700' 
                              : req.status === 'cancelled'
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-blue-50 border-blue-150 text-blue-700'
                          }`}>
                            {req.status}
                          </span>
                          
                          <button className="text-xs font-bold text-blue-600 flex items-center hover:underline gap-0.5 group">
                            <span>Track Live</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar widgets */}
            <div className="space-y-6">
              {/* Quick Inventory Widget */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inventory Status</h4>
                  <Link to="/hospital/inventory" className="text-xs font-bold text-blue-650 hover:underline">
                    Edit &rarr;
                  </Link>
                </div>
                
                <div className="grid grid-cols-4 gap-3 text-center">
                  {inventory.slice(0, 8).map(item => (
                    <div 
                      key={item.bloodGroup}
                      className={`p-2 border rounded-xl flex flex-col justify-center ${
                        item.unitsAvailable <= item.lowStockThreshold 
                          ? 'bg-red-50 border-red-200 text-red-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-black">{item.bloodGroup}</span>
                      <span className="text-lg font-black mt-0.5">{item.unitsAvailable}</span>
                      <span className="text-[7px] font-semibold text-slate-400 mt-0.5">Threshold: {item.lowStockThreshold}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surplus coordination card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md space-y-4">
                <div>
                  <h4 className="text-sm font-bold tracking-tight">Cross-Hospital Surplus</h4>
                  <p className="text-xs text-blue-100 leading-normal mt-1">
                    Got surplus blood near expiry? Flag it to let other coordination centers claim and transfer it immediately.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/hospital/coordination')}
                  className="w-full bg-white text-blue-700 py-2.5 px-4 rounded-xl text-xs font-bold shadow hover:bg-blue-50 transition-all flex items-center justify-center gap-1"
                >
                  <span>Go to Surplus Pool</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
