import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Heart, Share2, Printer, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export const CertificateViewer: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center max-w-md mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Loading Certificate...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface p-6 flex flex-col justify-center items-center max-w-md mx-auto text-center">
        <Award className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-lg font-bold text-on-surface">Certificate Not Found</h3>
        <button 
          onClick={() => navigate('/donor/history')}
          className="mt-6 border border-surface-container-high bg-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto relative border-x border-surface-container-high shadow-xl pb-6">
      {/* Header */}
      <header className="bg-white border-b border-surface-container-high p-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm print:hidden">
        <button onClick={() => navigate('/donor/history')} className="p-1 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-on-surface">Donation Certificate</h2>
          <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Appreciation Award</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col justify-center">
        {/* Certificate Container */}
        <div className="bg-white border-4 border-double border-primary/40 rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col text-center space-y-5 print:border-8 print:p-8">
          
          {/* Subtle watermark background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Heart className="w-80 h-80 text-primary fill-primary" />
          </div>

          {/* Certificate Badge */}
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary fill-primary/40" />
          </div>

          <div>
            <span className="text-[10px] tracking-widest text-primary font-black uppercase">Certificate of Appreciation</span>
            <h3 className="text-xl font-bold tracking-tight text-on-surface mt-1.5">LIFESAVER CITATION</h3>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">PROUDLY PRESENTED TO</p>
            <h4 className="text-lg font-black text-on-surface tracking-wide underline decoration-primary/30 decoration-2 underline-offset-4">
              {data.response.donorName}
            </h4>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto">
            for the noble and humanitarian act of whole blood donation at <strong className="text-on-surface">{data.request.hospitalName}</strong>, helping to save lives and support critical medical care.
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 my-2 text-xs font-bold text-on-surface">
            <div>
              <span className="text-[9px] text-on-surface-variant font-semibold block uppercase">Blood Type</span>
              <p className="text-sm text-primary font-black mt-0.5">{data.request.bloodGroup}</p>
            </div>
            <div>
              <span className="text-[9px] text-on-surface-variant font-semibold block uppercase">Donation Date</span>
              <p className="text-sm text-slate-800 mt-0.5">
                {new Date(data.response.donatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-4">
            <div className="text-left flex flex-col items-center">
              <span className="font-serif italic text-xs text-slate-600 border-b border-slate-300 w-24 text-center pb-1">Meera S.</span>
              <span className="text-[8px] text-on-surface-variant font-semibold uppercase mt-1">Medical Director</span>
            </div>
            
            {/* RedAid Stamp */}
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center text-primary/40 font-bold rotate-12 text-[9px] uppercase tracking-wider relative">
              <div className="absolute inset-0.5 border border-dashed border-primary/10 rounded-full"></div>
              <span>Verified</span>
            </div>

            <div className="text-right flex flex-col items-center">
              <span className="font-serif italic text-xs text-slate-600 border-b border-slate-300 w-24 text-center pb-1">RedAid Admin</span>
              <span className="text-[8px] text-on-surface-variant font-semibold uppercase mt-1">Platform Coordinator</span>
            </div>
          </div>

          <div className="pt-2 text-[9px] text-slate-400 font-semibold tracking-wider uppercase border-t border-slate-100 mt-4">
            Certificate ID: CERT-{data.response.id.substring(5, 13).toUpperCase()}
          </div>
        </div>
      </main>

      {/* Control Buttons */}
      <div className="px-6 space-y-3 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full bg-primary hover:bg-primary-container text-white py-3 px-4 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>

        <button
          onClick={() => navigate('/donor/history')}
          className="w-full bg-white border border-surface-container-high text-on-surface-variant py-3 px-4 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all text-center block"
        >
          Back to History List
        </button>
      </div>
    </div>
  );
};
