import React, { useState } from 'react';
import { Sparkles, XCircle, Stethoscope, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AISymptomAnalysisResult } from '../types';

interface AISymptomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDepartment: (dept: string) => void;
}

export const AISymptomModal: React.FC<AISymptomModalProps> = ({
  isOpen,
  onClose,
  onSelectDepartment
}) => {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [patientAge, setPatientAge] = useState<number>(30);
  const [duration, setDuration] = useState('3 days');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AISymptomAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;

    setIsLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('chiro_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symptoms: symptomsInput,
          age: patientAge,
          duration
        })
      });

      const data = await res.json();
      setResult(data.analysis);
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Gemini AI Symptom Triage</h3>
              <p className="text-xs text-slate-500">Smart Medical Guidance & Department Matching</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Form or Result */}
        {!result ? (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Describe Symptoms or Concerns</label>
              <textarea
                rows={3}
                placeholder="e.g. Sharp chest pressure after running, mild shortness of breath, dizziness for 2 days..."
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 2 days"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Analyzing Symptoms with Gemini AI...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Analyze Symptoms & Match Specialist</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Urgency Badge */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              result.urgencyLevel === 'emergency' || result.urgencyLevel === 'urgent'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              <span className="uppercase">Urgency Level: {result.urgencyLevel}</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-white/80 border text-[10px]">
                Recommended Mode: {result.suggestedType}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">AI Clinical Summary</h4>
              <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {result.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Preparation Checklist</h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                {result.preparationAdvice.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Re-Analyze
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectDepartment(result.recommendedDepartment);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
              >
                Book with {result.recommendedDepartment} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
