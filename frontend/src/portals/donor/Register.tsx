import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { api, BloodGroup, AvailabilityStatus } from '../../services/api';

export const DonorRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Step 1 State (create.png) ---
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // --- Step 2 State (pdetails.png) ---
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [status, setStatus] = useState<AvailabilityStatus>('active');

  // --- Step 3 State (Verification) ---
  const [otp, setOtp] = useState('');

  // Calculate age based on DOB
  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dob);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!dob) {
      setError('Please enter your date of birth');
      return;
    }
    if (age && (age < 18 || age > 65)) {
      setError('Eligibility Requirement: Donors must be between 18 and 65 years old.');
      return;
    }
    if (!city) {
      setError('Please enter your location/city');
      return;
    }

    setLoading(true);
    try {
      await api.sendOtp(phone);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      await api.registerDonor({
        fullName,
        phone,
        dateOfBirth: dob,
        bloodGroup,
        location: { lat: 28.6139, lng: 77.2090, city, address: city },
        availability: status,
        healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true }
      });
      // Force reload or redirect to dashboard
      navigate('/donor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between font-sans relative">
      
      {/* ================= STEP 1: CREATE ACCOUNT (create.png) ================= */}
      {step === 1 && (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-between flex-1">
          {/* Header row */}
          <div className="flex items-center pb-4">
            <button onClick={() => navigate('/donor/login')} className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 my-auto">
            {/* Drop logo */}
            <div className="text-center">
              <svg viewBox="0 0 100 100" className="w-16 h-16 fill-[#ba1a1a] mx-auto mb-4 drop-shadow-md">
                <path d="M50,5 C30,35 25,60 30,75 C35,90 50,95 50,95 C50,95 65,90 70,75 C75,60 70,35 50,5 Z" />
                <rect x="46" y="50" width="8" height="18" rx="1.5" fill="white" />
                <rect x="41" y="55" width="18" height="8" rx="1.5" fill="white" />
              </svg>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create Your Account</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">Quick signup — takes less than a minute.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[#ba1a1a] text-xs font-bold flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form details card */}
            <form onSubmit={handleStep1Submit} className="bg-white border border-[#eae7e7] rounded-3xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase text-[#ba1a1a] tracking-widest block">Your Details</span>
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-650 flex items-center gap-1 shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[9.5px] text-slate-400 font-bold leading-none pl-1">We'll send an OTP to verify this number</p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs font-bold text-slate-500 cursor-pointer select-none leading-relaxed">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-[#ba1a1a] focus:ring-[#ba1a1a] w-5 h-5 mt-0.5 shrink-0"
                  />
                  <span>
                    I agree to the <span className="text-[#ba1a1a] underline">Terms of Service</span> and <span className="text-[#ba1a1a] underline">Privacy Policy</span>
                  </span>
                </label>
              </div>

            </form>

            {/* Submit btn */}
            <button
              onClick={handleStep1Submit}
              className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow ${
                agreeTerms && email && phone && password.length >= 8
                  ? 'bg-[#ba1a1a] hover:bg-[#93000a] text-white shadow-md'
                  : 'bg-[#ffdad6]/60 text-[#ba1a1a]/60 cursor-not-allowed'
              }`}
            >
              Create Account
            </button>

            {/* Separator */}
            <div className="relative flex items-center justify-center text-[10px] font-black uppercase text-slate-400">
              <div className="absolute left-0 right-0 border-t border-slate-200/60"></div>
              <span className="bg-[#fcf9f8] px-3 z-10">or</span>
            </div>

            {/* Oauth buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setEmail('samuel@domain.com');
                  setPhone('+1 (555) 012-3456');
                  setPassword('Password123!');
                  setStep(2);
                }}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Google</span>
                <span>Continue with Google</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setEmail('samuel.phone@domain.com');
                  setPhone('+1 (555) 012-3456');
                  setPassword('PhonePassword!');
                  setStep(2);
                }}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>📱</span>
                <span>Continue with Phone Number only</span>
              </button>
            </div>

            <p className="text-center text-xs font-bold text-slate-500 pt-2">
              Already have an account?{' '}
              <button onClick={() => navigate('/donor/login')} className="text-[#ba1a1a] font-black hover:underline">
                Log In
              </button>
            </p>

          </div>

        </div>
      )}

      {/* ================= STEP 2: PERSONAL DETAILS (pdetails.png) ================= */}
      {step === 2 && (
        <div className="w-full max-w-md mx-auto flex flex-col flex-1 bg-white border-x border-[#eae7e7]">
          
          {/* Custom Red Header Bar */}
          <header className="bg-[#ba1a1a] text-white px-4 py-4 flex items-center justify-between shadow">
            <button onClick={() => setStep(1)} className="text-white hover:opacity-80">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-base font-black tracking-wide">Create Donor Profile</h2>
            <button onClick={() => alert("Simulated: Notification Drawer")} className="text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#ba1a1a]"></span>
            </button>
          </header>

          {/* Three progress bars */}
          <div className="px-5 pt-4 flex justify-between items-center gap-2.5">
            <div className="flex-1 h-1.5 bg-[#ba1a1a] rounded-full"></div>
            <div className="flex-1 h-1.5 bg-[#ba1a1a] rounded-full"></div>
            <div className="flex-1 h-1.5 bg-[#ba1a1a] rounded-full"></div>
            <span className="text-[10px] font-black text-[#ba1a1a] shrink-0">3/3</span>
          </div>

          <form onSubmit={handleStep2Submit} className="p-5 space-y-5 flex-1">
            
            <div className="space-y-1">
              <h1 className="text-xl font-black text-[#ba1a1a] tracking-tight">Personal Details</h1>
              <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                Become a lifesaver. Your information will only be shared with verified medical facilities in emergencies.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[#ba1a1a] text-xs font-bold">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
              />
            </div>

            {/* Phone Number (readonly from step 1) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Phone Number</label>
              <input
                type="text"
                required
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Email (Optional)</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
                />
              </div>
              {dob && age !== null && (
                <span className="text-xs text-slate-450 font-bold pl-1">{age} years old</span>
              )}
            </div>

            {/* Blood GroupScrolling list */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Blood Group</label>
              <div className="flex overflow-x-auto gap-2 py-1 scrollbar-none">
                {bloodGroups.map((bg) => {
                  const isSelected = bloodGroup === bg;
                  return (
                    <button
                      type="button"
                      key={bg}
                      onClick={() => setBloodGroup(bg)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all border ${
                        isSelected 
                          ? 'bg-[#ba1a1a] border-[#ba1a1a] text-white shadow' 
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      {bg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Location</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter your city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setCity('New Delhi')}
                  className="absolute right-3.5 top-3.5 text-[#ba1a1a] hover:text-[#93000a]"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Last Donation Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Last Donation Date</label>
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all"
              />
            </div>

            {/* Donor Status cards select */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Donor Status</label>
              
              {/* Active select Card */}
              <div 
                onClick={() => setStatus('active')}
                className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                  status === 'active' 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Active</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ready to receive urgent requests</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${status === 'active' ? 'border-emerald-500' : 'border-slate-300'}`}>
                  {status === 'active' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                </div>
              </div>

              {/* Snoozed select Card */}
              <div 
                onClick={() => setStatus('snoozed')}
                className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                  status === 'snoozed' 
                    ? 'border-amber-500 bg-amber-50/10' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'snoozed' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Snoozed</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Temporarily unavailable for 2 weeks</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${status === 'snoozed' ? 'border-amber-500' : 'border-slate-300'}`}>
                  {status === 'snoozed' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>}
                </div>
              </div>

              {/* Unavailable select Card */}
              <div 
                onClick={() => setStatus('unavailable')}
                className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                  status === 'unavailable' 
                    ? 'border-slate-500 bg-slate-50' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Unavailable</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Not currently accepting requests</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${status === 'unavailable' ? 'border-slate-500' : 'border-slate-300'}`}>
                  {status === 'unavailable' && <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>}
                </div>
              </div>

            </div>

            {/* Bottom Register Action */}
            <div className="pt-4 pb-6 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow flex items-center justify-center gap-2"
              >
                <span>Register as Donor</span>
                <span>❤️</span>
              </button>
              
              <p className="text-center text-[10px] font-bold text-slate-400">
                By registering, you agree to our terms of emergency response coordination.
              </p>
            </div>

          </form>

        </div>
      )}

      {/* ================= STEP 3: OTP VERIFICATION ================= */}
      {step === 3 && (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-between flex-1">
          <div className="flex items-center pb-4">
            <button onClick={() => setStep(2)} className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 my-auto max-w-sm mx-auto w-full">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verify Your Phone</h2>
              <p className="text-xs text-slate-450 font-semibold">We have sent a verification code to {phone}.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[#ba1a1a] text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-455 tracking-wider block mb-1.5">Verification Code (OTP)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter 4-digit code (e.g. 1234)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#ba1a1a] focus:bg-white transition-all text-center tracking-widest text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Verify and Finish</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-400 font-bold">Didn't receive the code?</span>
              <button 
                type="button" 
                onClick={() => alert("Simulated: OTP re-sent successfully.")}
                className="text-[#ba1a1a] text-[10px] font-black hover:underline block mx-auto mt-1"
              >
                Resend Code
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Footer copyright */}
      <footer className="text-center py-4 bg-white border-t border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
        <p>&copy; 2026 REDAID Blood Donors Network. All Rights Reserved.</p>
      </footer>

    </div>
  );
};
