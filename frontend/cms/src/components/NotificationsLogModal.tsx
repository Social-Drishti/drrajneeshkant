import React from 'react';
import { Bell, XCircle, Trash2, Clock, Zap } from 'lucide-react';
import { RealtimeEventPayload } from '../types';

interface NotificationsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: RealtimeEventPayload[];
  onClearAll: () => void;
}

export const NotificationsLogModal: React.FC<NotificationsLogModalProps> = ({
  isOpen,
  onClose,
  events,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Real-Time Activity Audit Log</h3>
              <p className="text-xs text-slate-500">Live SSE events broadcasted across active sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No real-time activity logged yet.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="uppercase tracking-wider text-blue-700 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {evt.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400 font-normal">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-800 font-medium">
                  {JSON.stringify(evt.payload).slice(0, 120)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {events.length > 0 && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Audit Log
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
