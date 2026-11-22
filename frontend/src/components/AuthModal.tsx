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
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
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
      setError('Could not connect to backend demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-theme-card border border-theme-border p-6 shadow-xl relative text-theme-main">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-faint hover:text-theme-main transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-9 h-9 rounded-xl bg-palette-terracotta/10 text-palette-terracotta flex items-center justify-center mx-auto mb-2.5">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-theme-main">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Access your personalized link dashboard & AI.
          </p>
        </div>

        {/* Demo Login Button */}
        <div className="mb-4 p-2.5 rounded-xl bg-theme-subtle/70 border border-theme-border flex items-center justify-between">
          <div className="text-left text-xs">
            <span className="font-semibold text-theme-main block">Quick Demo</span>
            <span className="text-[10px] text-theme-muted font-mono">demo@base62.ai</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-palette-terracotta hover:bg-brand-700 text-palette-cream text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <span>Demo Login</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-theme-muted mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-theme-page border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-theme-muted mb-1">Email</label>
            <input
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-theme-page border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-theme-muted mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-theme-page border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-palette-terracotta hover:bg-brand-700 text-palette-cream text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all mt-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isRegister ? 'Register' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-t border-theme-border">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-palette-terracotta hover:underline font-medium"
          >
            {isRegister ? 'Already registered? Sign in' : "New to Base62? Create account"}
          </button>
        </div>
      </div>
    </div>
  );
};
