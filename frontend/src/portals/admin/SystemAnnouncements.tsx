import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Users, Landmark, Activity, LogOut, ArrowLeft, BellRing, Send, LayoutDashboard } from 'lucide-react';
import { api } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const SystemAnnouncements: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targets, setTargets] = useState<'all' | 'donors' | 'hospitals'>('all');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setToast({ message: 'Title and message details are required.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.broadcastAnnouncement(title, message, targets);
      setToast({ message: `System broadcast alert dispatched to matched ${targets.toUpperCase()} device pools.`, type: 'success' });
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setToast({ message: err.message || 'Broadcast failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

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
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <span>Fraud Monitor</span>
            </Link>
            <Link 
              to="/admin/broadcast"
              className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <BellRing className="w-4 h-4" />
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
              <h2 className="text-xl font-bold text-slate-800">System Broadcast Center</h2>
              <p className="text-[10px] text-slate-400 font-medium">Coordinate push alerts and maintenance announcements</p>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 overflow-y-auto max-w-2xl w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
            <form onSubmit={handleBroadcast} className="space-y-5">
              
              {/* Target Pools */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Notification Pools
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'donors', 'hospitals'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargets(t)}
                      className={`py-2 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors text-center ${
                        targets === t
                          ? 'bg-purple-650 text-white border-purple-500 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-450 hover:bg-slate-900'
                      }`}
                    >
                      {t === 'all' ? 'All Channels' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Alert Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Critical Blood Shortage Alert: O- Required"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="msg" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Broadcast Message
                </label>
                <textarea
                  id="msg"
                  rows={5}
                  required
                  placeholder="e.g. System alert: Bengaluru blood banks are reporting critically low stock levels of O- whole blood. Matched active donors within 25km are urged to verify availability and accept coordination requests."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-650 hover:bg-purple-700 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast System Alerts</span>
                  </>
                )}
              </button>
            </form>
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
