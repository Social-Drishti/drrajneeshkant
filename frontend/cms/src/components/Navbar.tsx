import React from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Activity, 
  Wifi, 
  Bell, 
  Sparkles, 
  User,
  CalendarCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { CMSUser, UserRole } from '../types';

interface NavbarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  cmsUsers: CMSUser[];
  activeUser: CMSUser;
  isRealtimeConnected: boolean;
  activeEventsCount: number;
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRole,
  onRoleChange,
  activeUser,
  isRealtimeConnected,
  activeEventsCount,
  onOpenNotifications,
  onOpenLogin,
  onLogout,
  isAuthenticated
}) => {
  const roleBadges: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      role: 'doctor', 
      label: 'Doctor CMS', 
      icon: <Stethoscope className="w-4 h-4" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    { 
      role: 'receptionist', 
      label: 'Reception Desk', 
      icon: <UserCheck className="w-4 h-4" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
    },
    { 
      role: 'admin', 
      label: 'System Admin', 
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md pt-4 pb-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Logo & System Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-cyan-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight text-slate-900">Dr. Rajneesh Kant Clinic</h1>
            <p className="text-[11px] text-blue-600 font-extrabold uppercase tracking-wider">
              Dr. Rajneesh Kant · Chiropractic & CMS
            </p>
          </div>
        </div>

        {/* Real-Time Live Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <div className="relative flex h-2.5 w-2.5">
            {isRealtimeConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <span className="font-semibold text-slate-700">
            {isRealtimeConnected ? 'Real-Time Sync Active' : 'Connecting Stream...'}
          </span>
          <Wifi className={`w-3.5 h-3.5 ml-1 ${isRealtimeConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
        </div>

        {/* View / Role Switcher Pill Bar */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
          {roleBadges.map(({ role, label, icon, color }) => {
            const isActive = activeRole === role;
            return (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? `${color} border shadow-xs scale-102`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Doctor Profile, Notifications & Auth Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Real-Time Event Stream Log"
          >
            <Bell className="w-5 h-5" />
            {activeEventsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {activeEventsCount > 9 ? '9+' : activeEventsCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-tight">{activeUser.name}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{activeUser.department || activeUser.role}</p>
            </div>

            <div className="w-9 h-9 bg-slate-200 rounded-full border-2 border-white shadow-xs overflow-hidden flex-shrink-0">
              <img src={activeUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>

            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Switch Staff Account / Login"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Login / Switch</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

