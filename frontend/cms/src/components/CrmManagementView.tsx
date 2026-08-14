import React, { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Search, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  Calendar, 
  Phone, 
  Tag, 
  Check, 
  AlertCircle,
  Zap,
  Globe,
  Trash2
} from 'lucide-react';
import { Doctor, AppointmentSlot, Appointment, PatientInfo } from '../types';

interface CrmManagementViewProps {
  slots: AppointmentSlot[];
  appointments: Appointment[];
  selectedDate: string;
  selectedDoctor: Doctor;
  onSendConfirmationEmail: (appointmentId?: string, slotId?: string, email?: string) => Promise<any>;
  onAddWhatsAppLead: (leadData: { slotId: string; patientName: string; phone: string; symptoms: string }) => Promise<void>;
  onOpenClinicalNotes: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
}

export const CrmManagementView: React.FC<CrmManagementViewProps> = ({
  slots,
  appointments,
  selectedDate,
  selectedDoctor,
  onSendConfirmationEmail,
  onAddWhatsAppLead,
  onOpenClinicalNotes,
  onDeleteAppointment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'website' | 'walk_in'>('all');
  const [selectedSlotForEmail, setSelectedSlotForEmail] = useState<AppointmentSlot | null>(null);
  
  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [targetAptForEmail, setTargetAptForEmail] = useState<Appointment | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);

  // WhatsApp Lead Modal State
  const [showWaLeadModal, setShowWaLeadModal] = useState(false);
  const [waLeadName, setWaLeadName] = useState('');
  const [waLeadPhone, setWaLeadPhone] = useState('');
  const [waLeadSlotId, setWaLeadSlotId] = useState('');
  const [waLeadSymptoms, setWaLeadSymptoms] = useState('');
  const [isSubmittingWaLead, setIsSubmittingWaLead] = useState(false);

  // WhatsApp specific patients
  const whatsappPatients = appointments.filter(
    (apt) => apt.bookingChannel === 'whatsapp' || apt.patient.bookingChannel === 'whatsapp' || (apt.patient.phone && apt.patient.phone.includes('wa'))
  );

  // Stats calculation
  const totalBooked = appointments.length;
  const whatsappCount = whatsappPatients.length;
  const websiteCount = appointments.filter((a) => a.bookingChannel === 'website' || a.patient.bookingChannel === 'website').length;
  const emailsSentCount = appointments.filter((a) => a.emailSent || a.patient.emailSent).length;

  const availableOpenSlots = slots.filter((s) => s.status === 'available');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = 
      apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.phone.includes(searchTerm);
    
    if (channelFilter === 'all') return matchesSearch;
    if (channelFilter === 'whatsapp') return matchesSearch && (apt.bookingChannel === 'whatsapp' || apt.patient.bookingChannel === 'whatsapp');
    if (channelFilter === 'website') return matchesSearch && (apt.bookingChannel === 'website' || apt.patient.bookingChannel === 'website');
    if (channelFilter === 'walk_in') return matchesSearch && (apt.bookingChannel === 'walk_in' || apt.patient.bookingChannel === 'walk_in');
    
    return matchesSearch;
  });

  const handleOpenEmailModal = (apt: Appointment) => {
    setTargetAptForEmail(apt);
    setCustomEmail(apt.patient.email);
    setEmailSentSuccess(null);
    setShowEmailModal(true);
  };

  const handleTriggerEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAptForEmail) return;

    setIsSendingEmail(true);
    try {
      const res = await onSendConfirmationEmail(targetAptForEmail.id, targetAptForEmail.slotId, customEmail);
      if (res && res.message) {
        setEmailSentSuccess(res.message);
      } else {
        setEmailSentSuccess(`Confirmation email sent successfully to ${customEmail}!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleWaLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waLeadName || !waLeadSlotId) return;

    setIsSubmittingWaLead(true);
    try {
      await onAddWhatsAppLead({
        slotId: waLeadSlotId,
        patientName: waLeadName,
        phone: waLeadPhone || '+91 98765 88888',
        symptoms: waLeadSymptoms || 'WhatsApp Lead Inquiry'
      });
      setShowWaLeadModal(false);
      setWaLeadName('');
      setWaLeadPhone('');
      setWaLeadSlotId('');
      setWaLeadSymptoms('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWaLead(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top CRM Pipeline KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total CRM Leads */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Booked Leads</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{totalBooked}</span>
            <span className="text-[10px] font-semibold text-emerald-600">Active Patient Queue</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

        {/* WhatsApp Patients KPI Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90 block">WhatsApp Leads</span>
            <span className="text-3xl font-black mt-1 block">{whatsappCount}</span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block mt-1">
              Direct Social Inquiries
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <MessageSquare className="w-6 h-6 fill-white" />
          </div>
        </div>

        {/* Website Patients */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Website Direct Bookings</span>
            <span className="text-3xl font-black text-blue-600 mt-1 block">{websiteCount}</span>
            <span className="text-[10px] font-semibold text-blue-500">Live Portal Sync</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Confirmation Email Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Emails Dispatched</span>
            <span className="text-3xl font-black text-purple-600 mt-1 block">{emailsSentCount} / {totalBooked}</span>
            <span className="text-[10px] font-semibold text-purple-600">Calendar Invites Sent</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECTION: PATIENTS CAME THROUGH WHATSAPP */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <MessageSquare className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">WhatsApp Patient Inquiries & Leads</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  CRM Channel
                </span>
              </div>
              <p className="text-xs text-emerald-100/70">
                Patients who booked or inquired via WhatsApp chat. View slot details, dispatch confirmation emails, or chat directly.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWaLeadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>Log WhatsApp Patient Lead</span>
          </button>
        </div>

        {/* WhatsApp Patients Grid Cards */}
        {whatsappPatients.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
            <p className="text-xs text-emerald-200">No WhatsApp patient leads logged yet today.</p>
            <p className="text-[11px] text-emerald-300/60 mt-1">Click "Log WhatsApp Patient Lead" above to record a patient who messaged on WhatsApp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whatsappPatients.map((apt) => {
              const waCleanNumber = (apt.patient.whatsappNumber || apt.patient.phone || '').replace(/[^0-9]/g, '');
              const waMessageText = encodeURIComponent(
                `Hello ${apt.patient.name}, your appointment with ${apt.doctorName} is confirmed for ${apt.date} at ${apt.time}. Please let us know if you need any assistance!`
              );
              const waLink = `https://wa.me/${waCleanNumber}?text=${waMessageText}`;

              const isEmailSent = apt.emailSent || apt.patient.emailSent;

              return (
                <div
                  key={apt.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-3 flex flex-col justify-between hover:border-emerald-400/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {apt.time} ({apt.date})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 uppercase">
                        {apt.patient.crmStage || 'WhatsApp Lead'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-base">{apt.patient.name}</h3>
                      <p className="text-xs text-emerald-100/80 font-medium">{apt.patient.phone}</p>
                    </div>

                    <div className="bg-black/20 p-2.5 rounded-xl text-xs text-emerald-100/90 leading-relaxed border border-white/5">
                      <strong>Symptoms:</strong> {apt.patient.symptoms || 'WhatsApp inquiry'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-1">
                      <span>Email: {apt.patient.email}</span>
                      {isEmailSent ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Email Sent
                        </span>
                      ) : (
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Mail Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp & Email Action Buttons */}
                  <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-1.5">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] text-center flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <MessageSquare className="w-3 h-3 fill-slate-950" /> Chat
                    </a>

                    <button
                      onClick={() => handleOpenEmailModal(apt)}
                      className={`py-2 px-2 rounded-xl font-extrabold text-[11px] text-center flex items-center justify-center gap-1 transition-all ${
                        isEmailSent
                          ? 'bg-white/15 hover:bg-white/25 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                      }`}
                    >
                      <Mail className="w-3 h-3" /> Mail
                    </button>

                    {onDeleteAppointment && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete appointment/lead for ${apt.patient.name}?`)) {
                            onDeleteAppointment(apt.id);
                          }
                        }}
                        className="py-2 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 font-extrabold text-[11px] text-center flex items-center justify-center gap-1 transition-all border border-rose-500/30"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3 h-3 text-rose-300" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: FULL CRM PATIENT QUEUE & EMAIL CONFIRMATION DISPATCH */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" /> CRM Patient Database & Slot Confirmations
            </h2>
            <p className="text-xs text-slate-500">
              Inspect booked slots, dispatch formal calendar confirmation emails, and manage channel tags.
            </p>
          </div>

          {/* Channel Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by patient name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${channelFilter === 'all' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setChannelFilter('whatsapp')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${channelFilter === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setChannelFilter('website')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${channelFilter === 'website' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                Website
              </button>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-medium">No patient records match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Booked Slot</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Confirmation Mail</th>
                  <th className="py-3 px-4 text-right">CRM Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredAppointments.map((apt) => {
                  const isWhatsApp = apt.bookingChannel === 'whatsapp' || apt.patient.bookingChannel === 'whatsapp';
                  const isEmailSent = apt.emailSent || apt.patient.emailSent;

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{apt.patient.name}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{apt.patient.symptoms || 'General Check-Up'}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600 whitespace-nowrap">
                        {apt.time} ({apt.date})
                      </td>
                      <td className="py-3 px-4">
                        {isWhatsApp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <MessageSquare className="w-3 h-3 fill-emerald-600 text-emerald-600" /> WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                            <Globe className="w-3 h-3 text-blue-600" /> Website
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>{apt.patient.email}</div>
                        <div className="text-[10px] text-slate-500">{apt.patient.phone}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isEmailSent ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-extrabold">
                            <CheckCircle2 className="w-4 h-4" /> Sent ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEmailModal(apt)}
                            className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" /> Send Mail
                          </button>
                          <button
                            onClick={() => onOpenClinicalNotes(apt)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                          >
                            EHR
                          </button>
                          {onDeleteAppointment && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete appointment for ${apt.patient.name}?`)) {
                                  onDeleteAppointment(apt.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Appointment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* CONFIRMATION EMAIL PREVIEW & DISPATCH MODAL */}
      {showEmailModal && targetAptForEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Send Appointment Confirm Email</h3>
                  <p className="text-[11px] text-slate-500">Official calendar dispatch to patient</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {emailSentSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-black text-emerald-950 text-base">Email Sent Successfully!</h4>
                <p className="text-xs text-emerald-800">{emailSentSuccess}</p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                  >
                    Close Modal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTriggerEmailSend} className="space-y-4">
                
                {/* Email Recipient Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Patient Email</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Simulated Email Preview Box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-700 border-b border-slate-200 pb-2">
                    <span>Subject: Appointment Confirmed - {targetAptForEmail.doctorName}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      .ICS Attached
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed pt-1">
                    Dear <strong>{targetAptForEmail.patient.name}</strong>,<br /><br />
                    Your medical appointment with <strong>{targetAptForEmail.doctorName}</strong> ({targetAptForEmail.doctorDepartment}) is confirmed for <strong>{targetAptForEmail.date}</strong> at <strong>{targetAptForEmail.time}</strong>.<br /><br />
                    Location: {selectedDoctor.location}<br />
                    Consultation Type: {targetAptForEmail.type.toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingEmail ? 'Dispatching...' : 'Dispatch Confirm Email Now'}</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* LOG WHATSAPP LEAD MODAL */}
      {showWaLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <MessageSquare className="w-4 h-4 fill-white" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Log Patient Came via WhatsApp</h3>
              </div>
              <button
                onClick={() => setShowWaLeadModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWaLeadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Gupta"
                  value={waLeadName}
                  onChange={(e) => setWaLeadName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 99999"
                  value={waLeadPhone}
                  onChange={(e) => setWaLeadPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Available Slot ({selectedDate})</label>
                <select
                  value={waLeadSlotId}
                  onChange={(e) => setWaLeadSlotId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Select Open Slot --</option>
                  {availableOpenSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.time} - {s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Inquiry / Symptoms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient sent a audio/text query on WhatsApp regarding heart palpitations..."
                  value={waLeadSymptoms}
                  onChange={(e) => setWaLeadSymptoms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWaLeadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWaLead}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md"
                >
                  {isSubmittingWaLead ? 'Saving Lead...' : 'Save WhatsApp Lead & Slot'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
