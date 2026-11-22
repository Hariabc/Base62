import React, { useState } from 'react';
import { Search, ExternalLink, Copy, Check, QrCode, BarChart3, Trash2 } from 'lucide-react';
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
    <div className="card-aesthetic rounded-2xl overflow-hidden mt-6 shadow-md">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-theme-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-theme-card">
        <div>
          <h2 className="text-sm font-bold text-theme-main flex items-center gap-2">
            <span>Links</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-theme-subtle text-palette-amber font-semibold border border-theme-border">
              {urls.length}
            </span>
          </h2>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-theme-faint absolute inset-y-0 left-3 my-auto pointer-events-none" />
          <input
            type="text"
            placeholder="Search links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-theme-input border border-theme-border text-xs text-theme-main placeholder-theme-faint focus:outline-none focus:border-palette-terracotta"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-theme-subtle/50 text-theme-muted font-bold text-[10px] uppercase tracking-wider border-b border-theme-border">
            <tr>
              <th className="py-2.5 px-4">Destination</th>
              <th className="py-2.5 px-4">Short Link</th>
              <th className="py-2.5 px-4 text-center">Clicks</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border text-theme-main">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-theme-faint text-xs">
                  Loading links...
                </td>
              </tr>
            ) : filteredUrls.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-theme-faint text-xs">
                  {searchTerm ? 'No links found matching your search.' : 'No links yet. Shorten your first link above!'}
                </td>
              </tr>
            ) : (
              filteredUrls.map((url) => (
                <tr key={url.id} className="hover:bg-theme-subtle/40 transition-colors group">
                  {/* Title & Original Link */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-theme-main truncate flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${url.isActive && !url.isExpired ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="truncate">{url.title || 'Untitled Link'}</span>
                    </div>
                    <div className="text-[11px] text-theme-muted truncate pl-3.5 mt-0.5">
                      {url.originalUrl}
                    </div>
                  </td>

                  {/* Short Code & Copy */}
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-palette-amber hover:underline text-xs"
                      >
                        {url.customAlias ? `/r/${url.customAlias}` : `/r/${url.shortCode}`}
                      </a>
                      <button
                        onClick={() => copyShortUrl(url.id, url.shortUrl)}
                        className="text-theme-faint hover:text-theme-main transition-colors"
                        title="Copy short link"
                      >
                        {copiedId === url.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Clicks */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-xs font-bold text-theme-main px-2 py-0.5 rounded-md bg-theme-subtle border border-theme-border">
                      {url.clickCount.toLocaleString()}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="py-3 px-4 text-theme-muted text-[11px] font-mono">
                    {new Date(url.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onSelectUrl(url)}
                        className="p-1.5 rounded-lg hover:bg-theme-subtle text-theme-muted hover:text-palette-terracotta transition-colors border border-transparent hover:border-theme-border"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenQr(url)}
                        className="p-1.5 rounded-lg hover:bg-theme-subtle text-theme-muted hover:text-theme-main transition-colors border border-transparent hover:border-theme-border"
                        title="QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-theme-subtle text-theme-muted hover:text-theme-main transition-colors border border-transparent hover:border-theme-border"
                        title="Open Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onDeleteUrl(url.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-theme-faint hover:text-rose-500 transition-colors border border-transparent hover:border-rose-500/20"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
