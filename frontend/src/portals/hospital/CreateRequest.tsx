import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, LayoutDashboard, PlusCircle, Database, Activity, LogOut, ArrowLeft, Heart, Send, Sparkles } from 'lucide-react';
import { api, BloodGroup, RequestPriority } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [priority, setPriority] = useState<RequestPriority>('urgent');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unitsRequired < 1 || unitsRequired > 20) {
      setToast({ message: 'Request units must be between 1 and 20.', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      const result = await api.createBloodRequest({
        bloodGroup,
        unitsRequired,
        priority,
        notes,
      });
      setToast({ 
        message: `Success! Dispatching alerts to ${result.donorsNotified} eligible matched donors in a 15km radius.`, 
        type: 'success' 
      });
      
      setTimeout(() => {
        navigate(`/hospital/request/${result.id}`);
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to dispatch request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

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
              className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
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

      {/* Main Form container */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link to="/hospital" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dispatch Emergency Outreach</h2>
              <p className="text-[10px] text-slate-400 font-medium">Create a new blood request alert</p>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 overflow-y-auto max-w-3xl w-full">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Blood Group */}
                <div>
                  <label htmlFor="bloodGroup" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Required Blood Group
                  </label>
                  <select
                    id="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all appearance-none"
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

                {/* Units Needed */}
                <div>
                  <label htmlFor="units" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Units Needed (1 - 20 whole blood)
                  </label>
                  <input
                    id="units"
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(parseInt(e.target.value) || 1)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Priority Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Request Priority & Expiration Window
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['critical', 'urgent', 'scheduled'] as RequestPriority[]).map((p) => {
                    const styling = {
                      critical: {
                        selected: 'bg-red-500 text-white border-red-500 shadow-md',
                        unselected: 'bg-white border-slate-200 text-slate-700 hover:bg-red-50/20 hover:border-red-300',
                        desc: 'Life Threatening (2h expiry)',
                      },
                      urgent: {
                        selected: 'bg-amber-500 text-white border-amber-500 shadow-md',
                        unselected: 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/20 hover:border-amber-300',
                        desc: 'Needed within hours (6h expiry)',
                      },
                      scheduled: {
                        selected: 'bg-blue-500 text-white border-blue-500 shadow-md',
                        unselected: 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50/20 hover:border-blue-300',
                        desc: 'Elective / Surgeries (24h expiry)',
                      },
                    }[p];

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col justify-center items-center ${
                          priority === p ? styling.selected : styling.unselected
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-wider">{p}</span>
                        <span className="text-[9px] mt-1 opacity-90 font-semibold">{styling.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Case Notes / Patient Location details
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  required
                  placeholder="e.g. Patient Arjun in Cardiac ICU, block B bed 402. Surgery scheduled for early morning, O+ compatibility matching required."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all"
                />
              </div>

              {/* Matching Engine Preview Badge */}
              <div className="bg-slate-50 border border-slate-250 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Outreach Proximity Engine</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Auto-matching compatible groups. Radius starts at 15 km and auto-expands.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Est. Notification</span>
                  <span className="text-xs font-bold text-blue-600">SMS + Push alerts</span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Alerts to Matched Donors</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Global Toast component */}
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
