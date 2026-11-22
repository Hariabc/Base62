import React, { useState } from 'react';
import { Link2, Sparkles, ChevronDown, ChevronUp, Calendar, Tag, ShieldCheck, ArrowRight, Loader2, Check, Copy, QrCode } from 'lucide-react';
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
  const [expiresAt, setExpiresAt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const result = await urlApi.createUrl(payload);
      setRecentCreated(result);
      onUrlCreated(result);
      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');
      setExpiresAt('');
      setShowAdvanced(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to shorten URL. Check format or alias uniqueness.');
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Throughput Base62 Encoding & AI Analytics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Shorten, Brand & Track Any URL
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
            Sub-millisecond Redis redirection, distributed rate-limiting, and deep AI click diagnostics.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-bold ml-2">×</button>
          </div>
        )}

        {/* Shortener Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Link2 className="w-5 h-5 text-brand-400" />
              </div>
              <input
                type="text"
                placeholder="Paste your long destination URL (e.g. https://example.com/products/software/course?id=123)"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-inner font-mono text-xs sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !originalUrl.trim()}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encoding...</span>
                </>
              ) : (
                <>
                  <span>Shorten URL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-400 hover:text-brand-400 flex items-center gap-1.5 font-medium transition-colors"
            >
              <span>Custom Alias, Expiration & Metadata</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Collision-resistant Base62 Bijection</span>
            </div>
          </div>

          {/* Advanced Options Fields */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 animate-in fade-in-50 duration-200">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Custom Alias (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-slate-500 font-mono">/r/</span>
                  <input
                    type="text"
                    placeholder="my-campaign"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Title / Tag (Optional)</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-500" />
                  <input
                    type="text"
                    placeholder="Summer Course Launch"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Expiration Date (Optional)</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-500" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Recently Shortened Result Card */}
        {recentCreated && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-brand-950/60 to-indigo-950/60 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-brand-500/30 p-1 flex-shrink-0 flex items-center justify-center">
                {recentCreated.qrCodeDataUri ? (
                  <img src={recentCreated.qrCodeDataUri} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-6 h-6 text-brand-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={recentCreated.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm sm:text-base font-bold text-brand-400 hover:text-brand-300 hover:underline truncate"
                  >
                    {recentCreated.shortUrl}
                  </a>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                  ↳ {recentCreated.originalUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => copyToClipboard(recentCreated.shortUrl)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => onOpenQr(recentCreated)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 text-xs font-semibold border border-brand-500/30 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
