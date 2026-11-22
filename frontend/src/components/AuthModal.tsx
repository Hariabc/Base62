import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '../api/client';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await authApi.register(email, password, fullName);
        localStorage.setItem('base62_token', res.token);
        localStorage.setItem('linkmind_token', res.token);
        const profile = await authApi.getProfile();
        onAuthSuccess(res.token, profile);
      } else {
        const res = await authApi.login(email, password);
        localStorage.setItem('base62_token', res.token);
        localStorage.setItem('linkmind_token', res.token);
        const profile = await authApi.getProfile();
        onAuthSuccess(res.token, profile);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login('demo@base62.ai', 'password123');
      localStorage.setItem('base62_token', res.token);
      localStorage.setItem('linkmind_token', res.token);
      const profile = await authApi.getProfile();
      onAuthSuccess(res.token, profile);
      onClose();
    } catch (err: any) {
      setError('Could not connect to backend demo user. Ensure Spring Boot is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="w-full max-w-md rounded-2xl bg-espresso-900 border border-espresso-800 p-6 sm:p-8 shadow-2xl relative text-palette-cream">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-200/60 hover:text-palette-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-palette-amber flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-600/30">
            <Lock className="w-5 h-5 text-espresso-950" />
          </div>
          <h3 className="text-xl font-extrabold text-palette-cream">
            {isRegister ? 'Create an Account' : 'Welcome to Base62 AI'}
          </h3>
          <p className="text-xs text-amber-100/60 mt-1">
            Access your personalized link dashboard, API keys, and AI diagnostics.
          </p>
        </div>

        {/* Demo Login Shortcut */}
        <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-espresso-850 to-espresso-800 border border-brand-500/40 flex items-center justify-between">
          <div className="text-left">
            <div className="text-xs font-bold text-palette-cream flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-palette-amber" />
              <span>Instant Recruiter / Demo Access</span>
            </div>
            <div className="text-[10px] text-amber-200/70 font-mono">
              demo@base62.ai (Preloaded telemetry)
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-palette-cream text-xs font-semibold shadow-md shadow-brand-600/30 flex items-center gap-1 transition-all disabled:opacity-50 border border-brand-400/40"
          >
            <span>Demo Login</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-amber-200/70 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-amber-200/50 absolute inset-y-0 left-3 my-auto" />
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-espresso-950 border border-espresso-750 text-xs text-palette-cream placeholder-amber-200/40 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-amber-200/70 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-amber-200/50 absolute inset-y-0 left-3 my-auto" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-espresso-950 border border-espresso-750 text-xs text-palette-cream placeholder-amber-200/40 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-amber-200/70 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-200/50 absolute inset-y-0 left-3 my-auto" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-espresso-950 border border-espresso-750 text-xs text-palette-cream placeholder-amber-200/40 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-palette-amber hover:from-brand-500 hover:to-amber-400 text-espresso-950 text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-1.5 transition-all mt-4 disabled:opacity-50 border border-brand-400/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-espresso-950" /> : null}
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center mt-5 pt-4 border-t border-espresso-800">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-palette-amber hover:text-amber-300 font-medium"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register free"}
          </button>
        </div>
      </div>
    </div>
  );
};
