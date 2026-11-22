import axios from 'axios';
import {
  AuthResponse,
  User,
  UrlItem,
  AnalyticsOverview,
  AiInsights,
  AiChatMessage,
} from '../types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rate limit state listeners
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetSeconds: number;
};

let rateLimitListener: ((info: RateLimitInfo) => void) | null = null;

export const setRateLimitListener = (listener: (info: RateLimitInfo) => void) => {
  rateLimitListener = listener;
};

// Request interceptor to attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('base62_token') || localStorage.getItem('linkmind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to read rate limits
api.interceptors.response.use(
  (response) => {
    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (limit && remaining && rateLimitListener) {
      rateLimitListener({
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetSeconds: parseInt(reset || '60', 10),
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('base62_token');
      localStorage.removeItem('linkmind_token');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string):Promise<AuthResponse> => {
    const res = await api.post('/api/v1/auth/login', { email, password });
    return res.data.data;
  },
  register: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const res = await api.post('/api/v1/auth/register', { email, password, fullName });
    return res.data.data;
  },
  getProfile: async (): Promise<User> => {
    const res = await api.get('/api/v1/auth/me');
    return res.data.data;
  },
  regenerateApiKey: async (): Promise<User> => {
    const res = await api.post('/api/v1/auth/regenerate-api-key');
    return res.data.data;
  },
  updateTier: async (tier: 'FREE' | 'PRO' | 'ENTERPRISE'): Promise<User> => {
    const res = await api.post('/api/v1/auth/tier', { tier });
    return res.data.data;
  },
};

export const urlApi = {
  createUrl: async (payload: {
    originalUrl: string;
    customAlias?: string;
    title?: string;
    description?: string;
    expiresAt?: string;
  }): Promise<UrlItem> => {
    const res = await api.post('/api/v1/urls', payload);
    return res.data.data;
  },
  getUrls: async (page = 0, size = 15): Promise<{ content: UrlItem[]; totalElements: number }> => {
    const res = await api.get(`/api/v1/urls?page=${page}&size=${size}`);
    return res.data.data;
  },
  getUrl: async (id: number): Promise<UrlItem> => {
    const res = await api.get(`/api/v1/urls/${id}`);
    return res.data.data;
  },
  deleteUrl: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/urls/${id}`);
  },
};

export const analyticsApi = {
  getOverview: async (days = 7): Promise<AnalyticsOverview> => {
    const res = await api.get(`/api/v1/analytics/overview?days=${days}`);
    return res.data.data;
  },
  getUrlAnalytics: async (urlId: number, days = 7): Promise<AnalyticsOverview> => {
    const res = await api.get(`/api/v1/analytics/url/${urlId}?days=${days}`);
    return res.data.data;
  },
};

export const aiApi = {
  getUrlInsights: async (urlId: number): Promise<AiInsights> => {
    const res = await api.get(`/api/v1/ai/insights/url/${urlId}`);
    return res.data.data;
  },
  getOverallInsights: async (): Promise<AiInsights> => {
    const res = await api.get('/api/v1/ai/insights/overview');
    return res.data.data;
  },
  chat: async (question: string, urlId?: number): Promise<{ answer: string; suggestedFollowUps: string[]; quickInsights: AiInsights }> => {
    const res = await api.post('/api/v1/ai/chat', { question, urlId });
    return res.data.data;
  },
};

export default api;
