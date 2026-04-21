import { motion } from 'framer-motion';
import { Search, ChevronDown, X, Star, ArrowRight, Play } from 'lucide-react';

export default function Archives() {
  const expeditions = [
    { title: "Kyoto Whispers", desc: "Walking through bamboo forests as the moon crests over the ancient wooden temples. A quiet solitude.", tag: "AUTUMN 2023", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800", starred: true },
    { title: "Dune Serenade", desc: "The silence of the shifting sands under a canopy of silver stars. Far from the neon lights.", tag: "WINTER 2022", img: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=800" },
    { title: "Rain on Rue Cler", desc: "Reflections of warm cafe light dancing on wet cobblestones. A perfect espresso to cut the chill.", tag: "FALL 2021", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800" },
    { title: "Harbour Lights", desc: "Watching the ferries cut paths across the dark water, tracing lines of phosphorescence.", tag: "SUMMER 2021", img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800" }
  ];

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
        {["YEAR", "REGION", "TAGS"].map(f => (
          <button key={f} className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/10 transition-all">
            <span className="text-[10px] font-bold tracking-widest">{f}</span>
            <ChevronDown size={14} />
          </button>
        ))}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary text-primary">
          <span className="text-[10px] font-bold tracking-widest">ASIA</span>
          <X size={14} className="cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {expeditions.map((e, i) => (
          <article key={i} className="glass-card rounded-xl overflow-hidden group flex flex-col h-[400px] transition-all hover:scale-[1.02] relative">
            <div className="h-1/2 overflow-hidden relative">
              <img src={e.img} alt={e.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer"/>
              {e.starred && (
                <div className="absolute top-4 right-4 p-2 rounded-full glass-card shadow-lg">
                  <Star size={14} className="text-primary fill-primary" />
                </div>
              )}
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between -mt-8 relative z-10">
              <div className="space-y-2">
                <h2 className="font-headline text-2xl font-bold text-on-surface">{e.title}</h2>
                <p className="text-secondary text-sm line-clamp-2 font-body">{e.desc}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-[10px] font-bold tracking-widest text-secondary/60">{e.tag}</span>
                <ArrowRight size={20} className="text-primary cursor-pointer hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </article>
        ))}

        <article className="glass-card rounded-xl p-8 group flex flex-col h-[400px] relative bg-gradient-to-br from-surface-container-high to-surface">
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
        </article>
      </div>

      <div className="flex justify-center pt-8">
        <button className="px-8 py-3 rounded-full glass-card text-[10px] font-bold tracking-widest text-secondary uppercase hover:text-primary transition-colors">
          Load Older Memories
        </button>
      </div>
    </div>
  );
}
