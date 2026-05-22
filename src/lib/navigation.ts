import type { AppRouteState, AppTab } from '../types/navigation';

export const DEFAULT_LOCATION_ID = 'phu_quoc';

export function getRouteState(pathname: string): AppRouteState {
  if (pathname === '/') return { activeTab: 'Dashboard', locationId: DEFAULT_LOCATION_ID };
  if (pathname === '/archives') return { activeTab: 'Journal', locationId: DEFAULT_LOCATION_ID };
  if (pathname === '/admin') return { activeTab: 'Admin', locationId: DEFAULT_LOCATION_ID };
  if (pathname === '/stats') return { activeTab: 'Stats', locationId: DEFAULT_LOCATION_ID };

  if (pathname.startsWith('/gallery/')) {
    return { activeTab: 'Gallery', locationId: pathname.split('/')[2] || DEFAULT_LOCATION_ID };
  }

  if (pathname.startsWith('/mission-detail/')) {
    return { activeTab: 'Destinations', locationId: pathname.split('/')[2] || DEFAULT_LOCATION_ID };
  }

  return { activeTab: 'Dashboard', locationId: DEFAULT_LOCATION_ID };
}

export function isMusicRoute(activeTab: AppTab) {
  return activeTab === 'Destinations' || activeTab === 'Gallery';
}
