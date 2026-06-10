import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Heart, ArrowRight, Activity } from 'lucide-react';
import { api } from '../../services/api';

export const DonorLogin: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.sendOtp(phone);
      setStep(2);
      setInfo('Simulated OTP code sent to your device!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      const res = await api.login(phone, 'donor');
      navigate('/donor/dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Upper Content */}
      <div className="flex-1 flex flex-col justify-center py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg border border-primary/20 mx-auto mb-4 animate-pulse">
            <Heart className="w-9 h-9 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Red<span className="text-primary">Aid</span> Donors</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">LOG IN TO SAVE A LIFE TODAY</p>
        </div>

        {/* Info Notification */}
        {info && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs font-semibold text-center">
            {info}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-semibold text-center">
            {error}
          </div>
        )}

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
                Use <span className="font-semibold text-primary">+919876543210</span> (Arjun) or <span className="font-semibold text-primary">+919876543211</span> (Priya) to test verified accounts.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Verify OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                Verification Code (OTP)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  type="text"
                  required
                  placeholder="Enter 4 or 6 digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify and Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors py-2"
            >
              Go Back
            </button>
          </form>
        )}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-surface-container-high"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-3 text-[10px] text-on-surface-variant font-bold">New Donor?</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/donor/register')}
          className="w-full border border-surface-container-high hover:border-primary/30 bg-white text-on-surface py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
        >
          Create Blood Donor Account
        </button>
      </div>

      {/* Footer Gateway Selection */}
      <footer className="py-4 border-t border-surface-container-high text-center">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-primary hover:underline"
        >
          &larr; Exit to Gateway Menu
        </button>
      </footer>
    </div>
  );
};
