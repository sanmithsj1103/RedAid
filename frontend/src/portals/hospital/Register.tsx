import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone as PhoneIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowRight,
  ArrowLeft,
  Building,
  Briefcase,
  Upload,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  HelpCircle,
  FileText,
  Droplet
} from 'lucide-react';
import { api, BloodGroup } from '../../services/api';

export const HospitalRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // --- Step 1: Account Setup State ---
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // --- Step 2: Hospital Details State ---
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalType, setHospitalType] = useState<'Government' | 'Private' | 'NGO/Trust'>('Private');
  const [numberOfBeds, setNumberOfBeds] = useState('0');
  const [hasBloodBank, setHasBloodBank] = useState(true);
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<string | null>(null);

  // --- Step 3: Location & Contact Details State ---
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [is247, setIs247] = useState(true);

  // --- Step 4: Verification Documents State ---
  const [regNumber, setRegNumber] = useState('');
  const [docCertificate, setDocCertificate] = useState<string | null>(null);
  const [docLicense, setDocLicense] = useState<string | null>(null);
  const [docIdProof, setDocIdProof] = useState<string | null>(null);

  // --- Step 5: Review State ---
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);

  // Navigation handlers
  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!email || !phone || !password || !confirmPassword) {
        setError('Please fill in all account fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!hospitalName) {
        setError('Please enter your Hospital Name');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!streetAddress || !city || !pincode || !contactName || !contactDesignation || !contactPhone || !contactEmail) {
        setError('Please fill in all location and contact details');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!regNumber) {
        setError('Please enter your Hospital Registration Number');
        return;
      }
      if (!docCertificate) {
        setError('Please upload your Hospital Registration Certificate');
        return;
      }
      if (!docIdProof) {
        setError('Please upload Signatory ID Proof');
        return;
      }
      setStep(5);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/hospital/login');
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedAccuracy) {
      setError('You must confirm that all details are accurate');
      return;
    }

    try {
      await api.registerHospital({
        name: hospitalName,
        registrationNumber: regNumber,
        phone: phone || contactPhone,
        email: email || contactEmail,
        address: `${streetAddress}, ${city}, ${state} - ${pincode}`,
        location: { lat: 28.6139, lng: 77.2090, city },
      });
      alert('Hospital registered successfully! Redirecting to dashboard...');
      navigate('/hospital');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  // Mock Upload Simulator helper
  const simulateUpload = (docType: 'logo' | 'cert' | 'license' | 'id') => {
    const mockNames: Record<string, string> = {
      logo: 'hospital_logo_upload.png',
      cert: 'Hospital_Registration_Certificate.pdf',
      license: 'Blood_Bank_License_RD2026.pdf',
      id: 'Signatory_Govt_ID_Proof.jpg'
    };
    
    if (docType === 'logo') setLogoFile(mockNames.logo);
    if (docType === 'cert') setDocCertificate(mockNames.cert);
    if (docType === 'license') setDocLicense(mockNames.license);
    if (docType === 'id') setDocIdProof(mockNames.id);
    alert(`${mockNames[docType]} uploaded successfully (simulated).`);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Background Droplet Watermark (Bottom Right) */}
      <div className="absolute right-[-100px] bottom-[-100px] text-[#ffdad6]/20 select-none pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-80 h-80 fill-current">
          <path d="M50 15 C30 40 30 75 50 85 C70 75 70 40 50 15 Z" />
        </svg>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-8 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-black text-xs">
            +
          </div>
          <span className="font-black text-sm tracking-wider text-slate-800 uppercase">RedAid</span>
          <span className="text-slate-300 font-light px-1">|</span>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {step === 1 ? 'Hospital Registration Portal' : step <= 2 ? 'Hospital Onboarding' : step === 3 ? 'Hospital Network Registration' : 'Hospital Portal'}
          </span>
        </div>
        <button 
          onClick={() => alert("Registration support line: support@redaid.org")}
          className="text-slate-400 hover:text-[#ba1a1a] transition-colors"
          title="Need Help?"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 my-auto">
        <div className="w-full max-w-2xl bg-white border border-[#eae7e7] rounded-2xl shadow-lg overflow-hidden flex flex-col justify-between">
          
          {/* Progress Tracker Bar (Step 1) or Circles (Steps 2-5) */}
          {step === 1 ? (
            <div className="px-6 pt-5 pb-2 border-b border-[#eae7e7]/60 bg-slate-50/50">
              <div className="flex justify-between items-baseline text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">
                <span className="text-[#ba1a1a]">Step 1: Account Setup</span>
                <span>20% Completed</span>
              </div>
              <div className="flex gap-1.5 h-1">
                <div className="flex-1 bg-[#ba1a1a] rounded-full"></div>
                <div className="flex-1 bg-slate-200 rounded-full"></div>
                <div className="flex-1 bg-slate-200 rounded-full"></div>
                <div className="flex-1 bg-slate-200 rounded-full"></div>
                <div className="flex-1 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="px-6 pt-5 pb-3 border-b border-[#eae7e7]/60 bg-slate-50/50">
              <div className="flex justify-between items-center max-w-md mx-auto relative">
                {/* Horizontal progress lines */}
                <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200 z-0"></div>
                <div 
                  className="absolute left-4 top-4 h-0.5 bg-emerald-500 transition-all duration-300 z-0"
                  style={{ width: `${((step - 1) / 4) * 92}%` }}
                ></div>

                {/* Circles */}
                {[1, 2, 3, 4, 5].map((s) => {
                  const isDone = s < step;
                  const isActive = s === step;
                  const labels = ['Account Info', 'Hospital Details', 'Location', 'Verification', 'Review'];
                  
                  return (
                    <div key={s} className="flex flex-col items-center z-10 relative">
                      <button
                        type="button"
                        onClick={() => { if (s < step) setStep(s); }}
                        disabled={s >= step}
                        className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-black transition-all border ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isActive 
                              ? 'bg-white border-[#ba1a1a] text-[#ba1a1a] ring-4 ring-[#ffdad6]/40' 
                              : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        {isDone ? <Check className="w-4.5 h-4.5" /> : `0${s}`}
                      </button>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider mt-1.5 ${isActive ? 'text-[#ba1a1a]' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {labels[s - 1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Content Wrapper */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[#ba1a1a] text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-[#ba1a1a] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ================= STEP 1: ACCOUNT SETUP ================= */}
            {step === 1 && (
              <form onSubmit={handleContinue} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Create Hospital Account</h2>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Start by providing the official contact details for your medical facility.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Official Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Official Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. admin@cityhospital.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-650 font-bold shrink-0">
                        +91
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-bold leading-none mt-1">A one-time password (OTP) will be sent to this number for verification.</p>
                  </div>

                  {/* Passwords grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Create Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          required
                          placeholder="Min. 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex gap-3 text-sky-800 text-[11px] leading-relaxed">
                    <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <p className="font-semibold">
                      OTP verification is mandatory for all hospital registrations to ensure secure blood inventory management and emergency dispatch tracking.
                    </p>
                  </div>

                </div>

                {/* Footer Buttons inside card */}
                <div className="border-t border-slate-100 pt-5 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    disabled
                    className="py-2.5 px-6 border border-slate-200 bg-slate-100 text-slate-400 rounded-lg text-xs font-black uppercase cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 2: HOSPITAL DETAILS ================= */}
            {step === 2 && (
              <form onSubmit={handleContinue} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Hospital Details</h2>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Please provide the core information about your medical facility to help us tailor your dashboard.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Hospital Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Hospital Name</label>
                    <input
                      type="text"
                      required
                      placeholder="City Care Medical Center"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-450 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  {/* Hospital Type Selection Cards */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Hospital Type</label>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Govt */}
                      <button
                        type="button"
                        onClick={() => setHospitalType('Government')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                          hospitalType === 'Government' 
                            ? 'border-[#ba1a1a] bg-[#ffdad6]/10 text-[#ba1a1a] shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-5 h-5 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Government</span>
                      </button>

                      {/* Private */}
                      <button
                        type="button"
                        onClick={() => setHospitalType('Private')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                          hospitalType === 'Private' 
                            ? 'border-[#ba1a1a] bg-[#ffdad6]/10 text-[#ba1a1a] shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-5 h-5 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Private</span>
                      </button>

                      {/* NGO */}
                      <button
                        type="button"
                        onClick={() => setHospitalType('NGO/Trust')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                          hospitalType === 'NGO/Trust' 
                            ? 'border-[#ba1a1a] bg-[#ffdad6]/10 text-[#ba1a1a] shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Building className="w-5 h-5 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-wider">NGO/Trust</span>
                      </button>
                    </div>
                  </div>

                  {/* Beds and Blood Bank Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Number of Beds */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Number of Beds</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="number"
                          required
                          value={numberOfBeds}
                          onChange={(e) => setNumberOfBeds(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* Blood Bank Switch toggle */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Has Blood Bank?</label>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg h-10">
                        <span className="text-xs text-slate-700 font-semibold">Yes, on-site bank</span>
                        <button
                          type="button"
                          onClick={() => setHasBloodBank(!hasBloodBank)}
                          className={`w-9 h-5.5 rounded-full flex items-center p-0.5 transition-colors duration-300 ${hasBloodBank ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}
                        >
                          <div className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Description */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Hospital Description</label>
                    <textarea
                      placeholder="Brief overview of hospital specialties and mission..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                    ></textarea>
                  </div>

                  {/* Hospital Logo upload */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Hospital Logo</label>
                    <div 
                      onClick={() => simulateUpload('logo')}
                      className="border-2 border-dashed border-slate-200 hover:border-[#ba1a1a] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-[#ffdad6]/5 flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#ba1a1a]" />
                      <div className="text-xs font-bold text-slate-700">
                        {logoFile ? `Uploaded: ${logoFile}` : 'Click to upload or drag and drop'}
                      </div>
                      <p className="text-[9px] font-semibold text-slate-400">SVG, PNG, JPG or GIF (max. 800×400px)</p>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons inside card */}
                <div className="border-t border-slate-100 pt-5 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="py-2.5 px-6 border border-[#ba1a1a] text-[#ba1a1a] rounded-lg text-xs font-black uppercase hover:bg-[#ffdad6]/10 transition-colors"
                  >
                    Back
                  </button>
                  <span className="text-[10px] font-black text-slate-400">Step 2 of 5</span>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 3: LOCATION & CONTACT DETAILS ================= */}
            {step === 3 && (
              <form onSubmit={handleContinue} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Location & Contact Details</h2>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Provide the exact location and primary contact for your hospital blood bank.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Street Address & Map grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fields */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Street Address</label>
                        <textarea
                          required
                          placeholder="e.g. 123 Healthcare Blvd, Medical District"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          rows={2.5}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                        ></textarea>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">City</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. New Delhi"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">State</label>
                          <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                          >
                            <option value="Delhi">Delhi</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Pincode</label>
                          <input
                            type="text"
                            required
                            placeholder="6 Digits"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mock Map pin widget */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Pin Location on Map</label>
                      <div className="relative border border-slate-200 rounded-xl overflow-hidden h-44 bg-slate-100 flex items-center justify-center">
                        {/* Map Graphic mockup */}
                        <div className="absolute inset-0 opacity-80 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=300')` }}></div>
                        <div className="absolute inset-0 bg-slate-50/40"></div>
                        
                        {/* Marker Pin */}
                        <div className="z-10 flex flex-col items-center animate-bounce">
                          <MapPin className="w-8 h-8 text-[#ba1a1a] fill-[#ffdad6]" />
                        </div>
                        
                        {/* Map coordinate tag */}
                        <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-0.5 rounded text-[8px] font-black text-slate-700 border border-slate-200">
                          GPS: 28.6139° N, 77.2090° E
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Contact Person form box */}
                  <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Briefcase className="w-4 h-4 text-[#ba1a1a]" />
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-750">Authorized Contact Person</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8.5px] font-black uppercase text-slate-400 tracking-wider mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Dr. Sarah Johnson"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-black uppercase text-slate-400 tracking-wider mb-1">Designation</label>
                        <input
                          type="text"
                          required
                          placeholder="Head of Blood Bank"
                          value={contactDesignation}
                          onChange={(e) => setContactDesignation(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-black uppercase text-slate-400 tracking-wider mb-1">Mobile Phone</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[8.5px] font-black uppercase text-slate-400 tracking-wider mb-1">Official Email</label>
                        <input
                          type="email"
                          required
                          placeholder="bloodbank@hospital.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 24/7 Availability Timings toggle */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-450" />
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-tight">Blood Bank Timings</h4>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">24/7 Availability</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIs247(!is247)}
                      className={`w-9 h-5.5 rounded-full flex items-center p-0.5 transition-colors duration-300 ${is247 ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}
                    >
                      <div className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"></div>
                    </button>
                  </div>

                </div>

                {/* Footer Buttons inside card */}
                <div className="border-t border-slate-100 pt-5 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="py-2.5 px-6 border border-[#ba1a1a] text-[#ba1a1a] rounded-lg text-xs font-black uppercase hover:bg-[#ffdad6]/10 transition-colors"
                  >
                    Back
                  </button>
                  <span className="text-[10px] font-black text-slate-400">Step 3 of 5</span>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 4: VERIFICATION DOCUMENTS ================= */}
            {step === 4 && (
              <form onSubmit={handleContinue} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Verification Documents</h2>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Please upload valid legal documents for your institution to activate your blood request permissions.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Registration Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black uppercase text-slate-450 tracking-wider">Hospital Registration Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., HRN-8829-X-2024"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-450 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  {/* Document uploads blocks */}
                  <div className="space-y-3">
                    
                    {/* Document 1: Reg Certificate */}
                    <div 
                      onClick={() => simulateUpload('cert')}
                      className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-sm ${
                        docCertificate ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${docCertificate ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-[#ba1a1a]'}`}>
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 leading-tight">Hospital Registration Certificate</h4>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Upload PDF or Image (Max 5MB)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#ba1a1a] hover:underline shrink-0">
                        {docCertificate ? 'Replace File' : 'Click to upload file'}
                      </span>
                    </div>

                    {/* Document 2: Blood Bank License */}
                    <div 
                      onClick={() => simulateUpload('license')}
                      className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-sm ${
                        docLicense ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${docLicense ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-[#ba1a1a]'}`}>
                          <Droplet className="w-4.5 h-4.5 fill-current" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 leading-tight">Blood Bank License (Optional)</h4>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Required for direct inventory management access</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#ba1a1a] hover:underline shrink-0">
                        {docLicense ? 'Replace File' : 'Click to upload file'}
                      </span>
                    </div>

                    {/* Document 3: ID Proof */}
                    <div 
                      onClick={() => simulateUpload('id')}
                      className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-sm ${
                        docIdProof ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${docIdProof ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-[#ba1a1a]'}`}>
                          <ShieldCheck className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 leading-tight">Authorized Signatory ID Proof</h4>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Government issued ID (Passport, National ID)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#ba1a1a] hover:underline shrink-0">
                        {docIdProof ? 'Replace File' : 'Click to upload file'}
                      </span>
                    </div>

                  </div>

                  {/* Verification Timeline info box */}
                  <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800 text-[11px] leading-relaxed shadow-sm">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black">Verification Timeline</h5>
                      <p className="font-semibold mt-0.5 text-slate-500">
                        Once submitted, our compliance team will review your documents within 24-48 business hours. You can track status in your dashboard.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons inside card */}
                <div className="border-t border-slate-100 pt-5 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="py-2.5 px-6 border border-[#ba1a1a] text-[#ba1a1a] rounded-lg text-xs font-black uppercase hover:bg-[#ffdad6]/10 transition-colors"
                  >
                    Back
                  </button>
                  <span className="text-[10px] font-black text-slate-400">Step 4 of 5</span>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 5: REVIEW YOUR APPLICATION ================= */}
            {step === 5 && (
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Review Your Application</h2>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">Please confirm the details below before submitting your hospital registration for verification.</p>
                </div>

                <div className="space-y-3 pt-2">
                  
                  {/* Account Information block */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-sm relative">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="absolute right-4 top-4 text-[9px] font-black uppercase tracking-wider text-[#ba1a1a] hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Account Information</span>
                    <div className="text-xs mt-1 space-y-0.5">
                      <div className="font-black text-slate-800">{email}</div>
                      <div className="text-slate-400 font-semibold">Primary Admin Account</div>
                    </div>
                  </div>

                  {/* Hospital Details block */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-sm relative">
                    <button 
                      type="button"
                      onClick={() => setStep(2)}
                      className="absolute right-4 top-4 text-[9px] font-black uppercase tracking-wider text-[#ba1a1a] hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Hospital Details</span>
                    <div className="text-xs mt-1 space-y-0.5">
                      <div className="font-black text-slate-800">{hospitalName}</div>
                      <div className="text-slate-400 font-semibold">
                        {hospitalType} Care • Beds: {numberOfBeds} • {hasBloodBank ? 'Has On-site Blood Bank' : 'No On-site Blood Bank'}
                      </div>
                    </div>
                  </div>

                  {/* Location & Contact details block */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-sm relative">
                    <button 
                      type="button"
                      onClick={() => setStep(3)}
                      className="absolute right-4 top-4 text-[9px] font-black uppercase tracking-wider text-[#ba1a1a] hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Location & Contact</span>
                    <div className="text-xs mt-1 space-y-0.5">
                      <div className="font-black text-slate-800">{streetAddress}, {city}, {state} - {pincode}</div>
                      <div className="text-slate-400 font-semibold">
                        Contact: {contactName} ({contactDesignation}) • Phone: {contactPhone}
                      </div>
                    </div>
                  </div>

                  {/* Documents provided block */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 shadow-sm relative">
                    <button 
                      type="button"
                      onClick={() => setStep(4)}
                      className="absolute right-4 top-4 text-[9px] font-black uppercase tracking-wider text-[#ba1a1a] hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">Documents Provided</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {docCertificate && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-[9.5px] font-bold text-slate-650">
                          <FileText className="w-3 h-3 text-[#ba1a1a]" />
                          {docCertificate}
                        </span>
                      )}
                      {docLicense && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-[9.5px] font-bold text-slate-650">
                          <FileText className="w-3 h-3 text-[#ba1a1a]" />
                          {docLicense}
                        </span>
                      )}
                      {docIdProof && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-[9.5px] font-bold text-slate-650">
                          <FileText className="w-3 h-3 text-[#ba1a1a]" />
                          {docIdProof}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confirmed Accuracy Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 text-[11px] font-bold text-slate-500 cursor-pointer select-none leading-relaxed">
                      <input
                        type="checkbox"
                        required
                        checked={confirmedAccuracy}
                        onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                        className="rounded border-slate-350 text-[#ba1a1a] focus:ring-[#ba1a1a] w-4.5 h-4.5 mt-0.5 shrink-0"
                      />
                      <span>
                        I confirm that all information provided is accurate and all documents are authentic. I understand that misrepresentation may result in application rejection.
                      </span>
                    </label>
                  </div>

                </div>

                {/* Footer Submit buttons */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <button
                    type="submit"
                    className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Verification
                  </button>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-1">
                    <button 
                      type="button" 
                      onClick={handleBack}
                      className="hover:underline flex items-center gap-1"
                    >
                      &larr; Back to documents
                    </button>
                    <span>Step 5 of 5</span>
                  </div>
                </div>

              </form>
            )}

          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center py-5 border-t border-[#eae7e7]/50 bg-white text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0 z-10">
        <p>&copy; 2026 REDAID Blood Logistics Network. All Rights Reserved.</p>
      </footer>

    </div>
  );
};
