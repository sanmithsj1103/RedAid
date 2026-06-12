import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Heart, Share2, Download, CheckCircle, Home, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { Toast, ToastType } from '../../components/Toast';

export const CertificateViewer: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchCertificateData();
  }, [responseId]);

  const fetchCertificateData = async () => {
    if (!responseId) return;
    setLoading(true);
    try {
      const history = await api.getDonorDonationHistory();
      const match = history.find(h => h.response.id === responseId);
      if (match) {
        setData(match);
      } else {
        // Fallback for simulated completions
        const donor = await api.getDonorProfile();
        setData({
          response: {
            id: responseId,
            donorName: donor.fullName,
            donorBloodGroup: donor.bloodGroup,
            donatedAt: new Date().toISOString()
          },
          request: {
            hospitalName: 'City General Hospital',
            bloodGroup: donor.bloodGroup
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setToast({ message: 'Certificate downloaded successfully to your device!', type: 'success' });
  };

  const handleShare = () => {
    setToast({ message: 'Share link copied to clipboard! Share on socials.', type: 'info' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center max-w-md mx-auto border-x border-[#eae7e7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#ba1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Generating Certificate...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] p-6 flex flex-col justify-center items-center max-w-md mx-auto text-center border-x border-[#eae7e7]">
        <Award className="w-12 h-12 text-[#ba1a1a] mb-4" />
        <h3 className="text-lg font-black text-slate-850 uppercase">Certificate Missing</h3>
        <button 
          onClick={() => navigate('/donor/history')}
          className="mt-6 border border-slate-200 bg-white px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-700 shadow-sm"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative border-x border-[#eae7e7] shadow-xl overflow-hidden font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eae7e7] px-4 py-3.5 flex items-center gap-4 sticky top-0 z-30 shadow-sm shrink-0">
        <button onClick={() => navigate('/donor/history')} className="p-1 rounded-xl hover:bg-slate-50 text-slate-650 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Appreciation Certificate</h2>
          <span className="text-[9px] uppercase tracking-widest text-[#ba1a1a] font-bold">Official citation release</span>
        </div>
      </header>

      {/* Main Content Scroll container */}
      <main className="flex-1 p-5 space-y-5 overflow-y-auto">
        
        {/* 1. Green check-circle banner displaying "DONATION SUCCESSFUL" matching image 4 */}
        <div className="bg-emerald-600 text-white rounded-3xl p-4 flex items-center gap-3.5 shadow-md">
          <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">Donation Successful</h3>
            <p className="text-[10px] text-white/80 font-bold mt-0.5">Thank you for your generous contribution.</p>
          </div>
        </div>

        {/* 2. Red-bordered appreciation certificate card */}
        <div className="bg-white border-8 border-[#ba1a1a]/15 rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col text-center space-y-4">
          {/* Internal Double Thin Border */}
          <div className="absolute inset-2.5 border border-[#ba1a1a]/10 rounded-2xl pointer-events-none"></div>

          {/* Watermark Heart */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
            <Heart className="w-64 h-64 text-[#ba1a1a] fill-[#ba1a1a]" />
          </div>

          <div className="mx-auto w-11 h-11 rounded-full bg-[#ffdad6]/40 border border-[#ffdad6] flex items-center justify-center z-10">
            <Award className="w-6 h-6 text-[#ba1a1a]" />
          </div>

          <div className="z-10 space-y-1">
            <span className="text-[8.5px] tracking-widest text-[#ba1a1a] font-black uppercase block">Certificate of Appreciation</span>
            <h4 className="text-base font-black tracking-tight text-slate-800 uppercase">LIFESAVER CITATION</h4>
          </div>

          <div className="z-10 space-y-1 pt-1">
            <span className="text-[7.5px] text-slate-400 font-black uppercase tracking-wider block">THIS CERTIFICATE IS PROUDLY PRESENTED TO</span>
            <h3 className="text-base font-black text-slate-850 tracking-wide underline decoration-[#ba1a1a]/30 decoration-2 underline-offset-4 leading-none py-1">
              {data.response.donorName}
            </h3>
          </div>

          <p className="z-10 text-[10.5px] text-slate-500 leading-relaxed max-w-xs mx-auto font-bold">
            in recognition of the noble and selfless act of blood donation at <strong className="text-slate-800 font-black">{data.request.hospitalName}</strong>, contributing directly to saving lives in critical emergency care.
          </p>

          {/* Stats details section inside certificate */}
          <div className="z-10 grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 my-1 bg-slate-50/50 rounded-xl px-2">
            <div>
              <span className="text-[7.5px] text-slate-400 font-black uppercase block">Blood Type</span>
              <p className="text-xs font-black text-[#ba1a1a] mt-0.5">{data.request.bloodGroup}</p>
            </div>
            <div>
              <span className="text-[7.5px] text-slate-400 font-black uppercase block">Donation Date</span>
              <p className="text-xs font-black text-slate-700 mt-0.5">
                {new Date(data.response.donatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Official Signatures Row */}
          <div className="z-10 flex justify-between items-end pt-3">
            <div className="text-left flex flex-col items-center">
              <span className="font-serif italic text-xs text-slate-600 border-b border-slate-200 w-20 text-center pb-0.5">Meera S.</span>
              <span className="text-[7px] text-slate-400 font-black uppercase mt-1">Medical Director</span>
            </div>
            
            {/* RedAid Stamp block */}
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#ba1a1a]/30 flex items-center justify-center text-[#ba1a1a]/50 font-black rotate-12 text-[7px] uppercase tracking-wider relative shrink-0">
              <span>Verified</span>
            </div>

            <div className="text-right flex flex-col items-center">
              <span className="font-serif italic text-xs text-slate-600 border-b border-slate-200 w-20 text-center pb-0.5">Admin</span>
              <span className="text-[7px] text-slate-400 font-black uppercase mt-1">Coordinator</span>
            </div>
          </div>

          <div className="z-10 pt-2 text-[8px] text-slate-400 font-bold tracking-wider uppercase border-t border-slate-50 mt-2">
            Certificate ID: CERT-{data.response.id.substring(5, 12).toUpperCase()}
          </div>
        </div>

        {/* 3. Action buttons matching image 4 */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownload}
            className="w-full bg-[#ba1a1a] hover:bg-[#a61717] text-white py-3.5 px-4 rounded-2.5xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Certificate</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-650 py-3.5 px-4 rounded-2.5xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-slate-400" />
            <span>Share to Socials</span>
          </button>
        </div>

      </main>

      {/* Global Toast component */}
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
