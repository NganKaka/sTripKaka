import { apiUrl } from './api';
import { cachedFetchJson } from './apiCache';

let tripDetailModule: Promise<unknown> | null = null;
let galleryModule: Promise<unknown> | null = null;

export function prefetchTripDetail(locationId?: string) {
  if (!tripDetailModule) tripDetailModule = import('../components/TripDetail');
  if (locationId) {
    cachedFetchJson(apiUrl(`/locations/${locationId}`)).catch(() => {});
  }
}

export function prefetchGallery(locationId?: string) {
  if (!galleryModule) galleryModule = import('../components/GalleryView');
  if (locationId) {
    cachedFetchJson(apiUrl(`/locations/${locationId}`)).catch(() => {});
  }
}
