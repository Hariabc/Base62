import React, { useState, useEffect } from 'react';
import {
  Sparkles, Layers, ArrowUpRight, BarChart3, Database, Cpu, Globe,
  ShieldAlert, RefreshCw, Terminal, ExternalLink, HelpCircle
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
import { authApi, urlApi, analyticsApi, setRateLimitListener, RateLimitInfo } from './api/client';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'analytics' | 'ai' | 'docs'>('links');
  const [rateLimit, setRateLimit] = useState<RateLimitInfo>({ limit: 1000, remaining: 985, resetSeconds: 60 });

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<UrlItem | null>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiInitialQuestion, setAiInitialQuestion] = useState<string | undefined>(undefined);

  // Hook rate limit listener
  useEffect(() => {
    setRateLimitListener((info) => setRateLimit(info));
  }, []);

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
      // Auto-login with Demo account for a zero-friction recruiter experience
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
    if (!window.confirm('Delete this short URL? Cache will be evicted and redirect will cease.')) return;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        user={user}
        rateLimit={rateLimit}
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB 1: LINKS MANAGEMENT */}
        {activeTab === 'links' && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Top Shortener Hero */}
            <UrlShortenerCard
              onUrlCreated={handleUrlCreated}
              onOpenQr={(url) => setQrModalUrl(url)}
            />

            {/* Links Table */}
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

        {/* TAB 3: SWAGGER & SYSTEM ARCHITECTURE DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Engineering Specifications & OpenAPI</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                      Springdoc v2.6.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Explore live interactive Swagger UI endpoints, schemas, and rate-limiting headers.
                  </p>
                </div>
                <a
                  href="/swagger-ui/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
                >
                  <span>Open Swagger UI</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Architectural Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-brand-400 text-xs font-bold mb-2">
                    <Database className="w-4 h-4" />
                    <span>Sub-ms Redis Caching</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Redirects query Redis key <code className="text-brand-300 font-mono text-[11px]">base62:url:&#123;code&#125;</code> for ultra-low latency reads. Database hits occur only on cache misses with automatic cache warming.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-2">
                    <Cpu className="w-4 h-4" />
                    <span>Distributed Rate Limiter</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sliding window counter enforced in Redis. Responds with <code className="text-purple-300 font-mono text-[11px]">HTTP 429 Too Many Requests</code> and <code className="text-purple-300 font-mono text-[11px]">Retry-After</code> headers when exhausted.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                    <Globe className="w-4 h-4" />
                    <span>Decoupled Click Pipeline</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Redirect requests fire non-blocking asynchronous events. Telemetry ingestion, UA parsing, and GeoIP enrichment run in parallel worker pools without delaying visitor redirects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Action Button for AI Assistant */}
      <aside aria-label="Quick Actions" className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            setAiInitialQuestion(undefined);
            setAiDrawerOpen(true);
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs sm:text-sm shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all border border-white/20 glow-brand"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>Ask Base62 AI</span>
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
