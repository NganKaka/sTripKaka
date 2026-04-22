const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const base = (rawApiBaseUrl || 'http://localhost:8000').replace(/\/+$/, '');
export const API_BASE_URL = base.endsWith('/api') ? base : `${base}/api`;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
