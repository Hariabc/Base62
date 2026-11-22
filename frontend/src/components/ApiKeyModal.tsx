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
    if (!window.confirm('Are you sure you want to rotate your API key? Previous integrations using this key will immediately stop working.')) {
      return;
    }
    try {
      setLoading(true);
      const updated = await authApi.regenerateApiKey();
      onUserUpdated(updated);
    } catch (e) {
      alert('Failed to regenerate API key');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-espresso-900 border border-espresso-800 p-6 sm:p-7 shadow-2xl relative text-palette-cream">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-200/60 hover:text-palette-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-palette-amber flex items-center justify-center border border-brand-500/30 shadow-md">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-palette-cream">Developer API Access</h3>
            <p className="text-xs text-amber-100/60">Authenticate backend microservices via X-API-KEY header.</p>
          </div>
        </div>

        {/* API Key Box */}
        <div className="p-3.5 rounded-xl bg-espresso-950 border border-espresso-800 mb-4">
          <label className="block text-[11px] font-semibold text-amber-200/60 uppercase tracking-wider mb-1.5">
            Your Secret API Key
          </label>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs text-palette-amber font-mono truncate select-all">
              {user.apiKey}
            </code>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-espresso-850 hover:bg-espresso-800 text-palette-cream text-xs flex items-center gap-1 transition-colors border border-espresso-750"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="p-1.5 rounded-lg bg-espresso-850 hover:bg-espresso-800 text-palette-cream text-xs flex items-center gap-1 transition-colors disabled:opacity-50 border border-espresso-750"
                title="Rotate Key"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-palette-amber' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tier Upgrade Selector */}
        <div className="mb-5 p-3.5 rounded-xl bg-espresso-950/80 border border-espresso-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-amber-100/90">Rate Limit Tier</span>
            <span className="font-mono text-palette-amber font-bold">{user.rateLimitPerMinute} req/min</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['FREE', 'PRO', 'ENTERPRISE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTierChange(t)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold font-mono border transition-all ${
                  user.tier === t
                    ? 'bg-brand-600 text-palette-cream border-brand-500 shadow-md shadow-brand-600/30'
                    : 'bg-espresso-900 text-amber-200/60 border-espresso-800 hover:border-espresso-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Code Sample */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200/70 mb-1.5">
            <Terminal className="w-3.5 h-3.5 text-palette-amber" />
            <span>Example cURL Request</span>
          </div>
          <pre className="p-3 rounded-xl bg-espresso-950 border border-espresso-800 text-[11px] text-amber-100/90 font-mono overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:8080/api/v1/urls \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${user.apiKey}" \\
  -d '{"originalUrl": "https://base62.ai/docs"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
};
