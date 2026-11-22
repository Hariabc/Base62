import React from 'react';
import { Sparkles, Activity, Key, LogOut, User as UserIcon, Zap } from 'lucide-react';
import { User } from '../types';
import { RateLimitInfo } from '../api/client';

interface NavbarProps {
  user: User | null;
  rateLimit: RateLimitInfo;
  activeTab: 'links' | 'analytics' | 'ai' | 'docs';
  setActiveTab: (tab: 'links' | 'analytics' | 'ai' | 'docs') => void;
  onOpenAuth: () => void;
  onOpenApiKey: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  rateLimit,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenApiKey,
  onLogout,
}) => {
  const usagePercentage = Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100) || 5;

  return (
    <header className="border-b border-espresso-800/80 bg-espresso-900/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-palette-amber flex items-center justify-center shadow-lg shadow-brand-600/25 ring-1 ring-brand-400/30">
            <Sparkles className="w-5 h-5 text-palette-cream animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-palette-cream via-amber-100 to-palette-amber bg-clip-text text-transparent">
                Base62
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-palette-amber border border-brand-500/30">
                AI Platform
              </span>
            </div>
            <p className="text-[10px] text-amber-200/60 font-mono hidden sm:block">Base62 · Redis Cache · Event Driven</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-espresso-950/70 p-1 rounded-xl border border-espresso-800">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'links'
                ? 'bg-brand-600 text-palette-cream shadow-md shadow-brand-600/30'
                : 'text-amber-100/70 hover:text-palette-cream hover:bg-espresso-850'
            }`}
          >
            Links
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-brand-600 text-palette-cream shadow-md shadow-brand-600/30'
                : 'text-amber-100/70 hover:text-palette-cream hover:bg-espresso-850'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-brand-600 to-palette-amber text-espresso-950 font-bold shadow-md shadow-brand-600/30'
                : 'text-palette-amber hover:text-palette-cream hover:bg-espresso-850'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Insights
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'docs'
                ? 'bg-brand-600 text-palette-cream shadow-md shadow-brand-600/30'
                : 'text-amber-100/70 hover:text-palette-cream hover:bg-espresso-850'
            }`}
          >
            Swagger / API
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          
          {/* Rate Limit Meter */}
          <div className="hidden lg:flex items-center gap-2.5 bg-espresso-950/80 px-3 py-1.5 rounded-xl border border-espresso-800">
            <Activity className="w-4 h-4 text-palette-amber animate-pulse" />
            <div className="text-left">
              <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                <span className="text-amber-200/60 font-medium">Rate Limit</span>
                <span className="text-palette-amber font-semibold">{rateLimit.remaining}/{rateLimit.limit} req/m</span>
              </div>
              <div className="w-28 h-1 bg-espresso-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    usagePercentage > 80 ? 'bg-rose-500' : usagePercentage > 50 ? 'bg-brand-500' : 'bg-palette-amber'
                  }`}
                  style={{ width: `${Math.min(100, usagePercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenApiKey}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-espresso-850 hover:bg-espresso-800 text-xs font-mono text-palette-cream border border-espresso-750 transition-all"
                title="View & rotate API key"
              >
                <Key className="w-3.5 h-3.5 text-palette-amber" />
                <span>API Key</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-espresso-800">
                <div className="flex items-center gap-2 bg-espresso-850/80 px-2.5 py-1.5 rounded-lg border border-espresso-700/60">
                  <div className="w-6 h-6 rounded-md bg-brand-600/30 text-palette-amber flex items-center justify-center font-bold text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium text-palette-cream hidden md:inline">
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-brand-600/20 text-palette-amber border border-brand-500/30 uppercase">
                    {user.tier}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-amber-200/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-palette-cream text-sm font-semibold shadow-lg shadow-brand-600/30 transition-all border border-brand-400/30"
            >
              <UserIcon className="w-4 h-4" />
              <span>Login / Demo</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
