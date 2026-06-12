import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Bell, 
  Sliders, 
  Eye, 
  LogOut, 
  Globe, 
  Settings,
  HelpCircle,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { api, Donor } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const DonorProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Accordion active sections
  const [expandedSection, setExpandedSection] = useState<string | null>('display');

  // Display Settings State
  const [distanceUnit, setDistanceUnit] = useState<'KM' | 'Miles'>('KM');
  const [fontSize, setFontSize] = useState<number>(14);

  // Toggle Settings State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [anonymousDonor, setAnonymousDonor] = useState(false);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorProfile();
      setDonor(data);
      setFullName(data.fullName);
      setPhone(data.phone);
      setCity(data.location.city);
    } catch (err) {
      console.error(err);
      navigate('/donor/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!donor) return;
    try {
      await api.updateDonorProfile({
        fullName,
        location: { ...donor.location, city }
      });
      setToast({ message: 'Account updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Update failed', type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setToast({ message: 'Logging out...', type: 'info' });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      navigate('/');
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (loading || !donor) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center max-w-md mx-auto border-x border-[#eae7e7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ba1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3.5 flex items-center gap-4 sticky top-0 z-30 shadow-sm shrink-0">
        <button onClick={() => navigate('/donor/profile')} className="p-1 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">System Settings</h2>
          <span className="text-[9px] uppercase tracking-widest text-[#ba1a1a] font-bold font-bold">Preferences & Controls</span>
        </div>
      </header>

      {/* Main Accordion List */}
      <main className="flex-1 p-5 space-y-4 overflow-y-auto">
        
        {/* Accordion Item 1: Account details */}
        <div className="bg-white border border-[#eae7e7] rounded-3xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('account')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#ba1a1a]" />
              <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Account Settings</span>
            </div>
            {expandedSection === 'account' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {expandedSection === 'account' && (
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-50">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#ba1a1a]" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Registered Phone</label>
                  <input 
                    type="text" 
                    value={phone} 
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Location City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#ba1a1a]" 
                  />
                </div>
              </div>
              <button 
                onClick={handleUpdateAccount}
                className="w-full bg-[#ba1a1a] hover:bg-[#a61717] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Accordion Item 2: Notification Settings */}
        <div className="bg-white border border-[#eae7e7] rounded-3xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('notifications')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#ba1a1a]" />
              <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Alert Configurations</span>
            </div>
            {expandedSection === 'notifications' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {expandedSection === 'notifications' && (
            <div className="px-5 pb-5 pt-1 divide-y divide-slate-100 border-t border-slate-50">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-700">Push Notifications</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Receive real-time notifications on updates</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={pushNotifications} 
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="w-9 h-5 rounded-full bg-slate-200 checked:bg-[#ba1a1a] cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-700">Critical Dispatch Alerts</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Alerts for urgent emergency blood requirements</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={criticalAlerts} 
                  onChange={(e) => setCriticalAlerts(e.target.checked)}
                  className="w-9 h-5 rounded-full bg-slate-200 checked:bg-[#ba1a1a] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accordion Item 3: Display & Units (Unit switchers & Font slider) */}
        <div className="bg-white border border-[#eae7e7] rounded-3xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('display')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-[#ba1a1a]" />
              <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Display & Units</span>
            </div>
            {expandedSection === 'display' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {expandedSection === 'display' && (
            <div className="px-5 pb-5 pt-1 space-y-5 border-t border-slate-50">
              
              {/* Unit Switcher */}
              <div className="space-y-2 pt-2">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Distance Units</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border border-slate-200/60 rounded-xl">
                  <button
                    onClick={() => setDistanceUnit('KM')}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all ${distanceUnit === 'KM' ? 'bg-[#ba1a1a] text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Kilometers (KM)
                  </button>
                  <button
                    onClick={() => setDistanceUnit('Miles')}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all ${distanceUnit === 'Miles' ? 'bg-[#ba1a1a] text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Miles
                  </button>
                </div>
              </div>

              {/* Font Size Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">System Font Size</span>
                  <span className="text-xs font-black text-slate-650">{fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="20" 
                  step="1"
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-[#ba1a1a] cursor-pointer"
                />
                
                {/* Live Preview block */}
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-center">
                  <span className="text-[7.5px] font-black text-slate-450 uppercase tracking-widest block mb-1">Preview Text</span>
                  <p style={{ fontSize: `${fontSize}px` }} className="text-slate-700 font-bold leading-normal transition-all duration-150">
                    Your life-saving journey matters.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Accordion Item 4: Privacy Settings */}
        <div className="bg-white border border-[#eae7e7] rounded-3xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('privacy')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-[#ba1a1a]" />
              <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Privacy Settings</span>
            </div>
            {expandedSection === 'privacy' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {expandedSection === 'privacy' && (
            <div className="px-5 pb-5 pt-1 divide-y divide-slate-100 border-t border-slate-50">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-700">Share Live Location</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Let matched hospitals track en route ETA status</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={shareLocation} 
                  onChange={(e) => setShareLocation(e.target.checked)}
                  className="w-9 h-5 rounded-full bg-slate-200 checked:bg-[#ba1a1a] cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-700">Anonymous Donation</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Hide identity from coordination search boards</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={anonymousDonor} 
                  onChange={(e) => setAnonymousDonor(e.target.checked)}
                  className="w-9 h-5 rounded-full bg-slate-200 checked:bg-[#ba1a1a] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Logout Action (Red outlined button matching sett.png) */}
      <div className="p-5 shrink-0 bg-white border-t border-[#eae7e7] sticky bottom-0 z-30">
        <button
          onClick={handleLogout}
          className="w-full bg-white border-2 border-[#ba1a1a] hover:bg-[#ba1a1a]/5 text-[#ba1a1a] py-3.5 px-4 rounded-2.5xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 text-[#ba1a1a]" />
          <span>Log Out</span>
        </button>
      </div>

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
