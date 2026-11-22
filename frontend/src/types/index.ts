export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';
export type UserTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  tier: UserTier;
  apiKey: string;
  rateLimitPerMinute: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  tier: UserTier;
  apiKey: string;
}

export interface UrlItem {
  id: number;
  userId: number;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  shortUrl: string;
  title: string;
  description?: string;
  qrCodeDataUri?: string;
  isActive: boolean;
  isExpired: boolean;
  expiresAt?: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSeriesPoint {
  date: string;
  clicks: number;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export interface CountryItem {
  countryCode: string;
  countryName: string;
  count: number;
  percentage: number;
}

export interface AnalyticsOverview {
  totalClicks: number;
  weeklyChangePercentage: number;
  timeSeries: TimeSeriesPoint[];
  devices: DistributionItem[];
  browsers: DistributionItem[];
  operatingSystems: DistributionItem[];
  topReferrers: DistributionItem[];
  topCountries: CountryItem[];
}

export interface AiInsights {
  summary: string;
  engagementScore: number;
  trendDirection: 'GROWING' | 'DECLINING' | 'STEADY' | 'NEW_LINK' | 'STABLE';
  changePercentage: number;
  keyFactors: string[];
  recommendations: string[];
  optimalPostingWindow: string;
  dominantAudience: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedFollowUps?: string[];
  quickInsights?: AiInsights;
}
