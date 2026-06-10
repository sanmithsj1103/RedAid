import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, MapPin, Heart, ArrowRight, ArrowLeft } from 'lucide-react';
import { api, BloodGroup } from '../../services/api';

export const DonorRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  
  // Health declaration states
  const [noTattoosRecent, setNoTattoosRecent] = useState(false);
  const [noMedicationRecent, setNoMedicationRecent] = useState(false);
  const [generalFitness, setGeneralFitness] = useState(false);

  // OTP states
  const [otp, setOtp] = useState('');

  const calculateAge = (dobString: string) => {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!fullName || !phone || !dateOfBirth) {
        setError('Please fill in all personal details');
        return;
      }
      const age = calculateAge(dateOfBirth);
      if (age < 18 || age > 65) {
        setError('Eligibility requirement: Donors must be between 18 and 65 years old.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!city || !address) {
        setError('Please enter your location details');
        return;
      }
      if (!noTattoosRecent || !noMedicationRecent || !generalFitness) {
        setError('You must read and satisfy all health declarations to register as an active donor.');
        return;
      }
      setLoading(true);
      // Simulate sending verification code
      api.sendOtp(phone).then(() => {
        setStep(3);
        setError('');
      }).catch(err => {
        setError(err.message || 'Failed to send verification code');
      }).finally(() => {
        setLoading(false);
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      await api.registerDonor({
        fullName,
        phone,
        dateOfBirth,
        bloodGroup,
        location: { lat: 12.9716, lng: 77.5946, city, address },
        availability: 'active',
        healthDeclaration: { noTattoosRecent, noMedicationRecent, generalFitness },
      });
      navigate('/donor/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center py-6">
        {/* Top Progress bar */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>1</div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-surface-container'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>2</div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-surface-container'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 3 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>3</div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Become a Donor</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">JOIN THE VITAL RESPONSE NETWORK</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-semibold text-center leading-relaxed">
            {error}
          </div>
        )}

        {step === 1 && (
          /* Step 1: Personal Details */
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Arjun Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4.5 w-4.5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dob" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input
                    id="dob"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bloodGroup" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Blood Group</label>
                <select
                  id="bloodGroup"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="block w-full px-3 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
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
            </div>

            <button
              onClick={handleNextStep}
              className="w-full bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          /* Step 2: Location and Health Declarations */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Address / Area</label>
                <input
                  id="address"
                  type="text"
                  required
                  placeholder="Whitefield"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Health Declarations Card */}
            <div className="bg-white border border-surface-container-high rounded-2xl p-4 space-y-3 mt-2">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider border-bottom pb-1.5 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                Health Declaration
              </h3>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noTattoosRecent}
                  onChange={(e) => setNoTattoosRecent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary/40 border-slate-300"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                  I have NOT had any tattoos, piercings, or acupuncture in the past 6 months.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noMedicationRecent}
                  onChange={(e) => setNoMedicationRecent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary/40 border-slate-300"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                  I am NOT currently on active antibiotics or major prescription medications.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generalFitness}
                  onChange={(e) => setGeneralFitness(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary/40 border-slate-300"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                  I declare myself to be in good general health, weighing over 45 kg, and feeling fit.
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-1 px-4 border border-surface-container-high bg-white text-on-surface rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                onClick={handleNextStep}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Submit & Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          /* Step 3: Verify Phone OTP code */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs font-semibold text-center">
              Simulated verification code has been sent to {phone}!
            </div>

            <div>
              <label htmlFor="otp" className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Verification Code</label>
              <input
                id="otp"
                type="text"
                required
                placeholder="Enter verification code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-surface-container-high rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-1 px-4 border border-surface-container-high bg-white text-on-surface rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify and Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <footer className="py-4 border-t border-surface-container-high text-center">
        <button
          onClick={() => navigate('/donor/login')}
          className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          Already have an account? <span className="font-bold text-primary">Login</span>
        </button>
      </footer>
    </div>
  );
};
