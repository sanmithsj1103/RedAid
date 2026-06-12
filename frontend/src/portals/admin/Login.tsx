import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your administrator access token');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Authenticate admin via backend
      await api.login(password, 'admin', password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Access token verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-6">
      {/* Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-4">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          &larr; Exit Menu
        </button>
      </header>

      {/* Login Box */}
      <main className="max-w-md mx-auto w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl my-auto text-white">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-purple-500" />
          </div>
          <h1 className="text-xl font-black">RedAid Control</h1>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Operations Command Gate</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900/30 rounded-xl text-red-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Operator Access Token (Any password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <input
                id="token"
                type="password"
                required
                placeholder="Enter access credentials"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
              RedAid administrators require cryptokey clearance tokens. For testing, type any token.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-650 hover:bg-purple-700 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Secure Admin Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-700/60 pt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
          <ShieldCheck className="w-4 h-4 text-purple-500" />
          <span>Root Clearance Active</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-[10px] text-slate-500 font-semibold">&copy; 2026 REDAID. Platform Administration System.</p>
      </footer>
    </div>
  );
};
