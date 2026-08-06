import React, { useState } from 'react';
import { 
  Mail, 
  KeyRound, 
  LogIn, 
  X, 
  AlertCircle
} from 'lucide-react';
import { CMSUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  cmsUsers: CMSUser[];
  onLoginSuccess: (user: CMSUser) => void;
  currentUser: CMSUser | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  cmsUsers,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('dr.rajneesh@chiroconnect.in');
  const [password, setPassword] = useState('chiro123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const foundUser = cmsUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (foundUser) {
        setIsLoading(false);
        onLoginSuccess(foundUser);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid email or password for Chiroconnect CMS portal.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden space-y-0">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md">
              C
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Chiroconnect CMS Login</h2>
              <p className="text-xs text-cyan-300 font-semibold">Dr. Rajneesh Kant Practice Control Portal</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. dr.rajneesh@chiroconnect.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Authenticating...' : 'Sign In to CMS Portal'}
            </button>
          </form>



        </div>

      </div>
    </div>
  );
};
