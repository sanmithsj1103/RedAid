import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Lock, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { api } from '../../services/api';

export const HospitalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [department, setDepartment] = useState('Emergency Blood Bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail) {
      setError('Please enter your phone number or email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.login(phoneOrEmail, 'hospital');
      navigate('/hospital');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6">
      {/* Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-4 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          &larr; Exit Menu
        </button>
      </header>

      {/* Login Box */}
      <main className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-lg my-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 mx-auto mb-4">
            <Landmark className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-black text-slate-800">RedAid Coordinators</h1>
          <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Hospital Console Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-semibold text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="phoneOrEmail" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Hospital Contact Phone or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                id="phoneOrEmail"
                type="text"
                required
                placeholder="e.g. info.wf@manipalhospitals.com"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
              Use <span className="font-semibold text-primary">info.wf@manipalhospitals.com</span> (Manipal) or <span className="font-semibold text-primary">+918026304050</span> (Apollo) for testing.
            </p>
          </div>

          <div>
            <label htmlFor="department" className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Staff Department
            </label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all"
            >
              <option value="Emergency Blood Bank">Emergency Blood Bank</option>
              <option value="Cardiac Surgery ICU">Cardiac Surgery ICU</option>
              <option value="Pediatrics & Transfusion">Pediatrics & Transfusion</option>
              <option value="Admissions & Outreach">Admissions & Outreach</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Secure Console Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>SSL Encrypted Server Gate</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-[10px] text-slate-400 font-semibold">&copy; 2026 REDAID. Authorized Staff Access Only.</p>
      </footer>
    </div>
  );
};
