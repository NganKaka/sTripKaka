import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Mountain, ArrowLeft, Star } from 'lucide-react';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { apiUrl } from '../lib/api';
import { useMusic } from '../contexts/MusicContext';

type GalleryNode = {
  title: string;
  description: string;
  images: [string, string, string];
};

interface GalleryViewProps {
  setActiveTab: (tab: string) => void;
  locationId?: string;
}

interface ReviewItem {
  id: number;
  location_id: string;
  stars: number;
  nickname: string;
  comment: string;
  created_at: string;
}

interface ReviewsResponse {
  average_stars: number;
  total_reviews: number;
  reviews: ReviewItem[];
}

interface LocationResponse {
  name?: string;
  short_desc?: string;
  gallery_nodes?: any[];
  gallery_images?: string[];
  music_url?: string;
  img?: string;
}

interface ImageNoteItem {
  id: number;
  location_id: string;
  image_src: string;
  nickname: string;
  comment: string;
  created_at: string;
}

interface ImageNotesResponse {
  total_notes: number;
  remaining_slots: number;
  notes: ImageNoteItem[];
}

interface ActiveGalleryImage {
  src: string;
  alt: string;
}

const MAX_IMAGE_NOTES = 3;


const formatImageNoteDate = (iso: string) => {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-GB');
}

const sanitizeImageNoteInput = (value: string) => value.replace(/\r\n/g, '\n');

const getImageNotePreviewLabel = (src: string) => src.split('/').pop() || 'Image';

const getImageNoteStorageKey = (locationId: string, src: string) => `${locationId}:${src}`;

const isImageNoteFormVisible = (totalNotes: number) => totalNotes < MAX_IMAGE_NOTES;

const getImageNoteRemainingLabel = (remaining: number) => remaining === 1 ? '1 slot left' : `${remaining} slots left`;

const normalizeNodeImages = (images: string[] = []): [string, string, string] => [images[0] || '', images[1] || '', images[2] || ''];

const BANNED_REVIEW_WORDS = [
  'cặc', 'cc', 'lồn', 'loz', 'lz', 'l', 'ngu',
  'địt', 'dit', 'dm', 'dmm', 'vcl', 'vl', 'ml', 'óc chó', 'súc vật', 'đb', 'đéo',
];

const normalizeVietnameseText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const maskBannedWords = (comment: string) => {
  if (!comment) return comment;

  const bannedSet = new Set(
    BANNED_REVIEW_WORDS
      .map((word) => normalizeVietnameseText(word.trim()))
      .filter(Boolean),
  );

  return comment.replace(/\S+/g, (token) => {
    const normalizedToken = normalizeVietnameseText(token).replace(/[^a-z0-9]/g, '');
    if (!normalizedToken) return token;
    if (normalizedToken === 'l' || bannedSet.has(normalizedToken)) return '***';
    return token;
  });
};

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

const DEFAULT_CONTENT = LOCATION_CONTENT.phu_quoc;

