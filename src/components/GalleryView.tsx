import { motion, useScroll, useTransform } from 'framer-motion';
import { Mountain, UtensilsCrossed, ArrowLeft, Images } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

interface GalleryViewProps {
  setActiveTab: (tab: string) => void;
  locationId?: string;
}

// Static text content per location
const LOCATION_CONTENT: Record<string, {
  heroTitle: string; heroSub: string; heroDesc: string;
  sightsTitle: string; sightsDesc: string;
  flavorsTitle: string; flavorsDesc: string;
}> = {
  phu_quoc: {
    heroTitle: 'Sunset over', heroSub: 'Phu Quoc Island',
    heroDesc: 'A visual journal capturing the dramatic ocean views, tranquil lakes, and vibrant life on the pearl island.',
    sightsTitle: 'The Sights',
    sightsDesc: 'Endless beaches and hidden lakes dot the island, creating a spectacular tropical escape. The changing light throughout the day casts dramatic shadows across the water.',
    flavorsTitle: 'Local Flavors',
    flavorsDesc: 'The local hangouts and views are as rich as the landscape. Quiet coffee shops perched over the water, fresh breezes, and the gentle sun create a sensory event at every turn.',
  },
  hue: {
    heroTitle: 'Imperial silence of', heroSub: 'Hue City',
    heroDesc: 'A visual journey through ancient citadels, perfumed rivers, and the timeless spirit of the former imperial capital.',
    sightsTitle: 'The Citadel',
    sightsDesc: 'Centuries-old stone walls draped in moss guard the secrets of the Nguyen dynasty. Every corridor of the Imperial City whispers a different ghost story.',
    flavorsTitle: 'River at Dusk',
    flavorsDesc: 'The Perfume River glows softly at golden hour, dragon boats drifting slowly past lantern-lit banks — a scene unchanged across generations.',
  },
};

const DEFAULT_CONTENT = LOCATION_CONTENT['phu_quoc'];

function CircuitNode({ icon: Icon }: { icon: any }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: '-20%' }}
      variants={{
        hidden:  { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', scale: 0.8, boxShadow: 'none' },
        visible: { borderColor: 'rgba(34,211,238,0.8)',  color: 'rgba(34,211,238,1)',   scale: 1,   boxShadow: '0 0 20px rgba(34,211,238,0.5)' },
      }}
      transition={{ duration: 0.4 }}
      className="w-10 h-10 md:w-12 md:h-12 border-[2px] bg-background flex items-center justify-center relative z-20 rotate-45 shrink-0"
    >
      <div className="-rotate-45"><Icon size={20} /></div>
    </motion.div>
  );
}

