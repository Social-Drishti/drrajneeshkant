import { Doctor, CMSUser, Appointment, AppointmentSlot } from '../types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Rajneesh Kant, D.C.',
    title: 'Lead Chiropractor & Spine Specialist',
    department: 'Chiropractic Medicine & Spine Care',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajneesh',
    rating: 4.9,
    reviewCount: 485,
    consultationFee: 1200,
    location: 'Chiroconnect – Mumbai (Bandra West) & Patna (Boring Road)',
    bio: 'Doctor of Chiropractic with over 12 years of clinical excellence in non-surgical spinal adjustments, posture correction, sciatica relief, and sports rehabilitation.',
    specialties: ['Spine & Disc Alignment', 'Posture Correction', 'Sciatica & Lower Back Pain', 'Neck Pain & Headaches', 'Sports Rehab'],
    education: 'Doctorate in Chiropractic Medicine (D.C. USA Board Certified)',
    workingDays: [1, 2, 3, 4, 5, 6],
    startHour: '09:00',
    endHour: '18:00',
    slotDurationMinutes: 30,
    breakStart: '13:00',
    breakEnd: '14:00'
  }
];

export const INITIAL_CMS_USERS: CMSUser[] = [
  {
    id: 'cms-1',
    name: 'Dr. Rajneesh Kant',
    email: 'dr.rajneesh@chiroconnect.in',
    role: 'doctor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajneesh',
    department: 'Chiropractic Medicine & Clinic Direction',
    doctorId: 'doc-1',
    permissions: {
      manageSlots: true,
      editSchedule: true,
      manageRoles: true,
      viewMedicalRecords: true,
      cancelAppointments: true,
      emergencyOverride: true,
    },
    lastActive: 'Just now',
    status: 'active'
  },
  {
    id: 'cms-2',
    name: 'Pooja Sharma (Reception Desk)',
    email: 'reception@chiroconnect.in',
    role: 'receptionist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
    department: 'Chiroconnect Admissions & Front Desk',
    permissions: {
      manageSlots: true,
      editSchedule: false,
      manageRoles: false,
      viewMedicalRecords: false,
      cancelAppointments: true,
      emergencyOverride: false,
    },
    lastActive: '2 mins ago',
    status: 'active'
  },
  {
    id: 'cms-3',
    name: 'Sanjay Mehta (Admin)',
    email: 'admin@chiroconnect.in',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay',
    department: 'Chiroconnect Clinic Management',
    permissions: {
      manageSlots: true,
      editSchedule: true,
      manageRoles: true,
      viewMedicalRecords: true,
      cancelAppointments: true,
      emergencyOverride: true,
    },
    lastActive: 'Just now',
    status: 'active'
  }
];

// Helper to generate default slots for a given date YYYY-MM-DD
export function generateDefaultSlots(doctorId: string, dateStr: string): AppointmentSlot[] {
  const doctor = INITIAL_DOCTORS.find(d => d.id === doctorId) || INITIAL_DOCTORS[0];
  const slots: AppointmentSlot[] = [];

  const [startH, startM] = doctor.startHour.split(':').map(Number);
  const [endH, endM] = doctor.endHour.split(':').map(Number);
  const duration = doctor.slotDurationMinutes;

  let currentMin = startH * 60 + startM;
  const endTotalMin = endH * 60 + endM;

  const [breakStartH, breakStartM] = doctor.breakStart ? doctor.breakStart.split(':').map(Number) : [12, 0];
  const [breakEndH, breakEndM] = doctor.breakEnd ? doctor.breakEnd.split(':').map(Number) : [13, 0];
  const breakStartMin = breakStartH * 60 + breakStartM;
  const breakEndMin = breakEndH * 60 + breakEndM;

  let slotIndex = 1;

  while (currentMin + duration <= endTotalMin) {
    if (currentMin >= breakStartMin && currentMin < breakEndMin) {
      currentMin += duration;
      continue;
    }

    const startHStr = Math.floor(currentMin / 60).toString().padStart(2, '0');
    const startMStr = (currentMin % 60).toString().padStart(2, '0');
    
    const endTotal = currentMin + duration;
    const endHStr = Math.floor(endTotal / 60).toString().padStart(2, '0');
    const endMStr = (endTotal % 60).toString().padStart(2, '0');

    const timeString = `${startHStr}:${startMStr}`;
    const endTimeString = `${endHStr}:${endMStr}`;

    // Make a few slots booked or blocked for realistic demo state
    let status: AppointmentSlot['status'] = 'available';
    let type: AppointmentSlot['type'] = 'in_person';
    let bookedBy: AppointmentSlot['bookedBy'] = undefined;
    let appointmentId: string | undefined = undefined;

    if (slotIndex === 1) {
      status = 'booked';
      type = 'in_person';
      appointmentId = `apt-${doctorId}-${dateStr}-1`;
      bookedBy = {
        id: 'pat-101',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@gmail.com',
        phone: '+91 98201 23456',
        age: 52,
        symptoms: 'Routine Cardiovascular Check-up',
        urgencyLevel: 'low',
        bookingChannel: 'website',
        emailSent: true,
        emailSentAt: Date.now() - 3600000,
        crmStage: 'confirmed',
        crmNotes: 'Online website patient. Confirmation email dispatched automatically.'
      };
    } else if (slotIndex === 3) {
      status = 'booked';
      type = 'telehealth';
      appointmentId = `apt-${doctorId}-${dateStr}-3`;
      bookedBy = {
        id: 'pat-102',
        name: 'Vikram Malhotra',
        email: 'vikram.malhotra@gmail.com',
        phone: '+91 98765 43210',
        whatsappNumber: '+919876543210',
        age: 38,
        symptoms: 'Inquired via WhatsApp for Telehealth Consultation',
        urgencyLevel: 'moderate',
        bookingChannel: 'whatsapp',
        emailSent: false,
        crmStage: 'lead',
        crmNotes: 'Patient messaged on WhatsApp asking for 10:00 AM slot. Needs email confirmation.'
      };
    } else if (slotIndex === 4) {
      status = 'booked';
      type = 'in_person';
      appointmentId = `apt-${doctorId}-${dateStr}-4`;
      bookedBy = {
        id: 'pat-103',
        name: 'Pooja Sharma',
        email: 'pooja.sharma@gmail.com',
        phone: '+91 99300 11223',
        whatsappNumber: '+919930011223',
        age: 44,
        symptoms: 'Follow-up ECG & Blood Pressure Review (WhatsApp Lead)',
        urgencyLevel: 'low',
        bookingChannel: 'whatsapp',
        emailSent: false,
        crmStage: 'confirmed',
        crmNotes: 'Booked via WhatsApp Assistant. Awaiting email confirmation.'
      };
    } else if (slotIndex === 7) {
      status = 'blocked';
      type = 'emergency';
    }

    slots.push({
      id: `slot-${doctorId}-${dateStr}-${timeString}`,
      doctorId,
      date: dateStr,
      time: timeString,
      endTime: endTimeString,
      status,
      type,
      fee: doctor.consultationFee,
      bookedBy,
      appointmentId,
      updatedAt: Date.now()
    });

    slotIndex++;
    currentMin += duration;
  }

  return slots;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
