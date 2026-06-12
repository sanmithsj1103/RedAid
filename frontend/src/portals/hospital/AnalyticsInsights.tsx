import React, { useState } from 'react';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  Percent, 
  Clock, 
  ChevronDown
} from 'lucide-react';
import { HospitalLayout } from './HospitalLayout';

export const AnalyticsInsights: React.FC = () => {
  const [dateRange, setDateRange] = useState('Oct 01, 2023 - Oct 31, 2023');

  // SVG Donut metrics
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (74 / 100) * circumference;

  // Mock data for top reliable donors
  const topDonors = [
    { rank: '#1', name: 'Sarah Mitchell', initials: 'SM', group: 'O+', score: 98, donations: '24 Units', rate: '100%', color: 'bg-emerald-500' },
    { rank: '#2', name: 'James Rodriguez', initials: 'JR', group: 'A-', score: 94, donations: '19 Units', rate: '96%', color: 'bg-emerald-500' },
    { rank: '#3', name: 'Elena Kovac', initials: 'EK', group: 'O-', score: 91, donations: '15 Units', rate: '92%', color: 'bg-emerald-500' },
    { rank: '#4', name: 'Marcus Webb', initials: 'MW', group: 'B+', score: 88, donations: '12 Units', rate: '85%', color: 'bg-amber-500' }
  ];

  // Peak request times columns (representation of Image 4 heatmap)
  const peakTimeSlots = [
    { hour: '12 AM', levels: [1, 2, 4, 3, 1, 2, 1] },
    { hour: '1 AM', levels: [1, 0, 1, 2, 1, 0, 1] },
    { hour: '2 AM', levels: [0, 0, 0, 1, 0, 0, 0] },
    { hour: '3 AM', levels: [0, 0, 0, 0, 0, 0, 0] },
    { hour: '4 AM', levels: [0, 1, 0, 0, 1, 0, 0] },
    { hour: '5 AM', levels: [1, 1, 2, 1, 2, 1, 1] },
    { hour: '6 AM', levels: [2, 1, 1, 2, 1, 2, 2] },
    { hour: '7 AM', levels: [2, 3, 2, 3, 2, 2, 2] },
    { hour: '8 AM', levels: [3, 4, 3, 4, 3, 3, 3] },
    { hour: '9 AM', levels: [4, 5, 4, 5, 4, 4, 4] },
    { hour: '10 AM', levels: [4, 3, 5, 4, 5, 4, 4] },
    { hour: '11 AM', levels: [3, 2, 4, 3, 4, 3, 3] },
    { hour: '12 PM', levels: [4, 5, 4, 5, 4, 4, 5] },
    { hour: '1 PM', levels: [3, 4, 3, 4, 3, 3, 4] },
    { hour: '2 PM', levels: [2, 3, 2, 3, 2, 2, 3] },
    { hour: '3 PM', levels: [3, 2, 4, 2, 3, 3, 3] },
    { hour: '4 PM', levels: [4, 3, 3, 4, 3, 4, 4] },
    { hour: '5 PM', levels: [5, 4, 4, 5, 4, 5, 5] },
    { hour: '6 PM', levels: [4, 5, 3, 4, 5, 4, 4] },
    { hour: '7 PM', levels: [3, 3, 2, 3, 3, 3, 3] },
    { hour: '8 PM', levels: [2, 2, 1, 2, 2, 2, 2] },
    { hour: '9 PM', levels: [1, 2, 1, 1, 2, 1, 1] },
    { hour: '10 PM', levels: [1, 1, 0, 1, 1, 0, 1] },
    { hour: '11 PM', levels: [0, 0, 0, 0, 1, 0, 0] }
  ];

  const handleDownloadReport = () => {
    alert("Exporting analytics report as CSV...");
  };

  return (
    <HospitalLayout 
      searchPlaceholder="Search hospital records..."
      headerTitle={
        <span className="text-[#ba1a1a] font-black text-sm tracking-widest uppercase">
          REDAID Hospital Portal
        </span>
      }
    >
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        
        {/* Title Block */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Analytics & Insights</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time performance metrics and donor engagement statistics.</p>
          </div>
          
          {/* Date range picker */}
          <div className="relative">
            <button 
              onClick={() => alert("Calendar popup simulated.")}
              className="bg-white border border-[#eae7e7] rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm uppercase tracking-wider"
            >
              <Calendar className="w-4 h-4 text-[#ba1a1a]" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-450" />
            </button>
          </div>
        </div>

        {/* Row 1: Donation Volume & Fulfillment Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Donation Volume Bar Chart (2/3 width) */}
          <div className="lg:col-span-2 bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[360px]">
            <div className="flex justify-between items-center border-b border-[#eae7e7]/60 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Donation Volume</h3>
              {/* Ellipsis/Menu */}
              <button className="text-slate-450 hover:text-slate-700 font-black text-lg">•••</button>
            </div>

            {/* Custom SVG/CSS Bar Chart Grid */}
            <div className="flex-1 flex items-end justify-between px-2 pt-6 pb-2 relative h-48">
              {/* Y-Axis lines */}
              <div className="absolute inset-x-0 top-6 border-t border-slate-100"></div>
              <div className="absolute inset-x-0 top-20 border-t border-slate-100"></div>
              <div className="absolute inset-x-0 top-36 border-t border-slate-100"></div>
              <div className="absolute inset-x-0 bottom-10 border-t border-slate-200"></div>

              {/* Mon */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-24 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[65%] rounded-t-lg"></div>
                  {/* Tooltip */}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">26 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Mon</span>
              </div>

              {/* Tue */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-32 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[80%] rounded-t-lg"></div>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">34 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Tue</span>
              </div>

              {/* Wed */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-20 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[50%] rounded-t-lg"></div>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">20 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Wed</span>
              </div>

              {/* Thu */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-28 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[72%] rounded-t-lg"></div>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">30 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Thu</span>
              </div>

              {/* Fri */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-36 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[90%] rounded-t-lg"></div>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">42 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Fri</span>
              </div>

              {/* Sat */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-16 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[40%] rounded-t-lg"></div>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">16 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Sat</span>
              </div>

              {/* Sun */}
              <div className="flex flex-col items-center gap-2 flex-1 z-10">
                <div className="group relative w-7 bg-slate-100 hover:bg-[#ffdad6] h-12 rounded-t-lg transition-all flex items-end overflow-hidden">
                  <div className="w-full bg-[#ba1a1a] h-[30%] rounded-t-lg"></div>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-1 z-20">12 Units</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">Sun</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Rate Ring Chart (1/3 width) */}
          <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[360px]">
            <div className="border-b border-[#eae7e7]/60 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Fulfillment Rate</h3>
            </div>

            {/* Circular Gauge */}
            <div className="flex-1 flex flex-col items-center justify-center p-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Lighter track */}
                  <circle
                    className="text-slate-100"
                    strokeWidth={stroke}
                    stroke="currentColor"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  {/* Gauge Arc */}
                  <circle
                    className="text-[#ba1a1a]"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-slate-850">74%</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Fulfilled</span>
                </div>
              </div>
            </div>

            {/* Key Status Indicators */}
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-wider border-t border-[#eae7e7]/65 pt-3">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-700">Success</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                  <span className="text-slate-700">Urgent</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-350"></span>
                  <span className="text-slate-700">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Peak Request Times & Blood Group Demand */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Peak Request Times Heatmap (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[320px]">
            <div className="border-b border-[#eae7e7]/60 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Peak Request Times</h3>
            </div>

            {/* Visual Heatmap Grid */}
            <div className="flex-1 flex flex-col justify-between py-2">
              {/* Heat Bars Columns */}
              <div className="flex items-end justify-between h-36 px-1">
                {peakTimeSlots.map((slot, index) => {
                  // Determine height based on sum of mock levels
                  const maxLevel = Math.max(...slot.levels);
                  const heightPercent = maxLevel * 20; // max level is 5 -> 100%
                  
                  // Color based on level severity
                  let bgCol = 'bg-[#ffdad6]/20';
                  if (maxLevel >= 5) bgCol = 'bg-[#ba1a1a]';
                  else if (maxLevel >= 4) bgCol = 'bg-[#ffb4a9]';
                  else if (maxLevel >= 3) bgCol = 'bg-[#ffdad6]';
                  else if (maxLevel >= 2) bgCol = 'bg-[#fcf9f8]';

                  return (
                    <div key={index} className="group relative flex-1 flex flex-col items-center h-full justify-end px-0.5">
                      <div 
                        className={`w-2 rounded-full transition-all hover:scale-x-125 ${bgCol}`} 
                        style={{ height: `${Math.max(10, heightPercent)}%` }}
                      ></div>
                      {/* Tooltip */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded transition-opacity pointer-events-none z-20">
                        {slot.hour}: {maxLevel} reqs
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Time stamps */}
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 px-1 border-t border-slate-100 pt-2">
                <span>12 AM</span>
                <span>12 PM</span>
                <span>11 PM</span>
              </div>

              {/* Days Indicators */}
              <div className="flex gap-4 text-[8px] font-bold text-slate-400 mt-2">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* Blood Group Demand (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex flex-col justify-between h-[320px]">
            <div className="border-b border-[#eae7e7]/60 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Blood Group Demand</h3>
            </div>

            <div className="flex-1 space-y-4">
              {/* O+ */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-bold">
                  <span className="text-slate-800">O Positive (O+)</span>
                  <span className="text-slate-500">142 Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>

              {/* A+ */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-bold">
                  <span className="text-slate-800">A Positive (A+)</span>
                  <span className="text-slate-500">98 Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              {/* O- */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-bold">
                  <span className="text-slate-800">O Negative (O-)</span>
                  <span className="text-slate-500">74 Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '51%' }}></div>
                </div>
              </div>

              {/* B+ */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-bold">
                  <span className="text-slate-800">B Positive (B+)</span>
                  <span className="text-slate-500">56 Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500/80 h-full rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>

              {/* AB- */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-bold">
                  <span className="text-slate-800">AB Negative (AB-)</span>
                  <span className="text-slate-500">12 Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#ba1a1a] h-full rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Top Reliable Donors Grid Panel */}
        <div className="bg-white border border-[#eae7e7] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eae7e7] flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top Reliable Donors</h3>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert("Redirecting to donors directory...")}
                className="text-xs font-black text-[#ba1a1a] hover:underline uppercase tracking-wider"
              >
                View All Donors
              </button>
              
              {/* Circular red download icon */}
              <button 
                onClick={handleDownloadReport}
                className="w-8 h-8 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white flex items-center justify-center shadow-sm transition-transform transform active:scale-95"
                title="Download Data CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcf9f8]/80 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-[#eae7e7]">
                  <th className="px-6 py-3.5 text-center">Rank</th>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5 text-center">Blood Group</th>
                  <th className="px-6 py-3.5">Trust Score</th>
                  <th className="px-6 py-3.5">Total Donations</th>
                  <th className="px-6 py-3.5 text-center">Response Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae7e7]/60 text-slate-700">
                {topDonors.map((donor) => (
                  <tr key={donor.rank} className="hover:bg-slate-50/40 transition-colors">
                    {/* Rank */}
                    <td className="px-6 py-4 text-center font-black text-[#ba1a1a] text-xs">
                      {donor.rank}
                    </td>

                    {/* Avatar & Name */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ffdad6]/40 text-[#ba1a1a] flex items-center justify-center text-[10px] font-black shrink-0">
                        {donor.initials}
                      </div>
                      <span className="text-xs font-black text-slate-800 leading-tight">{donor.name}</span>
                    </td>

                    {/* Blood Group */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#ffdad6]/40 text-[#ba1a1a] border border-[#ffdad6]">
                        {donor.group}
                      </span>
                    </td>

                    {/* Trust Score Line Indicator */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${donor.color}`} style={{ width: `${donor.score}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-slate-650">{donor.score}</span>
                      </div>
                    </td>

                    {/* Total Donations */}
                    <td className="px-6 py-4 font-semibold text-slate-600 text-xs">
                      {donor.donations}
                    </td>

                    {/* Response Rate */}
                    <td className="px-6 py-4 font-black text-emerald-600 text-center text-xs">
                      {donor.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </HospitalLayout>
  );
};
