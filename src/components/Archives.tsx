import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Star, ArrowRight, Loader2 } from 'lucide-react';
import { MagneticCard } from './Dashboard';
import { apiUrl } from '../lib/api';

const ARCHIVE_FILTERS = ['ALL', 'CHAPTER I', 'CHAPTER II', 'CHAPTER III'];

const buildArchivesUrl = (skip: number, limit: number, activeFilter: string, searchQuery: string) => {
  const params = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
  });

  if (activeFilter !== 'ALL') {
    params.set('chapter', activeFilter.replace('CHAPTER', 'Chapter').trim());
  }

  const normalizedSearch = searchQuery.trim();
  if (normalizedSearch) {
    params.set('search', normalizedSearch);
  }

  return apiUrl(`/locations/paginated?${params.toString()}`);
};

let searchDebounceId: number | undefined;


interface Location {
  id: string;
  name: string;
  chapter: string;
  short_desc: string;
  img: string;
  visited_date: string;
  highlight_type: string;
  lat: string;
  lng: string;
  full_description?: string;
  average_stars?: number;
  total_reviews?: number;
}

interface ArchivesProps {
  setActiveTab: (tab: string) => void;
}

export default function Archives({ setActiveTab }: ArchivesProps) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  const formatVisitedDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchItems = async (isLoadMore = false, options?: { filter?: string; search?: string }) => {
    const nextFilter = options?.filter ?? activeFilter;
    const nextSearch = options?.search ?? searchQuery;
    const limit = isLoadMore ? 10 : 5;
    const skip = isLoadMore ? items.length : 0;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(buildArchivesUrl(skip, limit, nextFilter, nextSearch));
      if (!res.ok) throw new Error('Failed to fetch archives');
      const data = await res.json();
      const newItems = Array.isArray(data.items) ? data.items : [];

      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      setHasMore(Boolean(data.has_more));
    } catch (error) {
      console.error('Failed to fetch archives:', error);
      if (!isLoadMore) setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    window.clearTimeout(searchDebounceId);
    searchDebounceId = window.setTimeout(() => {
      fetchItems(false, { filter: activeFilter, search: searchQuery });
    }, 350);

    return () => window.clearTimeout(searchDebounceId);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = items;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight text-on-surface">The Archives</h1>
          <p className="text-secondary text-lg font-body">A curated collection of past expeditions.</p>
        </div>
        <div className="w-full md:w-96 flex items-center gap-3">
          <span className="font-headline text-[10px] uppercase tracking-widest text-secondary/60">Search:</span>
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary transition-colors group-hover:text-cyan-200 group-focus-within:text-cyan-200" size={20} />
            <input
              type="text"
              placeholder="Search memories, locations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setItems([]);
                setHasMore(false);
              }}
              className="w-full rounded-3xl border border-cyan-200/25 bg-cyan-950/10 py-4 pl-12 pr-4 font-body text-sm text-cyan-50/95 backdrop-blur-sm transition-all hover:border-cyan-200/50 hover:bg-cyan-900/15 hover:shadow-[0_0_24px_rgba(34,211,238,0.14)] focus:outline-none focus:border-cyan-200/65 focus:bg-cyan-900/20"
            />
          </div>
        </div>
      </header>

      <div className="flex items-center gap-4">
        <span className="font-headline text-[10px] uppercase tracking-widest text-secondary/50">Filters:</span>
        <div ref={filterDropdownRef} className="relative w-full max-w-xs">
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-3xl border border-cyan-200/30 bg-cyan-950/15 px-4 py-3 text-[10px] font-bold tracking-widest text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.10)] backdrop-blur-sm transition-all hover:border-cyan-200/60 hover:bg-cyan-900/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.18)] focus:outline-none focus:border-cyan-200/70"
          >
            <span>{activeFilter}</span>
            <ChevronDown
              size={16}
              className={`text-cyan-200 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 8, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-cyan-200/25 bg-slate-950/55 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.45)] backdrop-blur-md"
              >
                <div className="space-y-1">
                  {ARCHIVE_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setActiveFilter(filter);
                        setItems([]);
                        setHasMore(false);
                        setIsFilterOpen(false);
                      }}
                      className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-[10px] font-bold tracking-widest transition-all ${activeFilter === filter ? 'bg-cyan-400/15 text-cyan-100' : 'text-cyan-50/85 hover:bg-cyan-400/10 hover:text-cyan-100'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-secondary font-tech text-xs uppercase tracking-widest animate-pulse">Decrypting Records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000 items-start">
          <AnimatePresence>
            {filtered.map((e) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={e.id}
                className="mb-8"
              >
                <MagneticCard
                  onClick={() => setActiveTab(`Destinations:${e.id}`)}
                  attractOnProximity
                  className="glass-card rounded-xl overflow-hidden group flex flex-col transition-colors hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] relative cursor-pointer"
                >
                  <div className="flex flex-col">
                    {/* Scanline Effect */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,1)] -translate-y-[10px] group-hover:animate-scan z-50 pointer-events-none opacity-0 group-hover:opacity-100" />
                    
                    <div className="h-64 overflow-hidden relative shrink-0">
                      {/* Coordinates UI overlay */}
                      <div className="absolute top-3 left-3 z-20 text-[8px] font-tech text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                        [LAT: {e.lat}° N]
                      </div>
                      <div className="absolute top-3 right-3 z-20 text-[8px] font-tech text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                        [LNG: {e.lng}° E]
                      </div>
                      <div className="absolute bottom-3 left-3 z-20 text-[8px] font-tech text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                        PROCESSED // {e.id.toUpperCase()}
                      </div>

                      <img 
                        src={e.img} 
                        alt={e.name} 
                        className="w-full h-full object-cover group-hover:scale-110 group-hover:glitch-img transition-transform duration-1000" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800'; }}
                      />
                      {e.highlight_type === 'highlight' && (
                        <div className="absolute top-4 right-4 p-2 rounded-full glass-card shadow-lg z-10 group-hover:opacity-0 transition-opacity">
                          <Star size={14} className="text-primary fill-primary" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col -mt-4 relative z-10 bg-gradient-to-t from-background/80 to-transparent">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="font-headline text-2xl font-bold text-on-surface group-hover:text-cyan-400 transition-colors drop-shadow-sm">{e.name}</h2>
                          <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-tech tracking-[0.18em] text-primary">
                            ★ {(typeof e.average_stars === 'number' ? e.average_stars : 5).toFixed(1)}
                          </div>
                        </div>
                        <p className="text-secondary text-sm line-clamp-2 font-body transition-all">{e.short_desc}</p>
                        <p className="text-[10px] font-tech tracking-[0.18em] uppercase text-secondary/50">{(e.total_reviews || 0) > 0 ? `${e.total_reviews} reviews` : 'Default rating'}</p>

                        {/* Expandable Excerpt */}
                        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                          <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            <p className="text-[11px] font-tech text-secondary/80 italic border-l-2 border-primary/50 pl-3 mt-3">
                              "{e.full_description?.substring(0, 120)}..."
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end mt-4 gap-3">
                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                          <span className="text-[10px] font-tech tracking-widest text-secondary/60 group-hover:text-cyan-100 transition-colors">{formatVisitedDate(e.visited_date)}</span>
                          {/* Waveform visualizer */}
                          <div className="flex items-end gap-[2px] h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {[1, 2, 3, 4, 5].map(bar => (
                              <div key={bar} className="w-[1px] bg-cyan-400 waveform-bar" style={{ animationDelay: `${bar * 0.15}s`, height: '2px' }} />
                            ))}
                          </div>
                        </div>
                        <ArrowRight size={20} className="text-primary cursor-pointer group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
                      </div>
                    </div>
                  </div>
                </MagneticCard>
              </motion.div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="lg:col-span-3 md:col-span-2 col-span-1 py-20 text-center">
                <p className="text-secondary font-headline uppercase tracking-widest opacity-50">No memories found matching your search</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={() => fetchItems(true, { filter: activeFilter, search: searchQuery })}
            disabled={loadingMore}
            className="px-8 py-3 rounded-full glass-card text-[10px] font-bold tracking-widest text-secondary uppercase hover:text-primary transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingMore && <Loader2 size={14} className="animate-spin" />}
            {loadingMore ? 'Accessing Archives...' : 'Load Older Memories'}
          </button>
        </div>
      )}
    </div>
  );
}

