import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Share2, ArrowRight, ShieldCheck, HelpCircle, Plus, Minus, Info } from 'lucide-react';
import { api, BloodInventoryItem, HospitalSurplus, BloodGroup } from '../../services/api';
import { HospitalLayout } from './HospitalLayout';
import { Toast, ToastType } from '../../components/Toast';

export const InventoryManager: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<BloodInventoryItem[]>([]);
  const [surplusList, setSurplusList] = useState<HospitalSurplus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Edit stock levels state
  const [isEditing, setIsEditing] = useState(false);

  // Publish Surplus Modal State
  const [showSurplusModal, setShowSurplusModal] = useState(false);
  const [surplusGroup, setSurplusGroup] = useState<BloodGroup>('O+');
  const [surplusUnits, setSurplusUnits] = useState(5);
  const [surplusHours, setSurplusHours] = useState(24);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const inv = await api.getHospitalInventory();
      setInventory(inv);

      const surplus = await api.getSurplusBloodListings();
      setSurplusList(surplus);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
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

  const handlePublishSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.publishSurplusBlood(surplusGroup, surplusUnits, surplusHours);
      setToast({ message: `Success! ${surplusUnits} units of ${surplusGroup} flagged as surplus.`, type: 'success' });
      setShowSurplusModal(false);
      
      // Refresh surplus list
      const surplus = await api.getSurplusBloodListings();
      setSurplusList(surplus);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to publish surplus', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestTransfer = (hospitalName: string, bloodGroup: string) => {
    setToast({
      message: `Requesting transfer of ${bloodGroup} blood from ${hospitalName}... Courier dispatched.`,
      type: 'success'
    });
  };

  // Stock status categorization helper matching the screenshot values
  const getCardStatus = (item: BloodInventoryItem) => {
    const criticalThreshold = 10;
    const lowThreshold = item.lowStockThreshold;

    if (item.unitsAvailable <= 3 || (item.unitsAvailable <= lowThreshold && item.unitsAvailable <= 12)) {
      return {
        label: 'CRITICAL',
        bg: 'bg-[#fff5f5]',
        border: 'border-[#ffdad6]',
        text: 'text-[#ba1a1a]',
        badgeBg: 'bg-[#ba1a1a] text-white',
      };
    } else if (item.unitsAvailable <= lowThreshold) {
      return {
        label: 'LOW',
        bg: 'bg-[#fefce8]',
        border: 'border-[#fef08a]',
        text: 'text-[#a16207]',
        badgeBg: 'bg-[#eab308] text-slate-800',
      };
    } else {
      return {
        label: 'SUFFICIENT',
        bg: 'bg-[#f0fdf4]',
        border: 'border-[#bbf7d0]',
        text: 'text-[#166534]',
        badgeBg: 'bg-[#22c55e] text-white',
      };
    }
  };

  // Layout order of cards matching the screenshot:
  // Row 1: O+, A+, B+, AB+
  // Row 2: O-, A-, B-, AB-
  const orderedGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
  const sortedInventory = [...inventory].sort((a, b) => {
    return orderedGroups.indexOf(a.bloodGroup) - orderedGroups.indexOf(b.bloodGroup);
  });

  const getHospitalRowBadge = (group: string) => {
    return (
      <span key={group} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#fff5f5] border border-[#ffdad6] text-[10px] font-black text-[#ba1a1a]">
        {group}
      </span>
    );
  };

  return (
    <HospitalLayout searchPlaceholder="Search donors or requests...">
      <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
        
        {/* Header row */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Blood Inventory</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Last updated: Oct 24, 2023 • 09:42 AM
            </p>
          </div>

          <button
            onClick={() => setIsEditing(prev => !prev)}
            className={`px-4 py-2 border rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 ${
              isEditing 
                ? 'bg-primary text-white border-primary hover:bg-[#c0392b]' 
                : 'bg-white text-[#9e2016] border-[#ffdad6] hover:bg-[#fff5f5]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Done Editing' : 'Edit Inventory'}</span>
          </button>
        </div>

        {/* 8 Cards Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {sortedInventory.map((item) => {
            const status = getCardStatus(item);
            return (
              <div 
                key={item.bloodGroup} 
                className={`border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-44 transition-all relative ${status.bg} ${status.border}`}
              >
                <div>
                  <h3 className={`text-3xl font-black ${status.text}`}>{item.bloodGroup}</h3>
                  <p className="text-lg font-black text-slate-800 mt-1">
                    {item.unitsAvailable} <span className="text-xs font-bold text-slate-400">Units</span>
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-wider ${status.badgeBg}`}>
                    {status.label}
                  </span>

                  {/* Increment/Decrement Buttons when editing */}
                  {isEditing && (
                    <div className="flex items-center gap-1.5 bg-white rounded-full border border-slate-200 p-0.5 select-none animate-scale-up absolute right-6 top-6">
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.bloodGroup, -1)}
                        disabled={actionLoading || item.unitsAvailable === 0}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.bloodGroup, 1)}
                        disabled={actionLoading}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section: Cross-Hospital Coordination */}
        <div className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-[#eae7e7] flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-850 tracking-tight">Cross-Hospital Coordination</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Nearby hospitals with compatible stock available for transfer.</p>
            </div>

            <button
              onClick={() => setShowSurplusModal(true)}
              className="bg-primary hover:bg-[#c0392b] text-white px-4 py-2.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Flag Our Surplus</span>
            </button>
          </div>

          {/* Coordination Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcf9f8]/60 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-[#eae7e7]">
                  <th className="px-6 py-4.5">Hospital Name</th>
                  <th className="px-6 py-4.5">Distance</th>
                  <th className="px-6 py-4.5">Available Groups</th>
                  <th className="px-6 py-4.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae7e7]/60 text-slate-700">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">City General Medical Center</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Emergency Trauma Unit</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-sm font-semibold text-slate-650">3.2 km</td>
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-1.5">
                      {['O+', 'A+', 'B-'].map(getHospitalRowBadge)}
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <button
                      onClick={() => handleRequestTransfer('City General Medical Center', 'O+')}
                      className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      Request Transfer
                    </button>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">Westside Children's Hospital</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Main Blood Bank</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-sm font-semibold text-slate-650">5.8 km</td>
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-1.5">
                      {['O-', 'AB+'].map(getHospitalRowBadge)}
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <button
                      onClick={() => handleRequestTransfer("Westside Children's Hospital", 'O-')}
                      className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      Request Transfer
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">Mercy Hope Regional Center</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Community Services Division</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-sm font-semibold text-slate-650">7.1 km</td>
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-1.5">
                      {['A+', 'B+', 'O+', 'AB-'].map(getHospitalRowBadge)}
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <button
                      onClick={() => handleRequestTransfer('Mercy Hope Regional Center', 'A+')}
                      className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      Request Transfer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Flag Surplus Modal Dialog */}
      {showSurplusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-scale-up">
            <div className="text-center border-b border-slate-100 pb-3">
              <Share2 className="w-10 h-10 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-black text-slate-800">Publish Surplus Blood Offer</h3>
              <p className="text-xs text-slate-450 mt-1 leading-normal">
                Flag surplus blood units nearing expiry to let coordinate centers claim and request transfers.
              </p>
            </div>

            <form onSubmit={handlePublishSurplus} className="space-y-4">
              {/* Blood Group */}
              <div>
                <label htmlFor="surGroup" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Blood Group
                </label>
                <select
                  id="surGroup"
                  value={surplusGroup}
                  onChange={(e) => setSurplusGroup(e.target.value as BloodGroup)}
                  className="block w-full px-3.5 py-2.5 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-xs focus:outline-none"
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

              {/* Units & Expiration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="surUnits" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Units Available
                  </label>
                  <input
                    id="surUnits"
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={surplusUnits}
                    onChange={(e) => setSurplusUnits(parseInt(e.target.value) || 1)}
                    className="block w-full px-3.5 py-2.5 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="surHours" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Validity (Hours)
                  </label>
                  <select
                    id="surHours"
                    value={surplusHours}
                    onChange={(e) => setSurplusHours(parseInt(e.target.value) || 24)}
                    className="block w-full px-3.5 py-2.5 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-xs focus:outline-none"
                  >
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="48">48 Hours</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSurplusModal(false)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 py-2.5 rounded-lg text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-primary hover:bg-[#c0392b] text-white py-2.5 rounded-lg text-xs font-black shadow transition-all flex items-center justify-center gap-1"
                >
                  <span>Flag Surplus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast component */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </HospitalLayout>
  );
};
