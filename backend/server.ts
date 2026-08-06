import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  INITIAL_DOCTORS, 
  INITIAL_CMS_USERS, 
  generateDefaultSlots, 
  getTodayDateString 
} from './src/data/initialData';
import { 
  Doctor, 
  CMSUser, 
  AppointmentSlot, 
  Appointment, 
  RealtimeEventPayload 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Data Store (Server Source of Truth)
let doctors: Doctor[] = [...INITIAL_DOCTORS];
let cmsUsers: CMSUser[] = [...INITIAL_CMS_USERS];

// Key: `${doctorId}_${dateStr}` -> AppointmentSlot[]
const slotStore: Record<string, AppointmentSlot[]> = {};

// Appointments list
let appointmentsStore: Appointment[] = [];

// Initialize today's slots for all doctors
const todayStr = getTodayDateString();
doctors.forEach((doc) => {
  const key = `${doc.id}_${todayStr}`;
  slotStore[key] = generateDefaultSlots(doc.id, todayStr);
  
  // Extract initial appointments from generated slots
  slotStore[key].forEach((slot) => {
    if (slot.status === 'booked' && slot.bookedBy && slot.appointmentId) {
      appointmentsStore.push({
        id: slot.appointmentId,
        doctorId: doc.id,
        doctorName: doc.name,
        doctorDepartment: doc.department,
        slotId: slot.id,
        date: slot.date,
        time: slot.time,
        endTime: slot.endTime,
        type: slot.type,
        status: 'confirmed',
        patient: slot.bookedBy,
        createdAt: Date.now() - Math.floor(Math.random() * 100000)
      });
    }
  });
});

// SSE Clients for Real-time Broadcasting
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastEvent(type: RealtimeEventPayload['type'], payload: any, updatedBy?: string) {
  const eventData: RealtimeEventPayload = {
    type,
    payload,
    timestamp: Date.now(),
    updatedBy
  };

  const message = `data: ${JSON.stringify(eventData)}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch (e) {
      console.error('Error broadcasting to SSE client', client.id, e);
    }
  });
}

// ---------------- REST API ROUTES ----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Real-time SSE Stream Endpoint
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  sseClients.push({ id: clientId, res });

  // Send initial state snapshot on connect
  const initStateEvent: RealtimeEventPayload = {
    type: 'init_state',
    payload: {
      doctors,
      cmsUsers,
      todayStr
    },
    timestamp: Date.now()
  };
  res.write(`data: ${JSON.stringify(initStateEvent)}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Get Doctors
app.get('/api/doctors', (req: Request, res: Response) => {
  res.json({ doctors });
});

// Update Doctor Schedule / Settings
app.put('/api/doctors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const docIndex = doctors.findIndex((d) => d.id === id);

  if (docIndex === -1) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  doctors[docIndex] = { ...doctors[docIndex], ...updates };

  broadcastEvent('schedule_updated', { doctor: doctors[docIndex] }, updates.updatedBy);
  res.json({ success: true, doctor: doctors[docIndex] });
});

// Get Slots for a Doctor on a Date
app.get('/api/doctors/:id/slots', (req: Request, res: Response) => {
  const { id } = req.params;
  const dateStr = (req.query.date as string) || getTodayDateString();
  const key = `${id}_${dateStr}`;

  if (!slotStore[key]) {
    slotStore[key] = generateDefaultSlots(id, dateStr);
  }

  res.json({
    doctorId: id,
    date: dateStr,
    slots: slotStore[key]
  });
});

// Update single slot status (CMS / Doctor / Patient)
app.post('/api/slots/manage', (req: Request, res: Response) => {
  const { doctorId, date, slotId, status, type, blockReason, updatedBy } = req.body;
  const key = `${doctorId}_${date}`;

  if (!slotStore[key]) {
    slotStore[key] = generateDefaultSlots(doctorId, date);
  }

  const slotIndex = slotStore[key].findIndex((s) => s.id === slotId);
  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  const currentSlot = slotStore[key][slotIndex];
  const updatedSlot: AppointmentSlot = {
    ...currentSlot,
    status: status !== undefined ? status : currentSlot.status,
    type: type !== undefined ? type : currentSlot.type,
    blockReason: blockReason !== undefined ? blockReason : currentSlot.blockReason,
    updatedAt: Date.now()
  };

  if (status === 'available') {
    updatedSlot.bookedBy = undefined;
    updatedSlot.appointmentId = undefined;
  }

  slotStore[key][slotIndex] = updatedSlot;

  broadcastEvent('slot_updated', { doctorId, date, slot: updatedSlot }, updatedBy);
  res.json({ success: true, slot: updatedSlot });
});

// Bulk Block or Emergency Override
app.post('/api/slots/bulk-block', (req: Request, res: Response) => {
  const { doctorId, date, reason, updatedBy } = req.body;
  const key = `${doctorId}_${date}`;

  if (!slotStore[key]) {
    slotStore[key] = generateDefaultSlots(doctorId, date);
  }

  // Block all non-booked slots
  slotStore[key] = slotStore[key].map((s) => {
    if (s.status === 'available') {
      return {
        ...s,
        status: 'blocked',
        isCustomBlock: true,
        blockReason: reason || 'Emergency Hospital Block',
        updatedAt: Date.now()
      };
    }
    return s;
  });

  broadcastEvent('emergency_block_added', { doctorId, date, slots: slotStore[key], reason }, updatedBy);
  res.json({ success: true, slots: slotStore[key] });
});

// Book an Appointment (Patient or Receptionist)
app.post('/api/appointments/book', (req: Request, res: Response) => {
  const { doctorId, date, slotId, patient, appointmentType, updatedBy } = req.body;
  const key = `${doctorId}_${date}`;

  if (!slotStore[key]) {
    slotStore[key] = generateDefaultSlots(doctorId, date);
  }

  const slotIndex = slotStore[key].findIndex((s) => s.id === slotId);
  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  const targetSlot = slotStore[key][slotIndex];

  if (targetSlot.status === 'booked') {
    return res.status(400).json({ error: 'This slot has already been booked by another user in real time.' });
  }

  if (targetSlot.status === 'blocked') {
    return res.status(400).json({ error: 'This slot is currently blocked by the doctor/CMS.' });
  }

  const doctor = doctors.find((d) => d.id === doctorId) || doctors[0];
  const aptId = `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newAppointment: Appointment = {
    id: aptId,
    doctorId,
    doctorName: doctor.name,
    doctorDepartment: doctor.department,
    slotId,
    date,
    time: targetSlot.time,
    endTime: targetSlot.endTime,
    type: appointmentType || targetSlot.type || 'in_person',
    status: 'confirmed',
    patient: {
      id: `pat-${Date.now()}`,
      ...patient
    },
    createdAt: Date.now()
  };

  // Update Slot
  const updatedSlot: AppointmentSlot = {
    ...targetSlot,
    status: 'booked',
    type: appointmentType || targetSlot.type,
    bookedBy: newAppointment.patient,
    appointmentId: aptId,
    updatedAt: Date.now()
  };

  slotStore[key][slotIndex] = updatedSlot;
  appointmentsStore.unshift(newAppointment);

  // Broadcast Realtime Update
  broadcastEvent('appointment_booked', { doctorId, date, slot: updatedSlot, appointment: newAppointment }, updatedBy);

  res.json({
    success: true,
    appointment: newAppointment,
    slot: updatedSlot
  });
});

// Update Appointment Status or Notes (CMS/Doctor)
app.post('/api/appointments/status', (req: Request, res: Response) => {
  const { appointmentId, status, clinicalNotes, prescriptions, updatedBy } = req.body;

  const aptIndex = appointmentsStore.findIndex((a) => a.id === appointmentId);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const currentApt = appointmentsStore[aptIndex];
  const updatedApt: Appointment = {
    ...currentApt,
    status: status !== undefined ? status : currentApt.status,
    clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : currentApt.clinicalNotes,
    prescriptions: prescriptions !== undefined ? prescriptions : currentApt.prescriptions
  };

  appointmentsStore[aptIndex] = updatedApt;

  // If status is cancelled, update slot back to available
  if (status === 'cancelled') {
    const key = `${currentApt.doctorId}_${currentApt.date}`;
    if (slotStore[key]) {
      const slotIndex = slotStore[key].findIndex((s) => s.id === currentApt.slotId);
      if (slotIndex !== -1) {
        slotStore[key][slotIndex] = {
          ...slotStore[key][slotIndex],
          status: 'available',
          bookedBy: undefined,
          appointmentId: undefined,
          updatedAt: Date.now()
        };
        broadcastEvent('slot_updated', { doctorId: currentApt.doctorId, date: currentApt.date, slot: slotStore[key][slotIndex] }, updatedBy);
      }
    }
  }

  broadcastEvent('appointment_status_changed', { appointment: updatedApt }, updatedBy);
  res.json({ success: true, appointment: updatedApt });
});

// Delete an Appointment completely
app.post('/api/appointments/delete', (req: Request, res: Response) => {
  const { appointmentId, updatedBy } = req.body;

  const aptIndex = appointmentsStore.findIndex((a) => a.id === appointmentId);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const deletedApt = appointmentsStore[aptIndex];
  appointmentsStore.splice(aptIndex, 1);

  // Free up the corresponding slot
  const key = `${deletedApt.doctorId}_${deletedApt.date}`;
  if (slotStore[key]) {
    const slotIndex = slotStore[key].findIndex((s) => s.id === deletedApt.slotId);
    if (slotIndex !== -1) {
      slotStore[key][slotIndex] = {
        ...slotStore[key][slotIndex],
        status: 'available',
        bookedBy: undefined,
        appointmentId: undefined,
        updatedAt: Date.now()
      };
      broadcastEvent('slot_updated', { doctorId: deletedApt.doctorId, date: deletedApt.date, slot: slotStore[key][slotIndex] }, updatedBy);
    }
  }

  broadcastEvent('appointment_status_changed', { appointmentId, deleted: true }, updatedBy || 'CMS Staff');
  res.json({ success: true, deletedId: appointmentId });
});

// Send Confirmation Email Endpoint
app.post('/api/crm/send-confirmation-email', (req: Request, res: Response) => {
  const { appointmentId, slotId, doctorId, date, email, updatedBy } = req.body;

  let targetApt: Appointment | undefined;

  if (appointmentId) {
    targetApt = appointmentsStore.find((a) => a.id === appointmentId);
  } else if (slotId && doctorId && date) {
    const key = `${doctorId}_${date}`;
    const slot = slotStore[key]?.find((s) => s.id === slotId);
    if (slot && slot.appointmentId) {
      targetApt = appointmentsStore.find((a) => a.id === slot.appointmentId);
    }
  }

  if (!targetApt) {
    return res.status(404).json({ error: 'Appointment or patient record not found for sending confirmation email.' });
  }

  // Update email sent flags
  targetApt.emailSent = true;
  targetApt.emailSentAt = Date.now();
  if (targetApt.patient) {
    targetApt.patient.emailSent = true;
    targetApt.patient.emailSentAt = Date.now();
    targetApt.patient.crmStage = 'confirmed';
  }

  // Also update slot if in store
  const slotKey = `${targetApt.doctorId}_${targetApt.date}`;
  if (slotStore[slotKey]) {
    const sIndex = slotStore[slotKey].findIndex((s) => s.id === targetApt?.slotId);
    if (sIndex !== -1 && slotStore[slotKey][sIndex].bookedBy) {
      slotStore[slotKey][sIndex].bookedBy!.emailSent = true;
      slotStore[slotKey][sIndex].bookedBy!.emailSentAt = Date.now();
      slotStore[slotKey][sIndex].bookedBy!.crmStage = 'confirmed';
    }
  }

  const emailPreview = {
    to: email || targetApt.patient.email,
    subject: `Appointment Confirmed: ${targetApt.doctorName} on ${targetApt.date} at ${targetApt.time}`,
    body: `Dear ${targetApt.patient.name},\n\nYour appointment with ${targetApt.doctorName} (${targetApt.doctorDepartment}) has been officially confirmed.\n\nDate: ${targetApt.date}\nTime: ${targetApt.time} - ${targetApt.endTime}\nType: ${targetApt.type.toUpperCase()}\nLocation: Apollo Medical Center, Bandra West, Mumbai\n\nCalendar File (.ics) attached.\n\nBest regards,\nApollo Health Care Team`,
    sentAt: new Date().toLocaleTimeString()
  };

  broadcastEvent('appointment_status_changed', { appointment: targetApt, emailSent: true }, updatedBy || 'CRM Dispatch');

  res.json({
    success: true,
    message: `Confirmation email successfully sent to ${emailPreview.to}!`,
    appointment: targetApt,
    emailPreview
  });
});

// Add / Log WhatsApp Patient Lead
app.post('/api/crm/whatsapp-patient', (req: Request, res: Response) => {
  const { doctorId, date, slotId, patientName, phone, whatsappNumber, symptoms, updatedBy } = req.body;
  const key = `${doctorId}_${date}`;

  if (!slotStore[key]) {
    slotStore[key] = generateDefaultSlots(doctorId, date);
  }

  const slotIndex = slotStore[key].findIndex((s) => s.id === slotId);
  if (slotIndex === -1) {
    return res.status(404).json({ error: 'Slot not found for WhatsApp lead booking.' });
  }

  const targetSlot = slotStore[key][slotIndex];
  const doctor = doctors.find((d) => d.id === doctorId) || doctors[0];
  const aptId = `apt-wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newPatient = {
    id: `pat-wa-${Date.now()}`,
    name: patientName,
    email: `${patientName.toLowerCase().replace(/\s+/g, '.')}@whatsapp.patient`,
    phone: phone || whatsappNumber,
    whatsappNumber: whatsappNumber || phone,
    symptoms: symptoms || 'Patient lead arrived via WhatsApp message',
    urgencyLevel: 'moderate' as const,
    bookingChannel: 'whatsapp' as const,
    emailSent: false,
    crmStage: 'lead' as const,
    crmNotes: 'Lead logged from WhatsApp inquiry.'
  };

  const newAppointment: Appointment = {
    id: aptId,
    doctorId,
    doctorName: doctor.name,
    doctorDepartment: doctor.department,
    slotId,
    date,
    time: targetSlot.time,
    endTime: targetSlot.endTime,
    type: 'in_person',
    status: 'confirmed',
    patient: newPatient,
    bookingChannel: 'whatsapp',
    emailSent: false,
    createdAt: Date.now()
  };

  const updatedSlot: AppointmentSlot = {
    ...targetSlot,
    status: 'booked',
    bookedBy: newPatient,
    appointmentId: aptId,
    updatedAt: Date.now()
  };

  slotStore[key][slotIndex] = updatedSlot;
  appointmentsStore.unshift(newAppointment);

  broadcastEvent('appointment_booked', { doctorId, date, slot: updatedSlot, appointment: newAppointment }, updatedBy || 'WhatsApp CRM');

  res.json({
    success: true,
    appointment: newAppointment,
    slot: updatedSlot
  });
});

// Get all appointments
app.get('/api/appointments', (req: Request, res: Response) => {
  const { doctorId, date } = req.query;
  let filtered = [...appointmentsStore];

  if (doctorId) {
    filtered = filtered.filter((a) => a.doctorId === doctorId);
  }
  if (date) {
    filtered = filtered.filter((a) => a.date === date);
  }

  res.json({ appointments: filtered });
});

// CMS Roles & User Management
app.get('/api/roles', (req: Request, res: Response) => {
  res.json({ users: cmsUsers });
});

app.post('/api/roles/update', (req: Request, res: Response) => {
  const { userId, role, permissions, updatedBy } = req.body;

  const userIndex = cmsUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'CMS User not found' });
  }

  cmsUsers[userIndex] = {
    ...cmsUsers[userIndex],
    role: role || cmsUsers[userIndex].role,
    permissions: permissions ? { ...cmsUsers[userIndex].permissions, ...permissions } : cmsUsers[userIndex].permissions,
    lastActive: 'Updated just now'
  };

  broadcastEvent('role_updated', { user: cmsUsers[userIndex] }, updatedBy);
  res.json({ success: true, user: cmsUsers[userIndex] });
});

