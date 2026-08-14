import React from 'react';
import { Zap, AlertTriangle, CheckCircle2, ShieldAlert, Calendar, RefreshCw } from 'lucide-react';
import { RealtimeEventPayload } from '../types';

interface RealtimeStatusBannerProps {
  latestEvent: RealtimeEventPayload | null;
  onClear: () => void;
}

export const RealtimeStatusBanner: React.FC<RealtimeStatusBannerProps> = ({ latestEvent, onClear }) => {
  if (!latestEvent || latestEvent.type === 'init_state') return null;

  const getEventMeta = () => {
    switch (latestEvent.type) {
      case 'slot_updated':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: <RefreshCw className="w-4 h-4 text-blue-600 animate-spin-slow" />,
          title: 'Live Slot Availability Sync',
          message: `Slot on ${latestEvent.payload.date} updated to status "${latestEvent.payload.slot.status.toUpperCase()}"`
        };
      case 'emergency_block_added':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
          title: 'Emergency Override Active',
          message: `Doctor activated emergency slot block for ${latestEvent.payload.date}: "${latestEvent.payload.reason || 'Medical emergency'}"`
        };
      case 'appointment_booked':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          title: 'Appointment Booked Real-Time',
          message: `New booking for ${latestEvent.payload.appointment.patient.name} at ${latestEvent.payload.appointment.time} on ${latestEvent.payload.date}`
        };
      case 'appointment_status_changed':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-900',
          icon: <Calendar className="w-4 h-4 text-purple-600" />,
          title: 'Appointment Status Updated',
          message: `Appointment for ${latestEvent.payload.appointment.patient.name} updated to "${latestEvent.payload.appointment.status.toUpperCase()}"`
        };
      case 'role_updated':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <Zap className="w-4 h-4 text-amber-600" />,
          title: 'CMS Permissions Updated',
          message: `CMS user permissions modified for ${latestEvent.payload.user.name}`
        };
      case 'schedule_updated':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          icon: <Zap className="w-4 h-4 text-indigo-600" />,
          title: 'Doctor Schedule Configured',
          message: `Updated working hours & slot duration for ${latestEvent.payload.doctor.name}`
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-900',
          icon: <Zap className="w-4 h-4 text-slate-600" />,
          title: 'Real-Time Event',
          message: 'System state updated'
        };
    }
  };

  const meta = getEventMeta();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div className={`p-3.5 rounded-xl border ${meta.bg} flex items-center justify-between shadow-xs transition-all animate-fadeIn`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/80 shadow-xs">
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">{meta.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 font-semibold">
                {new Date(latestEvent.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs font-medium opacity-90 mt-0.5">{meta.message}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs font-semibold hover:underline opacity-70 hover:opacity-100 px-2 py-1"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
