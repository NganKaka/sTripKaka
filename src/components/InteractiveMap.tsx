import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// We use Carto DB base map style, so a real mapbox token is not necessary for loading the tiles
mapboxgl.accessToken = 'pk.dummy_token_not_real';

interface LocationData {
  name: string;
  coords: [number, number]; // [lng, lat]
  chapter: string;
  desc: string;
  img: string;
  date: string;
  type: 'primary' | 'secondary' | 'highlight';
}

const locations: LocationData[] = [
  { name: "Sapa", coords: [103.8440, 22.3363], chapter: "Chapter I", desc: "Mist-woven trails through terraced rice fields in the northern highlands.", img: "https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&q=80&w=400", date: "Mar 2024", type: "secondary" },
  { name: "Hanoi", coords: [105.8342, 21.0278], chapter: "Chapter II", desc: "The ancient capital's labyrinthine streets hummed with stories of a thousand years.", img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=400", date: "Mar 2024", type: "primary" },
  { name: "Hue", coords: [107.5905, 16.4637], chapter: "Chapter III", desc: "Imperial citadels and perfumed rivers under a contemplative sky.", img: "/hue/hue_landscape_1.jpg", date: "Apr 2024", type: "secondary" },
  { name: "Da Nang", coords: [108.2022, 16.0544], chapter: "Chapter IV", desc: "Where marble mountains meet the endless turquoise shore.", img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=400", date: "Apr 2024", type: "secondary" },
  { name: "Nha Trang", coords: [109.1967, 12.2388], chapter: "Chapter V", desc: "Crystal waters and sun-bleached shores stretching to infinity.", img: "https://images.unsplash.com/photo-1537956965359-7573183d1f57?auto=format&fit=crop&q=80&w=400", date: "May 2024", type: "secondary" },
  { name: "Da Lat", coords: [108.4583, 11.9404], chapter: "Chapter VI", desc: "The city of eternal spring, draped in fog and pine-scented breeze.", img: "https://images.unsplash.com/photo-1555217851-6141535bd330?auto=format&fit=crop&q=80&w=400", date: "Jun 2024", type: "primary" },
  { name: "Ho Chi Minh City", coords: [106.6297, 10.8231], chapter: "Chapter VII", desc: "A metropolis of neon and nostalgia — the beating heart of the south.", img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=400", date: "Jul 2024", type: "primary" },
  { name: "Can Tho", coords: [105.7469, 10.0452], chapter: "Chapter VIII", desc: "Floating markets at dawn, where the Mekong whispers ancient trade routes.", img: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400", date: "Aug 2024", type: "secondary" },
  { name: "Phu Quoc", coords: [103.9840, 10.2270], chapter: "Chapter IX", desc: "Golden hour painting the ocean. A perfect escape into the warm coastal breeze.", img: "/phu_quoc/pq_landscape_sea.jpg", date: "Sep 2024", type: "highlight" },
];

// GeoJSON Route (connecting all locations in chronological order)
const routeGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: locations.map(l => l.coords)
    }
  }]
};

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [106.5, 15.5],
      zoom: 5.2,
      pitch: 20,
      bearing: 0,
      attributionControl: false,
      dragRotate: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

    map.current.on('load', () => {
      const m = map.current!;
      setMapLoaded(true);

      // ---- Vietnam Outline (Hình chữ S) ----
      m.addSource('vietnam', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/VNM.geo.json'
      });

      m.addLayer({
        id: 'vietnam-fill',
        type: 'fill',
        source: 'vietnam',
        paint: {
          'fill-color': '#22d3ee',
          'fill-opacity': 0.03
        }
      });

      m.addLayer({
        id: 'vietnam-border-glow',
        type: 'line',
        source: 'vietnam',
        paint: {
          'line-color': '#22d3ee',
          'line-width': 4,
          'line-blur': 4,
          'line-opacity': 0.2
        }
      });

      m.addLayer({
        id: 'vietnam-border',
        type: 'line',
        source: 'vietnam',
        paint: {
          'line-color': '#22d3ee',
          'line-width': 1,
          'line-opacity': 0.4
        }
      });

      // ---- Animated Route with Glow ----
      m.addSource('route', { type: 'geojson', data: routeGeoJSON });

      // Outer glow layer
      m.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#e9c349',
          'line-width': 8,
          'line-opacity': 0.15,
          'line-blur': 8,
        }
      });

      // Main route line
      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#e9c349',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [2, 4],
        }
      });

      // Animate the dash offset for flowing effect
      let dashOffset = 0;
      const animateDash = () => {
        dashOffset = (dashOffset + 0.2) % 6;
        m.setPaintProperty('route-line', 'line-dasharray', [2, 4]);
        requestAnimationFrame(animateDash);
      };
      animateDash();

      // ---- Location Markers with Custom Popups ----
      locations.forEach((loc) => {
        // Create custom marker element
        const markerEl = document.createElement('div');
        const size = loc.type === 'highlight' ? 18 : loc.type === 'primary' ? 14 : 10;
        const color = loc.type === 'highlight' ? '#22d3ee' : '#e9c349';
        
        markerEl.innerHTML = `
          <div style="
            width: ${size}px; height: ${size}px;
            background: ${color};
            border-radius: 50%;
            box-shadow: 0 0 ${size * 2}px ${color}, 0 0 ${size}px ${color};
            cursor: pointer;
            transition: transform 0.3s ease;
            position: relative;
          ">
            ${loc.type !== 'secondary' ? `
              <div style="
                position: absolute; inset: -4px;
                border: 1.5px solid ${color};
                border-radius: 50%;
                opacity: 0.4;
                animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
              "></div>
            ` : ''}
          </div>
        `;
        
        markerEl.addEventListener('mouseenter', () => {
          markerEl.style.transform = 'scale(1.5)';
        });
        markerEl.addEventListener('mouseleave', () => {
          markerEl.style.transform = 'scale(1)';
        });

        // Create glassmorphism popup
        const popup = new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
          closeOnClick: true,
          maxWidth: '280px',
          className: 'voyager-popup'
        }).setHTML(`
          <div style="
            background: rgba(29, 32, 35, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(233,195,73,0.1);
          ">
            <img src="${loc.img}" alt="${loc.name}" style="
              width: 100%; height: 130px; object-fit: cover;
              border-bottom: 1px solid rgba(255,255,255,0.05);
            " referrerpolicy="no-referrer" />
            <div style="padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 9px;
                  letter-spacing: 0.15em;
                  color: ${color};
                  text-transform: uppercase;
                ">${loc.chapter}</span>
                <span style="
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 9px;
                  color: rgba(187,201,208,0.5);
                ">${loc.date}</span>
              </div>
              <h4 style="
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-weight: 700;
                font-size: 15px;
                color: #e1e2e7;
                margin: 0 0 6px;
              ">${loc.name}</h4>
              <p style="
                font-family: 'Manrope', serif;
                font-size: 11px;
                line-height: 1.5;
                color: rgba(187,201,208,0.7);
                margin: 0;
              ">${loc.desc}</p>
            </div>
          </div>
        `);

        new mapboxgl.Marker({ element: markerEl })
          .setLngLat(loc.coords)
          .setPopup(popup)
          .addTo(m);
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
      <div ref={mapContainer} className="w-full h-full" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-tech text-[10px] tracking-widest text-primary/80 uppercase">Loading cartography...</span>
          </div>
        </div>
      )}

      {/* Overlay HUD Stats */}
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
