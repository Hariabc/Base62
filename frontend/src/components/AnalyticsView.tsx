import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, Smartphone, Globe, Compass, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { AnalyticsOverview, UrlItem } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsOverview | null;
  selectedUrl: UrlItem | null;
  onClearSelectedUrl: () => void;
  onOpenAiChat: (question?: string) => void;
}

const DEVICE_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  selectedUrl,
  onClearSelectedUrl,
  onOpenAiChat,
}) => {
  if (!analytics) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center text-slate-500">
        Loading analytics stream...
      </div>
    );
  }

  const isGrowthPositive = analytics.weeklyChangePercentage >= 0;

  return (
    <div className="space-y-6">
      {/* Selected URL Banner or Global Portfolio Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              {selectedUrl ? `Analytics for: ${selectedUrl.title}` : 'All Links Performance (Portfolio View)'}
            </h3>
            {selectedUrl && (
              <button
                onClick={onClearSelectedUrl}
                className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
              >
                (View All Links)
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedUrl ? selectedUrl.originalUrl : 'Real-time telemetry gathered across your global link redirects.'}
          </p>
        </div>

        <button
          onClick={() => onOpenAiChat("Why did my link traffic decrease this week?")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          <span>Ask AI: Why Did Traffic Shift?</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Click Stream</span>
            <Activity className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {isGrowthPositive ? (
              <span className="flex items-center text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{analytics.weeklyChangePercentage}%
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-semibold">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {analytics.weeklyChangePercentage}%
              </span>
            )}
            <span className="text-slate-500">vs prior 7 days</span>
          </div>
        </div>

        {/* Top Referral Channel */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Primary Conversion Channel</span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 truncate">
            {analytics.topReferrers.length > 0 ? analytics.topReferrers[0].name : 'Direct / Unknown'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {analytics.topReferrers.length > 0
              ? `${analytics.topReferrers[0].percentage}% of total inbound traffic`
              : 'Direct visitors'}
          </div>
        </div>

        {/* Primary Device */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Dominant Platform</span>
            <Smartphone className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {analytics.devices.length > 0 ? analytics.devices[0].name : 'Desktop'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {analytics.devices.length > 0 ? `${analytics.devices[0].percentage}% market share` : 'Balanced'}
          </div>
        </div>

        {/* Top Region */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Top Geographic Market</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 truncate">
            {analytics.topCountries.length > 0 ? analytics.topCountries[0].countryName : 'Global'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {analytics.topCountries.length > 0 ? `${analytics.topCountries[0].percentage}% international reach` : 'Global coverage'}
          </div>
        </div>
      </div>

      {/* Main Time-Series Traffic Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Daily Traffic Velocity</h4>
            <p className="text-xs text-slate-400">Chronological click volume across the selected window.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Async Ingestion Pipeline</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e8ce9" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#0e8ce9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="clicks" stroke="#38a9f8" strokeWidth={3} fillOpacity={1} fill="url(#clickGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Device Distribution & Top Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Device Breakdown Donut */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Device Breakdown</h4>
            <p className="text-xs text-slate-400 mb-4">Distribution by client viewport category.</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {analytics.devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.devices}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {analytics.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-xs">No device data available.</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center">
            {analytics.devices.map((item, idx) => (
              <div key={item.name} className="p-2 rounded-lg bg-slate-950/60">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[idx % DEVICE_COLORS.length] }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-sm font-bold text-white mt-1 font-mono">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Inbound Referrer Sources</h4>
            <p className="text-xs text-slate-400 mb-4">Top platforms driving audience engagement.</p>
          </div>

          <div className="space-y-3">
            {analytics.topReferrers.length > 0 ? (
              analytics.topReferrers.map((ref, idx) => (
                <div key={ref.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300 truncate max-w-[200px]">{ref.name}</span>
                    <span className="font-mono text-slate-400 font-semibold">{ref.count} clicks ({ref.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${ref.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs py-10 text-center">No referrer data recorded yet.</div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Automated HTTP Referer header analysis</span>
            <button
              onClick={() => onOpenAiChat("How can I improve my referrer conversions?")}
              className="text-brand-400 hover:text-brand-300 underline font-medium"
            >
              Analyze with AI
            </button>
          </div>
        </div>
      </div>

      {/* Top Countries Table */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-1">Geographic Distribution</h4>
        <p className="text-xs text-slate-400 mb-4">Click origins determined via MaxMind / Edge IP Geolocation.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {analytics.topCountries.map((c) => (
            <div key={c.countryCode} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{c.countryName}</div>
                <div className="text-[10px] text-slate-400 font-mono">Code: {c.countryCode}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-brand-400 font-mono">{c.count}</div>
                <div className="text-[10px] text-slate-400">{c.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
