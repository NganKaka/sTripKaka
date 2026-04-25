import { motion, useScroll, useSpring, useInView } from 'framer-motion';
import { MapPin, Sun, Camera, ArrowRight, Quote, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TripDetailProps {
  setActiveTab: (tab: string) => void;
  locationId?: string;
}

interface MetricItem {
  icon: any;
  label: string;
  value: number | string;
}

interface LocationApiResponse {
  id: string;
  name: string;
  short_desc: string;
  chapter: string;
  hero_video?: string;
  hero_poster?: string;
  featured_images?: string[];
  full_description?: string;
  gallery_nodes?: any[];
  gallery_images?: string[];
  img?: string;
}

interface TripState {
  id: string;
  title: string;
  subtitle: string;
  chapter: string;
  video: string;
  poster: string;
  featured: string[];
  metrics: MetricItem[];
  storyTitle: string;
  quote: string;
  desc1: string;
  desc2: string;
  gallery: string[];
}

const PROVINCE_BY_LOCATION: Record<string, string> = {
  phu_quoc: 'Kien Giang',
  hue: 'Hue',
};

const REGION_BY_PROVINCE: Record<string, string> = {
  'Kien Giang': 'South',
  Hue: 'Central',
};

const TRAVEL_QUOTES = [
  'Travel far enough, you meet yourself.',
  'Not all those who wander are lost.',
  'Adventure is worthwhile in itself.',
  'The journey, not the arrival, matters most.',
  'Take only memories, leave only footprints.',
  'To travel is to live.',
  'Life begins at the end of your comfort zone.',
  'A journey is best measured in stories, not miles.',
  'Wherever you go becomes a part of you somehow.',
  'Travel opens your heart and broadens your mind.',
  'Collect moments, not things.',
  'The world is too big to stay in one place.',
  'Jobs fill your pocket, adventures fill your soul.',
  'Better to see something once than hear about it a thousand times.',
  'Travel is the only thing you buy that makes you richer.',
  'The best view comes after the hardest climb.',
  'Every destination has a story waiting for you.',
  'The road is calling, and I must go.',
  'In every walk with nature, one receives far more than he seeks.',
  'Memories made on the road last a lifetime.',
];

const getRandomQuote = () => TRAVEL_QUOTES[Math.floor(Math.random() * TRAVEL_QUOTES.length)];

const markdownComponents = {
  p: ({ children }: any) => <p className="text-lg md:text-xl font-medium text-on-surface leading-loose mb-5 last:mb-0 font-body drop-shadow-sm">{children}</p>,
  h1: ({ children }: any) => <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-4">{children}</h1>,
  h2: ({ children }: any) => <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-4">{children}</h2>,
  h3: ({ children }: any) => <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface mb-3">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-5 space-y-2 text-lg md:text-xl text-on-surface/90">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-5 space-y-2 text-lg md:text-xl text-on-surface/90">{children}</ol>,
  li: ({ children }: any) => <li>{children}</li>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-primary/50 pl-4 italic text-secondary/90 mb-5">{children}</blockquote>,
  strong: ({ children }: any) => <strong className="text-on-surface font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
};

const getProvince = (id: string, name: string) => PROVINCE_BY_LOCATION[id] || name;
const getRegion = (province: string) => REGION_BY_PROVINCE[province] || 'Unknown';

const countImagesFromData = (galleryNodes: any[] = [], galleryImages: string[] = []) => {
  const fromNodes = Array.isArray(galleryNodes)
    ? galleryNodes.flatMap((node: any) => (Array.isArray(node.images) ? node.images.filter(Boolean) : []))
    : [];
  if (fromNodes.length) return fromNodes.length;
  return Array.isArray(galleryImages) ? galleryImages.filter(Boolean).length : 0;
};

const FALLBACK_BY_LOCATION: Record<string, LocationApiResponse> = {
  phu_quoc: {
    id: 'phu_quoc',
    name: 'Phu Quoc',
    short_desc: 'Golden Hour Escape',
    chapter: 'Chapter IX',
    hero_video: '/videos/phu_quoc.mp4',
    hero_poster: '/phu_quoc/pq_landscape_sea.jpg',
    featured_images: [
      '/phu_quoc/pq_landscape_sea.jpg',
      '/phu_quoc/pq_landscape_lake.jpg',
      '/phu_quoc/pq_landscape_cafe_highlands.jpg',
    ],
    full_description: 'We arrived on the island just as the monsoon retreated, leaving behind skies so clear it felt like stepping onto another planet.',
    gallery_images: [
      '/phu_quoc/pq_landscape_sea.jpg', '/phu_quoc/pq_landscape_lake.jpg',
      '/phu_quoc/pq_landscape_cafe_highlands.jpg', '/phu_quoc/pq_landscape_sea_.jpg',
      '/phu_quoc/pq_landscape_lake_2.jpg', '/phu_quoc/pq_landscape_sea_2.jpg',
    ],
    img: '/phu_quoc/pq_landscape_sea.jpg',
  },
  hue: {
    id: 'hue',
    name: 'Hue',
    short_desc: 'Imperial Echoes',
    chapter: 'Chapter III',
    hero_video: '',
    hero_poster: '/hue/hue_landscape_1.jpg',
    featured_images: [
      '/hue/hue_landscape_1.jpg',
      '/hue/hue_landscape_2.jpg',
      '/hue/hue_landscape_3.jpg',
    ],
    full_description: 'Walking through the ancient citadel, feeling the quiet pulse of a dynasty long past.',
    gallery_images: [
      '/hue/hue_landscape_1.jpg', '/hue/hue_landscape_2.jpg',
      '/hue/hue_landscape_3.jpg', '/hue/hue_landscape_4.jpg',
      '/hue/hue_landscape_5.jpg', '/hue/hue_landscape_6.jpg',
      '/hue/hue_landscape_7.jpg',
    ],
    img: '/hue/hue_landscape_1.jpg',
  },
};

const getFallbackLocation = (locationId: string): LocationApiResponse => FALLBACK_BY_LOCATION[locationId] || FALLBACK_BY_LOCATION.phu_quoc;

const buildTripState = (locationId: string, data: LocationApiResponse): TripState => {
  const galleryFromNodes = Array.isArray(data.gallery_nodes)
    ? data.gallery_nodes.flatMap((node: any) => (Array.isArray(node.images) ? node.images.filter(Boolean) : []))
    : [];

  const gallery = galleryFromNodes.length ? galleryFromNodes : (data.gallery_images || []);

  const featuredFromApi = Array.isArray(data.featured_images)
    ? [data.featured_images[0] || '', data.featured_images[1] || '', data.featured_images[2] || ''].filter(Boolean)
    : [];
  const fallbackFeatured = [data.hero_poster || '', ...gallery].filter(Boolean);
  const featured = (featuredFromApi.length ? featuredFromApi : fallbackFeatured).slice(0, 3);

  const province = getProvince(locationId, data.name);
  const region = getRegion(province);
  const totalImages = countImagesFromData(data.gallery_nodes || [], data.gallery_images || []);

  return {
    id: locationId,
    title: data.name,
    subtitle: data.short_desc,
    chapter: data.chapter,
    video: data.hero_video || '',
    poster: featured[0] || data.img || '',
    featured,
    metrics: [
      { icon: MapPin, label: 'Province', value: province },
      { icon: Sun, label: 'Region', value: region },
      { icon: Camera, label: 'Photos Taken', value: totalImages },
    ],
    storyTitle: `Our Story at ${data.name}`,
    quote: getRandomQuote(),
    desc1: data.full_description || '',
    desc2: '',
    gallery,
  };
};

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(t => step(t, startTime));
    };
    requestAnimationFrame(t => step(t, t));
  }, [inView, target]);

  return <span ref={ref}>{display}</span>;
}

