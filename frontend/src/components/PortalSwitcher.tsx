import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Landmark, ShieldAlert, Award, Activity, HeartHandshake } from 'lucide-react';
import { api } from '../services/api';

export const PortalSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getAdminAnalytics().then(res => setStats(res.kpis));
  }, []);

  return (
    <div className="min-h-screen bg-surface-low flex flex-col justify-between p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg border border-primary/20">
            <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface">Red<span className="text-primary">Aid</span></h1>
            <p className="text-[10px] text-on-surface-variant font-medium tracking-wider uppercase">Emergency Blood Network</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
          v1.0 PWA Mode
        </span>
      </header>

      {/* Hero section */}
      <main className="max-w-6xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-8">
        <div className="text-center max-w-2xl mb-12">
          <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
            India's Real-time Coordination Platform
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-4 text-on-surface leading-tight">
            Every Second Counts. <br />
            Select Your Gateway.
          </h2>
          <p className="text-on-surface-variant mt-4 text-sm md:text-base font-normal leading-relaxed">
            Choose a portal below to interact with the RedAid platform. The app runs a local in-memory state engine simulating a live database and network latency.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Donor Card */}
          <div 
            onClick={() => navigate('/donor')}
            className="group relative bg-white border border-surface-container-high rounded-3xl p-6 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] group-hover:bg-primary/10 transition-colors -z-0"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Donor Portal</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Register as an eligible donor, toggle active availability, accept emergency requests, track maps, and download donation certificates.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
              <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Enter App &rarr;
              </span>
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded font-semibold border border-green-100">
                Mobile View
              </span>
            </div>
          </div>

          {/* Hospital Card */}
          <div 
            onClick={() => navigate('/hospital')}
            className="group relative bg-white border border-surface-container-high rounded-3xl p-6 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] group-hover:bg-blue-500/10 transition-colors -z-0"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Hospital Console</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Create O+/A- emergency requests, track en-route donors on the live map dashboard, manage blood stock levels, and coordinate surplus.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Enter Console &rarr;
              </span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
                Desktop/Tablet
              </span>
            </div>
          </div>

          {/* Admin Card */}
          <div 
            onClick={() => navigate('/admin')}
            className="group relative bg-white border border-surface-container-high rounded-3xl p-6 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] group-hover:bg-purple-500/10 transition-colors -z-0"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Admin Dashboard</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Verify medical centers, monitor system performance, manage blacklists, review logs, and broadcast system notifications.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
              <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Open Admin &rarr;
              </span>
              <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-semibold border border-purple-100">
                Operations
              </span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        {stats && (
          <div className="mt-12 w-full max-w-4xl bg-surface-container/60 border border-surface-container-high rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-2 border-r border-surface-container-high last:border-0">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Active Donors</span>
              <p className="text-lg font-bold text-on-surface mt-1">{stats.totalDonors}</p>
            </div>
            <div className="p-2 border-r border-surface-container-high last:border-0">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Coordination Centers</span>
              <p className="text-lg font-bold text-on-surface mt-1">{stats.totalHospitals}</p>
            </div>
            <div className="p-2 border-r border-surface-container-high last:border-0">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Dispatched Requests</span>
              <p className="text-lg font-bold text-on-surface mt-1">{stats.totalRequests}</p>
            </div>
            <div className="p-2 last:border-0">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Donations Fulfilled</span>
              <p className="text-lg font-bold text-green-600 mt-1">{stats.completedDonations}</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-surface-container-high max-w-6xl mx-auto w-full">
        <p className="text-[10px] text-on-surface-variant font-semibold">
          &copy; 2026 REDAID. Built with React, Tailwind CSS and Lucide Icons. Verified DPDPA 2023 Compliant.
        </p>
      </footer>
    </div>
  );
};
