import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Heart, Award, ShieldAlert, Sparkles, Activity, Clock } from 'lucide-react';
import { Toast, ToastType } from '../../components/Toast';

export const DonorGuide: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rules' | 'benefits' | 'aftercare'>('rules');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const categories = [
    { id: 'rules', label: 'Rules' },
    { id: 'benefits', label: 'Benefits' },
    { id: 'aftercare', label: 'Aftercare' }
  ] as const;

  const requirements = [
    {
      title: 'Age Requirement',
      value: '18 - 65 Years Old',
      desc: 'Valid photo ID is required for verification at center.',
      borderClass: 'border-l-4 border-l-green-500'
    },
    {
      title: 'Body Weight',
      value: 'Min 50 kg (110 lbs)',
      desc: 'Donors must be in good health and meet weight index.',
      borderClass: 'border-l-4 border-l-blue-500'
    },
    {
      title: 'Donation Interval',
      value: '90 Days Minimum',
      desc: 'Gap required to restore iron levels before next cycle.',
      borderClass: 'border-l-4 border-l-orange-500'
    },
    {
      title: 'Hemoglobin Count',
      value: 'Min 12.5 g/dL',
      desc: 'Tested free of charge prior to whole blood extraction.',
      borderClass: 'border-l-4 border-l-red-500'
    },
    {
      title: 'Medications',
      value: 'No Recent Antibiotics',
      desc: 'Free from active antibiotics for at least 14 days.',
      borderClass: 'border-l-4 border-l-amber-500'
    }
  ];

  const benefitsGrid = [
    {
      title: 'Save up to 3 Lives',
      desc: 'Whole blood donation is divided into RBCs, Plasma, and Platelets.',
      icon: <Heart className="w-5 h-5 text-[#ba1a1a]" />
    },
    {
      title: 'Stimulate RBC Production',
      desc: 'Encourages your bone marrow to synthesize fresh blood cells.',
      icon: <Activity className="w-5 h-5 text-blue-500" />
    },
    {
      title: 'Complimentary Checkup',
      desc: 'Includes screening of pulse, BP, temperature, and iron levels.',
      icon: <Award className="w-5 h-5 text-amber-500" />
    },
    {
      title: 'Balance Iron Stores',
      desc: 'Regular donation helps lower high levels of iron in blood.',
      icon: <Sparkles className="w-5 h-5 text-green-500" />
    }
  ];

  const waitTimeTable = [
    { condition: 'Recent Tattoo / Piercing', waitTime: '6 Months Lock' },
    { condition: 'Cold / Flu Recovery', waitTime: 'Fully Recovered' },
    { condition: 'Dental Extraction', waitTime: '3 Days Wait' },
    { condition: 'Major Surgery', waitTime: '6-12 Months' }
  ];

  const aftercareTimeline = [
    { time: 'Immediate (15m)', desc: 'Rest at center, drink juice/water, eat snacks.' },
    { time: 'First 5 Hours', desc: 'Avoid heavy lifting, intense workouts, and long standing.' },
    { time: 'First 24 Hours', desc: 'Hydrate with extra fluids, avoid alcoholic beverages.' },
    { time: 'First 48 Hours', desc: 'Keep puncture site clean; apply cold compress if bruised.' }
  ];

  const handleCheckEligibility = () => {
    setToast({ 
      message: 'Eligibility Survey Initialized: You are fully eligible to donate whole blood!', 
      type: 'success' 
    });
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3.5 flex items-center gap-4 sticky top-0 z-30 shadow-sm shrink-0">
        <button onClick={() => navigate('/donor/dashboard')} className="p-1 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Donation Guide</h2>
          <span className="text-[9px] uppercase tracking-widest text-[#ba1a1a] font-bold">Guidelines & Benefits</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white px-5 py-3.5 flex gap-2 border-b border-[#eae7e7]/50 shrink-0">
        {categories.map((cat) => {
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border text-center ${
                isActive 
                  ? 'bg-[#ba1a1a] border-[#ba1a1a] text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <main className="flex-1 p-5 overflow-y-auto space-y-5">
        
        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-5">
            {/* Requirements Indicator Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">General Prerequisites</h3>
              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div key={idx} className={`bg-white border border-[#eae7e7] rounded-2.5xl p-4 shadow-sm flex items-start gap-3.5 ${req.borderClass}`}>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800 leading-tight">{req.title}</h4>
                      <p className="text-sm font-black text-[#ba1a1a] tracking-tight">{req.value}</p>
                      <p className="text-[9.5px] text-slate-400 font-bold leading-normal pt-0.5">{req.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wait-Time Table Section */}
            <div className="bg-white border border-[#eae7e7] rounded-3xl p-5 shadow-sm space-y-3.5">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Temporary Deferrals
              </h3>
              
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {waitTimeTable.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50">
                    <span className="text-xs text-slate-700 font-bold">{item.condition}</span>
                    <span className="text-[10px] font-black text-[#ba1a1a] uppercase bg-[#ffdad6]/20 border border-[#ffdad6] px-2.5 py-0.5 rounded-lg">
                      {item.waitTime}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCheckEligibility}
                className="w-full bg-[#ba1a1a] hover:bg-[#a61717] text-white py-3.5 px-4 rounded-2.5xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all text-center block"
              >
                Check My Eligibility
              </button>
            </div>
          </div>
        )}

        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Why Donate Blood?</h3>
            
            {/* Why Donate 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {benefitsGrid.map((benefit, idx) => (
                <div key={idx} className="bg-white border border-[#eae7e7] rounded-3xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="w-9 h-9 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 leading-snug">{benefit.title}</h4>
                    <p className="text-[9.5px] text-slate-400 font-bold leading-normal">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quote / Summary block */}
            <div className="bg-red-50/40 border border-red-150 rounded-3xl p-5 text-center space-y-2">
              <Heart className="w-6 h-6 text-[#ba1a1a] fill-[#ba1a1a]/15 mx-auto" />
              <p className="text-xs text-[#ba1a1a] font-black leading-relaxed">
                "Every donation counts. Be the reason someone smiles today."
              </p>
            </div>
          </div>
        )}

        {/* Aftercare Tab */}
        {activeTab === 'aftercare' && (
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Post-Donation Care</h3>
            
            {/* Timeline checklist */}
            <div className="bg-white border border-[#eae7e7] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="space-y-4">
                {aftercareTimeline.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-16 text-[9.5px] font-black text-slate-450 uppercase tracking-wider pt-0.5 shrink-0">
                      {item.time}
                    </div>
                    <div className="flex-1 flex gap-2 items-start">
                      <div className="w-4 h-4 rounded-full border border-[#ba1a1a] bg-[#ffdad6]/20 flex items-center justify-center text-[9px] font-black text-[#ba1a1a] mt-0.5 shrink-0">✓</div>
                      <p className="text-xs text-slate-650 font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

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
