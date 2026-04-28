import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30_000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cm_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data:any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Upload ────────────────────────────────────────────────────
export const uploadApi = {
  upload: (formData:any, onProgress: any) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
    }),
  list: (page = 1) => api.get(`/upload?page=${page}`),
  status: (fileId:any) => api.get(`/upload/${fileId}/status`),
  download: (fileId:any) => api.get(`/upload/${fileId}/download`),
  delete: (fileId:any) => api.delete(`/upload/${fileId}`),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  analyze: (fileId: string, comparisonFileId?: string) =>
    api.post('/reports/analyze', { fileId, comparisonFileId }),
  retry: (fileId: string) => api.post(`/reports/retry/${fileId}`),
  list: (page = 1) => api.get(`/reports?page=${page}`),
  get: (reportId: string) => api.get(`/reports/${reportId}`),
  compare: (a: string, b: string) => api.get(`/reports/compare/${a}/${b}`),
  history: (params: any) => api.get('/reports/history/metrics', { params }),
  dashboard: () => api.get('/reports/summary/dashboard'),
  share: (reportId: string, expiresInDays = 7) =>
    api.post(`/reports/${reportId}/share`, { expiresInDays }),
  revokeShare: (reportId: string) => api.delete(`/reports/${reportId}/share`),
  getShared: (token: string) => api.get(`/reports/shared/${token}`),
};

// ── Metrics ───────────────────────────────────────────────────
export const metricsApi = {
  platforms: (params?: any) => api.get('/metrics/platforms', { params }),
  platform: (platform: string, months = 12) =>
    api.get(`/metrics/platforms/${platform}`, { params: { months } }),
  compare: (params: any) => api.get('/metrics/compare', { params }),
  funnel: (months = 1) => api.get('/metrics/funnel', { params: { months } }),
  leaderboard: (metric = 'impressions', limit = 5) =>
    api.get('/metrics/leaderboard', { params: { metric, limit } }),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsApi = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data: { fullName: string; company?: string }) =>
    api.put('/settings/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/settings/password', data),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  updateUser: (userId: string, data: { isActive?: boolean; role?: string }) =>
    api.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  retryFailedJobs: () => api.post('/admin/jobs/retry-failed'),
};

export default api;