function CircuitNode({ icon: Icon }: { icon: any }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: '-20%' }}
      variants={{
        hidden: { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', scale: 0.8, boxShadow: 'none' },
        visible: { borderColor: 'rgba(34,211,238,0.8)', color: 'rgba(34,211,238,1)', scale: 1, boxShadow: '0 0 20px rgba(34,211,238,0.5)' },
      }}
      transition={{ duration: 0.4 }}
      className="w-10 h-10 md:w-12 md:h-12 border-[2px] bg-background flex items-center justify-center relative z-20 rotate-45 shrink-0"
    >
      <div className="-rotate-45"><Icon size={20} /></div>
    </motion.div>
  );
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
    <span className={`block transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <img
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

export default function GalleryView({ setActiveTab, locationId = 'phu_quoc' }: GalleryViewProps) {
  const { scrollYProgress } = useScroll();
  const { activateMusic } = useMusic();
  const traceHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const [nodes, setNodes] = useState<GalleryNode[]>([]);
  const [heroImg, setHeroImg] = useState('');
  const [heroHeadline, setHeroHeadline] = useState('Golden Hour Escape');
  const [heroLocationName, setHeroLocationName] = useState('Phu Quoc');
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<ActiveGalleryImage | null>(null);
  const [imageNotes, setImageNotes] = useState<ImageNoteItem[]>([]);
  const [imageNotesLoading, setImageNotesLoading] = useState(false);
  const [imageNoteComment, setImageNoteComment] = useState('');
  const [imageNoteSubmitting, setImageNoteSubmitting] = useState(false);
  const [imageNoteError, setImageNoteError] = useState('');
  const [imageNoteTotal, setImageNoteTotal] = useState(0);
  const [imageNoteRemainingSlots, setImageNoteRemainingSlots] = useState(MAX_IMAGE_NOTES);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageStars, setAverageStars] = useState(5);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [nickname, setNickname] = useState('Guest');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const reviewSectionRef = useRef<HTMLElement | null>(null);

  const content = LOCATION_CONTENT[locationId] || DEFAULT_CONTENT;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const fetchReviews = () => {
    setReviewLoading(true);
    fetch(apiUrl(`/locations/${locationId}/reviews`))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
      })
      .then((data: ReviewsResponse) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverageStars(typeof data.average_stars === 'number' ? data.average_stars : 5);
        setTotalReviews(typeof data.total_reviews === 'number' ? data.total_reviews : 0);
      })
      .catch(() => {
        setReviews([]);
        setAverageStars(5);
        setTotalReviews(0);
      })
      .finally(() => setReviewLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    setActiveImage(null);
    setImageNotes([]);
    setImageNoteError('');
    setImageNoteComment('');
    setImageNoteTotal(0);
    setImageNoteRemainingSlots(MAX_IMAGE_NOTES);
    setShowAllReviews(false);
    setStars(5);
    setNickname('Guest');
    setComment('');
    setReviewError('');

    fetch(apiUrl(`/locations/${locationId}`))
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: LocationResponse) => {
        const backendNodes: GalleryNode[] = Array.isArray(data.gallery_nodes) && data.gallery_nodes.length
          ? data.gallery_nodes.map(normalizeNode)
          : nodesFromLegacyImages(data.gallery_images || []);
        setNodes(backendNodes);
        setHeroImg(backendNodes[0]?.images[0] || data.img || '');
        const subtitle = (data.short_desc || '').trim();
        const locationName = (data.name || locationId.replace(/_/g, ' ')).trim();
        setHeroHeadline(subtitle || 'Golden Hour Escape');
        setHeroLocationName(locationName || 'Unknown Destination');
        activateMusic(locationId, data.music_url);
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
        const fallbackNodes = nodesFromLegacyImages(fallbacks[locationId] || fallbacks.phu_quoc);
        setNodes(fallbackNodes);
        setHeroImg(fallbackNodes[0]?.images[0] || '');
        setHeroHeadline('Golden Hour Escape');
        setHeroLocationName(locationId.replace(/_/g, ' '));
        setLoading(false);
      });

    fetchReviews();
  }, [locationId]);

  useEffect(() => {
    if (!activeImage) return;

    setImageNotes([]);
    setImageNoteError('');
    setImageNoteComment('');
    setImageNoteTotal(0);
    setImageNoteRemainingSlots(MAX_IMAGE_NOTES);
    setImageNotesLoading(true);

    fetch(apiUrl(`/locations/${locationId}/image-notes?image_src=${encodeURIComponent(activeImage.src)}`))
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: ImageNotesResponse) => {
        setImageNotes(Array.isArray(data.notes) ? data.notes : []);
        setImageNoteTotal(typeof data.total_notes === 'number' ? data.total_notes : 0);
        setImageNoteRemainingSlots(typeof data.remaining_slots === 'number' ? data.remaining_slots : MAX_IMAGE_NOTES);
      })
      .catch(() => { setImageNotes([]); })
      .finally(() => setImageNotesLoading(false));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeImage, locationId]);

  useEffect(() => {
    const rawTarget = localStorage.getItem('reviewTarget');
    if (!rawTarget) return;
    const [targetLocationId, targetReviewId] = rawTarget.split(':');
    if (targetLocationId !== locationId) return;

    const scrollToReview = () => {
      const reviewElement = document.getElementById(`review-item-${targetReviewId}`);
      if (reviewElement) {
        setShowAllReviews(true);
        reviewElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        reviewElement.classList.add('ring-2', 'ring-primary/70');
        window.setTimeout(() => reviewElement.classList.remove('ring-2', 'ring-primary/70'), 2200);
      } else if (reviewSectionRef.current) {
        reviewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      localStorage.removeItem('reviewTarget');
    };

    window.setTimeout(scrollToReview, 250);
  }, [locationId, reviews]);

  const openImageModal = (src: string, alt: string) => {
    setActiveImage({ src, alt });
  };

  const closeImageModal = () => {
    setActiveImage(null);
  };

  const handleSubmitImageNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeImage) return;
    const trimmedComment = imageNoteComment.trim();
    if (!trimmedComment) {
      setImageNoteError('Note is required.');
      return;
    }
    if (trimmedComment.length > 150) {
      setImageNoteError('Note must be at most 150 characters.');
      return;
    }

    setImageNoteSubmitting(true);
    setImageNoteError('');

    fetch(apiUrl(`/locations/${locationId}/image-notes`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_src: activeImage.src,
        nickname: 'Guest',
        comment: sanitizeImageNoteInput(trimmedComment),
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || 'Failed to submit note');
        }
        return res.json();
      })
      .then((data: ImageNotesResponse) => {
        setImageNotes(Array.isArray(data.notes) ? data.notes : []);
        setImageNoteTotal(typeof data.total_notes === 'number' ? data.total_notes : 0);
        setImageNoteRemainingSlots(typeof data.remaining_slots === 'number' ? data.remaining_slots : 0);
        setImageNoteComment('');
      })
      .catch(err => setImageNoteError(err.message || 'Submit failed'))
      .finally(() => setImageNoteSubmitting(false));
  };

  const visibleModalNotes = imageNotes;
  const isImageNoteSubmitDisabled = imageNoteSubmitting || !imageNoteComment.trim() || !isImageNoteFormVisible(imageNoteTotal);
  const imageNoteCountLabel = `${imageNoteTotal}/${MAX_IMAGE_NOTES}`;
  const canShowImageNoteForm = isImageNoteFormVisible(imageNoteTotal);
  const activeImageDisplayAlt = activeImage?.alt || '';
  const activeImageDisplaySrc = activeImage?.src || '';

  const handleSelectStar = (value: number) => {
    if (value === 1 && stars === 1) {
      setStars(0);
      return;
    }
    setStars(value);
  };

  const clearRating = () => setStars(0);

  const handleSubmitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setReviewError('Comment is required.');
      return;
    }

    setSubmitting(true);
    setReviewError('');

    fetch(apiUrl(`/locations/${locationId}/reviews`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stars,
        nickname: nickname.trim() || 'Guest',
        comment: trimmedComment,
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || 'Failed to submit review');
        }
        return res.json();
      })
      .then((data: ReviewsResponse) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverageStars(typeof data.average_stars === 'number' ? data.average_stars : 5);
        setTotalReviews(typeof data.total_reviews === 'number' ? data.total_reviews : 0);
        setComment('');
        setNickname('Guest');
        setStars(5);
        setShowAllReviews(false);
      })
      .catch(err => setReviewError(err.message || 'Submit failed'))
      .finally(() => setSubmitting(false));
  };

  const renderStars = (value: number, size = 14) =>
    Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const active = starValue <= value;
      return (
        <Star
          key={`review-star-${value}-${size}-${starValue}`}
          size={size}
          className={active ? 'text-primary fill-primary' : 'text-secondary/40'}
        />
      );
    });

  const renderEditableStars = () =>
    Array.from({ length: 5 }, (_, index) => {
      const value = index + 1;
      const previewActive = hoverStars !== null && value <= hoverStars;
      const selectedActive = hoverStars === null && value <= stars;
      const className = previewActive
        ? 'text-primary/70 fill-primary/20 drop-shadow-[0_0_10px_rgba(233,195,73,0.35)] scale-105'
        : selectedActive
          ? 'text-primary fill-primary drop-shadow-[0_0_10px_rgba(233,195,73,0.8)]'
          : 'text-secondary/40';

      return (
        <button
          key={`form-star-${value}`}
          type="button"
          onClick={() => handleSelectStar(value)}
          onMouseEnter={() => setHoverStars(value)}
          onMouseLeave={() => setHoverStars(null)}
          className="p-1 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
        >
          <Star size={20} className={`${className} transition-all duration-200`} />
        </button>
      );
    });

  const resetStarPreview = () => setHoverStars(null);

  const renderGalleryImage = (src: string, alt: string, heightClass: string) => (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openImageModal(src, alt)}
      className="glass-card rounded-xl p-2 ghost-border overflow-hidden group relative w-full text-left cursor-pointer hover:shadow-[0_0_24px_rgba(34,211,238,0.16)] hover:border-cyan-400/30 transition-all"
    >
      <FadeInImage
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full ${heightClass} object-cover rounded-lg transition-transform duration-500 group-hover:scale-[1.04]`}
      />
      <div className="absolute inset-2 rounded-lg bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-5 right-5 px-3 py-1.5 rounded-full bg-background/75 border border-white/10 text-[10px] font-tech uppercase tracking-[0.2em] text-cyan-200 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none backdrop-blur-md">
        View
      </div>
    </motion.button>
  );

  const formatReviewDate = (iso: string) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-GB');
  };

  const averageDisplay = Number.isFinite(averageStars) ? averageStars.toFixed(1) : '5.0';
  const reviewSummaryLabel = totalReviews === 1 ? '1 review' : `${totalReviews} reviews`;
  const isReviewListExpandable = reviews.length > 3;
  const isSubmitDisabled = submitting || !comment.trim();

  return (
    <div className="space-y-16 relative w-full">
      <div className="absolute left-6 md:left-12 top-[600px] bottom-0 w-[2px] bg-white/5 z-0" />
      <motion.div
        style={{ height: traceHeight }}
        className="absolute left-6 md:left-12 top-[600px] w-[2px] bg-cyan-400 z-0 shadow-[0_0_15px_rgba(34,211,238,1)] origin-top"
      />

      <div className="flex items-center">
        <button
          onClick={() => setActiveTab(`Destinations:${locationId}`)}
          className="flex items-center gap-2 text-secondary hover:text-cyan-400 transition-colors font-tech text-xs tracking-widest group cursor-pointer drop-shadow-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2]" />
          <span>RETURN TO MISSION</span>
        </button>
      </div>

      <section className="relative rounded-2xl overflow-hidden min-h-[600px] flex items-end pb-16 px-8 md:px-16 glass-card ghost-border ambient-shadow group">
        {heroImg && (
          <FadeInImage
            src={heroImg}
            alt={heroLocationName}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="relative z-10 max-w-3xl">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-headline text-primary tracking-[0.05em] uppercase text-sm mb-4 block">
            Expedition Gallery
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight">
            <span className="text-primary">{heroHeadline || `Journey in ${heroLocationName}`}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-secondary max-w-xl leading-relaxed">
            A curated visual journal of landscapes, light, and quiet moments captured throughout the journey.
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
                <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: false, margin: '-20%' }} transition={{ duration: 0.5, delay: 0.2 }} className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-0 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left" />
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

      <section ref={reviewSectionRef} className="pl-16 md:pl-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-primary font-tech text-[10px] uppercase tracking-[0.2em] block">Traveler Reviews</span>
            <h3 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Rate this expedition</h3>
            <div className="glass-card rounded-xl p-5 ghost-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">{renderStars(Math.round(averageStars), 18)}</div>
                <span className="font-headline text-xl text-primary">{averageDisplay}</span>
              </div>
              <p className="text-secondary/70 text-sm">{reviewSummaryLabel}</p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmitReview} className="glass-card rounded-xl p-6 ghost-border space-y-5">
              <div className="space-y-2">
                <label className="text-secondary text-xs font-tech uppercase tracking-[0.2em] block">Your Rating</label>
                <div className="flex items-center gap-1">{renderEditableStars()}</div>
                <button type="button" onClick={clearRating} className="text-[10px] text-secondary/70 hover:text-primary font-tech uppercase tracking-[0.2em] transition-colors cursor-pointer">
                  Clear rating
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-secondary text-xs font-tech uppercase tracking-[0.2em] block">Nickname</label>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="Guest"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-secondary text-xs font-tech uppercase tracking-[0.2em] block">Comment</label>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="Share your thoughts about this location..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>

              {reviewError && <p className="text-rose-300 text-sm">{reviewError}</p>}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-6 py-3 rounded-xl border border-primary/40 text-primary font-headline text-xs uppercase tracking-[0.15em] hover:bg-primary/10 hover:border-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Send review'}
              </button>
            </form>

            {reviewLoading ? (
              <div className="glass-card rounded-xl p-6 ghost-border text-center">
                <p className="text-secondary font-tech text-xs tracking-widest uppercase">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="glass-card rounded-xl p-6 ghost-border text-center">
                <p className="text-secondary/70 font-tech text-xs tracking-widest uppercase">No reviews yet</p>
                <p className="text-secondary/60 text-sm mt-2">Be the first to share your impression.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleReviews.map(review => (
                  <div id={`review-item-${review.id}`} key={`review-${review.id}`} className="glass-card rounded-xl p-5 ghost-border space-y-3 transition-all duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-headline text-sm text-on-surface">{review.nickname || 'Guest'}</span>
                        <div className="flex items-center gap-1">{renderStars(review.stars)}</div>
                      </div>
                      <span className="text-secondary/60 text-[11px] font-tech tracking-wider">{formatReviewDate(review.created_at)}</span>
                    </div>
                    <p className="text-secondary/90 text-sm leading-relaxed">{maskBannedWords(review.comment)}</p>
                  </div>
                ))}
                {isReviewListExpandable && (
                  <div className="flex justify-center pt-2">
                    <button type="button" onClick={() => setShowAllReviews(prev => !prev)} className="text-primary text-xs font-tech tracking-[0.2em] uppercase hover:text-cyan-300 transition-colors cursor-pointer">
                      {showAllReviews ? 'Show less' : 'View all'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activeImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8" onClick={closeImageModal}>
            <div className="absolute inset-0 bg-background/65 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-7xl rounded-3xl border border-white/10 bg-surface/80 p-2.5 md:p-3 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeImageModal}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/70 text-on-surface/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                aria-label="Close image preview"
              >
                <ArrowLeft size={18} className="rotate-45" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-3 items-start">
                <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
                  <FadeInImage src={activeImageDisplaySrc} alt={activeImageDisplayAlt} loading="eager" decoding="async" className="max-h-[84vh] w-full object-contain" />
                </div>

                <motion.aside
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
                  className="relative flex max-h-[84vh] flex-col overflow-hidden rounded-[1.6rem] border border-white/8 bg-black/18 p-2 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(233,195,73,0.8)]" />
                      <span className="text-[10px] font-tech uppercase tracking-[0.22em] text-white/75">Story Notes</span>
                    </div>
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-tech text-white/55">{imageNoteCountLabel}</span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto px-1 py-2">
                    {imageNotesLoading ? (
                      <div className="px-2 py-8 text-center text-white/35 text-[11px] font-tech uppercase tracking-widest">Loading...</div>
                    ) : visibleModalNotes.length === 0 ? (
                      <div className="px-2 py-8 text-center text-white/35 text-xs">No notes yet.</div>
                    ) : (
                      visibleModalNotes.map((note, index) => (
                        <motion.div
                          key={`image-note-${note.id}`}
                          initial={{ opacity: 0, x: 12, y: 4 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ duration: 0.22, delay: index * 0.04 }}
                          className="ml-auto max-w-[92%] rounded-[1.15rem] rounded-br-md border border-white/10 bg-white/10 px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                        >
                          <p className="text-[13px] text-white/88 leading-relaxed break-words">{maskBannedWords(note.comment)}</p>
                          <span className="mt-1.5 block text-[9px] font-tech uppercase tracking-[0.18em] text-white/35">{formatImageNoteDate(note.created_at)}</span>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {canShowImageNoteForm ? (
                    <form onSubmit={handleSubmitImageNote} className="mt-2 space-y-2 border-t border-white/8 px-1 pt-2">
                      <div className="overflow-hidden rounded-[1.3rem] border border-white/10 bg-white/8 focus-within:border-primary/45 transition-colors">
                        <textarea
                          value={imageNoteComment}
                          onChange={(event) => setImageNoteComment(event.target.value)}
                          rows={3}
                          maxLength={150}
                          placeholder="Reply to this story..."
                          className="w-full bg-transparent px-3 py-2.5 text-sm text-white/90 placeholder:text-white/35 focus:outline-none resize-none"
                        />
                        <div className="flex items-center justify-between px-3 pb-2">
                          <span className="text-[9px] font-tech uppercase tracking-[0.16em] text-white/30">{imageNoteComment.length}/150</span>
                          <button
                            type="submit"
                            disabled={isImageNoteSubmitDisabled}
                            className="rounded-full bg-primary/14 px-3 py-1 text-[10px] font-tech uppercase tracking-[0.18em] text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {imageNoteSubmitting ? '...' : 'Send'}
                          </button>
                        </div>
                      </div>
                      {imageNoteError && <p className="px-1 text-xs text-rose-300">{imageNoteError}</p>}
                    </form>
                  ) : (
                    <p className="mt-2 px-2 text-[11px] text-white/40">Max 3 notes reached.</p>
                  )}
                </motion.aside>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
