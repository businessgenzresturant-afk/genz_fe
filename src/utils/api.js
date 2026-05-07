import axios from 'axios';

function readFirstEnv(keys) {
  for (const key of keys) {
    const value = import.meta.env?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeBaseUrl(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
}

const RAW_API_BASE_URL = readFirstEnv([
  'VITE_API_BASE_URL',
  'VITE_BACKEND_URL',
  'API_BASE_URL',
  'BACKEND_URL',
]);

const API_BASE_URL = normalizeBaseUrl(RAW_API_BASE_URL);

export function apiUrl(path) {
  if (!path) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
});
