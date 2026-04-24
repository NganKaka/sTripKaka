import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Mountain, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

type GalleryNode = {
  title: string;
  description: string;
  images: [string, string, string];
};

const normalizeNodeImages = (images: string[] = []): [string, string, string] => [images[0] || '', images[1] || '', images[2] || ''];
const normalizeNode = (node: any): GalleryNode => ({
  title: node?.title || '',
  description: node?.description || '',
  images: normalizeNodeImages(node?.images || []),
});
const nodesFromLegacyImages = (images: string[] = []): GalleryNode[] => {
  if (!images.length) return [];
  const nodes: GalleryNode[] = [];
  for (let i = 0; i < images.length; i += 3) {
    nodes.push({
      title: `Node ${nodes.length + 1}`,
      description: '',
      images: normalizeNodeImages(images.slice(i, i + 3)),
    });
  }
  return nodes;
};

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

  const [nodes, setNodes] = useState<GalleryNode[]>([]);
  const [heroImg, setHeroImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeImageAlt, setActiveImageAlt] = useState('');

  const content = LOCATION_CONTENT[locationId] || DEFAULT_CONTENT;

  useEffect(() => {
    setLoading(true);
    setActiveImage(null);
    setActiveImageAlt('');
    fetch(apiUrl(`/locations/${locationId}`))
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const backendNodes: GalleryNode[] = Array.isArray(data.gallery_nodes) && data.gallery_nodes.length
          ? data.gallery_nodes.map(normalizeNode)
          : nodesFromLegacyImages(data.gallery_images || []);
        setNodes(backendNodes);
        setHeroImg(backendNodes[0]?.images[0] || data.img || '');
        setLoading(false);
      })
      .catch(() => {
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
        const fallbackNodes = nodesFromLegacyImages(fallbacks[locationId] || fallbacks['phu_quoc']);
        setNodes(fallbackNodes);
        setHeroImg(fallbackNodes[0]?.images[0] || '');
        setLoading(false);
      });
  }, [locationId]);

  useEffect(() => {
    if (!activeImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null);
        setActiveImageAlt('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeImage]);

  const openImageModal = (src: string, alt: string) => {
    setActiveImage(src);
    setActiveImageAlt(alt);
  };

  const closeImageModal = () => {
    setActiveImage(null);
    setActiveImageAlt('');
  };

  const renderGalleryImage = (src: string, alt: string, heightClass: string) => (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openImageModal(src, alt)}
      className="glass-card rounded-xl p-2 ghost-border overflow-hidden group relative w-full text-left cursor-pointer hover:shadow-[0_0_24px_rgba(34,211,238,0.16)] hover:border-cyan-400/30 transition-all"
    >
      <img src={src} alt={alt} className={`w-full ${heightClass} object-cover rounded-lg transition-transform duration-500 group-hover:scale-[1.04]`} />
      <div className="absolute inset-2 rounded-lg bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-5 right-5 px-3 py-1.5 rounded-full bg-background/75 border border-white/10 text-[10px] font-tech uppercase tracking-[0.2em] text-cyan-200 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none backdrop-blur-md">
        View
      </div>
    </motion.button>
  );

  return (
    <div className="space-y-16 relative w-full">
      {/* Master Vertical Circuit Trace */}
      <div className="absolute left-6 md:left-12 top-[600px] bottom-0 w-[2px] bg-white/5 z-0" />
      <motion.div
        style={{ height: traceHeight }}
        className="absolute left-6 md:left-12 top-[600px] w-[2px] bg-cyan-400 z-0 shadow-[0_0_15px_rgba(34,211,238,1)] origin-top"
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
          {nodes.map((node, index) => {
            const [img1, img2, img3] = node.images;
            const hasImages = node.images.some(Boolean);
            if (!hasImages) return null;

            const isEven = index % 2 === 0;
            const textColumnClass = isEven ? 'lg:col-span-4 lg:order-1' : 'lg:col-span-4 lg:order-2';
            const imageColumnClass = isEven ? 'lg:col-span-8 lg:order-2' : 'lg:col-span-8 lg:order-1';

            return (
              <section key={`gallery-node-${index}`} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start pl-16 md:pl-28 relative">
                <div className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-white/5 z-0" />
                <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
                  viewport={{ once: false, margin: '-20%' }} transition={{ duration: 0.5, delay: 0.2 }}
                  className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-0 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left"
                />
                <div className={`${textColumnClass} sticky top-32 space-y-6 z-20`}>
                  <div className="flex items-center gap-4 mb-4 -ml-5 md:-ml-8">
                    <CircuitNode icon={Mountain} />
                    <span className="font-tech text-[10px] uppercase tracking-widest text-cyan-400 font-bold opacity-80 backdrop-blur-md px-2 py-1 rounded bg-cyan-500/10 border border-cyan-400/20">
                      NODE_{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">{node.title || `${content.sightsTitle} ${index + 1}`}</h2>
                  <p className="text-secondary leading-relaxed font-body">{node.description || content.sightsDesc}</p>
                </div>
                <div className={`${imageColumnClass} grid grid-cols-1 md:grid-cols-2 gap-6 z-10`}>
                  <div className="space-y-6">
                    {img1 && renderGalleryImage(img1, `${node.title || `Node ${index + 1}`} image 1`, 'h-80')}
                    {img2 && renderGalleryImage(img2, `${node.title || `Node ${index + 1}`} image 2`, 'h-64')}
                  </div>
                  <div className="space-y-6 md:mt-12">
                    {img3 && renderGalleryImage(img3, `${node.title || `Node ${index + 1}`} image 3`, 'h-96')}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8"
            onClick={closeImageModal}
          >
            <div className="absolute inset-0 bg-background/65 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-surface/80 p-3 md:p-4 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeImageModal}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/70 text-on-surface/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                aria-label="Close image preview"
              >
                <ArrowLeft size={18} className="rotate-45" />
              </button>
              <div className="overflow-hidden rounded-[1.25rem]">
                <img
                  src={activeImage}
                  alt={activeImageAlt}
                  className="max-h-[80vh] w-full object-contain bg-black/20"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
