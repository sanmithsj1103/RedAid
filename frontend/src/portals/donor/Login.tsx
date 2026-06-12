import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export const DonorLogin: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.login(phone, 'donor');
      navigate('/donor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
<<<<<<< HEAD
      await api.login('+1 (555) 012-3456', 'donor');
      navigate('/donor/dashboard');
    } catch (err) {
      setError('Google Sign In failed.');
=======
      const res = await api.verifyOtp(phone, otp);
      if (res.isNewUser) {
        // New user — redirect to registration
        navigate('/donor/register');
      } else {
        // Existing user — session already established
        navigate('/donor/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between p-4 max-w-md mx-auto font-sans relative">
      
      {/* Main card */}
      <div className="bg-white border border-[#eae7e7] rounded-3xl p-6 shadow-lg space-y-6 my-auto mt-8">
        
        {/* Blood drop Logo - styled exactly like Image 5 */}
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="w-16 h-16 fill-[#ba1a1a] mx-auto mb-4 drop-shadow-md">
            <path d="M50,5 C30,35 25,60 30,75 C35,90 50,95 50,95 C50,95 65,90 70,75 C75,60 70,35 50,5 Z" />
            <rect x="46" y="50" width="8" height="18" rx="1.5" fill="white" />
            <rect x="41" y="55" width="18" height="8" rx="1.5" fill="white" />
          </svg>
          <h1 className="text-xl font-black text-[#ba1a1a] tracking-tight">Welcome to REDAID</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Connecting hearts, saving lives.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[#ba1a1a] text-xs font-bold flex items-center gap-2">
            <span className="shrink-0 font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

<<<<<<< HEAD
        {/* Login Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>Phone Number</span>
            </label>
            <input
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all text-slate-700"
            />
            <p className="text-[9.5px] text-slate-400 font-bold leading-none pl-1">
              Test Donor: <span className="text-[#ba1a1a] font-black">+1 (555) 012-3456</span>
            </p>
          </div>
=======
        {step === 1 ? (
          /* Step 1: Send OTP */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="e.g., +919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1.5 leading-normal">
                Enter your registered phone number in <span className="font-semibold text-primary">+91XXXXXXXXXX</span> format.
              </p>
            </div>
>>>>>>> 385aa2671327c2bf0c83f743dca091d87ce46fa4

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Password</span>
              </label>
              <button
                type="button"
                onClick={() => alert("Simulated: Password reset link sent.")}
                className="text-[10px] font-black text-[#ba1a1a] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Login</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/donor/register')}
              className="w-full border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/20 py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center bg-white"
            >
              Create Account
            </button>
          </div>

        </form>

        {/* separator line */}
        <div className="relative flex items-center justify-center py-1 text-[10px] font-black uppercase text-slate-400">
          <div className="absolute left-0 right-0 border-t border-slate-100"></div>
          <span className="bg-white px-3 z-10">or</span>
        </div>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center gap-2.5 transition-all shadow-sm bg-white"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" className="w-[18px] h-[18px] shrink-0" style={{ minWidth: '18px', minHeight: '18px' }}>
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

      </div>

      {/* Footer terms */}
      <footer className="text-center py-4 border-t border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
        <p className="leading-relaxed">
          By continuing, you agree to REDAID's{' '}
          <a href="#" className="underline text-slate-500">Terms of Service</a> and{' '}
          <a href="#" className="underline text-slate-500">Privacy Policy</a>.
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-black text-[#ba1a1a] hover:underline uppercase tracking-wider mt-3"
        >
          &larr; Exit to Gateway Menu
        </button>
      </footer>

    </div>
  );
};
