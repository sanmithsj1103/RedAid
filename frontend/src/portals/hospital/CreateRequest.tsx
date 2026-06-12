import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Clipboard, Bell, Shield, Info, Send, Calendar, Clock, Plus, Minus, Search, Radio } from 'lucide-react';
import { api, BloodGroup, RequestPriority } from '../../services/api';
import { HospitalLayout } from './HospitalLayout';
import { Toast, ToastType } from '../../components/Toast';

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  
  // Tab states
  const activeTab = 'create'; // create, active, tracking

  // Form states
  const [patientName, setPatientName] = useState('');
  const [hospitalId, setHospitalId] = useState('MRN-8829-X');
  const [wardNumber, setWardNumber] = useState('ICU-402');
  const [caseType, setCaseType] = useState('Surgery (General)');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [priority, setPriority] = useState<RequestPriority>('critical');
  const [radius, setRadius] = useState(25);
  const [notes, setNotes] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Compute estimated reach dynamically based on radius
  // 5km -> ~18, 25km -> 142, 50km -> 385
  const getEstimatedReach = () => {
    const base = bloodGroup === 'O+' || bloodGroup === 'A+' ? 5.5 : 2.1;
    return Math.round(base * radius * (1.2 + (unitsRequired * 0.05)));
  };

  const handleIncrement = () => {
    if (unitsRequired < 20) setUnitsRequired(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (unitsRequired > 1) setUnitsRequired(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) {
      setToast({ message: 'Patient Name is required.', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      // Package patient metadata inside notes for backward compatibility
      const fullNotes = `Patient: ${patientName} | MRN: ${hospitalId} | Ward: ${wardNumber} | Case: ${caseType}. Additional: ${notes || "No extra notes"}`;
      
      const result = await api.createBloodRequest({
        bloodGroup,
        unitsRequired,
        priority,
        notes: fullNotes,
      });

      setToast({ 
        message: `Emergency request initialized! Dispatched notifications to ${result.donorsNotified} matched donors.`, 
        type: 'success' 
      });
      
      setTimeout(() => {
        navigate(`/hospital/request/${result.id}`);
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to dispatch request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  return (
    <HospitalLayout searchPlaceholder="Search requests, donors, or units...">
      <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
        
        {/* Breadcrumbs & Header Title */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Link to="/hospital/requests" className="hover:text-primary transition-colors">Blood Requests</Link>
              <span>&gt;</span>
              <span className="text-primary">New Request</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create New Blood Request</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Initialize a high-priority blood dispatch across the REDAID network.</p>
          </div>

          {/* Save as Draft Button */}
          <button 
            type="button"
            className="px-4 py-2 border border-slate-350 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            Save as Draft
          </button>
        </div>

        {/* Tab Sub-navigation bar */}
        <div className="border-b border-[#eae7e7] flex items-center gap-6">
          <button
            className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            <span className="w-4.5 h-4.5 rounded-full border border-primary flex items-center justify-center text-[10px] font-black">+</span>
            New Blood Request
          </button>
          
          <button
            onClick={() => navigate('/hospital/requests')}
            className="flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-slate-650 transition-all"
          >
            <Clipboard className="w-4 h-4" />
            Active Requests
          </button>

          <button
            onClick={() => navigate('/hospital')}
            className="flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-slate-650 transition-all"
          >
            <Clock className="w-4 h-4" />
            Live Request Tracking
          </button>
        </div>

        {/* Form Container Grid */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Form groups */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Patient Information */}
              <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-[#eae7e7]/55 pb-3">
                  <div className="flex items-center gap-2.5">
                    <User className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Patient Information</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-[#fff5f5] text-[#ba1a1a] text-[9px] font-black uppercase tracking-wider rounded border border-[#ffdad6]">
                    Critical Required
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Full Patient Name */}
                  <div>
                    <label htmlFor="patientName" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Full Patient Name
                    </label>
                    <input
                      id="patientName"
                      type="text"
                      required
                      placeholder="e.g. Jonathan Doe"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="block w-full px-4 py-3 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Hospital ID and Ward ID */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="hospitalId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Hospital ID / MRN
                      </label>
                      <input
                        id="hospitalId"
                        type="text"
                        required
                        placeholder="MRN-8829-X"
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        className="block w-full px-4 py-3 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="wardNumber" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Ward / Room Number
                      </label>
                      <input
                        id="wardNumber"
                        type="text"
                        required
                        placeholder="ICU-402"
                        value={wardNumber}
                        onChange={(e) => setWardNumber(e.target.value)}
                        className="block w-full px-4 py-3 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Case Type Dropdown */}
                  <div>
                    <label htmlFor="caseType" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Case Type
                    </label>
                    <select
                      id="caseType"
                      value={caseType}
                      onChange={(e) => setCaseType(e.target.value)}
                      className="block w-full px-4 py-3 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Surgery (General)">Surgery (General)</option>
                      <option value="Cardiovascular Bypass">Cardiovascular Bypass</option>
                      <option value="Trauma / Emergency Hemorrhage">Trauma / Emergency Hemorrhage</option>
                      <option value="Oncology / Chemotherapy support">Oncology / Chemotherapy support</option>
                      <option value="Thalassemia / Transfusion Dependency">Thalassemia / Transfusion Dependency</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Clinical Requirements */}
              <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#eae7e7]/55 pb-3">
                  <Clipboard className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Clinical Requirements</h3>
                </div>

                <div className="space-y-5">
                  {/* Blood Group Grid */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Target Blood Group
                    </label>
                    
                    <div className="grid grid-cols-4 gap-3">
                      {bloodGroups.map((group) => {
                        const isSelected = bloodGroup === group;
                        return (
                          <button
                            key={group}
                            type="button"
                            onClick={() => setBloodGroup(group)}
                            className={`py-3 px-4 border text-sm font-black rounded-lg transition-all ${
                              isSelected
                                ? 'bg-[#fff5f5] border-primary text-primary'
                                : 'bg-white border-[#eae7e7] text-slate-700 hover:bg-[#fcf9f8]'
                            }`}
                          >
                            {group}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Units Required Numeric Counter */}
                  <div className="flex items-center justify-between border-t border-[#eae7e7]/50 pt-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Units Required</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Standard 450ml units per bag</p>
                    </div>

                    {/* Numeric Selector */}
                    <div className="flex items-center border border-[#eae7e7] rounded-full px-2 py-1 bg-[#fcf9f8]/40 select-none">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <span className="w-10 text-center font-bold text-sm text-slate-800">{unitsRequired}</span>
                      
                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes / Case Description */}
                  <div className="border-t border-[#eae7e7]/50 pt-4">
                    <label htmlFor="notes" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Case Notes / Patient Details (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="e.g. Surgery scheduled for early morning. Patient requires packed red cells with O- compatibility matching."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full px-4 py-3 bg-[#fcf9f8]/60 border border-[#eae7e7] rounded-lg text-sm focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Urgency & Outreach Radius */}
            <div className="space-y-6">
              
              {/* Widget 1: Urgency Level */}
              <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#eae7e7]/55 pb-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Urgency Level</h3>
                </div>

                <div className="space-y-3">
                  {/* Critical card option */}
                  <div 
                    onClick={() => setPriority('critical')}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      priority === 'critical'
                        ? 'border-primary bg-[#fff5f5]/30'
                        : 'border-[#eae7e7] bg-white hover:bg-[#fcf9f8]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-primary uppercase tracking-wider">Critical</h4>
                        <h5 className="text-[11px] font-bold text-slate-800 mt-1">Immediate Dispatch</h5>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Required within 60 minutes. Highest priority notification broadcast.</p>
                      </div>
                    </div>
                  </div>

                  {/* Urgent card option */}
                  <div 
                    onClick={() => setPriority('urgent')}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      priority === 'urgent'
                        ? 'border-primary bg-[#fff5f5]/30'
                        : 'border-[#eae7e7] bg-white hover:bg-[#fcf9f8]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Urgent</h4>
                        <h5 className="text-[11px] font-bold text-slate-800 mt-1">High Priority</h5>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Required within 2-4 hours. Standard donor alerts.</p>
                      </div>
                      <Clock className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Scheduled card option */}
                  <div 
                    onClick={() => setPriority('scheduled')}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      priority === 'scheduled'
                        ? 'border-primary bg-[#fff5f5]/30'
                        : 'border-[#eae7e7] bg-white hover:bg-[#fcf9f8]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Scheduled</h4>
                        <h5 className="text-[11px] font-bold text-slate-800 mt-1">Standard Request</h5>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Planned procedure. Notifications sent to matched donors.</p>
                      </div>
                      <Calendar className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: Network Radius */}
              <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-[#eae7e7]/55 pb-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Network Radius</h3>
                </div>

                {/* Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Broadcast Radius</span>
                    <span className="text-primary">{radius} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full accent-primary bg-slate-250 cursor-pointer h-1 rounded"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>5km</span>
                    <span>50km</span>
                  </div>
                </div>

                {/* Estimated Reach (green box) */}
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex gap-3.5">
                  <div className="w-10 h-10 bg-[#dcfce7] rounded-full flex items-center justify-center shrink-0 text-[#22c55e]">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#166534] uppercase tracking-wider block">Estimated Reach</span>
                    <p className="text-xs text-[#166534] font-medium leading-tight mt-0.5">
                      Broadcast to <strong className="text-primary text-sm font-black">{getEstimatedReach()}</strong> Eligible Donors
                    </p>
                  </div>
                </div>

                {/* Coordination Summary */}
                <div className="bg-[#fcf9f8] border border-dashed border-[#eae7e7] rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Coordination Summary</span>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-medium">
                      Dispatching this request will notify all <strong className="text-slate-800 font-bold">{bloodGroup}</strong> and compatible donors within a {radius}km radius of our medical center. Partner blood banks will also receive an urgent inventory availability ping.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom dispatch button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#c0392b] text-white py-4 px-6 rounded-xl font-black text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.005] active:scale-[0.995] transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-white" />
                  <span>Dispatch Emergency Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Global Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </HospitalLayout>
  );
};
