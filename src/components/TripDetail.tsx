import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { Ship, Sun, Camera, Star, ArrowRight, Quote, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TripDetailProps {
  setActiveTab: (tab: string) => void;
  locationId?: string;
}

const STATIC_METRICS: Record<string, any[]> = {
  "phu_quoc": [
    { icon: Ship, label: "Nautical Miles", value: 120 },
    { icon: Sun,  label: "Sunset Hours",   value: 14  },
    { icon: Camera, label: "Photos Taken", value: 450 },
  ],
  "hue": [
    { icon: Star,   label: "Historical Sites", value: 12  },
    { icon: Sun,    label: "Sunny Days",        value: 4   },
    { icon: Camera, label: "Photos Taken",      value: 890 },
  ],
};

const DEFAULT_METRICS = [
  { icon: Camera, label: "Photos Taken",  value: 0 },
  { icon: Sun,    label: "Days Explored", value: 0 },
  { icon: Star,   label: "Highlights",    value: 0 },
];

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(t => step(t, startTime));
    };
    requestAnimationFrame(t => step(t, t));
  }, [inView, target]);

  return <span ref={ref}>{display}</span>;
}

// ── Floating image ─────────────────────────────────────────────────────────────
function FloatingImage({ src, alt, delay = 0, className = '' }: { src: string; alt: string; delay?: number; className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`rounded-xl overflow-hidden group ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    </motion.div>
  );
}

export default function TripDetail({ setActiveTab, locationId = 'phu_quoc' }: TripDetailProps) {
  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/locations/${locationId}`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(data => {
        setTripData({
          title: data.name,
          subtitle: data.short_desc,
          chapter: data.chapter,
          video: data.hero_video || '',
          poster: data.hero_poster || data.img || '',
          metrics: STATIC_METRICS[locationId] || DEFAULT_METRICS,
          desc1: data.full_description || '',
          desc2: '',
          gallery: data.gallery_images || [],
        });
        setLoading(false);
      })
      .catch(() => {
        const fallback: Record<string, any> = {
          phu_quoc: {
            title: 'Phu Quoc', subtitle: 'Golden Hour Escape', chapter: 'Chapter IX',
            video: '/videos/phu_quoc.mp4', poster: '/phu_quoc/pq_landscape_sea.jpg',
            desc1: 'We arrived on the island just as the monsoon retreated, leaving behind skies so clear it felt like stepping onto another planet.',
            desc2: 'We spent our days exploring hidden beaches illuminated by slivers of sunlight.',
            gallery: [
              '/phu_quoc/pq_landscape_sea.jpg', '/phu_quoc/pq_landscape_lake.jpg',
              '/phu_quoc/pq_landscape_cafe_highlands.jpg', '/phu_quoc/pq_landscape_sea_.jpg',
              '/phu_quoc/pq_landscape_lake_2.jpg', '/phu_quoc/pq_landscape_sea_2.jpg',
            ],
          },
          hue: {
            title: 'Hue', subtitle: 'Imperial Echoes', chapter: 'Chapter III',
            video: '', poster: '/hue/hue_landscape_1.jpg',
            desc1: 'Walking through the ancient citadel, feeling the quiet pulse of a dynasty long past.',
            desc2: 'The perfume river flows silently beneath the Truong Tien bridge.',
            gallery: [
              '/hue/hue_landscape_1.jpg', '/hue/hue_landscape_2.jpg',
              '/hue/hue_landscape_3.jpg', '/hue/hue_landscape_4.jpg',
              '/hue/hue_landscape_5.jpg', '/hue/hue_landscape_6.jpg',
              '/hue/hue_landscape_7.jpg',
            ],
          },
        };
        const d = fallback[locationId] || fallback['phu_quoc'];
        setTripData({ ...d, metrics: STATIC_METRICS[locationId] || DEFAULT_METRICS });
        setLoading(false);
      });
  }, [locationId]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-secondary font-tech text-xs tracking-widest uppercase">Loading mission data...</p>
        </div>
      </div>
    );
  }

  if (!tripData) return null;

  // Only show first 3 images as "featured" in the detail view
  const featuredImgs = tripData.gallery.slice(0, 3);
  const [heroImg, img2, img3] = featuredImgs;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left shadow-[0_0_15px_rgba(233,195,73,1)]"
        style={{ scaleX }}
      />
      <div className="space-y-16">
        {/* Back Button */}
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('Journal')}
            className="flex items-center gap-2 text-secondary hover:text-cyan-400 transition-colors font-tech text-xs tracking-widest group cursor-pointer drop-shadow-sm"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2]" />
            <span>RETURN TO ARCHIVES</span>
          </button>
        </div>

        {/* Hero Section */}
        <section className="relative w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden ambient-shadow flex flex-col justify-end bg-surface">
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)' }}
            transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 1.5 }}
            className="absolute inset-0 w-full h-full z-0"
          >
            {tripData.video ? (
              <motion.video
                initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                transition={{ duration: 4, ease: 'easeOut', delay: 1.5 }}
                autoPlay loop muted playsInline poster={tripData.poster}
                className="w-full h-full object-cover opacity-80"
              >
                <source src={tripData.video} type="video/mp4" />
              </motion.video>
            ) : (
              <motion.img
                initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                transition={{ duration: 4, ease: 'easeOut', delay: 1.5 }}
                src={tripData.poster}
                className="w-full h-full object-cover opacity-80"
                alt={tripData.title}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0 pointer-events-none"
          />

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row justify-between items-end gap-6 pointer-events-none">
            <div className="max-w-3xl pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.8 }}
                className="flex items-center gap-3 mb-4"
              >
                <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 rounded-full font-headline text-[10px] uppercase tracking-[0.05em] text-secondary ghost-border">Vietnam</span>
                <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 rounded-full font-headline text-[10px] uppercase tracking-[0.05em] text-secondary ghost-border">{tripData.chapter}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight text-on-surface mb-4 leading-tight drop-shadow-[0_0_30px_rgba(0,0,0,1)]"
              >
                {tripData.subtitle} <br />
                <span className="text-primary drop-shadow-[0_0_15px_rgba(233,195,73,0.5)]">{tripData.title}</span>
              </motion.h1>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Left column: description + animated stats */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-6">
              <p className="text-lg md:text-xl font-medium text-on-surface leading-loose first-letter:text-6xl first-letter:font-headline first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:mt-2 font-body drop-shadow-sm">
                {tripData.desc1}
              </p>
              {tripData.desc2 && (
                <p className="text-secondary/80 font-body">{tripData.desc2}</p>
              )}
            </div>

            {/* ── Animated stat cards ── */}
            <div className="grid grid-cols-2 gap-4">
              {tripData.metrics.map((stat: any, i: number) => (
                <div key={i} className="glass-card rounded-xl p-6 ghost-border transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(233,195,73,0.1)] group">
                  <stat.icon className="text-secondary mb-3 group-hover:text-primary transition-colors drop-shadow-sm" size={24} />
                  <h4 className="font-headline text-[10px] uppercase tracking-[0.05em] text-secondary mb-1">{stat.label}</h4>
                  <p className="font-headline font-semibold text-on-surface text-2xl group-hover:drop-shadow-[0_0_5px_rgba(233,195,73,0.5)]">
                    {typeof stat.value === 'number'
                      ? <AnimatedNumber target={stat.value} />
                      : stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: featured 3 images (floating) + button */}
          <div className="lg:col-span-7 space-y-8">
            <h3 className="font-headline text-2xl font-bold text-on-surface drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Journey Gallery</h3>

            {featuredImgs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 auto-rows-[200px]">
                {/* Hero image — large, floats */}
                {heroImg && (
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="col-span-2 row-span-2 rounded-xl overflow-hidden relative group"
                  >
                    <img
                      src={heroImg}
                      alt={`${tripData.title} - main`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <span className="font-headline text-[10px] uppercase tracking-[0.05em] text-primary mb-2 block drop-shadow-[0_0_8px_rgba(233,195,73,0.8)]">{tripData.chapter}</span>
                      <h4 className="font-headline text-xl font-bold text-on-surface drop-shadow-md">{tripData.title}</h4>
                    </div>
                  </motion.div>
                )}

                {/* img2 */}
                {img2 && <FloatingImage src={img2} alt={`${tripData.title} - 2`} delay={0.8} />}
                {/* img3 */}
                {img3 && <FloatingImage src={img3} alt={`${tripData.title} - 3`} delay={1.6} />}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-12 flex items-center justify-center ghost-border">
                <p className="text-secondary/50 font-tech text-xs tracking-widest uppercase">No gallery images yet</p>
              </div>
            )}

            {/* Quote block */}
            <div className="glass-card rounded-xl p-8 flex flex-col justify-center items-center text-center ghost-border relative overflow-hidden group transition-all hover:bg-white/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <Quote className="absolute top-4 left-4 text-white/5" size={64} />
              <p className="font-headline text-xl md:text-2xl font-medium text-secondary italic relative z-10 group-hover:text-cyan-100 transition-colors">
                "The mist here doesn't obscure the view; it paints it, turning the landscape into a living watercolor."
              </p>
            </div>

            {/* See All Pictures → goes to /gallery/:id */}
            <div className="flex justify-center">
              <button
                onClick={() => setActiveTab(`Gallery:${locationId}`)}
                className="glass-card group relative flex items-center gap-3 px-8 py-4 border border-primary/50 text-primary font-headline font-bold rounded-xl transition-all hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_30px_rgba(233,195,73,0.4)] cursor-pointer overflow-hidden"
              >
                <span className="tracking-wider uppercase text-xs drop-shadow-[0_0_5px_rgba(233,195,73,0.5)] z-10 transition-colors group-hover:text-white">See all pictures</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 z-10 group-hover:text-white" />
                <div className="absolute inset-0 bg-primary/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
