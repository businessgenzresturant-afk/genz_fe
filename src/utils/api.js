import axios from 'axios';

const RAW_API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim();

const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

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
