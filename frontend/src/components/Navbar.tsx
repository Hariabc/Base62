import React from 'react';
import { Sparkles, Key, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: 'links' | 'analytics' | 'ai' | 'docs';
  setActiveTab: (tab: 'links' | 'analytics' | 'ai' | 'docs') => void;
  onOpenAuth: () => void;
  onOpenApiKey: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenApiKey,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="border-b border-theme-border bg-theme-page/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Minimalist Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('links')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-palette-terracotta text-palette-cream flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              B
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-theme-main">
                Base62
              </span>
              <span className="text-palette-terracotta font-black text-sm ml-0.5">•</span>
            </div>
          </button>
        </div>

        {/* Quiet Minimalist Navigation */}
        <nav className="flex items-center gap-1 bg-theme-subtle/60 p-1 rounded-xl border border-theme-border">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'links'
                ? 'bg-palette-terracotta text-palette-cream shadow-sm'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            Links
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-palette-terracotta text-palette-cream shadow-sm'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-palette-terracotta text-palette-cream shadow-sm'
                : 'text-theme-muted hover:text-palette-terracotta'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'docs'
                ? 'bg-palette-terracotta text-palette-cream shadow-sm'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            API
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Switcher: Cream Linen vs Espresso Night */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-subtle border border-theme-border transition-colors"
            title={isDark ? 'Switch to Warm Cream (Light)' : 'Switch to Espresso Night (Dark)'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-palette-amber" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenApiKey}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-subtle text-xs font-medium text-theme-main border border-theme-border hover:border-theme-border-hover transition-colors"
                title="Developer API Key"
              >
                <Key className="w-3.5 h-3.5 text-palette-terracotta" />
                <span>API Key</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-theme-border">
                <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-theme-subtle/80 border border-theme-border">
                  <div className="w-6 h-6 rounded-lg bg-palette-terracotta/15 text-palette-terracotta flex items-center justify-center font-bold text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-theme-main hidden sm:inline">
                    {user.fullName || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-theme-faint hover:text-rose-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-palette-terracotta hover:bg-brand-700 text-palette-cream text-xs font-semibold shadow-sm transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
