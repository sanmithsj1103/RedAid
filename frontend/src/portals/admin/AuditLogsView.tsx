import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Users, Landmark, Activity, LogOut, ArrowLeft, ClipboardList, Info, LayoutDashboard } from 'lucide-react';
import { api, AuditLog } from '../../services/api';

export const AuditLogsView: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-650 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading System Logs...</p>
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
              className="flex items-center gap-3 px-4 py-3 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <ClipboardList className="w-4 h-4" />
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
              <h2 className="text-xl font-bold text-slate-800">Operational Audit Logs</h2>
              <p className="text-[10px] text-slate-400 font-medium">Compliance and system verification trail</p>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-w-5xl w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-purple-500" />
              System Event Log Trail
            </h3>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 font-semibold">No audit logs recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <div key={log.id} className="py-4 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between items-center text-[10px] text-slate-550 font-bold">
                      <span className="text-purple-400">ID: {log.id}</span>
                      <span>
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-slate-300">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Action</span>
                        <span className="mt-0.5 block font-bold text-white">{log.action}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Actor</span>
                        <span className="mt-0.5 block">{log.actorRole.toUpperCase()} ({log.actorId ? log.actorId.substring(0, 8) : 'SYSTEM'})</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Entity Target</span>
                        <span className="mt-0.5 block">{log.entityType} ({log.entityId.substring(0, 8)})</span>
                      </div>
                    </div>

                    {/* Metadata details toggle */}
                    <div>
                      <button
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        className="text-[10px] text-slate-450 hover:text-purple-400 flex items-center gap-1 mt-1 font-bold"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>{expandedLogId === log.id ? 'Hide Parameters' : 'View Parameters'}</span>
                      </button>
                      
                      {expandedLogId === log.id && (
                        <pre className="mt-2 p-3 bg-slate-950 text-slate-400 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-800">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
