import React, { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { UrlItem } from '../types';

interface QrCodeModalProps {
  url: UrlItem | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!url.qrCodeDataUri) return;
    const a = document.createElement('a');
    a.href = url.qrCodeDataUri;
    a.download = `base62-${url.customAlias || url.shortCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="w-full max-w-xs rounded-2xl bg-theme-card border border-theme-border p-5 shadow-xl text-center relative text-theme-main">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-faint hover:text-theme-main transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-bold text-theme-main mb-0.5 truncate">
          {url.title || 'QR Code'}
        </h3>
        <p className="text-xs text-palette-terracotta mb-4 font-mono truncate">
          {url.shortUrl}
        </p>

        {/* QR Code Container */}
        <div className="p-3 rounded-xl bg-white mx-auto w-52 h-52 flex items-center justify-center shadow-xs border border-theme-border">
          {url.qrCodeDataUri ? (
            <img
              src={url.qrCodeDataUri}
              alt="QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-theme-faint text-xs">Generating QR...</div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-palette-terracotta hover:bg-brand-700 text-palette-cream text-xs font-semibold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-theme-subtle hover:bg-theme-border text-theme-main text-xs font-semibold transition-all border border-theme-border"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