type FadeInImageProps = {
  src: string;
  alt: string;
  className: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
};

function FadeInImage({ src, alt, className, loading = 'lazy', decoding = 'async', fetchPriority }: FadeInImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <span className={`block transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-90'}`}>
      <img
        key={src}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={className}
      />
    </span>
  );
}

function FloatingImage({ src, alt, delay = 0, className = '' }: { src: string; alt: string; delay?: number; className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4 + delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`rounded-xl overflow-hidden group ${className}`}
    >
      <FadeInImage
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    </motion.div>
  );
}

export default function TripDetail({ setActiveTab, locationId = 'phu_quoc' }: TripDetailProps) {
  const [tripData, setTripData] = useState<TripState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl(`/locations/${locationId}`))
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then((data: LocationApiResponse) => {
        setTripData(buildTripState(locationId, data));
        setLoading(false);
      })
      .catch(() => {
        setTripData(buildTripState(locationId, getFallbackLocation(locationId)));
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

  const featuredImgs = (tripData.featured || tripData.gallery || []).slice(0, 3);
  const [heroImg, img2, img3] = featuredImgs;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left shadow-[0_0_15px_rgba(233,195,73,1)]"
        style={{ scaleX }}
      />
      <div className="space-y-16">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('Journal')}
            className="flex items-center gap-2 text-secondary hover:text-cyan-400 transition-colors font-tech text-xs tracking-widest group cursor-pointer drop-shadow-sm"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2]" />
            <span>RETURN TO ARCHIVES</span>
          </button>
        </div>

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
              <motion.div
                initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                transition={{ duration: 4, ease: 'easeOut', delay: 1.5 }}
                className="w-full h-full"
              >
                <FadeInImage
                  src={tripData.poster}
                  alt={tripData.title}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover opacity-80"
                />
              </motion.div>
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
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-primary font-tech text-[10px] uppercase tracking-[0.2em] block">Story Log</span>
                <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface">{tripData.storyTitle}</h2>
              </div>
              <div className="prose prose-invert max-w-none first-letter:[all:unset]">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {tripData.desc1}
                </ReactMarkdown>
              </div>
              {tripData.desc2 && (
                <p className="text-secondary/80 font-body">{tripData.desc2}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tripData.metrics.map((stat: MetricItem, i: number) => (
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

          <div className="lg:col-span-7 space-y-8">
            <h3 className="font-headline text-2xl font-bold text-on-surface drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Journey Gallery</h3>

            {featuredImgs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 auto-rows-[200px]">
                {heroImg && (
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="col-span-2 row-span-2 rounded-xl overflow-hidden relative group"
                  >
                    <FadeInImage
                      src={heroImg}
                      alt={`${tripData.title} - main`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <span className="font-headline text-[10px] uppercase tracking-[0.05em] text-primary mb-2 block drop-shadow-[0_0_8px_rgba(233,195,73,0.8)]">{tripData.chapter}</span>
                      <h4 className="font-headline text-xl font-bold text-on-surface drop-shadow-md">{tripData.title}</h4>
                    </div>
                  </motion.div>
                )}

                {img2 && <FloatingImage src={img2} alt={`${tripData.title} - 2`} delay={0.8} />}
                {img3 && <FloatingImage src={img3} alt={`${tripData.title} - 3`} delay={1.6} />}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-12 flex items-center justify-center ghost-border">
                <p className="text-secondary/50 font-tech text-xs tracking-widest uppercase">No gallery images yet</p>
              </div>
            )}

            <div className="glass-card rounded-xl p-8 flex flex-col justify-center items-center text-center ghost-border relative overflow-hidden group transition-all hover:bg-white/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
              <Quote className="absolute top-4 left-4 text-white/5" size={64} />
              <p className="font-headline text-xl md:text-2xl font-medium text-secondary italic relative z-10 group-hover:text-cyan-100 transition-colors">
                "{tripData.quote}"
              </p>
            </div>

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
