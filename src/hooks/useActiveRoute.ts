import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_LOCATION_ID, getRouteState } from '../lib/navigation';

export function useActiveRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTab, locationId } = useMemo(() => getRouteState(location.pathname), [location.pathname]);

  const setActiveTab = useCallback((tab: string) => {
    if (tab.startsWith('Destinations:')) {
      const id = tab.split(':')[1] || DEFAULT_LOCATION_ID;
      navigate(`/mission-detail/${id}`);
      return;
    }
    if (tab.startsWith('Gallery:')) {
      const id = tab.split(':')[1] || DEFAULT_LOCATION_ID;
      navigate(`/gallery/${id}`);
      return;
    }

    switch(tab) {
      case 'Dashboard': navigate('/'); break;
      case 'Journal': navigate('/archives'); break;
      case 'Gallery': navigate(`/gallery/${locationId}`); break;
      case 'Stats': navigate('/stats'); break;
      case 'Admin': navigate('/admin'); break;
      default: navigate('/');
    }
  }, [locationId, navigate]);

  return { activeTab, locationId, pathname: location.pathname, setActiveTab };
}
