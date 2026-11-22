import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { AnalyticsOverview, UrlItem } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsOverview | null;
  selectedUrl: UrlItem | null;
  onClearSelectedUrl: () => void;
  onOpenAiChat: (question?: string) => void;
}

const PALETTE_COLORS = ['#D4621A', '#F4AE52', '#E28C38', '#C45112', '#F9CA7A'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  selectedUrl,
  onClearSelectedUrl,
  onOpenAiChat,
}) => {
  if (!analytics) {
    return (
      <div className="card-aesthetic rounded-2xl p-12 text-center text-theme-muted text-xs">
        Loading analytics...
      </div>
    );
  }

  const isGrowthPositive = analytics.weeklyChangePercentage >= 0;

  return (
    <div className="space-y-6 pt-2">
      {/* Quiet Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-theme-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-theme-main">
              {selectedUrl ? selectedUrl.title : 'Overview'}
            </h2>
            {selectedUrl && (
              <button
                onClick={onClearSelectedUrl}
                className="text-xs text-palette-terracotta hover:underline font-medium"
              >
                (View All)
              </button>
            )}
          </div>
          <p className="text-xs text-theme-muted mt-0.5">
            {selectedUrl ? selectedUrl.originalUrl : 'Performance across all shortened links.'}
          </p>
        </div>

        <button
          onClick={() => onOpenAiChat("Why did my link traffic shift this week?")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-card hover:bg-theme-subtle border border-theme-border text-xs font-semibold text-palette-terracotta shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Analysis</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <div className="card-aesthetic rounded-2xl p-4">
          <div className="text-xs text-theme-muted font-medium">Total Clicks</div>
          <div className="text-2xl font-extrabold text-theme-main mt-1 font-mono">
            {analytics.totalClicks.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            {isGrowthPositive ? (
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{analytics.weeklyChangePercentage}%
              </span>
            ) : (
              <span className="flex items-center text-rose-500 font-semibold">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {analytics.weeklyChangePercentage}%
              </span>
            )}
            <span className="text-theme-faint">7d</span>
          </div>
        </div>

        {/* Top Referral */}
        <div className="card-aesthetic rounded-2xl p-4">
          <div className="text-xs text-theme-muted font-medium">Top Source</div>
          <div className="text-lg font-bold text-theme-main mt-1 truncate">
            {analytics.topReferrers.length > 0 ? analytics.topReferrers[0].name : 'Direct'}
          </div>
          <div className="text-[11px] text-theme-muted mt-1 truncate">
            {analytics.topReferrers.length > 0 ? `${analytics.topReferrers[0].percentage}% of traffic` : 'Direct inbound'}
          </div>
        </div>

        {/* Primary Device */}
        <div className="card-aesthetic rounded-2xl p-4">
          <div className="text-xs text-theme-muted font-medium">Top Device</div>
          <div className="text-lg font-bold text-theme-main mt-1">
            {analytics.devices.length > 0 ? analytics.devices[0].name : 'Desktop'}
          </div>
          <div className="text-[11px] text-theme-muted mt-1">
            {analytics.devices.length > 0 ? `${analytics.devices[0].percentage}% share` : 'Balanced'}
          </div>
        </div>

        {/* Top Location */}
        <div className="card-aesthetic rounded-2xl p-4">
          <div className="text-xs text-theme-muted font-medium">Top Country</div>
          <div className="text-lg font-bold text-theme-main mt-1 truncate">
            {analytics.topCountries.length > 0 ? analytics.topCountries[0].countryName : 'Global'}
          </div>
          <div className="text-[11px] text-theme-muted mt-1">
            {analytics.topCountries.length > 0 ? `${analytics.topCountries[0].percentage}% reach` : 'Global reach'}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card-aesthetic rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider">
            Daily Traffic Velocity
          </h3>
          <span className="text-[11px] text-theme-muted font-mono">Past 7 days</span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="aestheticArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4621A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F4AE52" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="currentColor" className="text-theme-faint" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-theme-faint" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: 'var(--text-main)',
                  boxShadow: 'var(--shadow-card)',
                }}
              />
              <Area type="monotone" dataKey="clicks" stroke="#D4621A" strokeWidth={2.5} fillOpacity={1} fill="url(#aestheticArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Device Breakdown & Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Breakdown */}
        <div className="card-aesthetic rounded-2xl p-5 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider mb-2">
            Device Share
          </h3>

          <div className="h-44 w-full flex items-center justify-center">
            {analytics.devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.devices}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {analytics.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: 'var(--text-main)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-theme-faint text-xs">No data recorded.</div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 pt-3 border-t border-theme-border text-center">
            {analytics.devices.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length] }} />
                <span className="text-theme-muted">{item.name}</span>
                <span className="font-semibold text-theme-main font-mono">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referrers */}
        <div className="card-aesthetic rounded-2xl p-5 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider mb-2">
            Referrers
          </h3>

          <div className="space-y-2.5 my-auto">
            {analytics.topReferrers.length > 0 ? (
              analytics.topReferrers.map((ref) => (
                <div key={ref.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-theme-main truncate">{ref.name}</span>
                    <span className="font-mono text-theme-muted">{ref.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-theme-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-palette-terracotta rounded-full transition-all"
                      style={{ width: `${ref.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-theme-faint text-xs py-8 text-center">No referrers yet.</div>
            )}
          </div>

          <div className="pt-3 border-t border-theme-border text-right">
            <button
              onClick={() => onOpenAiChat("How can I improve my referrer conversions?")}
              className="text-xs text-palette-terracotta hover:underline font-medium"
            >
              Analyze Sources with AI →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
