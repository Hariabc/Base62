import React, { useState, useEffect } from 'react';
import {
  Sparkles, Database, Cpu, Globe, ExternalLink
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UrlShortenerCard } from './components/UrlShortenerCard';
import { UrlTable } from './components/UrlTable';
import { AnalyticsView } from './components/AnalyticsView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AuthModal } from './components/AuthModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { QrCodeModal } from './components/QrCodeModal';
import { User, UrlItem, AnalyticsOverview } from './types';
import { authApi, urlApi, analyticsApi } from './api/client';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'analytics' | 'ai' | 'docs'>('links');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('base62_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<UrlItem | null>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiInitialQuestion, setAiInitialQuestion] = useState<string | undefined>(undefined);

  // Sync theme with HTML class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('base62_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('base62_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Check auth and load initial data
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const token = localStorage.getItem('base62_token') || localStorage.getItem('linkmind_token');
    if (token) {
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
      } catch (e) {
        console.warn('Existing token expired or backend offline', e);
      }
    } else {
      // Auto-login with Demo account for immediate access
      try {
        const res = await authApi.login('demo@base62.ai', 'password123');
        localStorage.setItem('base62_token', res.token);
        localStorage.setItem('linkmind_token', res.token);
        const profile = await authApi.getProfile();
        setUser(profile);
      } catch (ignored) {}
    }

    loadUrls();
    loadAnalytics();
  };

  const loadUrls = async () => {
    try {
      setLoadingUrls(true);
      const res = await urlApi.getUrls(0, 50);
      setUrls(res.content || []);
    } catch (e) {
      console.error('Failed to load user URLs', e);
    } finally {
      setLoadingUrls(false);
    }
  };

  const loadAnalytics = async (urlId?: number) => {
    try {
      const data = urlId
        ? await analyticsApi.getUrlAnalytics(urlId, 7)
        : await analyticsApi.getOverview(7);
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    }
  };

  const handleUrlCreated = (newUrl: UrlItem) => {
    setUrls((prev) => [newUrl, ...prev]);
    loadAnalytics();
  };

  const handleDeleteUrl = async (id: number) => {
    if (!window.confirm('Delete this short link?')) return;
    try {
      await urlApi.deleteUrl(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
      if (selectedUrl?.id === id) {
        setSelectedUrl(null);
      }
      loadAnalytics();
    } catch (e) {
      alert('Failed to delete URL');
    }
  };

  const handleSelectUrlForAnalytics = (url: UrlItem) => {
    setSelectedUrl(url);
    setActiveTab('analytics');
    loadAnalytics(url.id);
  };

  const handleClearSelectedUrl = () => {
    setSelectedUrl(null);
    loadAnalytics();
  };

  const handleOpenAiWithQuestion = (question?: string) => {
    setAiInitialQuestion(question);
    setAiDrawerOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('base62_token');
    localStorage.removeItem('linkmind_token');
    setUser(null);
    setUrls([]);
    setAnalytics(null);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-theme-page text-theme-main flex flex-col font-sans transition-colors selection:bg-palette-terracotta selection:text-palette-cream">
      {/* Aesthetic Minimal Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'ai') {
            setAiInitialQuestion(undefined);
            setAiDrawerOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenApiKey={() => setApiKeyModalOpen(true)}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* TAB 1: LINKS */}
        {activeTab === 'links' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <UrlShortenerCard
              onUrlCreated={handleUrlCreated}
              onOpenQr={(url) => setQrModalUrl(url)}
            />

            <UrlTable
              urls={urls}
              loading={loadingUrls}
              onSelectUrl={handleSelectUrlForAnalytics}
              onOpenQr={(url) => setQrModalUrl(url)}
              onDeleteUrl={handleDeleteUrl}
              onRefresh={loadUrls}
            />
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in-50 duration-200">
            <AnalyticsView
              analytics={analytics}
              selectedUrl={selectedUrl}
              onClearSelectedUrl={handleClearSelectedUrl}
              onOpenAiChat={handleOpenAiWithQuestion}
            />
          </div>
        )}

        {/* TAB 3: API & SPECS */}
        {activeTab === 'docs' && (
          <div className="card-aesthetic rounded-2xl p-6 sm:p-8 animate-in fade-in-50 duration-200 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-theme-border">
              <div>
                <h2 className="text-xl font-bold text-theme-main">
                  Developer API & Specifications
                </h2>
                <p className="text-xs text-theme-muted mt-1">
                  Integrate Base62 into your apps with low-latency REST endpoints.
                </p>
              </div>
              <a
                href="/swagger-ui/index.html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-palette-terracotta hover:bg-brand-700 text-palette-cream text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Interactive Swagger UI</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-theme-subtle/50 border border-theme-border">
                <div className="flex items-center gap-2 text-palette-terracotta text-xs font-bold mb-1.5">
                  <Database className="w-4 h-4" />
                  <span>Sub-ms Redis Caching</span>
                </div>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Redirects query Redis memory for sub-5ms latency, falling back to database on cache miss.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-theme-subtle/50 border border-theme-border">
                <div className="flex items-center gap-2 text-palette-amber text-xs font-bold mb-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>Token Bucket Limiter</span>
                </div>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Sliding-window rate limits per API key with standard <code className="font-mono text-[10px]">X-RateLimit-*</code> response headers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-theme-subtle/50 border border-theme-border">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1.5">
                  <Globe className="w-4 h-4" />
                  <span>Async Event Pipeline</span>
                </div>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Click logging and GeoIP telemetry execute asynchronously without blocking 302 redirects.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Aesthetic Floating AI Pill */}
      <aside aria-label="AI Assistant" className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            setAiInitialQuestion(undefined);
            setAiDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-palette-terracotta hover:bg-brand-700 active:scale-95 text-palette-cream font-medium text-xs shadow-lg transition-all border border-palette-cream/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </aside>

      {/* Modals & Slide-Overs */}
      <AiAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        selectedUrl={selectedUrl}
        initialQuestion={aiInitialQuestion}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(_, userProfile) => {
          setUser(userProfile);
          loadUrls();
          loadAnalytics();
        }}
      />

      <ApiKeyModal
        user={user}
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onUserUpdated={(updated) => setUser(updated)}
      />

      <QrCodeModal
        url={qrModalUrl}
        onClose={() => setQrModalUrl(null)}
      />
    </div>
  );
};

export default App;
