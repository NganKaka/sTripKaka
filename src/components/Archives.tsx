import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, Star, ArrowRight, Play } from 'lucide-react';
import { MagneticCard } from './Dashboard';

interface ArchivesProps {
  setActiveTab: (tab: string) => void;
}

export default function Archives({ setActiveTab }: ArchivesProps) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  const expeditions = [
    { title: "Sunset over Phu Quoc", desc: "Golden hour painting the ocean. A perfect escape into the warm coastal breeze and the endless horizon.", excerpt: "The scent of salt and the sound of waves crashing against the shore echoed through the evening...", tag: "SUMMER 2024", region: "ASIA", img: "/phu_quoc/pq_landscape_sea.jpg", starred: true, h: 420 },
    { title: "Dune Serenade", desc: "The silence of the shifting sands under a canopy of silver stars. Far from the neon lights.", excerpt: "Cold winds swept through the dunes, carrying whispers of ancient caravans across the desert...", tag: "WINTER 2022", region: "EUROPE", img: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=800", h: 320 },
    { title: "Rain on Rue Cler", desc: "Reflections of warm cafe light dancing on wet cobblestones. A perfect espresso to cut the chill.", excerpt: "Sitting by the window, the Parisian rain washed away my fatigue as the city rushed by...", tag: "FALL 2021", region: "EUROPE", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800", h: 380 },
    { title: "Harbour Lights", desc: "Watching the ferries cut paths across the dark water, tracing lines of phosphorescence.", excerpt: "The glowing wake left by the midnight ferry was mesmerizing to watch under the moonlight...", tag: "SUMMER 2021", region: "ASIA", img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800", h: 450 }
  ];

  const filtered = expeditions.filter(e => activeFilter === 'ALL' || e.region === activeFilter);

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
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all font-body text-sm"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <span className="font-headline text-[10px] uppercase tracking-widest text-secondary/50">Filters:</span>
        {["ALL", "ASIA", "EUROPE"].map(f => (
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

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 perspective-1000">
        <AnimatePresence>
          {filtered.map((e, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={e.title}
              className="break-inside-avoid mb-8"
            >
              <MagneticCard 
                onClick={() => setActiveTab('Destinations')}
                className="glass-card rounded-xl overflow-hidden group flex flex-col transition-colors hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] relative cursor-pointer"
              >
                <div style={{ height: e.h }} className="flex flex-col">
                  {/* Scanline Effect */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,1)] -translate-y-[10px] group-hover:animate-scan z-50 pointer-events-none opacity-0 group-hover:opacity-100" />
                  
                  <div className="h-1/2 overflow-hidden relative shrink-0">
                    {/* Coordinates UI overlay */}
                    <div className="absolute top-3 left-3 z-20 text-[8px] font-tech text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                      [LAT: {(Math.random() * 90).toFixed(4)}° N]
                    </div>
                    <div className="absolute top-3 right-3 z-20 text-[8px] font-tech text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                      [LNG: {(Math.random() * 180).toFixed(4)}° E]
                    </div>
                    <div className="absolute bottom-3 left-3 z-20 text-[8px] font-tech text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                      35MM // F1.4 // 1/250S
                    </div>

                    <img src={e.img} alt={e.title} className="w-full h-full object-cover group-hover:scale-110 group-hover:glitch-img transition-transform duration-1000" referrerPolicy="no-referrer"/>
                    {e.starred && (
                      <div className="absolute top-4 right-4 p-2 rounded-full glass-card shadow-lg z-10 group-hover:opacity-0 transition-opacity">
                        <Star size={14} className="text-primary fill-primary" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between -mt-4 relative z-10 bg-gradient-to-t from-background/80 to-transparent">
                    <div className="space-y-2">
                      <h2 className="font-headline text-2xl font-bold text-on-surface group-hover:text-cyan-400 transition-colors drop-shadow-sm">{e.title}</h2>
                      <p className="text-secondary text-sm line-clamp-2 font-body transition-all">{e.desc}</p>
                      
                      {/* Expandable Excerpt */}
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
                        <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                          <p className="text-[11px] font-tech text-secondary/80 italic border-l-2 border-primary/50 pl-3 mt-3">
                            "{e.excerpt}"
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-tech tracking-widest text-secondary/60 group-hover:text-cyan-100 transition-colors">{e.tag}</span>
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

          <motion.article layout className="break-inside-avoid mb-8 glass-card rounded-xl p-8 group flex flex-col h-[400px] relative bg-gradient-to-br from-surface-container-high to-surface">
          <div className="flex-1 space-y-6">
            <div className="inline-block px-3 py-1 glass-card rounded-full text-[10px] font-bold tracking-widest text-secondary uppercase">Journal Extract</div>
            <h2 className="font-headline text-3xl font-bold text-on-surface leading-tight">The Midnight Train to Lucerne</h2>
            <p className="text-secondary italic font-body line-clamp-4">
              "The window was cold against my forehead. Outside, jagged peaks cut through the fog like obsidian teeth, while the rhythmic clack of the rails kept time..."
            </p>
          </div>
          <div className="flex justify-between items-center mt-6">
            <span className="text-[10px] font-bold tracking-widest text-secondary/60">SPRING 2022</span>
            <button className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center shadow-lg hover:scale-110 transition-all">
              <Play size={16} fill="currentColor" />
            </button>
          </div>
        </motion.article>
        </AnimatePresence>
      </div>

      <div className="flex justify-center pt-8">
        <button className="px-8 py-3 rounded-full glass-card text-[10px] font-bold tracking-widest text-secondary uppercase hover:text-primary transition-colors">
          Load Older Memories
        </button>
      </div>
    </div>
  );
}
