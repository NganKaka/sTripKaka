import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiUrl } from '../lib/api';

type HighlightType = 'primary' | 'secondary' | 'highlight';

type DbLocation = {
  id: string;
  name: string;
  chapter: string;
  short_desc: string;
  img: string;
  visited_date: string;
  highlight_type: HighlightType;
  lat: string;
  lng: string;
};

interface LocationData {
  id: string;
  name: string;
  coords: [number, number];
  chapter: string;
  desc: string;
  img: string;
  date: string;
  type: HighlightType;
  radiusKm: number;
}

const getRadiusByType = (type: HighlightType): number => {
  if (type === 'highlight') return 28;
  if (type === 'primary') return 20;
  return 14;
};

const toMapLocation = (location: DbLocation): LocationData | null => {
  const lng = Number(location.lng);
  const lat = Number(location.lat);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  return {
    id: location.id,
    name: location.name,
    coords: [lng, lat],
    chapter: location.chapter,
    desc: location.short_desc,
    img: location.img,
    date: location.visited_date,
    type: location.highlight_type || 'secondary',
    radiusKm: getRadiusByType(location.highlight_type || 'secondary'),
  };
};

const buildRouteGeoJSON = (locations: LocationData[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: locations.map(location => location.coords),
      },
    },
  ],
});

const sortByLatitudeAsc = (a: DbLocation, b: DbLocation) => {
  const aLat = Number(a.lat);
  const bLat = Number(b.lat);
  if (!Number.isNaN(aLat) && !Number.isNaN(bLat)) return aLat - bLat;
  if (!Number.isNaN(aLat)) return -1;
  if (!Number.isNaN(bLat)) return 1;
  return a.id.localeCompare(b.id);
};

interface InteractiveMapProps {
  provinceCount: number;
  recentTripName: string;
  onOpenExpeditionLog: (locationId: string) => void;
}

