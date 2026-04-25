import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Globe, Image as ImageIcon, Map as MapIcon } from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { apiUrl } from '../lib/api';

interface DbLocation {
  id: string;
  name: string;
  chapter: string;
  short_desc: string;
  img: string;
  visited_date: string;
  highlight_type: string;
  lat: string;
  lng: string;
  gallery_nodes?: { images?: string[] }[];
  gallery_images?: string[];
}

interface MetricItem {
  icon: any;
  value: string;
  label: string;
}

const sortByVisitedDateDesc = (a: DbLocation, b: DbLocation) => {
  const aTs = Date.parse(a.visited_date || '');
  const bTs = Date.parse(b.visited_date || '');
  if (!Number.isNaN(aTs) && !Number.isNaN(bTs)) return bTs - aTs;
  if (!Number.isNaN(aTs)) return -1;
  if (!Number.isNaN(bTs)) return 1;
  return b.id.localeCompare(a.id);
};

const countLocationImages = (location: DbLocation): number => {
  const nodeImages = Array.isArray(location.gallery_nodes)
    ? location.gallery_nodes.flatMap(node => Array.isArray(node.images) ? node.images.filter(Boolean) : [])
    : [];
  if (nodeImages.length) return nodeImages.length;
  return Array.isArray(location.gallery_images) ? location.gallery_images.filter(Boolean).length : 0;
};

const computeMetrics = (locations: DbLocation[]): MetricItem[] => {
  const expeditionCount = locations.length;
  const totalImages = locations.reduce((sum, location) => sum + countLocationImages(location), 0);

  return [
    { icon: Globe, value: String(expeditionCount), label: 'Expeditions' },
    { icon: ImageIcon, value: String(totalImages), label: 'Total Images' },
    { icon: MapIcon, value: '0', label: 'International Explored' },
  ];
};

const fallbackChapters = [
  { id: 'phu_quoc', name: 'Sunset over Phu Quoc', chapter: 'Chapter IX', short_desc: 'Golden hour painting the ocean. A perfect escape into the warm coastal breeze.', img: '/phu_quoc/pq_landscape_sea.jpg', lat: '10.2899', lng: '103.9840', visited_date: '2024-09-01' },
  { id: 'hue', name: 'Imperial Echoes', chapter: 'Chapter III', short_desc: 'Walking through the ancient citadel, feeling the quiet pulse of a dynasty long past.', img: '/hue/hue_landscape_2.jpg', lat: '16.4637', lng: '107.5909', visited_date: '2024-04-01' },
  { id: 'hokkaido', name: 'The Silent Pines', chapter: 'Chapter XII', short_desc: 'Deep in the northern forests, absolute silence reigns supreme.', img: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800', lat: '43.0641', lng: '141.3469', visited_date: '2024-01-01' }
];

const fallbackMetrics: MetricItem[] = [
  { icon: Globe, value: String(fallbackChapters.length), label: 'Expeditions' },
  { icon: ImageIcon, value: '0', label: 'Total Images' },
  { icon: MapIcon, value: '0', label: 'International Explored' },
];

const getLatestTripName = (locations: DbLocation[]) => {
  if (!locations.length) return '';
  const sorted = locations.slice().sort(sortByVisitedDateDesc);
  return sorted[0]?.name || '';
};

const toRecentCards = (locations: DbLocation[]) =>
  locations
    .slice()
    .sort(sortByVisitedDateDesc)
    .slice(0, 3);

const toProvinceCount = (locations: DbLocation[]) => locations.length;

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

function AnimatedCounter({ value, className }: { value: number, className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 120, damping: 15 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplay(Math.floor(latest));
    });
  }, [springValue]);

  return <span ref={ref} className={className}>{display}</span>;
}

function AnimatedIcon({ icon: Icon, size }: { icon: any, size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className={inView ? "draw-icon" : ""}>
      <Icon size={size} className="group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
    </div>
  );
}

function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[index];
    const typingSpeed = isDeleting ? 75 : 150;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.substring(0, text.length + 1));
        if (text === currentWord) {
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        setText(currentWord.substring(0, text.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, text === currentWord ? 2500 : typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, words]);

  // Find the longest word to reserve space and prevent layout shifts
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");

  return (
    <span className="text-primary inline-grid relative">
      {/* Ghost text to reserve space */}
      <span className="invisible pointer-events-none select-none col-start-1 row-start-1">
        {longestWord}
      </span>
      {/* Visible typing text */}
      <span className="col-start-1 row-start-1 whitespace-nowrap">
        {text}
        <span className="animate-pulse inline-block ml-0.5">_</span>
      </span>
    </span>
  );
}

