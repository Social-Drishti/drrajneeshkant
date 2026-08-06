import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Stethoscope, 
  UserCheck, 
  Bell, 
  Plus, 
  Search, 
  LogOut, 
  LogIn, 
  Clock, 
  Zap, 
  ChevronRight, 
  Settings, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X,
  Building2,
  CalendarCheck,
  Trash2
} from 'lucide-react';
import { 
  Doctor, 
  AppointmentSlot, 
  Appointment, 
  CMSUser, 
  UserRole, 
  SlotStatus, 
  AppointmentType, 
  PatientInfo,
  RealtimeEventPayload
} from '../types';
import { CrmManagementView } from './CrmManagementView';
import { RoleManagementCMS } from './RoleManagementCMS';
import { DoctorCMSPortal } from './DoctorCMSPortal';

interface DashboardLayoutProps {
  doctors: Doctor[];
  selectedDoctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
  slots: AppointmentSlot[];
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  appointments: Appointment[];
  activeUser: CMSUser;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  cmsUsers: CMSUser[];
  onUpdateRole: (userId: string, role: UserRole, permissions: CMSUser['permissions']) => void;
  onDeleteUser?: (userId: string) => void;
  onManageSlot: (slotId: string, status: SlotStatus, type?: AppointmentType, blockReason?: string) => void;
  onBulkBlockSlots: (reason: string) => void;
  onBookWalkIn: (slotId: string, patient: PatientInfo, appointmentType: AppointmentType) => void;
  onCancelAppointment?: (appointmentId: string) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  onUpdateDoctorSchedule: (doctorUpdates: Partial<Doctor>) => void;
  onOpenClinicalNotes: (appointment: Appointment) => void;
  onSendConfirmationEmail: (appointmentId?: string, slotId?: string, email?: string) => Promise<any>;
  onAddWhatsAppLead: (leadData: { slotId: string; patientName: string; phone: string; symptoms: string }) => Promise<void>;
  isRealtimeConnected: boolean;
  latestEvent: RealtimeEventPayload | null;
  onClearLatestEvent: () => void;
  eventLogLength: number;
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  doctors,
  selectedDoctor,
  onSelectDoctor,
  slots,
  selectedDate,
  onDateChange,
  appointments,
  activeUser,
  activeRole,
  onRoleChange,
  cmsUsers,
  onUpdateRole,
  onDeleteUser,
  onManageSlot,
  onBulkBlockSlots,
  onBookWalkIn,
  onCancelAppointment,
  onDeleteAppointment,
  onUpdateDoctorSchedule,
  onOpenClinicalNotes,
  onSendConfirmationEmail,
  onAddWhatsAppLead,
  isRealtimeConnected,
  latestEvent,
  onClearLatestEvent,
  eventLogLength,
  onOpenNotifications,
  onOpenLogin,
  onLogout,
  isAuthenticated
}) => {
  const [activeNav, setActiveNav] = useState<'overview' | 'crm' | 'slots' | 'queue' | 'schedule' | 'roles'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  // Walk-in modal trigger state from header
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInSlotId, setWalkInSlotId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInSymptoms, setWalkInSymptoms] = useState('');
  const [walkInType, setWalkInType] = useState<AppointmentType>('in_person');

  const availableSlots = slots.filter((s) => s.status === 'available');
  const bookedSlots = slots.filter((s) => s.status === 'booked');
  const blockedSlots = slots.filter((s) => s.status === 'blocked');

  const waLeadsCount = appointments.filter((a) => a.patient?.bookingChannel === 'whatsapp').length;
  const walkInCount = appointments.filter((a) => a.patient?.bookingChannel === 'walk_in').length;

  const filteredAppointments = appointments.filter((a) => {
    if (!quickSearch.trim()) return true;
    const term = quickSearch.toLowerCase();
    return (
      a.patient.name.toLowerCase().includes(term) ||
      a.patient.phone.toLowerCase().includes(term) ||
      a.time.toLowerCase().includes(term) ||
      (a.patient.symptoms && a.patient.symptoms.toLowerCase().includes(term))
    );
  });

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInSlotId || !walkInName) return;

    onBookWalkIn(
      walkInSlotId,
      {
        name: walkInName,
        email: `${walkInName.toLowerCase().replace(/\s+/g, '.')}@walkin.patient`,
        phone: walkInPhone || '+91 98000 00000',
        symptoms: walkInSymptoms || 'Direct Walk-In Consultation',
        urgencyLevel: 'moderate',
        bookingChannel: 'walk_in'
      },
      walkInType
    );

    setShowWalkInModal(false);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInSymptoms('');
    setWalkInSlotId('');
  };

  const isAdmin = activeUser.role === 'admin' || activeRole === 'admin';

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" />, badge: null },
    { id: 'crm', label: 'CRM & WhatsApp Leads', icon: <MessageSquare className="w-4 h-4" />, badge: appointments.length },
    { id: 'slots', label: 'Slots & Day Matrix', icon: <Calendar className="w-4 h-4" />, badge: availableSlots.length },
    { id: 'queue', label: 'Patient Queue & EHR', icon: <Users className="w-4 h-4" />, badge: bookedSlots.length },
    { id: 'schedule', label: 'Shift Hours & Overrides', icon: <Settings className="w-4 h-4" />, badge: null },
    ...(isAdmin ? [{ id: 'roles', label: 'Role & User Access', icon: <ShieldCheck className="w-4 h-4" />, badge: cmsUsers.length }] : [])
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col md:flex-row antialiased">

      {/* LEFT DASHBOARD SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-5 space-y-6">

          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                C
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-none">Chiroconnect</h1>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider mt-1">
                  Dr. Rajneesh Kant CMS
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Staff Account Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src={activeUser.avatar} alt={activeUser.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
              <div className="truncate">
                <p className="text-xs font-black text-slate-900 truncate">{activeUser.name}</p>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block truncate">
                  {activeUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenLogin}
              className="p-1.5 text-blue-600 hover:bg-blue-100/60 rounded-lg transition-colors flex-shrink-0"
              title="Switch Account"
            >
              <LogIn className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Practice Dashboard
            </span>
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-xs font-extrabold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-[10px] font-black
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Bottom Footer */}
        <div className="p-4 border-t border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span className="text-[11px] font-bold">{isRealtimeConnected ? 'Live Cloud Sync' : 'Offline Mode'}</span>
            </div>
            <button 
              onClick={onOpenNotifications}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {eventLogLength > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 font-semibold text-center border-t border-slate-100">
            Chiroconnect Clinic OS v2.4
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 min-w-0 bg-white flex flex-col min-h-screen">

        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize leading-tight">
                {activeNav === 'overview' && 'Practice Overview'}
                {activeNav === 'crm' && 'CRM & WhatsApp Leads Manager'}
                {activeNav === 'slots' && 'Daily Slots & Schedule Matrix'}
                {activeNav === 'queue' && 'Patient Queue & EHR Records'}
                {activeNav === 'schedule' && 'Doctor Working Hours'}
                {activeNav === 'roles' && 'Staff Access & Permission Matrix'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Clinic: <strong className="text-slate-800">{selectedDoctor.name} ({selectedDoctor.location})</strong>
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-3">

            {/* Quick Search Input */}
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search patient, phone..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white bg-slate-50/50"
              />
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-blue-600 ml-1.5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-2 py-1 rounded-lg border-0 bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Doctor Switcher */}
            {doctors.length > 1 && (
              <select
                value={selectedDoctor.id}
                onChange={(e) => {
                  const doc = doctors.find((d) => d.id === e.target.value);
                  if (doc) onSelectDoctor(doc);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            )}

            {/* Quick Walk-In Button */}
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-2xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">+ Walk-In Patient</span>
            </button>

            {/* Logout / Switch User */}
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

        </header>

        {/* REALTIME EVENT TICKER BANNER */}
        {latestEvent && (
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 flex items-center justify-between text-xs font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>[Realtime Alert] {latestEvent.message}</span>
            </div>
            <button onClick={onClearLatestEvent} className="text-white/80 hover:text-white font-black text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* WORKSPACE CONTENT AREA */}
        <main className="p-4 sm:p-8 space-y-8 flex-1 bg-white">

          {/* TOP METRIC STATS ROW (Always Crisp White Containers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Patients</span>
                <p className="text-2xl font-black text-slate-900">{appointments.length}</p>
                <p className="text-[11px] text-slate-500 font-semibold">
                  <span className="text-emerald-600 font-bold">{waLeadsCount} WhatsApp</span> · {walkInCount} Walk-Ins
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Open Slots Capacity</span>
                <p className="text-2xl font-black text-emerald-600">{availableSlots.length}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Out of {slots.length} total day slots</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">WhatsApp Inquiries</span>
                <p className="text-2xl font-black text-cyan-600">{waLeadsCount}</p>
                <p className="text-[11px] text-slate-500 font-semibold">Direct leads & confirmations</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Clinic Shift Hours</span>
                <p className="text-xl font-extrabold text-slate-900">{selectedDoctor.startHour} - {selectedDoctor.endHour}</p>
                <p className="text-[11px] text-slate-500 font-semibold">{selectedDoctor.slotDurationMinutes} mins per slot</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Clock className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Quick Slot Matrix */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Live Appointment Slot Matrix</h3>
                      <p className="text-xs text-slate-500">Realtime availability for {selectedDate}</p>
                    </div>
                    <button
                      onClick={() => setActiveNav('slots')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Manage All Slots <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {slots.slice(0, 8).map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-2xl border text-center text-xs font-extrabold ${
                          slot.status === 'available'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : slot.status === 'booked'
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div>{slot.time}</div>
                        <div className="text-[10px] font-bold mt-1 uppercase">
                          {slot.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Doctor Profile Summary */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{selectedDoctor.name}</h3>
                      <p className="text-xs font-bold text-blue-600">{selectedDoctor.department}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedDoctor.location}</p>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <p>⏱ <strong>Shift Hours:</strong> {selectedDoctor.startHour} - {selectedDoctor.endHour}</p>
                    <p>⌛ <strong>Slot Interval:</strong> {selectedDoctor.slotDurationMinutes} mins</p>
                    <p>🎓 <strong>Qualification:</strong> {selectedDoctor.education}</p>
                  </div>

                  <button
                    onClick={() => setActiveNav('schedule')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" /> Edit Working Hours
                  </button>
                </div>

              </div>

              {/* Full Patient Queue Widget */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Today's Patient Queue ({filteredAppointments.length})</h3>
                    <p className="text-xs text-slate-500">Live synchronization with patient appointments</p>
                  </div>
                  <button
                    onClick={() => setActiveNav('crm')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open CRM Manager →
                  </button>
                </div>

                {filteredAppointments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-6 bg-slate-50 rounded-2xl text-center">
                    No scheduled appointments found for {selectedDate}.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Patient Name</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Channel</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">EHR Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-black text-slate-900">{apt.time}</td>
                            <td className="py-3 px-3 font-bold text-slate-800">{apt.patient.name}</td>
                            <td className="py-3 px-3 text-slate-600">{apt.patient.phone}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                apt.patient.bookingChannel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {apt.patient.bookingChannel || 'Website'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => onOpenClinicalNotes(apt)}
                                  className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                                >
                                  EHR Notes
                                </button>
                                {onDeleteAppointment && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete appointment for ${apt.patient.name}?`)) {
                                        onDeleteAppointment(apt.id);
                                      }
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete Appointment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SECTION 2: CRM & WHATSAPP LEADS TAB */}
          {activeNav === 'crm' && (
            <CrmManagementView
              slots={slots}
              appointments={appointments}
              selectedDate={selectedDate}
              selectedDoctor={selectedDoctor}
              onSendConfirmationEmail={onSendConfirmationEmail}
              onAddWhatsAppLead={onAddWhatsAppLead}
              onOpenClinicalNotes={onOpenClinicalNotes}
              onDeleteAppointment={onDeleteAppointment}
            />
          )}

          {/* SECTION 3 & 4 & 5: DOCTOR CMS PORTAL FOR SLOTS, QUEUE & SCHEDULE */}
          {(activeNav === 'slots' || activeNav === 'queue' || activeNav === 'schedule') && (
            <DoctorCMSPortal
              doctors={doctors}
              selectedDoctor={selectedDoctor}
              onSelectDoctor={onSelectDoctor}
              slots={slots}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              appointments={appointments}
              activeUser={activeUser}
              onManageSlot={onManageSlot}
              onBulkBlockSlots={onBulkBlockSlots}
              onBookWalkIn={onBookWalkIn}
              onUpdateDoctorSchedule={onUpdateDoctorSchedule}
              onOpenClinicalNotes={onOpenClinicalNotes}
              onSendConfirmationEmail={onSendConfirmationEmail}
              onAddWhatsAppLead={onAddWhatsAppLead}
              onDeleteAppointment={onDeleteAppointment}
            />
          )}

          {/* SECTION 6: ROLE & USER ACCESS TAB */}
          {activeNav === 'roles' && isAdmin && (
            <RoleManagementCMS
              cmsUsers={cmsUsers}
              activeUser={activeUser}
              onUpdateRole={onUpdateRole}
              onDeleteUser={onDeleteUser}
            />
          )}

        </main>

      </div>

      {/* QUICK WALK-IN PATIENT MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Book Direct Walk-In Patient</h3>
              </div>
              <button onClick={() => setShowWalkInModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Open Slot ({selectedDate})</label>
                <select
                  value={walkInSlotId}
                  onChange={(e) => setWalkInSlotId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose Slot --</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.time} - {s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Symptoms / Chief Complaint</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Acute lower back pain after lifting..."
                  value={walkInSymptoms}
                  onChange={(e) => setWalkInSymptoms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md"
                >
                  Confirm Walk-In Booking
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
