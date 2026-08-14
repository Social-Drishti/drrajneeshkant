import React, { useState } from 'react';
import { FileText, XCircle, Save, CheckCircle2, Stethoscope, Pill } from 'lucide-react';
import { Appointment } from '../types';

interface ClinicalNotesModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (appointmentId: string, notes: string, prescriptions: string[]) => void;
}

export const ClinicalNotesModal: React.FC<ClinicalNotesModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSaveNotes
}) => {
  if (!isOpen || !appointment) return null;

  const [notes, setNotes] = useState(appointment.clinicalNotes || '');
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [prescriptions, setPrescriptions] = useState<string[]>(appointment.prescriptions || []);

  const handleAddPrescription = () => {
    if (!prescriptionInput.trim()) return;
    setPrescriptions([...prescriptions, prescriptionInput.trim()]);
    setPrescriptionInput('');
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(appointment.id, notes, prescriptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">EHR Clinical Notes</h3>
              <p className="text-xs text-slate-500">Patient: {appointment.patient.name} ({appointment.date})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Examination Notes</label>
            <textarea
              rows={4}
              placeholder="Record clinical observations, diagnostic findings, and treatment plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Prescriptions & Rx Orders</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Amoxicillin 500mg - 1 tab TID x 7 days"
                value={prescriptionInput}
                onChange={(e) => setPrescriptionInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <button
                type="button"
                onClick={handleAddPrescription}
                className="px-3 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs"
              >
                + Add Rx
              </button>
            </div>

            {prescriptions.length > 0 && (
              <div className="mt-2 space-y-1">
                {prescriptions.map((rx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-800 border border-slate-200">
                    <span>💊 {rx}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrescription(idx)}
                      className="text-rose-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save EHR Record
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
