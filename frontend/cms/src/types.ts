export type UserRole = 'doctor' | 'receptionist' | 'admin' | 'patient';

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'reserved';
export type AppointmentType = 'in_person' | 'telehealth' | 'emergency' | 'consultation';
export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  location: string;
  bio: string;
  specialties: string[];
  education: string;
  workingDays: number[]; // 1 = Monday, 7 = Sunday
  startHour: string; // "08:00"
  endHour: string; // "17:00"
  slotDurationMinutes: number; // 30
  breakStart?: string; // "12:00"
  breakEnd?: string; // "13:00"
}

export interface PatientInfo {
  id?: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  gender?: string;
  symptoms?: string;
  urgencyLevel?: 'low' | 'moderate' | 'urgent' | 'emergency';
  bookingChannel?: 'website' | 'whatsapp' | 'phone' | 'walk_in';
  whatsappNumber?: string;
  crmNotes?: string;
  crmStage?: 'lead' | 'confirmed' | 'consulted' | 'followed_up';
  emailSent?: boolean;
  emailSentAt?: number;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "09:00"
  endTime: string; // "09:30"
  status: SlotStatus;
  type: AppointmentType;
  fee: number;
  isCustomBlock?: boolean;
  blockReason?: string;
  bookedBy?: PatientInfo;
  appointmentId?: string;
  updatedAt?: number;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorDepartment: string;
  slotId: string;
  date: string;
  time: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  patient: PatientInfo;
  bookingChannel?: 'website' | 'whatsapp' | 'phone' | 'walk_in';
  emailSent?: boolean;
  emailSentAt?: number;
  clinicalNotes?: string;
  prescriptions?: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
  };
  createdAt: number;
}

export interface CMSUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
  doctorId?: string;
  permissions: {
    manageSlots: boolean;
    editSchedule: boolean;
    manageRoles: boolean;
    viewMedicalRecords: boolean;
    cancelAppointments: boolean;
    emergencyOverride: boolean;
  };
  lastActive: string;
  status: 'active' | 'away' | 'offline';
}

export interface RealtimeEventPayload {
  type: 'slot_updated' | 'appointment_booked' | 'appointment_status_changed' | 'role_updated' | 'schedule_updated' | 'emergency_block_added' | 'init_state';
  payload: any;
  timestamp: number;
  updatedBy?: string;
}

export interface AISymptomAnalysisResult {
  recommendedDepartment: string;
  suggestedType: AppointmentType;
  urgencyLevel: 'low' | 'moderate' | 'urgent' | 'emergency';
  summary: string;
  preparationAdvice: string[];
}