export default function InteractiveMap({ provinceCount, recentTripName, onOpenExpeditionLog }: InteractiveMapProps) {
// Build a circle polygon (approx) from a center + radius
function createCircleGeoJSON(center: [number, number], radiusKm: number, steps = 64): GeoJSON.Feature {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / 111) * Math.cos(angle);
    const dLng = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } };
}

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const mapInitialized = useRef(false);
  const onOpenExpeditionLogRef = useRef(onOpenExpeditionLog);
  onOpenExpeditionLogRef.current = onOpenExpeditionLog;
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);

  const initMap = useCallback((locs: LocationData[]) => {
    if (!mapContainer.current || mapInitialized.current || !locs.length) return;

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [106.5, 16.0],
      zoom: 4.5,
      minZoom: 3.5,
      maxZoom: 12,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      dragRotate: false,
    });

    newMap.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, showZoom: true }),
      'top-right'
    );

    newMap.on('load', () => {
      const m = newMap;

      m.addSource('vietnam', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/VNM.geo.json',
      });
      m.addLayer({ id: 'vietnam-fill', type: 'fill', source: 'vietnam', paint: { 'fill-color': '#22d3ee', 'fill-opacity': 0.03 } });
      m.addLayer({ id: 'vietnam-border-glow', type: 'line', source: 'vietnam', paint: { 'line-color': '#22d3ee', 'line-width': 4, 'line-blur': 4, 'line-opacity': 0.15 } });
      m.addLayer({ id: 'vietnam-border', type: 'line', source: 'vietnam', paint: { 'line-color': '#22d3ee', 'line-width': 1, 'line-opacity': 0.4 } });

      const routeGeoJSON = buildRouteGeoJSON(locs);
      m.addSource('route', { type: 'geojson', data: routeGeoJSON });
      m.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#e9c349', 'line-width': 8, 'line-opacity': 0.12, 'line-blur': 8 } });
      m.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#e9c349', 'line-width': 1.5, 'line-opacity': 0.6, 'line-dasharray': [2, 4] } });

      locs.forEach((loc, idx) => {
        const color = loc.type === 'highlight' ? '#22d3ee' : loc.type === 'primary' ? '#e9c349' : '#bbc9d0';
        const fillOpacity = loc.type === 'highlight' ? 0.15 : loc.type === 'primary' ? 0.10 : 0.07;
        const circleId = `circle-${idx}`;

        m.addSource(circleId, { type: 'geojson', data: createCircleGeoJSON(loc.coords, loc.radiusKm) });
        m.addLayer({ id: `${circleId}-fill`, type: 'fill', source: circleId, paint: { 'fill-color': color, 'fill-opacity': fillOpacity } });
        m.addLayer({ id: `${circleId}-stroke`, type: 'line', source: circleId, paint: { 'line-color': color, 'line-width': 1.2, 'line-opacity': 0.5 } });

        const size = loc.type === 'highlight' ? 16 : loc.type === 'primary' ? 12 : 8;
        const markerEl = document.createElement('div');
        markerEl.innerHTML = `
          <div style="
            width:${size}px; height:${size}px;
            background:${color};
            border-radius:50%;
            box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size}px ${color};
            cursor:pointer;
            transition:transform 0.3s ease;
            position:relative;
          ">
            ${loc.type !== 'secondary' ? `
              <div style="
                position:absolute; inset:-4px;
                border:1.5px solid ${color};
                border-radius:50%;
                opacity:0.4;
                animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;
              "></div>` : ''}
          </div>`;
        const dotEl = markerEl.firstElementChild as HTMLDivElement;
        markerEl.addEventListener('mouseenter', () => {
          if (dotEl) dotEl.style.transform = 'scale(1.5)';
        });
        markerEl.addEventListener('mouseleave', () => {
          if (dotEl) dotEl.style.transform = 'scale(1)';
        });

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, closeOnClick: true, maxWidth: '280px', className: 'stripkaka-popup' })
          .setHTML(`
            <div style="background:rgba(29,32,35,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:12px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 30px rgba(233,195,73,0.1);">
              <img src="${loc.img}" alt="${loc.name}" style="width:100%;height:130px;object-fit:cover;border-bottom:1px solid rgba(255,255,255,0.05);" referrerpolicy="no-referrer"/>
              <div style="padding:12px 14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.15em;color:${color};text-transform:uppercase;">${loc.chapter}</span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(187,201,208,0.5);">${loc.date || 'N/A'}</span>
                </div>
                <h4 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;color:#e1e2e7;margin:0 0 6px;">${loc.name}</h4>
                <p style="font-family:'Manrope',serif;font-size:11px;line-height:1.5;color:rgba(187,201,208,0.7);margin:0 0 12px;">${loc.desc}</p>
                <button type="button"
                   data-location-id="${loc.id}"
                   style="display:block;width:100%;text-align:center;background:${color};color:#000;padding:8px;border:none;border-radius:6px;font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;font-weight:800;text-decoration:none;letter-spacing:0.1em;transition:all 0.3s;box-shadow:0 10px 20px -5px ${color}66;cursor:pointer;"
                   onmouseover="this.style.opacity='0.8';this.style.transform='translateY(-1px)'"
                   onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                  OPEN EXPEDITION LOG
                </button>
              </div>
            </div>`);

        popup.on('open', () => {
          const popupEl = popup.getElement();
          const button = popupEl?.querySelector<HTMLButtonElement>(`button[data-location-id="${loc.id}"]`);
          if (!button) return;
          button.onclick = () => onOpenExpeditionLogRef.current(loc.id);
        });

        new mapboxgl.Marker({ element: markerEl }).setLngLat(loc.coords).setPopup(popup).addTo(m);
      });
    });

    mapInitialized.current = true;
    map.current = newMap;
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    fetch(apiUrl('/locations'))
      .then(res => res.json())
      .then((data: DbLocation[]) => {
        const mapped = Array.isArray(data)
          ? data
              .slice()
              .sort(sortByLatitudeAsc)
              .map(toMapLocation)
              .filter((item): item is LocationData => !!item)
          : [];
        setLocations(mapped);
        initMap(mapped);
      })
      .catch(err => {
        console.error('Error fetching map locations:', err);
        setLocations([]);
        setMapLoaded(true);
      });
  }, [initMap]);

  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
      mapInitialized.current = false;
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
      <div ref={mapContainer} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-tech text-[10px] tracking-widest text-primary/80 uppercase">Loading cartography...</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex flex-col gap-1 z-10 pointer-events-none">
        <span className="text-secondary text-[10px] uppercase tracking-wider font-bold">Provinces Explored</span>
        <span className="text-primary font-headline text-3xl font-bold drop-shadow-[0_0_10px_rgba(233,195,73,0.5)]">{provinceCount}<span className="text-secondary/50 text-xl">/63</span></span>
      </div>

      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex flex-col gap-1 text-right z-10 pointer-events-none">
        <span className="text-secondary text-[10px] uppercase tracking-wider font-bold">Recent Trip</span>
        <span className="text-cyan-400 font-headline text-xl font-bold drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{recentTripName || 'No trip yet'}</span>
      </div>
    </div>
  );
}
