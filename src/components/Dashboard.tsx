import { motion } from 'framer-motion';
import { Globe, Plane, Map as MapIcon, Compass } from 'lucide-react';

export default function Dashboard() {
  const metrics = [
    { icon: Globe, value: "42", label: "Coordinates Explored" },
    { icon: Plane, value: "18", label: "Expeditions" },
    { icon: MapIcon, value: "7", label: "Regions Mapped" }
  ];

  const chapters = [
    { title: "Shadows of Arashiyama", loc: "Kyoto, JP", desc: "Walking through bamboo groves at midnight, where the wind creates a silent symphony.", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800" },
    { title: "Neon Reflections", loc: "Seoul, KR", desc: "The rain washed away the daytime noise, leaving only the reflection of thousand neon signs.", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800" },
    { title: "The Silent Pines", loc: "Hokkaido, JP", desc: "Deep in the northern forests, absolute silence reigns supreme. A stark contrast to the buzzing cities.", img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800" }
  ];

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[500px]">
        <div className="space-y-6">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">Chapter IV</span>
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-on-surface">
            The Luminous<br /><span className="text-primary">Voyager</span>
          </h1>
          <p className="text-secondary text-lg md:text-xl max-w-lg leading-relaxed font-body">
            Chronicling silent explorations through nocturnal cities, forgotten trails, and the quiet spaces between coordinates.
          </p>
          <div className="flex gap-4 mt-8">
            <button className="bg-primary text-background px-8 py-4 rounded-xl text-sm font-bold tracking-wide hover:scale-105 transition-all shadow-[0_0_20px_rgba(233,195,73,0.3)]">
              Explore Chapters
            </button>
            <button className="glass-card text-on-surface px-8 py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-white/10 transition-all">
              View Map
            </button>
          </div>
        </div>

        <div className="relative h-[500px] hidden md:block">
          <motion.div 
            initial={{ rotate: -5, y: 20 }}
            animate={{ rotate: 0, y: 0 }}
            className="absolute top-0 right-12 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl z-20 border border-white/10"
          >
            <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
          </motion.div>
          <motion.div 
            initial={{ scale: 0.9, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            className="absolute top-32 right-64 w-56 h-72 rounded-2xl overflow-hidden shadow-2xl z-30 border border-white/10"
          >
            <img src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-10 right-[-20px] w-40 h-40 rounded-full overflow-hidden shadow-2xl z-40 border-4 border-background"
          >
            <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-surface-container-low rounded-3xl p-12 border border-white/5">
        <h2 className="font-headline text-3xl font-bold tracking-tight mb-12 text-on-surface">Voyage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-6 p-6 glass-card rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <m.icon size={32} />
              </div>
              <div>
                <div className="text-4xl font-bold text-on-surface font-headline tracking-tighter">{m.value}</div>
                <div className="text-[10px] text-secondary uppercase tracking-widest mt-1">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Chapters */}
      <section className="space-y-12">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Recent Chapters</h2>
            <p className="text-secondary mt-2 font-body">Latest entries from the nocturnal log.</p>
          </div>
          <button className="text-primary font-bold text-sm tracking-wide hover:underline underline-offset-8 transition-all">
            View Archive
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {chapters.map((c, i) => (
            <div key={i} className="group bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all cursor-pointer">
              <div className="h-48 overflow-hidden relative">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer"/>
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded text-[10px] text-primary font-bold tracking-wider">{c.loc}</div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">{c.title}</h3>
                <p className="text-secondary text-sm line-clamp-2 font-body">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
