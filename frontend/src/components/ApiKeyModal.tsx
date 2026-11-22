import React, { useState } from 'react';
import { X, Key, Copy, Check, RefreshCw, Terminal } from 'lucide-react';
import { User } from '../types';
import { authApi } from '../api/client';

interface ApiKeyModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(user.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Rotate your API key? Integrations using this key will immediately expire.')) {
      return;
    }
    try {
      setLoading(true);
      const updated = await authApi.regenerateApiKey();
      onUserUpdated(updated);
    } catch (e) {
      alert('Failed to regenerate key');
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async (tier: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    try {
      setLoading(true);
      const updated = await authApi.updateTier(tier);
      onUserUpdated(updated);
    } catch (e) {
      alert('Failed to update tier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="w-full max-w-md rounded-2xl bg-theme-card border border-theme-border p-6 shadow-xl relative text-theme-main">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-faint hover:text-theme-main transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-palette-terracotta/10 text-palette-terracotta flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-theme-main">Developer API Access</h3>
            <p className="text-[11px] text-theme-muted">Header: X-API-KEY</p>
          </div>
        </div>

        {/* API Key Box */}
        <div className="p-3 rounded-xl bg-theme-page border border-theme-border mb-3.5">
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs text-palette-terracotta font-mono truncate select-all">
              {user.apiKey}
            </code>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-theme-subtle text-theme-muted hover:text-theme-main text-xs flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-theme-subtle text-theme-muted hover:text-theme-main text-xs transition-colors disabled:opacity-50"
                title="Rotate Key"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tier Selector */}
        <div className="mb-4 p-3 rounded-xl bg-theme-subtle/50 border border-theme-border">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-theme-main">Tier</span>
            <span className="font-mono text-palette-terracotta font-bold">{user.rateLimitPerMinute} req/min</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['FREE', 'PRO', 'ENTERPRISE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTierChange(t)}
                className={`py-1 px-2 rounded-lg text-xs font-semibold font-mono border transition-all ${
                  user.tier === t
                    ? 'bg-palette-terracotta text-palette-cream border-palette-terracotta shadow-xs'
                    : 'bg-theme-card text-theme-muted border-theme-border hover:border-theme-border-hover'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal cURL snippet */}
        <div className="p-2.5 rounded-xl bg-theme-page border border-theme-border text-[11px] font-mono text-theme-muted overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:8080/api/v1/urls \\
  -H "X-API-KEY: ${user.apiKey}" \\
  -d '{"originalUrl": "https://base62.ai"}'`}
        </div>
      </div>
    </div>
  );
};
