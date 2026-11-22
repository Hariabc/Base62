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
    a.download = `base62-qr-${url.customAlias || url.shortCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-espresso-900 border border-espresso-800 p-6 shadow-2xl text-center relative text-palette-cream">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-200/60 hover:text-palette-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-palette-cream mb-1">
          {url.title || 'Dynamic QR Code'}
        </h3>
        <p className="text-xs text-palette-amber mb-5 font-mono truncate">
          {url.shortUrl}
        </p>

        {/* QR Code Container */}
        <div className="p-4 rounded-xl bg-white mx-auto w-64 h-64 flex items-center justify-center shadow-lg">
          {url.qrCodeDataUri ? (
            <img
              src={url.qrCodeDataUri}
              alt="Link QR Code"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-espresso-900 text-xs font-medium">Generating QR...</div>
          )}
        </div>

        {/* Destination Info */}
        <p className="text-[11px] text-amber-100/60 mt-4 truncate max-w-xs mx-auto">
          Points to: {url.originalUrl}
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-palette-cream text-xs font-semibold shadow-md shadow-brand-600/30 transition-all border border-brand-400/30"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-espresso-850 hover:bg-espresso-800 text-palette-cream text-xs font-semibold border border-espresso-750 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
