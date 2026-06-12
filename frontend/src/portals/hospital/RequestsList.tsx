import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Calendar, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, BloodRequest, BloodGroup, RequestPriority } from '../../services/api';
import { HospitalLayout } from './HospitalLayout';

export const RequestsList: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'fulfilled' | 'cancelled'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('All Groups');
  const [selectedPriority, setSelectedPriority] = useState<string>('All Priorities');
  
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getHospitalRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests list:", err);
      navigate('/hospital/login');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedGroup('All Groups');
    setSelectedPriority('All Priorities');
    setActiveTab('all');
  };

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    // 1. Tab Filter
    if (activeTab === 'active') {
      const isActive = req.status === 'dispatched' || req.status === 'accepted' || req.status === 'en_route' || req.status === 'arrived';
      if (!isActive) return false;
    } else if (activeTab === 'fulfilled') {
      if (req.status !== 'completed') return false;
    } else if (activeTab === 'cancelled') {
      if (req.status !== 'cancelled') return false;
    }

    // 2. Blood Group Filter
    if (selectedGroup !== 'All Groups') {
      if (req.bloodGroup !== selectedGroup) return false;
    }

    // 3. Priority Filter
    if (selectedPriority !== 'All Priorities') {
      const p = selectedPriority.toLowerCase();
      // Map screenshot priority labels to api values
      if (p === 'critical' && req.priority !== 'critical') return false;
      if (p === 'high' && req.priority !== 'urgent') return false;
      if (p === 'normal' && req.priority !== 'scheduled') return false;
    }

    return true;
  });

  // Render Pill badges
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]">
            CRITICAL
          </span>
        );
      case 'urgent': // Urgency mapped to High Priority
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
            HIGH
          </span>
        );
      case 'scheduled': // Scheduled mapped to Normal Priority
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
            NORMAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
            NORMAL
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'dispatched':
      case 'accepted':
      case 'en_route':
      case 'arrived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fefce8] text-[#a16207] border border-[#fef08a]">
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
            Fulfilled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
            Active
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Blood Requests...</p>
        </div>
      </div>
    );
  }

  return (
    <HospitalLayout searchPlaceholder="Search requests, donors...">
      <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
        
        {/* Title row */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Blood Requests</h2>
            <p className="text-sm text-slate-400 font-medium">Manage and monitor urgent blood requirements across departments.</p>
          </div>

          <button
            onClick={() => navigate('/hospital/create')}
            className="bg-primary hover:bg-[#c0392b] text-white px-4 py-2.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3px]" />
            <span>New Request</span>
          </button>
        </div>

        {/* Outer card containing filter + table + pagination */}
        <div className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm overflow-hidden">
          
          {/* Sub-tabs Row */}
          <div className="border-b border-[#eae7e7] px-6 flex items-center gap-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'active'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('fulfilled')}
              className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'fulfilled'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Fulfilled
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'cancelled'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Cancelled
            </button>
          </div>

          {/* Filters Row */}
          <div className="px-6 py-4 bg-[#fcf9f8]/40 border-b border-[#eae7e7] flex flex-wrap items-center gap-4">
            {/* Blood Group Select */}
            <div className="w-44 select-none">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-white border border-[#eae7e7] rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All Groups">All Groups</option>
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

            {/* Priority Level Select */}
            <div className="w-44 select-none">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-white border border-[#eae7e7] rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="All Priorities">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
              </select>
            </div>

            {/* Date Range Picker Placeholder */}
            <button 
              type="button" 
              className="bg-white border border-[#eae7e7] rounded-lg px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-450" />
              <span>Oct 01 - Oct 31, 2023</span>
            </button>

            {/* More Filters */}
            <button 
              type="button" 
              className="bg-[#f0eded]/65 hover:bg-[#eae7e7] rounded-lg px-3.5 py-2 text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>More Filters</span>
            </button>

            {/* Reset Filters Icon */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 border border-[#eae7e7] bg-white rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors ml-auto"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Table Viewport */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcf9f8]/60 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-[#eae7e7]">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Blood Group</th>
                  <th className="px-6 py-4">Units</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4 text-center">Donors Notified</th>
                  <th className="px-6 py-4 text-center">Accepted</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae7e7]/60 text-slate-700">
                {filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/hospital/request/${req.id}`)}
                  >
                    {/* ID */}
                    <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                      #{req.id}
                    </td>

                    {/* Blood Group Circle */}
                    <td className="px-6 py-4.5">
                      <div className="w-9 h-9 rounded-full bg-[#fff5f5] border border-[#ffdad6] flex items-center justify-center">
                        <span className="text-sm font-black text-[#ba1a1a]">{req.bloodGroup}</span>
                      </div>
                    </td>

                    {/* Units */}
                    <td className="px-6 py-4.5 font-semibold text-sm">
                      {req.unitsRequired} Units
                    </td>

                    {/* Priority badge */}
                    <td className="px-6 py-4.5">
                      {renderPriorityBadge(req.priority)}
                    </td>

                    {/* Donors Notified */}
                    <td className="px-6 py-4.5 text-center text-slate-500 font-bold text-sm">
                      {req.donorsNotified}
                    </td>

                    {/* Accepted */}
                    <td className="px-6 py-4.5 text-center text-slate-500 font-bold text-sm">
                      {req.donorsAccepted}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4.5">
                      {renderStatusBadge(req.status)}
                    </td>

                    {/* Created At (e.g. 2 mins ago) */}
                    <td className="px-6 py-4.5 text-slate-400 font-medium text-xs">
                      {req.id === 'REQ-8291' ? '2 mins ago' :
                       req.id === 'REQ-8290' ? '30 mins ago' :
                       req.id === 'REQ-8288' ? '2 hours ago' :
                       req.id === 'REQ-8285' ? '5 hours ago' :
                       req.id === 'REQ-8280' ? '1 day ago' :
                       req.id === 'REQ-8275' ? '1 day ago' : 'Recently'}
                    </td>

                    {/* Action icon */}
                    <td className="px-6 py-4.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {req.status !== 'cancelled' ? (
                        <button 
                          onClick={() => navigate(`/hospital/request/${req.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                          title="Track Request"
                        >
                          <Eye className="w-4.5 h-4.5 text-[#ba1a1a]" />
                        </button>
                      ) : (
                        <div className="w-7 h-7 mx-auto"></div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold">
                      No matching blood requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="px-6 py-4 border-t border-[#eae7e7] flex items-center justify-between text-xs font-bold text-slate-400">
            <div>
              Showing <span className="text-slate-700">1 - {filteredRequests.length}</span> of <span className="text-slate-700">{requests.length}</span> requests
            </div>

            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button className="w-7 h-7 rounded flex items-center justify-center bg-primary text-white">1</button>
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-50 text-slate-650 transition-colors">2</button>
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-50 text-slate-650 transition-colors">3</button>
              <span className="px-1 text-slate-350">...</span>
              <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-50 text-slate-650 transition-colors">25</button>
              
              <button className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </HospitalLayout>
  );
};
