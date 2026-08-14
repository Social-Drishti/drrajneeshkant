import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Settings, 
  AlertCircle, 
  Video, 
  UserPlus, 
  FileText, 
  RefreshCw,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Mail,
  Users,
  Trash2
} from 'lucide-react';
import { 
  Doctor, 
  AppointmentSlot, 
  Appointment, 
  CMSUser, 
  SlotStatus, 
  AppointmentType,
  PatientInfo
} from '../types';
import { CrmManagementView } from './CrmManagementView';

interface DoctorCMSPortalProps {
  doctors: Doctor[];
  selectedDoctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
  slots: AppointmentSlot[];
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  appointments: Appointment[];
  activeUser: CMSUser;
  onManageSlot: (slotId: string, status: SlotStatus, type?: AppointmentType, blockReason?: string) => void;
  onBulkBlockSlots: (reason: string) => void;
  onBookWalkIn: (slotId: string, patient: PatientInfo, appointmentType: AppointmentType) => void;
  onUpdateDoctorSchedule: (doctorUpdates: Partial<Doctor>) => void;
  onOpenClinicalNotes: (appointment: Appointment) => void;
  onSendConfirmationEmail: (appointmentId?: string, slotId?: string, email?: string) => Promise<any>;
  onAddWhatsAppLead: (leadData: { slotId: string; patientName: string; phone: string; symptoms: string }) => Promise<void>;
  onDeleteAppointment?: (appointmentId: string) => void;
}

