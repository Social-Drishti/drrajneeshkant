import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  RealtimeStatusBanner 
} from './components/RealtimeStatusBanner';
import { 
  DoctorCMSPortal 
} from './components/DoctorCMSPortal';
import { 
  RoleManagementCMS 
} from './components/RoleManagementCMS';
import { 
  DashboardLayout 
} from './components/DashboardLayout';
import { 
  AISymptomModal 
} from './components/AISymptomModal';
import { 
  ClinicalNotesModal 
} from './components/ClinicalNotesModal';
import { 
  NotificationsLogModal 
} from './components/NotificationsLogModal';
import {
  LoginModal
} from './components/LoginModal';

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
} from './types';
import { INITIAL_DOCTORS, INITIAL_CMS_USERS, getTodayDateString } from './data/initialData';

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('doctor');
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(INITIAL_DOCTORS[0]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cmsUsers, setCmsUsers] = useState<CMSUser[]>(INITIAL_CMS_USERS);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<CMSUser | null>(() => {
    try {
      const saved = localStorage.getItem('chiro_active_user');
      return saved ? JSON.parse(saved) : INITIAL_CMS_USERS[0];
    } catch {
      return INITIAL_CMS_USERS[0];
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Real-time State
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState<RealtimeEventPayload | null>(null);
  const [eventLog, setEventLog] = useState<RealtimeEventPayload[]>([]);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeClinicalNotesApt, setActiveClinicalNotesApt] = useState<Appointment | null>(null);

  // Active user derived from login or role
  const activeUser = currentUser || cmsUsers.find((u) => u.role === activeRole) || cmsUsers[0];

  const handleLoginSuccess = (user: CMSUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveRole(user.role);
    try {
      localStorage.setItem('chiro_active_user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem('chiro_active_user');
    } catch (e) {
      console.error('Failed to remove user session', e);
    }
    setIsLoginModalOpen(true);
  };

  // Fetch Slots
  const fetchSlots = useCallback(async (docId: string, dateStr: string) => {
    try {
      const res = await fetch(`/api/doctors/${docId}/slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (e) {
      console.error('Error fetching slots:', e);
    }
  }, []);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error('Error fetching appointments:', e);
    }
  }, []);

  // Fetch Doctors & Roles
  const fetchInitialData = useCallback(async () => {
    try {
      const [docRes, roleRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/roles')
      ]);

      if (docRes.ok) {
        const data = await docRes.json();
        if (data.doctors && data.doctors.length > 0) {
          setDoctors(data.doctors);
        }
      }

      if (roleRes.ok) {
        const data = await roleRes.json();
        if (data.users && data.users.length > 0) {
          setCmsUsers(data.users);
        }
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchInitialData();
    fetchAppointments();
  }, [fetchInitialData, fetchAppointments]);

  // Load slots whenever doctor or date changes
  useEffect(() => {
    fetchSlots(selectedDoctor.id, selectedDate);
  }, [selectedDoctor.id, selectedDate, fetchSlots]);

  // Real-time SSE Setup
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payloadData: RealtimeEventPayload = JSON.parse(event.data);
          
          if (payloadData.type !== 'init_state') {
            setLatestEvent(payloadData);
            setEventLog((prev) => [payloadData, ...prev]);
          }

          // Real-time state reaction logic
          if (payloadData.type === 'slot_updated' || payloadData.type === 'emergency_block_added') {
            if (
              payloadData.payload.doctorId === selectedDoctor.id &&
              payloadData.payload.date === selectedDate
            ) {
              fetchSlots(selectedDoctor.id, selectedDate);
            }
          } else if (payloadData.type === 'appointment_booked' || payloadData.type === 'appointment_status_changed') {
            fetchAppointments();
            fetchSlots(selectedDoctor.id, selectedDate);
          } else if (payloadData.type === 'role_updated') {
            fetchInitialData();
          } else if (payloadData.type === 'schedule_updated') {
            fetchInitialData();
            fetchSlots(selectedDoctor.id, selectedDate);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch (e) {
      console.error('SSE connection error:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [selectedDoctor.id, selectedDate, fetchSlots, fetchAppointments, fetchInitialData]);

  // API Handlers
  const handleManageSlot = async (
    slotId: string, 
    status: SlotStatus, 
    type?: AppointmentType, 
    blockReason?: string
  ) => {
    try {
      const res = await fetch('/api/slots/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          slotId,
          status,
          type,
          blockReason,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchSlots(selectedDoctor.id, selectedDate);
      }
    } catch (e) {
      console.error('Error managing slot:', e);
    }
  };

  const handleBulkBlockSlots = async (reason: string) => {
    try {
      const res = await fetch('/api/slots/bulk-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          reason,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchSlots(selectedDoctor.id, selectedDate);
      }
    } catch (e) {
      console.error('Error bulk blocking slots:', e);
    }
  };

  const handleBookAppointment = async (
    doctorId: string,
    date: string,
    slotId: string,
    patient: PatientInfo,
    type: AppointmentType
  ) => {
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          date,
          slotId,
          patient,
          appointmentType: type,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchSlots(doctorId, date);
        fetchAppointments();
      }
    } catch (e) {
      console.error('Error booking appointment:', e);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status: 'cancelled',
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchAppointments();
        fetchSlots(selectedDoctor.id, selectedDate);
      }
    } catch (e) {
      console.error('Error cancelling appointment:', e);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const res = await fetch('/api/appointments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchAppointments();
        fetchSlots(selectedDoctor.id, selectedDate);
      }
    } catch (e) {
      console.error('Error deleting appointment:', e);
    }
  };

  const handleSaveClinicalNotes = async (
    appointmentId: string, 
    clinicalNotes: string, 
    prescriptions: string[]
  ) => {
    try {
      const res = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status: 'completed',
          clinicalNotes,
          prescriptions,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error('Error saving clinical notes:', e);
    }
  };

  const handleUpdateRole = async (
    userId: string, 
    role: UserRole, 
    permissions: CMSUser['permissions']
  ) => {
    try {
      const res = await fetch('/api/roles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role,
          permissions,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchInitialData();
      }
    } catch (e) {
      console.error('Error updating user role:', e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch('/api/roles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchInitialData();
      }
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleUpdateDoctorSchedule = async (updates: Partial<Doctor>) => {
    try {
      const res = await fetch(`/api/doctors/${selectedDoctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchInitialData();
        fetchSlots(selectedDoctor.id, selectedDate);
      }
    } catch (e) {
      console.error('Error updating doctor schedule:', e);
    }
  };

  const handleGenerateAiSummary = async (appointment: Appointment) => {
    try {
      const res = await fetch('/api/ai/doctor-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: appointment.patient.name,
          symptoms: appointment.patient.symptoms || 'Routine follow-up',
          age: appointment.patient.age,
          appointmentType: appointment.type,
          department: appointment.doctorDepartment
        })
      });

      const data = await res.json();
      alert(`🤖 Gemini AI Doctor Summary:\n\n${data.summary}`);
    } catch (e) {
      console.error('Error generating AI summary:', e);
    }
  };

  const handleSendConfirmationEmail = async (appointmentId?: string, slotId?: string, email?: string) => {
    try {
      const res = await fetch('/api/crm/send-confirmation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          slotId,
          doctorId: selectedDoctor.id,
          date: selectedDate,
          email,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        fetchAppointments();
        fetchSlots(selectedDoctor.id, selectedDate);
        return data;
      }
    } catch (e) {
      console.error('Error sending confirmation email:', e);
    }
  };

  const handleAddWhatsAppLead = async (leadData: { slotId: string; patientName: string; phone: string; symptoms: string }) => {
    try {
      const res = await fetch('/api/crm/whatsapp-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          slotId: leadData.slotId,
          patientName: leadData.patientName,
          phone: leadData.phone,
          whatsappNumber: leadData.phone,
          symptoms: leadData.symptoms,
          updatedBy: activeUser.name
        })
      });

      if (res.ok) {
        fetchAppointments();
        fetchSlots(selectedDoctor.id, selectedDate);
      }
    } catch (e) {
      console.error('Error logging WhatsApp lead:', e);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      
      {/* Primary Dashboard Layout */}
      <DashboardLayout
        doctors={doctors}
        selectedDoctor={selectedDoctor}
        onSelectDoctor={setSelectedDoctor}
        slots={slots}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        appointments={appointments.filter((a) => a.doctorId === selectedDoctor.id)}
        activeUser={activeUser}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        cmsUsers={cmsUsers}
        onUpdateRole={handleUpdateRole}
        onDeleteUser={handleDeleteUser}
        onManageSlot={handleManageSlot}
        onBulkBlockSlots={handleBulkBlockSlots}
        onBookWalkIn={(slotId, patient, type) => handleBookAppointment(selectedDoctor.id, selectedDate, slotId, patient, type)}
        onCancelAppointment={handleCancelAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        onUpdateDoctorSchedule={handleUpdateDoctorSchedule}
        onOpenClinicalNotes={(apt) => setActiveClinicalNotesApt(apt)}
        onSendConfirmationEmail={handleSendConfirmationEmail}
        onAddWhatsAppLead={handleAddWhatsAppLead}
        isRealtimeConnected={isRealtimeConnected}
        latestEvent={latestEvent}
        onClearLatestEvent={() => setLatestEvent(null)}
        eventLogLength={eventLog.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />

      {/* AI Symptom Triage Modal */}
      <AISymptomModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectDepartment={(dept) => {
          const matchedDoc = doctors.find((d) => d.department === dept);
          if (matchedDoc) setSelectedDoctor(matchedDoc);
        }}
      />

      {/* Clinical Notes Modal */}
      <ClinicalNotesModal
        isOpen={!!activeClinicalNotesApt}
        appointment={activeClinicalNotesApt}
        onClose={() => setActiveClinicalNotesApt(null)}
        onSaveNotes={handleSaveClinicalNotes}
      />

      {/* Notifications Audit Log Modal */}
      <NotificationsLogModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        events={eventLog}
        onClearAll={() => setEventLog([])}
      />

      {/* Staff Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        cmsUsers={cmsUsers}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />

    </div>
  );
}
