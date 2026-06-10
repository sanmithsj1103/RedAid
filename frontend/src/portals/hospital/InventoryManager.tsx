import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, LayoutDashboard, PlusCircle, Database, Activity, LogOut, ArrowLeft, Heart, Plus, Minus, AlertTriangle } from 'lucide-react';
import { api, BloodInventoryItem, BloodGroup } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const InventoryManager: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getHospitalInventory();
      setInventory(data);
    } catch (err) {
      console.error(err);
      navigate('/hospital/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (bloodGroup: BloodGroup, change: number) => {
    const currentItem = inventory.find(i => i.bloodGroup === bloodGroup);
    if (!currentItem) return;

    const newUnits = Math.max(0, currentItem.unitsAvailable + change);
    setActionLoading(true);
    try {
      const updatedList = await api.updateInventoryItem(bloodGroup, newUnits);
      setInventory(updatedList);
      setToast({ message: `Updated ${bloodGroup} stock level to ${newUnits} units.`, type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update stock', type: 'error' });
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
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Inventory Manager...</p>
        </div>
      </div>
    );
  }

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
              className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <Database className="w-4 h-4" />
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

      {/* Main content body */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/hospital" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Blood Bank Inventory</h2>
              <p className="text-[10px] text-slate-400 font-medium">Manage stock levels and low stock thresholds</p>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 overflow-y-auto max-w-4xl w-full">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="overflow-hidden rounded-2xl border border-slate-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-200">
                    <th className="p-4">Blood Group</th>
                    <th className="p-4 text-center">Available Stock</th>
                    <th className="p-4 text-center">Alert Threshold</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4 text-center">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inventory.map((item) => {
                    const isLow = item.unitsAvailable <= item.lowStockThreshold;
                    return (
                      <tr key={item.bloodGroup} className="hover:bg-slate-50/50 transition-colors text-sm font-medium">
                        <td className="p-4 font-extrabold text-slate-800">{item.bloodGroup}</td>
                        <td className="p-4 text-center text-base font-black">{item.unitsAvailable} units</td>
                        <td className="p-4 text-center text-slate-400">{item.lowStockThreshold} units</td>
                        <td className="p-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                              <span>Good</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStock(item.bloodGroup, -1)}
                              disabled={actionLoading || item.unitsAvailable === 0}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStock(item.bloodGroup, 1)}
                              disabled={actionLoading}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