export const DoctorCMSPortal: React.FC<DoctorCMSPortalProps> = ({
  doctors,
  selectedDoctor,
  onSelectDoctor,
  slots,
  selectedDate,
  onDateChange,
  appointments,
  activeUser,
  onManageSlot,
  onBulkBlockSlots,
  onBookWalkIn,
  onUpdateDoctorSchedule,
  onOpenClinicalNotes,
  onSendConfirmationEmail,
  onAddWhatsAppLead,
  onDeleteAppointment
}) => {
  const [activeTab, setActiveTab] = useState<'crm' | 'slots' | 'appointments' | 'schedule'>('crm');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [targetSlotForWalkIn, setTargetSlotForWalkIn] = useState<AppointmentSlot | null>(null);
  
  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInSymptoms, setWalkInSymptoms] = useState('');
  const [walkInType, setWalkInType] = useState<AppointmentType>('in_person');

  // Schedule modal state
  const [startHour, setStartHour] = useState(selectedDoctor.startHour);
  const [endHour, setEndHour] = useState(selectedDoctor.endHour);
  const [slotDuration, setSlotDuration] = useState(selectedDoctor.slotDurationMinutes);
  const [emergencyReason, setEmergencyReason] = useState('Emergency Surgery / Ward Duty');

  const canManageSlots = activeUser.permissions.manageSlots || activeUser.role === 'admin' || activeUser.role === 'doctor';
  const canEditSchedule = activeUser.permissions.editSchedule || activeUser.role === 'admin' || activeUser.role === 'doctor';

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlotForWalkIn || !walkInName) return;

    onBookWalkIn(targetSlotForWalkIn.id, {
      name: walkInName,
      email: `${walkInName.toLowerCase().replace(/\s+/g, '.')}@walkin.patient`,
      phone: walkInPhone || '+91 98000 00000',
      symptoms: walkInSymptoms || 'Direct Walk-In Consultation',
      urgencyLevel: 'moderate'
    }, walkInType);

    setShowWalkInModal(false);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInSymptoms('');
  };

  const handleScheduleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDoctorSchedule({
      startHour,
      endHour,
      slotDurationMinutes: Number(slotDuration)
    });
    setActiveTab('slots');
  };

  // Stats
  const availableSlotsCount = slots.filter((s) => s.status === 'available').length;
  const bookedSlotsCount = slots.filter((s) => s.status === 'booked').length;
  const blockedSlotsCount = slots.filter((s) => s.status === 'blocked').length;

  return (
    <div className="space-y-6">
      
      {/* Doctor Header & Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Active Doctor Details */}
          <div className="flex items-center gap-4">
            <img
              src={selectedDoctor.avatar}
              alt={selectedDoctor.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500/10 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{selectedDoctor.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {selectedDoctor.department}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedDoctor.title} • {selectedDoctor.location}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-600">
                <span>⏱ Shift: {selectedDoctor.startHour} - {selectedDoctor.endHour}</span>
                <span>⌛ Interval: {selectedDoctor.slotDurationMinutes} mins</span>
              </div>
            </div>
          </div>

          {/* Doctor Switcher or Single Doctor Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {doctors.length > 1 ? (
              <>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Switch Doctor View</span>
                  <span className="text-xs font-medium text-slate-600">CMS Control Panel</span>
                </div>
                <select
                  value={selectedDoctor.id}
                  onChange={(e) => {
                    const doc = doctors.find((d) => d.id === e.target.value);
                    if (doc) onSelectDoctor(doc);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.department})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="bg-blue-50/80 px-3.5 py-2 rounded-2xl border border-blue-200/80 text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 block">Lead Practice Physician</span>
                <span className="text-xs font-black text-slate-900">{selectedDoctor.name}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Date & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* CMS Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'crm'
                ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 font-bold'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" /> CRM & WhatsApp ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'slots'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Live Slots Grid ({slots.length})
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'appointments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Patient Queue ({appointments.length})
          </button>
          {canEditSchedule && (
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                activeTab === 'schedule'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Working Hours
            </button>
          )}
        </div>

      </div>

      {/* CRM MANAGEMENT VIEW TAB */}
      {activeTab === 'crm' && (
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

      {/* Bento Grid Layout Container for Slots Tab */}
      {activeTab === 'slots' && (
      <div className="grid grid-cols-12 gap-4">
        
        {/* Main Calendar / Appointments Bento Card */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              Today's Appointments
              <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">
                {appointments.length} Scheduled
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('slots')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  activeTab === 'slots'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Day Matrix
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  activeTab === 'appointments'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Patient Queue
              </button>
            </div>
          </div>

          {/* List of Today's Scheduled Appointments */}
          <div className="space-y-3 overflow-hidden flex-grow">
            {appointments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-medium">
                No active appointments booked for {selectedDate}. Use Patient View or Walk-In to add bookings.
              </div>
            ) : (
              appointments.slice(0, 4).map((apt, idx) => {
                const statusBadgeClass =
                  apt.status === 'in_progress' || idx === 0
                    ? 'bg-blue-600 text-white'
                    : apt.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : apt.status === 'completed'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-700';

                const statusText =
                  idx === 0 && apt.status === 'confirmed' ? 'IN-PROGRESS' : apt.status.toUpperCase();

                return (
                  <div
                    key={apt.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      idx === 0
                        ? 'bg-blue-50/50 border-blue-100'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-sm font-bold text-blue-600 w-16 flex-shrink-0">{apt.time}</span>
                    <div className="h-8 w-[2px] bg-blue-200 flex-shrink-0"></div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{apt.patient.name}</p>
                      <p className="text-xs text-slate-500 truncate">{apt.patient.symptoms || 'General Check-Up'}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenClinicalNotes(apt)}
                        className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 transition-colors"
                      >
                        📋 EHR
                      </button>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                      {onDeleteAppointment && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete appointment for ${apt.patient.name}?`)) {
                              onDeleteAppointment(apt.id);
                            }
                          }}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Default Break Row */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-sm font-bold text-slate-400 w-16">12:00 PM</span>
              <div className="h-8 w-[2px] bg-slate-200"></div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-slate-500">No Scheduled Patient</p>
                <p className="text-xs text-slate-400">Clinic Midday Pause</p>
              </div>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-3 py-1 rounded-full font-bold uppercase">
                LUNCH BREAK
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Slot Availability Bento Card */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Quick Availability</h2>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Next Available</p>
              <p className="text-lg font-black text-blue-600">
                {slots.find((s) => s.status === 'available')?.time || '01:45 PM'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Est. Wait Time</p>
              <p className="text-lg font-black text-slate-700">12m</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-slate-500">Manage PM Slots</p>
              {canManageSlots && (
                <button
                  onClick={() => onBulkBlockSlots('Doctor Surgery Duty')}
                  className="text-[10px] font-bold text-rose-600 hover:underline"
                >
                  Bulk Block Open Slots
                </button>
              )}
            </div>

            {slots.slice(0, 4).map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold ${
                  slot.status === 'available'
                    ? 'bg-emerald-50 border-emerald-100 text-slate-800'
                    : slot.status === 'blocked'
                    ? 'bg-rose-50 border-rose-100 text-slate-800'
                    : 'bg-blue-50 border-blue-100 text-slate-800'
                }`}
              >
                <span>{slot.time} - {slot.endTime}</span>
                {canManageSlots && (
                  <button
                    onClick={() =>
                      onManageSlot(
                        slot.id,
                        slot.status === 'available' ? 'blocked' : 'available',
                        'in_person',
                        'Schedule Adjustment'
                      )
                    }
                    className={`text-[10px] px-2.5 py-1 rounded shadow-xs font-bold uppercase transition-colors ${
                      slot.status === 'available'
                        ? 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        : slot.status === 'blocked'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {slot.status === 'available' ? 'ACTIVE' : slot.status === 'blocked' ? 'BLOCKED' : 'BOOKED'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Role Configurator Bento Card */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-4">Role Configurator</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-white">Doctor Admin</p>
                  <p className="text-[10px] text-slate-400">Full clinical & CMS schedule access</p>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-white">Staff Registry</p>
                  <p className="text-[10px] text-slate-400">Schedule management only</p>
                </div>
                <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-slate-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('schedule')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              ADD NEW TEAM ROLE
            </button>
          </div>
        </div>

        {/* Quick Stats: Weekly Utilization */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-blue-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-sm">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Weekly Utilization</p>
          <div className="mt-4">
            <h3 className="text-4xl font-black">94.2%</h3>
            <p className="text-xs opacity-90 mt-1 font-medium">+5.4% from last month</p>
          </div>
        </div>

        {/* Quick Stats: Patient Retention */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Retention</p>
          <div className="flex items-end justify-between mt-4">
            <h3 className="text-4xl font-black text-slate-900">88%</h3>
            <div className="flex gap-1.5 h-12 items-end">
              <div className="w-2.5 bg-slate-100 rounded-t h-4"></div>
              <div className="w-2.5 bg-slate-100 rounded-t h-7"></div>
              <div className="w-2.5 bg-blue-500 rounded-t h-12"></div>
              <div className="w-2.5 bg-blue-600 rounded-t h-10"></div>
            </div>
          </div>
        </div>

      </div>
      )}

      {/* APPOINTMENTS QUEUE TAB */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Patient Consultation Queue ({appointments.length})
          </h3>

          {appointments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-sm font-semibold text-slate-600">No bookings scheduled for {selectedDate}.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <div key={apt.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {apt.time}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{apt.patient.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                          {apt.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                          apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Phone:</strong> {apt.patient.phone} • <strong>Symptoms:</strong> {apt.patient.symptoms || 'None specified'}
                      </p>
                      {apt.clinicalNotes && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 text-xs text-slate-700 italic border border-slate-200">
                          <strong>Clinical Notes:</strong> {apt.clinicalNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenClinicalNotes(apt)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> EHR Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE CONFIG TAB */}
      {activeTab === 'schedule' && canEditSchedule && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 max-w-2xl space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" /> Configure Shift & Slot Parameters
          </h3>
          <p className="text-xs text-slate-500">Updating working hours will recalculate available slots for future dates in real-time.</p>

          <form onSubmit={handleScheduleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift Start Time</label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift End Time</label>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slot Duration Interval</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Save Schedule & Update Live Slots
            </button>
          </form>
        </div>
      )}

      {/* Walk-In Booking Modal */}
      {showWalkInModal && targetSlotForWalkIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Book Walk-In Patient
              </h3>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-900 font-semibold">
              Slot Time: {targetSlotForWalkIn.time} - {targetSlotForWalkIn.endTime} ({selectedDate})
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. David Miller"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chief Symptoms / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chest tightness, blood pressure spike"
                  value={walkInSymptoms}
                  onChange={(e) => setWalkInSymptoms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Mode</label>
                <select
                  value={walkInType}
                  onChange={(e) => setWalkInType(e.target.value as AppointmentType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                >
                  <option value="in_person">In-Person Consultation</option>
                  <option value="telehealth">Telehealth Video</option>
                  <option value="emergency">Emergency Priority</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
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
