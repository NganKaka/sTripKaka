import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.dummy_token_not_real';

interface LocationData {
  name: string;
  coords: [number, number]; // [lng, lat]
  chapter: string;
  desc: string;
  img: string;
  date: string;
  type: 'primary' | 'secondary' | 'highlight';
  radiusKm: number;
  dbId?: string; // Add this to track if it exists in DB
}

const locations: LocationData[] = [
  { name: "Sapa",           coords: [103.8440, 22.3363], chapter: "Chapter I",   desc: "Mist-woven trails through terraced rice fields in the northern highlands.", img: "https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&q=80&w=400", date: "Mar 2024", type: "secondary",  radiusKm: 18 },
  { name: "Hanoi",          coords: [105.8342, 21.0278], chapter: "Chapter II",  desc: "The ancient capital's labyrinthine streets hummed with stories of a thousand years.", img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=400", date: "Mar 2024", type: "primary",    radiusKm: 22 },
  { name: "Hue",            coords: [107.5905, 16.4637], chapter: "Chapter III", desc: "Imperial citadels and perfumed rivers under a contemplative sky.", img: "/hue/hue_landscape_1.jpg", date: "Apr 2024", type: "secondary",  radiusKm: 14 },
  { name: "Da Nang",        coords: [108.2022, 16.0544], chapter: "Chapter IV",  desc: "Where marble mountains meet the endless turquoise shore.", img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=400", date: "Apr 2024", type: "secondary",  radiusKm: 16 },
  { name: "Nha Trang",      coords: [109.1967, 12.2388], chapter: "Chapter V",   desc: "Crystal waters and sun-bleached shores stretching to infinity.", img: "https://images.unsplash.com/photo-1537956965359-7573183d1f57?auto=format&fit=crop&q=80&w=400", date: "May 2024", type: "secondary",  radiusKm: 14 },
  { name: "Da Lat",         coords: [108.4583, 11.9404], chapter: "Chapter VI",  desc: "The city of eternal spring, draped in fog and pine-scented breeze.", img: "https://images.unsplash.com/photo-1555217851-6141535bd330?auto=format&fit=crop&q=80&w=400", date: "Jun 2024", type: "primary",    radiusKm: 16 },
  { name: "Ho Chi Minh City", coords: [106.6297, 10.8231], chapter: "Chapter VII", desc: "A metropolis of neon and nostalgia — the beating heart of the south.", img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=400", date: "Jul 2024", type: "primary",    radiusKm: 28 },
  { name: "Can Tho",        coords: [105.7469, 10.0452], chapter: "Chapter VIII", desc: "Floating markets at dawn, where the Mekong whispers ancient trade routes.", img: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400", date: "Aug 2024", type: "secondary",  radiusKm: 16 },
  { name: "Phu Quoc",       coords: [103.9840, 10.2270], chapter: "Chapter IX",  desc: "Golden hour painting the ocean. A perfect escape into the warm coastal breeze.", img: "/phu_quoc/pq_landscape_sea.jpg", date: "Sep 2024", type: "highlight",   radiusKm: 28 },
];

// GeoJSON Route
const routeGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: locations.map(l => l.coords) } }],
};

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

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dbLocationIds, setDbLocationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('http://localhost:8000/api/locations')
      .then(res => res.json())
      .then(data => {
        const ids = new Set(data.map((l: any) => l.id.toLowerCase()));
        setDbLocationIds(ids);
      })
      .catch(err => console.error("Error fetching location IDs:", err));
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) {
        map.current.remove();
        map.current = null;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [106.5, 16.0],   // centred on Vietnam vertically
      zoom: 4.5,                // zoomed out enough to see all of Vietnam
      minZoom: 3.5,
      maxZoom: 12,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      dragRotate: false,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, showZoom: true }),
      'top-right'
    );

    map.current.on('load', () => {
      const m = map.current!;
      setMapLoaded(true);

      // ── Vietnam Country Outline ──────────────────────────────────────────
      m.addSource('vietnam', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/VNM.geo.json',
      });
      m.addLayer({ id: 'vietnam-fill', type: 'fill', source: 'vietnam', paint: { 'fill-color': '#22d3ee', 'fill-opacity': 0.03 } });
      m.addLayer({ id: 'vietnam-border-glow', type: 'line', source: 'vietnam', paint: { 'line-color': '#22d3ee', 'line-width': 4, 'line-blur': 4, 'line-opacity': 0.15 } });
      m.addLayer({ id: 'vietnam-border', type: 'line', source: 'vietnam', paint: { 'line-color': '#22d3ee', 'line-width': 1, 'line-opacity': 0.4 } });

      // ── Route Line ───────────────────────────────────────────────────────
      m.addSource('route', { type: 'geojson', data: routeGeoJSON });
      m.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#e9c349', 'line-width': 8, 'line-opacity': 0.12, 'line-blur': 8 } });
      m.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#e9c349', 'line-width': 1.5, 'line-opacity': 0.6, 'line-dasharray': [2, 4] } });

      // ── Per-location: highlight circle + marker ──────────────────────────
      locations.forEach((loc, idx) => {
        const color = loc.type === 'highlight' ? '#22d3ee' : loc.type === 'primary' ? '#e9c349' : '#bbc9d0';
        const fillOpacity = loc.type === 'highlight' ? 0.15 : loc.type === 'primary' ? 0.10 : 0.07;
        const circleId = `circle-${idx}`;

        // Add filled circle for this location's region
        m.addSource(circleId, { type: 'geojson', data: createCircleGeoJSON(loc.coords, loc.radiusKm) });
        m.addLayer({ id: `${circleId}-fill`, type: 'fill', source: circleId, paint: { 'fill-color': color, 'fill-opacity': fillOpacity } });
        m.addLayer({ id: `${circleId}-stroke`, type: 'line', source: circleId, paint: { 'line-color': color, 'line-width': 1.2, 'line-opacity': 0.5 } });

        // Dot marker
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

        const lowerName = loc.name.toLowerCase().replace(/\s+/g, '_');
        const hasDb = dbLocationIds.has(lowerName);

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, closeOnClick: true, maxWidth: '280px', className: 'voyager-popup' })
          .setHTML(`
            <div style="background:rgba(29,32,35,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:12px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 30px rgba(233,195,73,0.1);">
              <img src="${loc.img}" alt="${loc.name}" style="width:100%;height:130px;object-fit:cover;border-bottom:1px solid rgba(255,255,255,0.05);" referrerpolicy="no-referrer"/>
              <div style="padding:12px 14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.15em;color:${color};text-transform:uppercase;">${loc.chapter}</span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(187,201,208,0.5);">${loc.date}</span>
                </div>
                <h4 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;color:#e1e2e7;margin:0 0 6px;">${loc.name}</h4>
                <p style="font-family:'Manrope',serif;font-size:11px;line-height:1.5;color:rgba(187,201,208,0.7);margin:0 0 12px;">${loc.desc}</p>
                
                ${hasDb ? `
                  <a href="#/mission-detail/${lowerName}" 
                     onclick="window.location.hash='#/mission-detail/${lowerName}'; window.location.reload();"
                     style="display:block;text-align:center;background:${color};color:#000;padding:8px;border-radius:6px;font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;font-weight:800;text-decoration:none;letter-spacing:0.1em;transition:all 0.3s;box-shadow:0 10px 20px -5px ${color}66;"
                     onmouseover="this.style.opacity='0.8';this.style.transform='translateY(-1px)'"
                     onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                    OPEN EXPEDITION LOG
                  </a>
                ` : `
                  <div style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(187,201,208,0.3);border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;letter-spacing:0.1em;">
                    [SYSTEM_REF: NO_DB_RECORD]
                  </div>
                `}
              </div>
            </div>`);

        new mapboxgl.Marker({ element: markerEl }).setLngLat(loc.coords).setPopup(popup).addTo(m);
      });
    });

    return () => { map.current?.remove(); map.current = null; };
  }, [dbLocationIds]);

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
        <span className="text-primary font-headline text-3xl font-bold drop-shadow-[0_0_10px_rgba(233,195,73,0.5)]">30<span className="text-secondary/50 text-xl">/63</span></span>
      </div>

      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex flex-col gap-1 text-right z-10 pointer-events-none">
        <span className="text-secondary text-[10px] uppercase tracking-wider font-bold">Recent Trip</span>
        <span className="text-cyan-400 font-headline text-xl font-bold drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">Phu Quoc Island</span>
      </div>
    </div>
  );
}