app.post('/api/roles/delete', (req: Request, res: Response) => {
  const { userId, updatedBy } = req.body;

  const userIndex = cmsUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'CMS User not found' });
  }

  const deletedUser = cmsUsers[userIndex];
  cmsUsers.splice(userIndex, 1);

  broadcastEvent('role_updated', { userId, deleted: true }, updatedBy);
  res.json({ success: true, deletedUser });
});

// ---------------- GEMINI AI ROUTES ----------------

// Patient Symptom Check & Triage Recommendation
app.post('/api/ai/symptom-check', async (req: Request, res: Response) => {
  try {
    const { symptoms, age, duration } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        analysis: {
          recommendedDepartment: 'General Medicine / Cardiology',
          suggestedType: 'consultation',
          urgencyLevel: 'moderate',
          summary: 'Based on your reported symptoms, a routine medical consultation is recommended for thorough evaluation.',
          preparationAdvice: [
            'Bring a list of any current medications.',
            'Note down when symptoms first began and any specific triggers.',
            'Check your temperature or blood pressure prior to visit if available.'
          ]
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a medical triage assistant. Analyze the patient description:
Symptoms: "${symptoms}"
Patient Age: ${age || 'Not specified'}
Symptom Duration: ${duration || 'Not specified'}

Provide a JSON object response with exact keys:
- "recommendedDepartment": (e.g. "Cardiology", "Neurology", "Pediatrics", "Orthopedics")
- "suggestedType": ("in_person", "telehealth", "emergency", "consultation")
- "urgencyLevel": ("low", "moderate", "urgent", "emergency")
- "summary": (2-3 concise professional clinical guidance sentences)
- "preparationAdvice": (Array of 3 practical bullet points for the patient prior to appointment)

Return strictly valid JSON only. Do not include markdown code block backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    res.json({ analysis: parsed });
  } catch (error) {
    console.error('Gemini symptom check error:', error);
    res.json({
      analysis: {
        recommendedDepartment: 'General Medicine',
        suggestedType: 'in_person',
        urgencyLevel: 'moderate',
        summary: 'A standard clinical assessment is recommended based on your description.',
        preparationAdvice: [
          'Bring your ID and medical insurance card.',
          'Prepare questions for your physician.'
        ]
      }
    });
  }
});

// Doctor AI Preparation Summary
app.post('/api/ai/doctor-summary', async (req: Request, res: Response) => {
  try {
    const { patientName, symptoms, age, appointmentType, department } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        summary: `Patient ${patientName} (${age || 'N/A'} yrs) presenting for ${appointmentType}. Primary concern: "${symptoms}". Recommend reviewing baseline vital signs and past consultation history.`
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a physician assistant tool. Synthesize a 3-sentence clinical prep summary for Dr. ${department}:
Patient: ${patientName}, Age: ${age || 'N/A'}
Type: ${appointmentType}
Reported Symptoms: ${symptoms}

Highlight potential diagnostic focus areas and immediate red flags to watch for during consultation. Keep concise and medical-grade.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error) {
    console.error('Gemini doctor summary error:', error);
    res.json({ summary: 'Clinical preparation summary unavailable at this time.' });
  }
});

// ---------------- VITE & STATIC HANDLING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 Doctor Appointment & CMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
