import React, { useState } from 'react';
import { Search, ExternalLink, Copy, Check, QrCode, BarChart3, Trash2, Globe, Clock, ShieldAlert } from 'lucide-react';
import { UrlItem } from '../types';

interface UrlTableProps {
  urls: UrlItem[];
  loading: boolean;
  onSelectUrl: (url: UrlItem) => void;
  onOpenQr: (url: UrlItem) => void;
  onDeleteUrl: (id: number) => void;
  onRefresh: () => void;
}

export const UrlTable: React.FC<UrlTableProps> = ({
  urls,
  loading,
  onSelectUrl,
  onOpenQr,
  onDeleteUrl,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredUrls = urls.filter(
    (u) =>
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.customAlias && u.customAlias.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyShortUrl = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Link Management</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {urls.length} URLs
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed URLs with sub-millisecond Redis redirection and click tracking.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute inset-y-0 left-3 my-auto pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, alias, or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Title & Original Link</th>
              <th className="py-3 px-4">Short Code & Alias</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Clicks</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Loading URLs...
                </td>
              </tr>
            ) : filteredUrls.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  {searchTerm ? 'No links matching search criteria.' : 'No shortened links yet. Create one above!'}
                </td>
              </tr>
            ) : (
              filteredUrls.map((url) => (
                <tr key={url.id} className="hover:bg-slate-800/40 transition-colors group">
                  {/* Title & Original Link */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-white truncate text-sm">
                      {url.title || 'Untitled Link'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{url.originalUrl}</span>
                    </div>
                  </td>

                  {/* Short Code & Alias */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-brand-400 hover:text-brand-300 hover:underline"
                      >
                        {url.customAlias ? `/r/${url.customAlias}` : `/r/${url.shortCode}`}
                      </a>
                      <button
                        onClick={() => copyShortUrl(url.id, url.shortUrl)}
                        className="text-slate-500 hover:text-slate-200 transition-colors"
                        title="Copy short link"
                      >
                        {copiedId === url.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {url.customAlias && (
                      <span className="text-[10px] text-slate-500 font-sans">
                        code: {url.shortCode}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {url.isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Clock className="w-2.5 h-2.5" /> Expired
                      </span>
                    ) : url.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Paused
                      </span>
                    )}
                  </td>

                  {/* Clicks */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 font-mono font-bold text-slate-200 text-xs">
                      <span className="text-brand-400">⚡</span>
                      <span>{url.clickCount.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(url.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onSelectUrl(url)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-brand-600/30 text-slate-400 hover:text-brand-300 transition-colors"
                        title="View Detailed Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenQr(url)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Open destination in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onDeleteUrl(url.id)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete URL"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
