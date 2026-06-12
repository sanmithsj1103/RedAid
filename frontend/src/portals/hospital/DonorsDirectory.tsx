import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Heart, 
  Award, 
  Zap, 
  X, 
  Bell, 
  Phone, 
  MessageSquare, 
  Check, 
  Star,
  Plus
} from 'lucide-react';
import { api, Donor, BloodGroup, AvailabilityStatus } from '../../services/api';
import { HospitalLayout } from './HospitalLayout';

export const DonorsDirectory: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Trust Score (Highest)');

  // Drawer Form State
  const [drawerRating, setDrawerRating] = useState(4);
  const [drawerNotes, setDrawerNotes] = useState('');

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorGroup, setNewDonorGroup] = useState<BloodGroup>('O+');
  const [newDonorPhone, setNewDonorPhone] = useState('');

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const data = await api.getDonorsAdminList();
      setDonors(data);
      setFilteredDonors(data);
    } catch (err) {
      console.error('Error fetching donors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run Filters
  useEffect(() => {
    let result = [...donors];

    // Text Search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.fullName.toLowerCase().includes(term) || 
        d.id.toLowerCase().includes(term)
      );
    }

    // Blood Group
    if (groupFilter !== 'All') {
      result = result.filter(d => d.bloodGroup === groupFilter);
    }

    // Status
    if (statusFilter !== 'All') {
      result = result.filter(d => d.availability === statusFilter.toLowerCase());
    }

    // Sort By
    if (sortBy === 'Trust Score (Highest)') {
      result.sort((a, b) => b.trustScore - a.trustScore);
    } else if (sortBy === 'Trust Score (Lowest)') {
      result.sort((a, b) => a.trustScore - b.trustScore);
    } else if (sortBy === 'Total Donations') {
      result.sort((a, b) => b.totalDonations - a.totalDonations);
    }

    setFilteredDonors(result);
  }, [searchTerm, groupFilter, statusFilter, sortBy, donors]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setGroupFilter('All');
    setStatusFilter('All');
    setSortBy('Trust Score (Highest)');
  };

  // Helper to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Helper to get distance relative to Hospital (hospital_1)
  const getDistanceString = (donorId: string) => {
    const distanceMap: Record<string, string> = {
      'donor_julianne': '2.4 km',
      'donor_marcus': '5.8 km',
      'donor_sarah_r': '1.2 km',
      'donor_thomas': '12.5 km',
      'donor_anita': '4.1 km',
      'donor_adrian': '2.0 km',
      'donor_1': '4.6 km',
    };
    return distanceMap[donorId] || '3.5 km';
  };

  const handleRowClick = (donor: Donor) => {
    setSelectedDonor(donor);
    setDrawerRating(4);
    setDrawerNotes('');
  };

  // Drawer Interactions
  const handleToggleEmergencyReady = async () => {
    if (!selectedDonor) return;
    const newStatus: AvailabilityStatus = selectedDonor.availability === 'active' ? 'unavailable' : 'active';
    try {
      const updated = await api.updateDonor(selectedDonor.id, { availability: newStatus });
      setSelectedDonor(updated);
      // Update local state list
      setDonors(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonor) return;
    
    // Penalize or reward trust score based on stars
    const scoreDiff = (drawerRating - 3.5) * 1.5;
    const newScore = Math.max(0, Math.min(100, Math.round(selectedDonor.trustScore + scoreDiff)));
    
    try {
      const updated = await api.updateDonor(selectedDonor.id, { trustScore: newScore });
      setSelectedDonor(null); // Close drawer
      setDonors(prev => prev.map(d => d.id === updated.id ? updated : d));
      alert(`Feedback submitted successfully! Donor trust score updated to ${newScore}%.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonorName || !newDonorPhone) return;

    try {
      await api.registerDonor({
        fullName: newDonorName,
        phone: newDonorPhone,
        dateOfBirth: '1995-01-01',
        bloodGroup: newDonorGroup,
        location: { lat: 12.9698, lng: 77.7499, city: 'Bengaluru', address: 'Whitefield' },
        availability: 'active',
        healthDeclaration: { noTattoosRecent: true, noMedicationRecent: true, generalFitness: true },
      });
      setIsRegisterOpen(false);
      setNewDonorName('');
      setNewDonorPhone('');
      fetchDonors();
      alert('Donor registered successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <HospitalLayout searchPlaceholder="Search donors by name, ID or group...">
      <div className="space-y-6 max-w-[1400px] mx-auto pb-16 relative">
        
        {/* Main Content Area */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Donors Directory</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage and connect with our verified blood donor network.</p>
          </div>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white py-2.5 px-4 rounded-xl text-xs font-black tracking-wider flex items-center gap-2 shadow-sm transition-all uppercase"
          >
            <Plus className="w-4 h-4" />
            Register New Donor
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Search Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by donor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Blood Group</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white transition-colors"
              >
                <option value="All">All Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Donor Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white transition-colors"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Snoozed">Snoozed</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white transition-colors"
              >
                <option value="Trust Score (Highest)">Trust Score (Highest)</option>
                <option value="Trust Score (Lowest)">Trust Score (Lowest)</option>
                <option value="Total Donations">Total Donations</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleClearFilters}
              className="text-xs font-black text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table Panel */}
        <div className="bg-white border border-[#eae7e7] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcf9f8]/80 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-[#eae7e7]">
                  <th className="px-6 py-3.5">Donor Name</th>
                  <th className="px-6 py-3.5">Blood Group</th>
                  <th className="px-6 py-3.5">Distance</th>
                  <th className="px-6 py-3.5">Trust Score</th>
                  <th className="px-6 py-3.5">Last Donated</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Total Donations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae7e7]/60 text-slate-700">
                {filteredDonors.map((donor) => {
                  const initials = getInitials(donor.fullName);
                  
                  // Status render
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-650 text-xs font-bold uppercase tracking-wider">
                      Unavailable
                    </span>
                  );
                  if (donor.availability === 'active') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                        Active
                      </span>
                    );
                  } else if (donor.availability === 'snoozed') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase tracking-wider">
                        Snoozed
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={donor.id} 
                      onClick={() => handleRowClick(donor)}
                      className={`hover:bg-slate-50/40 transition-colors cursor-pointer ${selectedDonor?.id === donor.id ? 'bg-[#ffdad6]/10' : ''}`}
                    >
                      {/* Avatar & Name */}
                      <td className="px-6 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#ffdad6]/40 text-[#ba1a1a] flex items-center justify-center text-xs font-black shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 leading-tight">{donor.fullName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">ID: {donor.id.replace('donor_', '#DN-').toUpperCase()}</span>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="px-6 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-[#ba1a1a] text-white tracking-wider">
                          {donor.bloodGroup}
                        </span>
                      </td>

                      {/* Distance */}
                      <td className="px-6 py-3 font-semibold text-slate-700 text-xs">
                        {getDistanceString(donor.id)}
                      </td>

                      {/* Trust Score Progress Bar */}
                      <td className="px-6 py-3">
                        <div className="flex flex-col max-w-[120px]">
                          <span className="text-xs font-bold text-[#ba1a1a]">{Math.round(donor.trustScore)}%</span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="h-full rounded-full bg-[#ba1a1a]" style={{ width: `${donor.trustScore}%` }}></div>
                          </div>
                        </div>
                      </td>

                      {/* Last Donated */}
                      <td className="px-6 py-3 font-semibold text-slate-500 text-xs">
                        {formatDate(donor.lastDonatedAt)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        {statusBadge}
                      </td>

                      {/* Total Donations */}
                      <td className="px-6 py-3 font-black text-slate-800 text-center text-xs">
                        {donor.totalDonations}
                      </td>
                    </tr>
                  );
                })}

                {filteredDonors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold">
                      No verified donors found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-6 py-4 border-t border-[#eae7e7] flex items-center justify-between text-xs text-slate-400 font-semibold bg-[#fcf9f8]/40">
            <span>Showing 1 to {filteredDonors.length} of {donors.length} verified donors</span>
            <div className="flex items-center gap-1.5">
              <button className="p-1 px-2 border border-slate-200 rounded hover:bg-slate-50 shrink-0 text-slate-600 disabled:opacity-50" disabled>&lt;</button>
              <button className="p-1 px-2.5 bg-[#ba1a1a] text-white rounded font-bold shrink-0">1</button>
              <button className="p-1 px-2.5 border border-slate-250 hover:bg-slate-50 rounded shrink-0">2</button>
              <button className="p-1 px-2.5 border border-slate-250 hover:bg-slate-50 rounded shrink-0">3</button>
              <span className="px-1 text-slate-350">...</span>
              <button className="p-1 px-2.5 border border-slate-250 hover:bg-slate-50 rounded shrink-0">25</button>
              <button className="p-1 px-2 border border-slate-200 rounded hover:bg-slate-50 shrink-0 text-slate-600">&gt;</button>
            </div>
          </div>
        </div>

        {/* Floating Map Action Button */}
        <div className="absolute right-4 bottom-20">
          <button 
            onClick={() => alert("Showing donor coordination map...")}
            className="w-12 h-12 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-[1.05]"
            title="Show Coordinates Map"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Metrics Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Active Donors Summary */}
          <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
              <Heart className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Active Donors</span>
              <h4 className="text-xl font-black text-slate-800 leading-tight">1,248</h4>
              <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↗ +12% from last month</p>
            </div>
          </div>

          {/* Average Trust Score Summary */}
          <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-[#ba1a1a] shrink-0">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Avg. Trust Score</span>
              <h4 className="text-xl font-black text-slate-800 leading-tight">94.2%</h4>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Based on 840 recent ratings</p>
            </div>
          </div>

          {/* Emergency Readiness Summary */}
          <div className="bg-white border border-[#eae7e7] rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 shrink-0">
              <Zap className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Emergency Readiness</span>
              <h4 className="text-xl font-black text-slate-800 leading-tight">42 Donors</h4>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Available within 2km radius</p>
            </div>
          </div>
        </div>

        {/* Drawer Sidebar: Slide-over Detail drawer (Image 3) */}
        {selectedDonor && (
          <>
            {/* Overlay background mask */}
            <div 
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-40 transition-opacity"
              onClick={() => setSelectedDonor(null)}
            ></div>

            {/* Sidebar drawer container */}
            <div className="fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl z-50 flex flex-col justify-between overflow-hidden border-l border-[#eae7e7] transition-all transform animate-slide-in duration-300">
              
              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
                
                {/* Header: AS Avatar, Name & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center text-sm font-black shadow-sm">
                        {getInitials(selectedDonor.fullName)}
                      </div>
                      {selectedDonor.availability === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 leading-tight">{selectedDonor.fullName}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-[#ba1a1a] text-white">
                        {selectedDonor.bloodGroup} NEGATIVE
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDonor(null)}
                    className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Card 1: Trust Score Ring Gauge */}
                <div className="bg-[#ffdad6]/10 border border-[#ffdad6]/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1 max-w-[180px]">
                    <h4 className="text-xs font-black text-[#ba1a1a] tracking-tight">{Math.round(selectedDonor.trustScore)}% Trust</h4>
                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed">
                      Top 5% of reliable donors. Based on punctuality and vitals.
                    </p>
                  </div>
                  {/* SVG circular progress indicator */}
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#ba1a1a]"
                        strokeWidth="3"
                        strokeDasharray={`${selectedDonor.trustScore}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-slate-800">{Math.round(selectedDonor.trustScore)}</span>
                  </div>
                </div>

                {/* Card 2: Emergency Ready switch */}
                <div className="bg-white border border-[#eae7e7] rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedDonor.availability === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Bell className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-tight">Emergency Ready</h4>
                      <p className="text-[9px] font-semibold text-slate-400">Available for urgent calls</p>
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <button 
                    onClick={handleToggleEmergencyReady}
                    className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors duration-300 ${selectedDonor.availability === 'active' ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
                  </button>
                </div>

                {/* Donation History timeline */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline border-b border-[#eae7e7]/60 pb-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Donation History</h4>
                    <button onClick={() => alert("Showing comprehensive history timeline...")} className="text-[9px] font-black text-[#ba1a1a] hover:underline uppercase tracking-wider">View All</button>
                  </div>
                  
                  {/* Vertical Timeline */}
                  <div className="space-y-4 pl-3 relative border-l border-slate-200 mt-2 ml-1">
                    {/* Item 1 */}
                    <div className="relative pl-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                      <div className="text-[11px] leading-tight">
                        <h5 className="font-bold text-slate-800">Whole Blood Donation</h5>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">12 Oct 2023 • General Ward</p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="relative pl-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                      <div className="text-[11px] leading-tight">
                        <h5 className="font-bold text-slate-800">Platelet Apheresis</h5>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">15 Jul 2023 • Oncology Dept</p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="relative pl-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                      <div className="text-[11px] leading-tight">
                        <h5 className="font-bold text-slate-800">Whole Blood Donation</h5>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">02 Feb 2023 • Emergency Unit</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Star rating feedback panel */}
                <form onSubmit={handleSubmitRating} className="bg-white border border-[#eae7e7] rounded-xl p-4 shadow-sm space-y-3.5">
                  <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Post-Donation Rating</h4>
                  
                  {/* Interactive Star layout */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setDrawerRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${star <= drawerRating ? 'fill-amber-400 text-amber-400' : 'text-slate-350'}`} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Add a private note about the donor's vitals or conduct..."
                    value={drawerNotes}
                    onChange={(e) => setDrawerNotes(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  ></textarea>

                  <button
                    type="submit"
                    className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-2.5 rounded-lg text-xs font-black tracking-wider transition-all uppercase"
                  >
                    Submit Report
                  </button>
                </form>
              </div>

              {/* Sticky footer action buttons */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#eae7e7] bg-white flex gap-3 z-10">
                <button 
                  onClick={() => alert(`Simulating message interface with: ${selectedDonor.fullName}`)}
                  className="flex-1 py-3 px-4 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  Message
                </button>
                <button 
                  onClick={() => alert(`Dialing contact number: ${selectedDonor.phone} for ${selectedDonor.fullName}`)}
                  className="flex-[2] py-3 px-4 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  Call Now
                </button>
              </div>

            </div>
          </>
        )}

        {/* Modal: Register New Donor */}
        {isRegisterOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-[#eae7e7] rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-scale-in">
              <button 
                onClick={() => setIsRegisterOpen(false)}
                className="absolute right-4 top-4 p-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-[#eae7e7]/60 pb-3 mb-4">Register New Donor</h3>
              
              <form onSubmit={handleRegisterDonor} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter donor's full name..."
                    value={newDonorName}
                    onChange={(e) => setNewDonorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Blood Group</label>
                  <select
                    value={newDonorGroup}
                    onChange={(e) => setNewDonorGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 transition-colors"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210..."
                    value={newDonorPhone}
                    onChange={(e) => setNewDonorPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="flex-1 py-2.5 border border-slate-250 rounded-lg text-xs font-black uppercase text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg text-xs font-black uppercase transition-all"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </HospitalLayout>
  );
};
