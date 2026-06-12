import React from 'react';
import { HospitalLayout } from './HospitalLayout';
import { Users, BarChart2, Settings, ShieldCheck, HelpCircle } from 'lucide-react';

export const DonorsPlaceholder: React.FC = () => {
  return (
    <HospitalLayout searchPlaceholder="Search donors by group, ID or name...">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Matched Donors Directory</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">View and manage local blood donor registrations in your coordination radius.</p>
        </div>

        <div className="bg-white border border-[#eae7e7] rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-[#fff5f5] rounded-full flex items-center justify-center mx-auto text-primary">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Donor Directory Integration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Matched donor records are automatically pulled when an emergency dispatch is initialized. Direct lookup and individual donor notification channels will be connected to the backend.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Developer Sandboxed
            </span>
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
};

export const AnalyticsPlaceholder: React.FC = () => {
  return (
    <HospitalLayout searchPlaceholder="Search analytical datasets...">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Outreach & Stock Analytics</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Real-time charts, notification conversion rate and response times.</p>
        </div>

        <div className="bg-white border border-[#eae7e7] rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-[#fff5f5] rounded-full flex items-center justify-center mx-auto text-primary">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Outreach Performance Metrics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track coordination efficiency, donor arrival times, and surplus exchange volumes. Detailed charts and data exports will be wired up to the aggregation backend service.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              Mock Simulation Active
            </span>
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
};

export const SettingsPlaceholder: React.FC = () => {
  return (
    <HospitalLayout searchPlaceholder="Search portal configurations...">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Portal Configurations</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Configure notification radiuses, thresholds, and institutional verification.</p>
        </div>

        <div className="bg-white border border-[#eae7e7] rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-[#fff5f5] rounded-full flex items-center justify-center mx-auto text-primary">
            <Settings className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Institutional Settings</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Update Hospital credentials, staff access levels, and automatic stock depletion webhooks. Security rules and configurations will be tied to the database settings tables.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Read-Only Demo Mode
            </span>
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
};
