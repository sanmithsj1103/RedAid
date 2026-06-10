import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Heart, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';
import { api, Donor, AvailabilityStatus } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const DonorProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [availability, setAvailability] = useState<AvailabilityStatus>('active');
  const [snoozeHours, setSnoozeHours] = useState('24');
  
  // Health declaration checklist
  const [noTattoosRecent, setNoTattoosRecent] = useState(false);
  const [noMedicationRecent, setNoMedicationRecent] = useState(false);
  const [generalFitness, setGeneralFitness] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorProfile();
      setDonor(data);
      setFullName(data.fullName);
      setDateOfBirth(data.dateOfBirth);
      setCity(data.location.city);
      setAddress(data.location.address || '');
      setAvailability(data.availability);
      setNoTattoosRecent(data.healthDeclaration.noTattoosRecent || false);
      setNoMedicationRecent(data.healthDeclaration.noMedicationRecent || false);
      setGeneralFitness(data.healthDeclaration.generalFitness || false);
    } catch (err) {
      console.error(err);
      navigate('/donor/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !city || !address) {
      setToast({ message: 'Name and location fields are required', type: 'error' });
      return;
    }

    setSaveLoading(true);
    try {
      // Calculate snooze until if selected
      let snoozeUntil: string | null = null;
      if (availability === 'snoozed') {
        snoozeUntil = new Date(Date.now() + parseInt(snoozeHours) * 60 * 60 * 1000).toISOString();
      }

      await api.updateDonorProfile({
        fullName,
        dateOfBirth,
        location: { lat: 12.9716, lng: 77.5946, city, address },
        availability,
        snoozeUntil,
        healthDeclaration: { noTattoosRecent, noMedicationRecent, generalFitness },
      });

      setToast({ message: 'Profile settings updated successfully!', type: 'success' });
      setTimeout(() => {
        navigate('/donor/dashboard');
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update settings', type: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading || !donor) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Loading Profile Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between max-w-md mx-auto relative border-x border-surface-container-high shadow-xl pb-6">
      {/* Header */}
      <header className="bg-white border-b border-surface-container-high p-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
        <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-on-surface">Profile Settings</h2>
          <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Manage Account</span>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 p-4 overflow-y-auto">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Read Only Attributes */}
          <div className="bg-surface-container-low border border-surface-container rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block">Mobile (Auth)</span>
              <span className="text-xs font-bold text-slate-700">{donor.phone}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block">Blood Group</span>
              <span className="text-xs font-extrabold text-primary">{donor.bloodGroup}</span>
            </div>
          </div>

          {/* Personal details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Personal Details</h3>
            
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-white border border-surface-container-high rounded-xl text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dob" className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-white border border-surface-container-high rounded-xl text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2.5 bg-white border border-surface-container-high rounded-xl text-xs focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Area</label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-surface-container-high rounded-xl text-xs focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Availability Settings */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Availability Settings</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {(['active', 'snoozed', 'unavailable'] as AvailabilityStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAvailability(status)}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors text-center ${
                    availability === status
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {status === 'active' ? 'Available' : status}
                </button>
              ))}
            </div>

            {availability === 'snoozed' && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 animate-fade-in">
                <label htmlFor="snoozeHours" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Snooze Duration</label>
                <select
                  id="snoozeHours"
                  value={snoozeHours}
                  onChange={(e) => setSnoozeHours(e.target.value)}
                  className="block w-full bg-white border border-slate-300 rounded-lg text-xs py-2 px-3 focus:outline-none"
                >
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="48">48 Hours (2 Days)</option>
                  <option value="168">168 Hours (1 Week)</option>
                </select>
              </div>
            )}
          </div>

          {/* Health Declarations Toggles */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Health Declaration Toggles</h3>
            <div className="bg-white border border-surface-container-high rounded-2xl p-4 space-y-3 shadow-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noTattoosRecent}
                  onChange={(e) => setNoTattoosRecent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary/40 border-slate-300"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed font-semibold">
                  I have NOT had any tattoos/piercings in the past 6 months.
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
                  I am NOT taking active antibiotics/medications.
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
                  I am currently in good general fitness.
                </span>
              </label>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={saveLoading}
            className="w-full bg-primary hover:bg-primary-container text-white py-3.5 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center mt-6"
          >
            {saveLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Save & Update Settings</span>
            )}
          </button>
        </form>
      </main>

      {/* Toast feedback */}
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
