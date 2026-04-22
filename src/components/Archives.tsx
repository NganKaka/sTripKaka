import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Star, ArrowRight, Play, Loader2 } from 'lucide-react';
import { MagneticCard } from './Dashboard';
import { API_BASE_URL } from '../lib/api';

const API = API_BASE_URL;

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
  h?: number; // Visual height for masonry
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

  const fetchItems = async (isLoadMore = false) => {
    const limit = isLoadMore ? 10 : 5;
    const skip = isLoadMore ? items.length : 0;
    
    if (isLoadMore) setLoadingMore(true);
    
    try {
      const res = await fetch(`${API}/locations/paginated?limit=${limit}&skip=${skip}`);
      const data = await res.json();
      
      const newItems = data.items.map((it: any) => ({
        ...it,
        h: Math.floor(Math.random() * (450 - 320 + 1)) + 320 // Random height for masonry
      }));

      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      setHasMore(data.has_more);
    } catch (error) {
      console.error("Failed to fetch archives:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = items.filter(e => {
    const matchesFilter = activeFilter === 'ALL' || e.chapter.toUpperCase().includes(activeFilter);
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.short_desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight text-on-surface">The Archives</h1>
          <p className="text-secondary text-lg font-body">A curated collection of past expeditions.</p>
        </div>
        <div className="w-full md:w-96 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search memories, locations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all font-body text-sm"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <span className="font-headline text-[10px] uppercase tracking-widest text-secondary/50">Filters:</span>
        {["ALL", "CHAPTER I", "CHAPTER II", "CHAPTER III"].map(f => (
          <button 
            key={f} 
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full glass-card transition-all cursor-pointer ${activeFilter === f ? 'bg-primary/20 border-primary text-primary' : 'hover:bg-white/10'}`}
          >
            <span className="text-[10px] font-bold tracking-widest">{f}</span>
            {activeFilter === f && <X size={14} />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-secondary font-tech text-xs uppercase tracking-widest animate-pulse">Decrypting Records...</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 perspective-1000">
          <AnimatePresence>
            {filtered.map((e) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={e.id}
                className="break-inside-avoid mb-8"
              >
                <MagneticCard 
                  onClick={() => setActiveTab(`Destinations:${e.id}`)}
                  className="glass-card rounded-xl overflow-hidden group flex flex-col transition-colors hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] relative cursor-pointer"
                >
                  <div style={{ height: e.h }} className="flex flex-col">
                    {/* Scanline Effect */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,1)] -translate-y-[10px] group-hover:animate-scan z-50 pointer-events-none opacity-0 group-hover:opacity-100" />
                    
                    <div className="h-1/2 overflow-hidden relative shrink-0">
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
                    <div className="p-6 flex-1 flex flex-col justify-between -mt-4 relative z-10 bg-gradient-to-t from-background/80 to-transparent">
                      <div className="space-y-2">
                        <h2 className="font-headline text-2xl font-bold text-on-surface group-hover:text-cyan-400 transition-colors drop-shadow-sm">{e.name}</h2>
                        <p className="text-secondary text-sm line-clamp-2 font-body transition-all">{e.short_desc}</p>
                        
                        {/* Expandable Excerpt */}
                        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                          <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            <p className="text-[11px] font-tech text-secondary/80 italic border-l-2 border-primary/50 pl-3 mt-3">
                              "{e.full_description?.substring(0, 120)}..."
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-tech tracking-widest text-secondary/60 group-hover:text-cyan-100 transition-colors">{e.visited_date}</span>
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
              <div className="col-span-full py-20 text-center">
                <p className="text-secondary font-headline uppercase tracking-widest opacity-50">No memories found matching your search</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={() => fetchItems(true)}
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

