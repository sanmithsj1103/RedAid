import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageSquare, CheckCircle, Navigation, Compass, AlertCircle } from 'lucide-react';
import { api, BloodRequest, DonationResponse } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const DonorNavigation: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [response, setResponse] = useState<DonationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchActiveRequest();
  }, [requestId]);

  const fetchActiveRequest = async () => {
    setLoading(true);
    try {
      if (!requestId) return;
      const req = await api.getBloodRequestById(requestId);
      if (req) {
        setRequest(req);
        const resp = await api.getOrCreateResponseForDonor(requestId);
        if (resp.status === 'notified') {
          resp.status = 'accepted';
        }
        setResponse(resp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDonationSimulated = async () => {
    if (!response || !request) return;
    setActionLoading(true);
    try {
      if (response.id.startsWith('resp_nav_sim_')) {
        const currentResponses = JSON.parse(localStorage.getItem('redaid_responses') || '[]');
        if (!currentResponses.some((r: any) => r.id === response.id)) {
          currentResponses.push(response);
          localStorage.setItem('redaid_responses', JSON.stringify(currentResponses));
        }
      }

      await api.updateDonorResponseStatus(response.id, 'arrived');
      await api.updateDonorResponseStatus(response.id, 'donated');

      setToast({ message: 'Donation Completed! Loading Certificate...', type: 'success' });
      
      setTimeout(() => {
        navigate(`/donor/certificate/${response.id}`);
      }, 1200);
    } catch (err: any) {
      setToast({ message: err.message || 'Verification failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center max-w-md mx-auto border-x border-[#eae7e7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ba1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading GPS Navigation...</p>
        </div>
      </div>
    );
  }

  if (!request || !response) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] p-6 flex flex-col justify-center items-center max-w-md mx-auto text-center border-x border-[#eae7e7]">
        <AlertCircle className="w-12 h-12 text-[#ba1a1a] mb-4" />
        <h3 className="text-lg font-black text-slate-800 uppercase">Navigation Terminated</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs font-bold">
          The routing session has ended or is unavailable for this request.
        </p>
        <button 
          onClick={() => navigate('/donor/dashboard')}
          className="mt-6 border border-slate-200 bg-white px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-700 shadow-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d6ece4] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      
      {/* Header styled exactly like Image 3 */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/donor/request/${request.id}`)} className="p-1 rounded-xl text-slate-650 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h2 className="text-base font-black tracking-tight text-[#ba1a1a]">REDAID</h2>
        </div>
        
        {/* Critical Badge */}
        <div className="bg-[#ffdad6] text-[#ba1a1a] rounded-lg px-2.5 py-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider border border-[#ffdad6]">
          <span>★</span>
          <span>CRITICAL</span>
        </div>
      </header>

      {/* Map backdrop and Upper card layout */}
      <div className="flex-1 relative overflow-hidden z-10">
        {/* SVG Route Streets (Teal streets SVG) */}
        <svg className="absolute inset-0 w-full h-full stroke-white/60 stroke-[1.5]" fill="none">
          <line x1="50" y1="0" x2="50" y2="1000" strokeDasharray="3 3" />
          <line x1="150" y1="0" x2="150" y2="1000" strokeDasharray="3 3" />
          <line x1="250" y1="0" x2="250" y2="1000" strokeDasharray="3 3" />
          <line x1="350" y1="0" x2="350" y2="1000" strokeDasharray="3 3" />
          <line x1="0" y1="100" x2="500" y2="100" strokeDasharray="3 3" />
          <line x1="0" y1="250" x2="500" y2="250" strokeDasharray="3 3" />
          <line x1="0" y1="400" x2="500" y2="400" strokeDasharray="3 3" />

          {/* Road Network */}
          <path d="M 220,0 L 220,1000" strokeWidth="8" className="stroke-[#c8e2d9]" />
          <path d="M 0,330 L 500,330" strokeWidth="8" className="stroke-[#c8e2d9]" />

          {/* Route Line */}
          <path d="M 220,600 L 220,330 L 380,330" stroke="#ba1a1a" strokeWidth="4" strokeLinecap="round" className="stroke-[#ba1a1a]/30" />
          <path d="M 220,600 L 220,330 L 380,330" stroke="#ba1a1a" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" className="animate-[dash_3s_linear_infinite]" />
        </svg>

        {/* Location blue dot */}
        <div className="absolute left-[220px] top-[480px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-500/25 animate-ping absolute"></div>
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md relative z-10"></div>
        </div>

        {/* Hospital Pin */}
        <div className="absolute left-[380px] top-[330px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center border-2 border-white shadow-md animate-bounce text-xs font-bold">
          +
        </div>

        {/* 1. Upper overlay card matching Image 3 */}
        <div className="absolute top-4 inset-x-4 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-lg space-y-3 z-20">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                <span className="text-[10px] font-black text-[#ba1a1a] uppercase tracking-wider">EN ROUTE</span>
              </div>
              <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight pt-1">
                {request.hospitalName}
              </h3>
              <p className="text-[10.5px] text-slate-500 font-bold leading-normal">
                {request.notes || 'Emergency Blood Unit Transfer'}
              </p>
            </div>
            
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-[#ba1a1a] tracking-tight leading-none">~12</span>
              <span className="text-[10px] text-slate-500 font-black block mt-0.5 uppercase tracking-wide">mins</span>
            </div>
          </div>

          {/* Progress bar inside card */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
            <div className="flex justify-between text-[10px] font-bold text-slate-450">
              <span>Current Progress</span>
              <span>4.2 km remaining</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[55%] h-full bg-[#ba1a1a] rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Bottom Sheet slider matching Image 3 */}
      <div className="bg-white border-t border-slate-200 rounded-t-3xl p-5 shadow-2xl space-y-4 z-20 shrink-0">
        
        {/* Drag handle line */}
        <div className="w-11 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2"></div>

        {/* Step Indicator Progress Row exactly like Image 3 */}
        <div className="relative pt-2">
          {/* Connector Line background */}
          <div className="absolute top-[28px] inset-x-8 h-0.5 bg-slate-150 z-0"></div>
          {/* Connected Highlighted Line */}
          <div className="absolute top-[28px] left-8 w-[50%] h-0.5 bg-[#ba1a1a] z-0"></div>

          <div className="grid grid-cols-3 text-center relative z-10">
            
            {/* Step 1: Accepted (Check mark red) */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-sm font-bold">✓</span>
              </div>
              <span className="text-[10.5px] font-black text-[#ba1a1a] uppercase tracking-wide">Accepted</span>
            </div>

            {/* Step 2: En Route (Truck icon red) */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center border-2 border-white shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-[2.5]">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <span className="text-[10.5px] font-black text-[#ba1a1a] uppercase tracking-wide">En Route</span>
            </div>

            {/* Step 3: Arrived (Gray Location dot) */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              </div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">Arrived</span>
            </div>

          </div>
        </div>

        {/* 2-Column Grid Info Cards exactly like Image 3 */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {/* Card 1: Blood Type */}
          <div className="bg-[#fbf8f7] border border-slate-200 rounded-2.5xl p-4 flex justify-between items-center shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Blood Type</span>
              <p className="text-xs font-black text-slate-800 leading-tight">O- Negative</p>
            </div>
            {/* Droplet icon outline */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#ba1a1a] stroke-[1.8] fill-none shrink-0">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>

          {/* Card 2: Quantity */}
          <div className="bg-[#fbf8f7] border border-slate-200 rounded-2.5xl p-4 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Quantity</span>
            <p className="text-xs font-black text-slate-800 leading-tight mt-0.5">4 Units (2.0L)</p>
          </div>
        </div>

        {/* Contact actions exactly like Image 3 */}
        <div className="grid grid-cols-2 gap-3.5">
          <a 
            href={`tel:${request.hospitalPhone}`}
            className="border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/5 py-3.5 rounded-2.5xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all"
          >
            <Phone className="w-4 h-4 text-[#ba1a1a]" />
            <span>Call Hospital</span>
          </a>
          
          <button 
            onClick={() => alert("Message thread with Hospital coordinator initialized.")}
            className="border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/5 py-3.5 rounded-2.5xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-white"
          >
            <MessageSquare className="w-4 h-4 text-[#ba1a1a]" />
            <span>Message</span>
          </button>
        </div>

        {/* I HAVE ARRIVED (Primary action button matching Image 3) */}
        <button
          onClick={handleCompleteDonationSimulated}
          disabled={actionLoading}
          className="w-full bg-[#ba1a1a] hover:bg-[#a61717] text-white py-4 px-4 rounded-2.5xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <CheckCircle className="w-5 h-5 text-white fill-white/10" />
          <span>I HAVE ARRIVED</span>
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
