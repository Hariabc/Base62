import React, { useState } from 'react';
import { Link2, ArrowRight, Loader2, Check, Copy, QrCode, SlidersHorizontal, Sparkles } from 'lucide-react';
import { UrlItem } from '../types';
import { urlApi } from '../api/client';

interface UrlShortenerCardProps {
  onUrlCreated: (url: UrlItem) => void;
  onOpenQr: (url: UrlItem) => void;
}

export const UrlShortenerCard: React.FC<UrlShortenerCardProps> = ({ onUrlCreated, onOpenQr }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCreated, setRecentCreated] = useState<UrlItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    try {
      setLoading(true);
      setError(null);
      let formattedUrl = originalUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const payload = {
        originalUrl: formattedUrl,
        customAlias: customAlias.trim() || undefined,
        title: title.trim() || undefined,
      };

      const result = await urlApi.createUrl(payload);
      setRecentCreated(result);
      onUrlCreated(result);
      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');
      setShowOptions(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not shorten link. Verify format or alias.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto pt-2 pb-2">
      {/* User Brand Logo & Hero Header */}
      <div className="text-center mb-7">
        <div className="flex justify-center mb-4">
          <div className="relative group p-1 rounded-2xl bg-gradient-to-b from-theme-subtle/80 to-transparent border border-theme-border/60 shadow-lg">
            <img
              src="/logo.png"
              alt="Base62 - Shorten, Share, Track"
              className="h-20 sm:h-24 w-auto object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-theme-main tracking-tight">
          Simplify your links.
        </h1>
        <p className="text-sm text-theme-muted mt-2 max-w-md mx-auto">
          Ultra-fast Base62 redirects with quiet, real-time AI telemetry.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-300 text-xs text-center flex items-center justify-between">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-rose-500 ml-2">×</button>
        </div>
      )}

      {/* Main Clean Shortener Input Box */}
      <div className="card-aesthetic rounded-2xl p-2 sm:p-2.5 shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1 flex items-center">
            <Link2 className="w-4 h-4 text-theme-faint absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Paste long link (e.g. https://example.com/project)..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              className="w-full pl-10 pr-24 py-3 bg-transparent text-theme-main placeholder-theme-faint text-sm focus:outline-none"
            />
            
            {/* Custom Options Toggle */}
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`absolute right-2 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                showOptions || customAlias || title
                  ? 'bg-palette-terracotta/15 text-palette-terracotta border border-palette-terracotta/30'
                  : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden sm:inline">Options</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !originalUrl.trim()}
            className="px-6 py-3 rounded-xl bg-palette-terracotta hover:bg-brand-700 active:scale-[0.98] text-palette-cream font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-brand-400/20"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-palette-cream" />
            ) : (
              <>
                <span>Shorten</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Minimal Optional Fields */}
        {showOptions && (
          <div className="mt-2.5 pt-3 border-t border-theme-border grid grid-cols-1 sm:grid-cols-2 gap-2.5 px-1 animate-in fade-in-50 duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-theme-muted mb-1">Custom Alias (Optional)</label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs text-theme-faint font-mono">/r/</span>
                <input
                  type="text"
                  placeholder="launch"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-theme-input border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-theme-muted mb-1">Title / Tag (Optional)</label>
              <input
                type="text"
                placeholder="Marketing Campaign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-theme-input border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta"
              />
            </div>
          </div>
        )}
      </div>

      {/* Clean Success Feedback Pill */}
      {recentCreated && (
        <div className="mt-4 p-3.5 rounded-2xl bg-theme-card border border-palette-terracotta/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-palette-terracotta/15 text-palette-terracotta flex items-center justify-center flex-shrink-0 border border-palette-terracotta/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <a
                href={recentCreated.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm font-bold text-palette-amber hover:underline truncate block"
              >
                {recentCreated.shortUrl}
              </a>
              <span className="text-[11px] text-theme-muted truncate block max-w-sm">
                ↳ {recentCreated.originalUrl}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => copyToClipboard(recentCreated.shortUrl)}
              className="px-3 py-1.5 rounded-lg bg-theme-subtle hover:bg-theme-border text-theme-main text-xs font-semibold border border-theme-border flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => onOpenQr(recentCreated)}
              className="px-3 py-1.5 rounded-lg bg-theme-subtle hover:bg-theme-border text-theme-main text-xs font-semibold border border-theme-border flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
