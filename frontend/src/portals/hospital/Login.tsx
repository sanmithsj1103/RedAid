import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';

export const HospitalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      // Authenticate with mock api
      await api.login(email, 'hospital');
      navigate('/hospital');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Sign in as default hospital
      await api.login('logistics@stjude.medical', 'hospital');
      navigate('/hospital');
    } catch (err) {
      setError('Google Sign In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      
      {/* Left Pane: Split Screen Red Brand Showcase (Image.png) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#ba1a1a] flex-col justify-between p-12 text-white relative">
        {/* Brand Header */}
        <div className="flex items-center gap-2">
          {/* Logo Circle */}
          <div className="w-8 h-8 rounded-full bg-white text-[#ba1a1a] flex items-center justify-center font-black text-sm shadow-md">
            +
          </div>
          <span className="font-black text-lg tracking-wider">REDAID</span>
        </div>

        {/* Center Illustration Frame */}
        <div className="my-auto space-y-10 flex flex-col items-center">
          {/* Neon Cyan SVG Hospital Outline Illustration */}
          <div className="w-80 h-80 rounded-2xl bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-center shadow-lg relative p-6">
            {/* Cyan glowing backdrop */}
            <div className="absolute inset-8 rounded-full bg-cyan-400/10 blur-3xl"></div>
            
            <svg viewBox="0 0 120 120" className="w-64 h-64 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] z-10">
              {/* Floor/Base grid */}
              <line x1="10" y1="100" x2="110" y2="100" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              
              {/* Left wing building */}
              <rect x="25" y="55" width="20" height="45" rx="2" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
              <line x1="31" y1="65" x2="31" y2="70" stroke="#22d3ee" strokeWidth="1" />
              <line x1="39" y1="65" x2="39" y2="70" stroke="#22d3ee" strokeWidth="1" />
              <line x1="31" y1="78" x2="31" y2="83" stroke="#22d3ee" strokeWidth="1" />
              <line x1="39" y1="78" x2="39" y2="83" stroke="#22d3ee" strokeWidth="1" />
              <line x1="31" y1="90" x2="31" y2="95" stroke="#22d3ee" strokeWidth="1" />
              <line x1="39" y1="90" x2="39" y2="95" stroke="#22d3ee" strokeWidth="1" />

              {/* Right wing building */}
              <rect x="75" y="55" width="20" height="45" rx="2" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
              <line x1="81" y1="65" x2="81" y2="70" stroke="#22d3ee" strokeWidth="1" />
              <line x1="89" y1="65" x2="89" y2="70" stroke="#22d3ee" strokeWidth="1" />
              <line x1="81" y1="78" x2="81" y2="83" stroke="#22d3ee" strokeWidth="1" />
              <line x1="89" y1="78" x2="89" y2="83" stroke="#22d3ee" strokeWidth="1" />
              <line x1="81" y1="90" x2="81" y2="95" stroke="#22d3ee" strokeWidth="1" />
              <line x1="89" y1="90" x2="89" y2="95" stroke="#22d3ee" strokeWidth="1" />

              {/* Center Main building tower */}
              <rect x="42" y="30" width="36" height="70" rx="3" stroke="#22d3ee" strokeWidth="2" fill="none" />
              
              {/* Medical Plus Cross */}
              <rect x="56" y="38" width="8" height="8" rx="1.5" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
              <line x1="60" y1="40" x2="60" y2="44" stroke="#22d3ee" strokeWidth="1" />
              <line x1="58" y1="42" x2="62" y2="42" stroke="#22d3ee" strokeWidth="1" />

              {/* Windows center tower */}
              <rect x="49" y="52" width="6" height="8" rx="1" stroke="#22d3ee" strokeWidth="1" fill="none" />
              <rect x="65" y="52" width="6" height="8" rx="1" stroke="#22d3ee" strokeWidth="1" fill="none" />
              <rect x="49" y="65" width="6" height="8" rx="1" stroke="#22d3ee" strokeWidth="1" fill="none" />
              <rect x="65" y="65" width="6" height="8" rx="1" stroke="#22d3ee" strokeWidth="1" fill="none" />
              <rect x="49" y="78" width="6" height="8" rx="1" stroke="#22d3ee" strokeWidth="1" fill="none" />
              <rect x="65" y="78" width="6" height="8" rx="1" stroke="#22d3ee" strokeWidth="1" fill="none" />

              {/* Main Entrance door */}
              <path d="M54 100 V90 H66 V100" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
              
              {/* Map pin coordinates icons around building */}
              <circle cx="20" cy="45" r="2" fill="#22d3ee" />
              <path d="M20 45 C18 40 22 40 20 35 C18 40 22 40 20 45" stroke="#22d3ee" strokeWidth="1" />
              
              <circle cx="100" cy="45" r="2" fill="#22d3ee" />
              <path d="M100 45 C98 40 102 40 100 35 C98 40 102 40 100 45" stroke="#22d3ee" strokeWidth="1" />

              <circle cx="50" cy="18" r="1.5" fill="#22d3ee" />
              <circle cx="70" cy="18" r="1.5" fill="#22d3ee" />
            </svg>
          </div>

          <div className="text-center max-w-sm space-y-3">
            <h2 className="text-lg font-black tracking-wide leading-snug">Connecting Hospitals to Lifesavers, Instantly</h2>
            <p className="text-xs text-red-100 font-semibold leading-relaxed">
              Empowering medical institutions with real-time donor tracking and streamlined blood inventory management.
            </p>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-6 text-center text-[10px] uppercase font-black tracking-wider">
          <div className="space-y-0.5">
            <div className="text-base">500+</div>
            <div className="text-white/70">Hospitals</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base">50,000+</div>
            <div className="text-white/70">Donors</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base">10,000+</div>
            <div className="text-white/70">Lives Saved</div>
          </div>
        </div>
      </div>

      {/* Right Pane: Login Credentials Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-16 my-auto">
        {/* Back action */}
        <div className="flex justify-between items-center pb-6 lg:pb-0">
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-black text-[#ba1a1a] hover:underline uppercase tracking-wider"
          >
            &larr; Portal Gateway
          </button>
        </div>

        <div className="max-w-md mx-auto w-full space-y-8 py-10">
          
          {/* Header titles */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ba1a1a]">Hospital Portal</span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Please enter your credentials to access the blood management dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[#ba1a1a] text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form details */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="hospital@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="pass" className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-450 hover:text-slate-650"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / Forgot password */}
            <div className="flex items-center justify-between text-[11px] font-bold">
              <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#ba1a1a] focus:ring-[#ba1a1a] w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>
              
              <button 
                type="button"
                onClick={() => alert("Simulated: Forgot password flow initialized.")}
                className="text-[#ba1a1a] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3 rounded-lg text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* separator line */}
          <div className="relative flex items-center justify-center py-2 text-[10px] font-black uppercase text-slate-450">
            <div className="absolute left-0 right-0 border-t border-slate-100"></div>
            <span className="bg-white px-3 z-10">or</span>
          </div>

          {/* Social login Google */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {/* Google Icon */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Register link */}
          <p className="text-center text-xs font-semibold text-slate-500">
            Don't have a hospital account?{' '}
            <button 
              onClick={() => navigate('/hospital/register')}
              className="text-[#ba1a1a] font-black hover:underline"
            >
              Register Your Hospital
            </button>
          </p>

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-100 flex flex-col items-center gap-1">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
            By continuing, you agree to REDAID'S{' '}
            <a href="#" className="underline">Terms of Service</a> and{' '}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
          <p className="text-[7.5px] font-black uppercase text-slate-400/80 tracking-widest mt-0.5">
            Unauthorized access is strictly prohibited and monitored.
          </p>
        </div>
      </div>

    </div>
  );
};
