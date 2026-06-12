import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Briefcase, 
  Phone, 
  Mail, 
  Clock, 
  ShieldAlert, 
  Share2, 
  Save, 
  Camera,
  CheckCircle2,
  Lock,
  Network
} from 'lucide-react';
import { api, Hospital } from '../../services/api';
import { HospitalLayout } from './HospitalLayout';

export const HospitalSettings: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [activeTab, setActiveTab] = useState('Hospital Profile');
  const [loading, setLoading] = useState(true);

  // Form Fields State
  const [name, setName] = useState('');
  const [facilityId, setFacilityId] = useState('SJMC-992-RED');
  const [contactPerson, setContactPerson] = useState('');
  const [department, setDepartment] = useState('Hematology & Blood Bank');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getHospitalProfile();
      setHospital(data);
      
      // Seed form
      setName(data.name);
      setPhone(data.phone);
      setEmail(data.email);
      
      // Default placeholder fields if not in actual Hospital record
      setContactPerson('Dr. Sarah Mitchell');
      setDepartment('Hematology & Blood Bank');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateHospitalProfile({
        name,
        phone,
        email
      });
      setHospital(updated);
      alert('Changes saved successfully! Dynamic header name has been updated.');
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (hospital) {
      setName(hospital.name);
      setPhone(hospital.phone);
      setEmail(hospital.email);
      setContactPerson('Dr. Sarah Mitchell');
      setDepartment('Hematology & Blood Bank');
      alert('Changes discarded.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Hospital Console...</p>
        </div>
      </div>
    );
  }

  // tabs list matching Image 5
  const tabs = ['Hospital Profile', 'Notifications', 'Security', 'Hospital Details'];

  return (
    <HospitalLayout searchPlaceholder="Search portal configurations...">
      <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
        
        {/* Title block */}
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Settings</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage your hospital's account, notifications, and security preferences.</p>
        </div>

        {/* Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Navigation Tabs (1/4 width) */}
          <div className="space-y-6">
            <div className="bg-white border border-[#eae7e7] rounded-xl p-3 shadow-sm space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-xs font-black transition-all flex items-center gap-2 border-l-4 ${
                      isActive 
                        ? 'bg-[#ffdad6]/20 text-[#ba1a1a] border-l-[#ba1a1a]' 
                        : 'text-slate-500 hover:bg-slate-50 border-l-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Verified Facility Badge */}
            <div className="bg-[#ffdad6]/10 border-l-4 border-l-[#ba1a1a] border border-[#ffdad6]/40 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-[#ba1a1a]">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-xs font-black uppercase tracking-wider">Verified Facility</h4>
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                Your hospital is part of the REDAID elite responder network since 2022.
              </p>
            </div>
          </div>

          {/* Right Forms Panel (3/4 width) */}
          <div className="lg:col-span-3">
            {activeTab === 'Hospital Profile' ? (
              <form onSubmit={handleSaveChanges} className="bg-white border border-[#eae7e7] rounded-xl p-6 shadow-sm space-y-6">
                
                {/* Header */}
                <div className="border-b border-[#eae7e7]/60 pb-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Hospital Profile</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Update your public profile and primary contact information used for blood logistics.</p>
                </div>

                {/* Form Body layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Hospital Logo frame upload (left 1 column) */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="group relative w-full aspect-video md:h-28 md:w-44 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-50">
                      <img 
                        src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=300"
                        alt="Hospital logo building"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Upload camera overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1">
                        <Camera className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-wider">Upload Logo</span>
                      </div>
                    </div>
                  </div>

                  {/* Input fields grid (right 2 columns) */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Hospital Name */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Hospital Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Primary Facility ID (disabled) */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Primary Facility ID</label>
                      <input
                        type="text"
                        disabled
                        value={facilityId}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-not-allowed font-semibold"
                      />
                    </div>

                    {/* Contact Person */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Contact Person</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Department</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-[#eae7e7]/60 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600">
                    <Clock className="w-4.5 h-4.5" />
                    <span>Last updated: Oct 24, 2023 by Administrator</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDiscardChanges}
                      className="px-4 py-2 border border-slate-250 rounded-lg text-xs font-black uppercase text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              <div className="bg-white border border-[#eae7e7] rounded-xl p-10 text-center space-y-3 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{activeTab} Configurations</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Configuration channels for {activeTab.toLowerCase()} settings are managed by institution administrative tokens. 
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-wider">
                    Developer Sandbox Active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Synced Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Data Privacy Card */}
          <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 text-[#ba1a1a] rounded-lg flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-[11px] leading-relaxed">
              <h4 className="font-bold text-slate-850 text-xs">Data Privacy</h4>
              <p className="text-slate-400 font-semibold mt-1">
                Your hospital's logistical data is encrypted following HIPAA-compliant standards. Manage access in Security settings.
              </p>
            </div>
          </div>

          {/* Network Status Card */}
          <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="text-[11px] leading-relaxed">
              <h4 className="font-bold text-slate-850 text-xs">Network Status</h4>
              <p className="text-slate-400 font-semibold mt-1">
                All 4 satellite storage facilities are synced. You have active sharing agreements with 12 neighboring hospitals.
              </p>
            </div>
          </div>
        </div>

      </div>
    </HospitalLayout>
  );
};
