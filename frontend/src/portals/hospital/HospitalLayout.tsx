import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Droplet, Archive, Users, BarChart2, Settings, LogOut, Bell, Search } from 'lucide-react';
import { api, Hospital } from '../../services/api';

interface HospitalLayoutProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  headerAction?: React.ReactNode;
  headerTitle?: React.ReactNode;
}

export const HospitalLayout: React.FC<HospitalLayoutProps> = ({ 
  children, 
  searchPlaceholder = "Search blood group, donor ID, or request...",
  headerAction,
  headerTitle
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.getHospitalProfile();
        setHospital(profile);
      } catch (err) {
        console.error("Failed to load hospital profile in layout:", err);
        // If unauthorized, redirect to login
        navigate('/hospital/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    window.addEventListener('hospital-profile-updated', fetchProfile);
    return () => {
      window.removeEventListener('hospital-profile-updated', fetchProfile);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await api.logout();
    navigate('/');
  };

  const navItems = [
    { 
      path: '/hospital', 
      label: 'Dashboard', 
      icon: LayoutDashboard 
    },
    { 
      path: '/hospital/requests', 
      label: 'Blood Requests', 
      icon: Droplet 
    },
    { 
      path: '/hospital/inventory', 
      label: 'Inventory', 
      icon: Archive 
    },
    { 
      path: '/hospital/donors', 
      label: 'Donors', 
      icon: Users 
    },
    { 
      path: '/hospital/analytics', 
      label: 'Analytics', 
      icon: BarChart2 
    },
    { 
      path: '/hospital/settings', 
      label: 'Settings', 
      icon: Settings 
    },
  ];

  const isActive = (path: string) => {
    if (path === '/hospital') {
      return location.pathname === '/hospital';
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Hospital Console...</p>
        </div>
      </div>
    );
  }

  // Get matching user info for styling
  const getHeaderProfileInfo = () => {
    if (!hospital) return { name: "Dr. Sarah Mitchell", role: "HOSPITAL ADMIN", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150" };
    
    let avatar = "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150";
    if (hospital.id === 'hospital_1') {
      avatar = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150";
    } else if (hospital.id === 'hospital_2') {
      avatar = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150";
    }

    return {
      name: hospital.name,
      role: hospital.id === 'hospital_1' ? "HOSPITAL ADMIN" : "ADMINISTRATOR",
      avatar
    };
  };

  const profile = getHeaderProfileInfo();

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#fcf9f8] border-r border-[#eae7e7] flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0">
        <div>
          {/* Brand Logo */}
          <div className="mb-10 pl-2">
            <h1 className="text-2xl font-black tracking-tight text-primary">REDAID</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-1">Hospital Portal</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all group ${
                    active
                      ? 'text-primary bg-[#fff5f5]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-[#f6f3f2]'
                  }`}
                >
                  {/* Left border indicator for active tab */}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-r" />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 ${
                    active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-4 py-3 text-slate-500 hover:text-primary hover:bg-[#fff5f5] rounded-lg text-sm font-semibold transition-all group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-primary shrink-0" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Common Header */}
        <header className="bg-white border-b border-[#eae7e7] px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 flex-1">
            {/* Search bar */}
            <div className="relative w-96">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="block w-full pl-10 pr-4 py-2 bg-[#f0eded]/60 border-none rounded-lg text-sm placeholder-slate-450 focus:outline-none focus:bg-slate-50 transition-colors"
              />
            </div>

            {headerTitle && (
              <div className="text-sm font-bold">{headerTitle}</div>
            )}

            {headerAction && (
              <div className="ml-2">{headerAction}</div>
            )}
          </div>

          {/* User profile & Notifications */}
          <div className="flex items-center gap-5">
            {/* Bell notification */}
            <button className="relative p-1.5 text-slate-650 hover:bg-[#f0eded]/55 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white"></span>
            </button>

            {/* Divider */}
            <div className="h-8 w-[1px] bg-[#eae7e7]" />

            {/* Profile widget */}
            <div className="flex items-center gap-3.5">
              <div className="text-right">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">{profile.name}</h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">{profile.role}</p>
              </div>
              <img
                src={profile.avatar}
                alt="Profile Avatar"
                className="w-9 h-9 rounded-full object-cover border border-[#eae7e7]"
              />
            </div>
          </div>
        </header>

        {/* Active Page Viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#fcf9f8]">
          {children}
        </main>
      </div>
    </div>
  );
};
