const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const base = (rawApiBaseUrl || 'http://localhost:8000').replace(/\/+$/, '');
export const API_BASE_URL = base.endsWith('/api') ? base : `${base}/api`;

const VIEWER_KEY_STORAGE = 'stripkaka_viewer_key';
const RECENT_VIEWS_STORAGE = 'stripkaka_recent_views';
const RECENT_VIEWS_LIMIT = 6;

export type LocationViewType = 'mission_detail' | 'gallery';

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getOrCreateViewerKey() {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(VIEWER_KEY_STORAGE);
  if (existing) return existing;
  const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(VIEWER_KEY_STORAGE, next);
  return next;
}

export function pushRecentView(locationId: string) {
  if (typeof window === 'undefined' || !locationId) return;
  const raw = window.localStorage.getItem(RECENT_VIEWS_STORAGE);
  const current = raw ? JSON.parse(raw) : [];
  const normalized = Array.isArray(current) ? current.filter((id) => typeof id === 'string' && id !== locationId) : [];
  const next = [locationId, ...normalized].slice(0, RECENT_VIEWS_LIMIT);
  window.localStorage.setItem(RECENT_VIEWS_STORAGE, JSON.stringify(next));
}

export function getRecentViews(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(RECENT_VIEWS_STORAGE);
  const parsed = raw ? JSON.parse(raw) : [];
  return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
}

export async function trackLocationView(locationId: string, viewType: LocationViewType) {
  if (!locationId) return;
  const viewerKey = getOrCreateViewerKey();
  try {
    await fetch(apiUrl(`/locations/${locationId}/views`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_type: viewType, viewer_key: viewerKey }),
    });
  } catch {
    // best-effort tracking only
  }
}

export async function fetchPopularThisWeek(limit = 6) {
  const response = await fetch(apiUrl(`/stats/popular-this-week?limit=${limit}`));
  if (!response.ok) throw new Error('Failed to fetch popular this week');
  return response.json();
}

export async function fetchTrafficSeries(rangeDays = 7) {
  const response = await fetch(apiUrl(`/stats/traffic-series?range_days=${rangeDays}`));
  if (!response.ok) throw new Error('Failed to fetch traffic series');
  return response.json();
}

export { RECENT_VIEWS_LIMIT };
