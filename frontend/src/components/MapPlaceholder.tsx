import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface MapPlaceholderProps {
  hospitalName: string;
  hospitalLocation: { lat: number; lng: number };
  donorLocation?: { lat: number; lng: number };
  status?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  hospitalName,
  hospitalLocation,
  donorLocation = { lat: 12.9716, lng: 77.5946 },
  status = 'accepted',
}) => {
  const [progress, setProgress] = useState(0);

  // En route animation simulation
  useEffect(() => {
    if (status === 'en_route') {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 150);
      return () => clearInterval(interval);
    } else if (status === 'arrived' || status === 'completed') {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [status]);

  // Compute interpolated donor position for en route display
  const dX = 120; // Donor X relative pos
  const dY = 250; // Donor Y relative pos
  const hX = 260; // Hospital X
  const hY = 80;  // Hospital Y

  const currentX = dX + (hX - dX) * (progress / 100);
  const currentY = dY + (hY - dY) * (progress / 100);

  return (
    <div className="relative w-full h-72 bg-slate-100 rounded-2xl overflow-hidden border border-surface-container-high shadow-inner">
      {/* Map grid background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Background streets simulation */}
      <svg className="absolute inset-0 w-full h-full text-slate-300 stroke-2" fill="none">
        <path d="M-50,150 Q150,50 450,180" stroke="currentColor" strokeWidth="6" />
        <path d="M100,-50 L180,350" stroke="currentColor" strokeWidth="4" />
        <path d="M50,220 Q200,240 350,120" stroke="currentColor" strokeWidth="4" />
        <path d="M250,-20 Q250,180 320,380" stroke="currentColor" strokeWidth="5" />
      </svg>

      {/* Hospital Pin */}
      <div 
        className="absolute transition-all duration-300"
        style={{ left: `${hX}px`, top: `${hY}px`, transform: 'translate(-50%, -100%)' }}
      >
        <div className="relative flex flex-col items-center">
          <div className="bg-primary px-3 py-1 text-[10px] text-white font-bold rounded-lg shadow-md whitespace-nowrap mb-1">
            {hospitalName}
          </div>
          <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="w-3 h-3 bg-primary/40 rounded-full blur-[2px] mt-0.5"></div>
        </div>
      </div>

      {/* Donor Location Pin */}
      {status !== 'arrived' && status !== 'completed' && (
        <div 
          className="absolute transition-all duration-300"
          style={{ left: `${status === 'en_route' ? currentX : dX}px`, top: `${status === 'en_route' ? currentY : dY}px`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative flex flex-col items-center">
            {status === 'en_route' ? (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                <Navigation className="w-4 h-4 text-white rotate-45" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              </div>
            )}
            <span className="text-[9px] font-semibold text-slate-700 bg-white/95 px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
              {status === 'en_route' ? 'En Route' : 'Donor Location'}
            </span>
          </div>
        </div>
      )}

      {/* Path Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
        {/* Total Path */}
        <line 
          x1={dX} y1={dY} x2={hX} y2={hY} 
          stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 4"
        />
        {/* Traveled Path */}
        {status === 'en_route' && (
          <line 
            x1={dX} y1={dY} x2={currentX} y2={currentY} 
            stroke="#2563eb" strokeWidth="4"
          />
        )}
      </svg>

      {/* Compass HUD */}
      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-lg border border-white shadow-md flex items-center gap-1.5 text-[10px] font-semibold text-slate-700">
        <Compass className="w-4 h-4 text-slate-500 animate-spin-slow" />
        <span>GPS Signal Active</span>
      </div>

      {/* Proximity Stats Overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md flex justify-between items-center">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Estimated Proximity</span>
          <p className="text-sm font-bold text-slate-800">
            {status === 'en_route' ? `${(4.2 * (1 - progress/100)).toFixed(1)} km left` : '4.2 km (12 mins)'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">ETA</span>
          <p className="text-sm font-bold text-blue-600">
            {status === 'en_route' ? `${Math.ceil(12 * (1 - progress/100))} mins` : status === 'arrived' || status === 'completed' ? 'Arrived' : '12 mins'}
          </p>
        </div>
      </div>
    </div>
  );
};