export function MagneticCard({ children, onClick, className, attractOnProximity = false }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  const translateX = useTransform(mouseXSpring, [-0.5, 0.5], ["-30px", "30px"]);
  const translateY = useTransform(mouseYSpring, [-0.5, 0.5], ["-30px", "30px"]);

  const setFromPointer = (clientX: number, clientY: number, rect: DOMRect) => {
    const width = rect.width;
    const height = rect.height;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFromPointer(e.clientX, e.clientY, rect);
  };

  const handleMouseLeave = () => {
    if (!attractOnProximity) {
      x.set(0);
      y.set(0);
    }
  };

  useEffect(() => {
    if (!attractOnProximity) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const radius = 180;

      if (distance <= radius) {
        setFromPointer(e.clientX, e.clientY, rect);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [attractOnProximity]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateY, rotateX, x: translateX, y: translateY, transformStyle: "preserve-3d" }}
      onClick={onClick}
      className={className}
    >
      <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const navigate = useNavigate();
  const mapSectionRef = useRef<HTMLElement | null>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -250]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -80]);
  const [dbChapters, setDbChapters] = useState<DbLocation[]>([]);

  useEffect(() => {
    fetch(apiUrl('/locations'))
      .then(res => res.json())
      .then((data: DbLocation[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbChapters(data);
        } else {
          setDbChapters([]);
        }
      })
      .catch(err => {
        console.error('Error fetching chapters:', err);
        setDbChapters([]);
      });
  }, []);

  const displayList = dbChapters.length > 0 ? toRecentCards(dbChapters) : fallbackChapters;
  const metrics = dbChapters.length > 0 ? computeMetrics(dbChapters) : fallbackMetrics;
  const provinceCount = dbChapters.length > 0 ? toProvinceCount(dbChapters) : fallbackChapters.length;
  const recentTripName = dbChapters.length > 0 ? getLatestTripName(dbChapters) : fallbackChapters[0].name;

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[500px]">
        <div className="space-y-6">
          <span className="text-primary font-tech tracking-[0.2em] font-bold text-sm">ALL CHAPTERS</span>
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-on-surface">
            The Ngan's Trips
          </h1>
          <p className="text-secondary text-lg md:text-xl max-w-lg leading-relaxed font-body">
            Người ta đi xa không phải để tìm nơi trốn chạy, mà để tìm một thế giới quan rộng lớn hơn.
          </p>
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('Journal')}
              className="bg-primary text-background px-8 py-4 rounded-xl text-sm font-bold tracking-wide hover:scale-105 transition-all shadow-[0_0_20px_rgba(233,195,73,0.6)] hover:shadow-[0_0_40px_rgba(233,195,73,1)] border border-primary/50 relative overflow-hidden group cursor-pointer"
            >
              <span className="relative z-10">Explore Chapters</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            <button
              onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="glass-card text-on-surface px-8 py-4 rounded-xl text-sm font-bold tracking-wide border border-cyan-400/30 hover:border-cyan-300/70 hover:bg-cyan-400/10 hover:text-cyan-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all duration-300 cursor-pointer"
            >
              View Map
            </button>
          </div>
        </div>

        <div className="relative h-[500px] hidden md:block">
          <motion.div style={{ y: y1 }} className="absolute top-0 right-12 z-20">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
              className="w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: y2 }} className="absolute top-32 right-64 z-30">
            <motion.div
              animate={{ y: [0, 25, 0] }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
              className="w-56 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: y3 }} className="absolute top-10 right-[-20px] z-40">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
              className="w-40 h-40 rounded-full overflow-hidden shadow-2xl border-4 border-background"
            >
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cartography of Memories Map Block */}
      <motion.section
        ref={mapSectionRef}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-surface-container/30 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
      >
        {/* Subtle glow behind the map */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 z-10">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Cartography of Memories</h2>
            <p className="text-secondary text-lg max-w-md font-body leading-relaxed">
Một sự tái hiện trực quan về những hành trình đã qua. Mỗi điểm nhìn chính là một mảnh ký ức được lưu dấu, một quan sát lặng lẽ được ghi lại trong nhật ký kỹ thuật số.            </p>
            <div className="pt-8">
              <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Current Focus</span>
              <h3 className="font-headline text-3xl font-bold text-on-surface drop-shadow-[0_0_15px_rgba(233,195,73,0.4)]">VIETNAM</h3>
            </div>
          </div>

          <div className="relative">
            <InteractiveMap
              provinceCount={provinceCount}
              recentTripName={recentTripName}
              onOpenExpeditionLog={(locationId) => navigate(`/mission-detail/${locationId}`)}
            />
          </div>
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="rounded-3xl p-12 relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-60 pointer-events-none" />
        <div className="absolute inset-[0.5px] rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', padding: '1px', borderRadius: 'inherit' }} />
        <h2 className="font-display text-3xl font-bold tracking-tight mb-12 text-on-surface relative z-10">Voyage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {metrics.map((m, i) => (
            <MagneticCard key={i} className="group relative flex items-center gap-6 p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-cyan-400/30 hover:bg-white/[0.08] hover:shadow-[0_0_40px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500 cursor-default">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="w-16 h-16 rounded-xl bg-primary/10 backdrop-blur-sm flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 group-hover:bg-cyan-500/15 group-hover:border-cyan-400/50 group-hover:text-cyan-400 transition-all duration-300 relative z-10">
                <AnimatedIcon icon={m.icon} size={32} />
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-bold text-on-surface font-tech tracking-tight drop-shadow-sm group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] transition-all duration-500 transform group-hover:translate-x-2">
                  <AnimatedCounter value={Number(m.value) || 0} />
                </div>
                <div className="text-[10px] text-secondary font-tech uppercase tracking-widest mt-1 opacity-80 group-hover:opacity-100 group-hover:text-cyan-100 transition-all duration-300 transform group-hover:translate-x-1">{m.label}</div>
              </div>
            </MagneticCard>
          ))}
        </div>
      </motion.section>

      {/* Recent Chapters */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-12 overflow-hidden"
      >
        <div className="flex justify-between items-end mr-4">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Recent Chapters</h2>
            <p className="text-secondary mt-2 font-body">Real-time coordinates and journals from the database.</p>
          </div>
          <button onClick={() => setActiveTab('Journal')} className="text-primary font-bold text-sm tracking-wide hover:underline underline-offset-8 transition-all cursor-pointer">
            View Journey Log
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayList.slice(0, 3).map((c, i) => (
            <motion.div
              key={`${c.id}-${i}`}
              onClick={() => navigate(`/mission-detail/${c.id}`)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              className="group relative rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-md border border-white/[0.08] hover:border-primary/40 hover:shadow-[0_0_50px_rgba(233,195,73,0.15)] transition-all duration-500 cursor-pointer h-full"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_15px_rgba(233,195,73,1)] -translate-y-[10px] group-hover:animate-scan z-50 pointer-events-none opacity-0 group-hover:opacity-100" />
              
              <div className="h-52 overflow-hidden relative">
                <div className="absolute top-3 left-3 z-20 text-[9px] font-tech text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-[0.2em] bg-background/60 backdrop-blur-md px-2 py-0.5 rounded">
                  DAT_LAT: {c.lat || "00.0000"}° N
                </div>
                <div className="absolute top-3 right-3 z-20 text-[9px] font-tech text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-[0.2em] bg-background/60 backdrop-blur-md px-2 py-0.5 rounded">
                  DAT_LNG: {c.lng || "000.0000"}° E
                </div>

                <img 
                  src={c.img} 
                  alt={c.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 left-4 bg-primary/20 backdrop-blur-md px-3 py-1 rounded-md border border-primary/30 text-[10px] text-primary font-bold tracking-widest uppercase">
                  {c.chapter}
                </div>
              </div>
              
              <div className="p-7 relative bg-gradient-to-b from-transparent to-black/20">
                <h3 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors tracking-tight">
                  {c.name}
                </h3>
                <p className="text-secondary/70 text-sm line-clamp-2 font-body leading-relaxed mb-6">
                  {c.short_desc}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-tech tracking-[0.3em] text-secondary/40 uppercase">Memory_ID</span>
                    <span className="text-[10px] font-tech text-primary/60">{c.id.slice(0, 12)}...</span>
                  </div>
                  
                  <div className="flex items-end gap-[3px] h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {[1, 2, 3, 4, 5, 6].map(bar => (
                      <motion.div
                        key={bar}
                        animate={{ height: ["2px", "14px", "6px", "10px", "2px"] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: bar * 0.1, ease: "easeInOut" }}
                        className="w-[1.5px] bg-primary/60 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

    </div>
  );
}