export default function GalleryView({ setActiveTab, locationId = 'phu_quoc' }: GalleryViewProps) {
  const { scrollYProgress } = useScroll();
  const traceHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const [gallery, setGallery] = useState<string[]>([]);
  const [heroImg, setHeroImg] = useState('');
  const [loading, setLoading] = useState(true);

  const content = LOCATION_CONTENT[locationId] || DEFAULT_CONTENT;

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl(`/locations/${locationId}`))
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const imgs: string[] = data.gallery_images || [];
        setGallery(imgs);
        setHeroImg(imgs[0] || data.img || '');
        setLoading(false);
      })
      .catch(() => {
        // Static fallback
        const fallbacks: Record<string, string[]> = {
          phu_quoc: [
            '/phu_quoc/pq_landscape_sea.jpg', '/phu_quoc/pq_landscape_lake.jpg',
            '/phu_quoc/pq_landscape_cafe_highlands.jpg', '/phu_quoc/pq_landscape_sea_.jpg',
            '/phu_quoc/pq_landscape_lake_2.jpg', '/phu_quoc/pq_landscape_sea_2.jpg',
            '/phu_quoc/pq_landscape_sea_3.jpg',
          ],
          hue: [
            '/hue/hue_landscape_1.jpg', '/hue/hue_landscape_2.jpg',
            '/hue/hue_landscape_3.jpg', '/hue/hue_landscape_4.jpg',
            '/hue/hue_landscape_5.jpg', '/hue/hue_landscape_6.jpg',
            '/hue/hue_landscape_7.jpg',
          ],
        };
        const imgs = fallbacks[locationId] || fallbacks['phu_quoc'];
        setGallery(imgs);
        setHeroImg(imgs[0]);
        setLoading(false);
      });
  }, [locationId]);

  // Split gallery: row1 = [0], row2 = [1,2,3], rest = remaining
  const [img0, img1, img2, img3, ...restImgs] = gallery;

  return (
    <div className="space-y-16 relative w-full">
      {/* Master Vertical Circuit Trace */}
      <div className="absolute left-6 md:left-12 top-[400px] bottom-0 w-[2px] bg-white/5 z-0" />
      <motion.div
        style={{ height: traceHeight }}
        className="absolute left-6 md:left-12 top-[400px] w-[2px] bg-cyan-400 z-10 shadow-[0_0_15px_rgba(34,211,238,1)] origin-top"
      />

      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={() => setActiveTab(`Destinations:${locationId}`)}
          className="flex items-center gap-2 text-secondary hover:text-cyan-400 transition-colors font-tech text-xs tracking-widest group cursor-pointer drop-shadow-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2]" />
          <span>RETURN TO MISSION</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden min-h-[600px] flex items-end pb-16 px-8 md:px-16 glass-card ghost-border ambient-shadow group">
        {heroImg && (
          <img
            src={heroImg}
            alt={content.heroSub}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="relative z-10 max-w-3xl">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="font-headline text-primary tracking-[0.05em] uppercase text-sm mb-4 block">
            Expedition Gallery
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight">
            {content.heroTitle} <br />
            <span className="text-primary">{content.heroSub}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-secondary max-w-xl leading-relaxed">
            {content.heroDesc}
          </motion.p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary font-tech text-xs tracking-widest uppercase">Loading gallery...</p>
          </div>
        </div>
      ) : (
        <>
          {/* The Sights — NODE 01 */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start pl-16 md:pl-28 relative">
            <div className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-white/5 z-0" />
            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
              viewport={{ once: false, margin: '-20%' }} transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left"
            />
            <div className="lg:col-span-4 sticky top-32 space-y-6">
              <div className="flex items-center gap-4 mb-4 -ml-5 md:-ml-8">
                <CircuitNode icon={Mountain} />
                <span className="font-tech text-[10px] uppercase tracking-widest text-cyan-400 font-bold opacity-80 backdrop-blur-md px-2 py-1 rounded bg-cyan-500/10 border border-cyan-400/20">NODE_01: LANDSCAPE</span>
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">{content.sightsTitle}</h2>
              <p className="text-secondary leading-relaxed font-body">{content.sightsDesc}</p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {img1 && (
                  <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
                    <img src={img1} alt="Sights 1" className="w-full h-80 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                {img2 && (
                  <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
                    <img src={img2} alt="Sights 2" className="w-full h-64 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
              </div>
              <div className="space-y-6 md:mt-12">
                {img3 && (
                  <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
                    <img src={img3} alt="Sights 3" className="w-full h-96 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Local Flavors — NODE 02 */}
          {restImgs.length > 0 && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center pl-16 md:pl-28 relative">
              <div className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-white/5 z-0" />
              <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                viewport={{ once: false, margin: '-20%' }} transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left"
              />
              <div className="lg:col-span-7 grid grid-cols-2 gap-4 order-2 lg:order-1">
                {restImgs[0] && (
                  <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group col-span-2">
                    <img src={restImgs[0]} alt="Flavors 1" className="w-full h-72 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                {restImgs[1] && (
                  <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
                    <img src={restImgs[1]} alt="Flavors 2" className="w-full h-48 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                {restImgs[2] && (
                  <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
                    <img src={restImgs[2]} alt="Flavors 3" className="w-full h-48 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-4 -ml-5 md:-ml-8">
                  <CircuitNode icon={UtensilsCrossed} />
                  <span className="font-tech text-[10px] uppercase tracking-widest text-cyan-400 font-bold opacity-80 backdrop-blur-md px-2 py-1 rounded bg-cyan-500/10 border border-cyan-400/20">NODE_02: FLAVORS</span>
                </div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">{content.flavorsTitle}</h2>
                <p className="text-secondary leading-relaxed font-body">{content.flavorsDesc}</p>
              </div>
            </section>
          )}

          {/* Remaining images — full grid */}
          {restImgs.length > 3 && (
            <section className="pl-16 md:pl-28 relative space-y-6">
              <div className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-white/5 z-0" />
              <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                viewport={{ once: false, margin: '-20%' }} transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left"
              />
              <div className="flex items-center gap-4 -ml-5 md:-ml-8 mb-8">
                <CircuitNode icon={Images} />
                <span className="font-tech text-[10px] uppercase tracking-widest text-cyan-400 font-bold opacity-80 backdrop-blur-md px-2 py-1 rounded bg-cyan-500/10 border border-cyan-400/20">NODE_03: ALL FRAMES</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {restImgs.slice(3).map((src, i) => (
                  <div key={i} className="glass-card rounded-xl p-2 ghost-border overflow-hidden group aspect-square">
                    <img src={src} alt={`Photo ${i + 8}`} className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
