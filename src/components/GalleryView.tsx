import { motion, useScroll, useTransform } from 'framer-motion';
import { Mountain, UtensilsCrossed, ArrowLeft } from 'lucide-react';

interface GalleryViewProps {
  setActiveTab: (tab: string) => void;
}

function CircuitNode({ icon: Icon }: { icon: any }) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-20%" }}
      variants={{
        hidden: { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", scale: 0.8, boxShadow: "none" },
        visible: { borderColor: "rgba(34,211,238,0.8)", color: "rgba(34,211,238,1)", scale: 1, boxShadow: "0 0 20px rgba(34,211,238,0.5)" }
      }}
      transition={{ duration: 0.4 }}
      className="w-10 h-10 md:w-12 md:h-12 border-[2px] bg-background flex items-center justify-center relative z-20 rotate-45 shrink-0"
    >
      <div className="-rotate-45">
        <Icon size={20} />
      </div>
    </motion.div>
  );
}

export default function GalleryView({ setActiveTab }: GalleryViewProps) {
  const { scrollYProgress } = useScroll();
  const traceHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="space-y-16 relative w-full">
      {/* Master Vertical Circuit Trace */}
      <div className="absolute left-6 md:left-12 top-[400px] bottom-0 w-[2px] bg-white/5 z-0" />
      <motion.div 
        style={{ height: traceHeight }}
        className="absolute left-6 md:left-12 top-[400px] w-[2px] bg-cyan-400 z-10 shadow-[0_0_15px_rgba(34,211,238,1)] origin-top hidden md:block" // Hidden on mobile to avoid overflow issues if any, but let's keep it visible since we added left-padding.
      />
      <motion.div 
        style={{ height: traceHeight }}
        className="absolute left-6 md:left-12 top-[400px] w-[2px] bg-cyan-400 z-10 shadow-[0_0_15px_rgba(34,211,238,1)] origin-top block" 
      />
      {/* Back Button */}
      <div className="flex items-center">
        <button 
          onClick={() => setActiveTab('Destinations')}
          className="flex items-center gap-2 text-secondary hover:text-cyan-400 transition-colors font-tech text-xs tracking-widest group cursor-pointer drop-shadow-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2]" />
          <span>RETURN TO MISSION</span>
        </button>
      </div>
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden min-h-[600px] flex items-end pb-16 px-8 md:px-16 glass-card ghost-border ambient-shadow group">
        <img 
          src="/phu_quoc/pq_landscape_sea.jpg" 
          alt="Phu Quoc Island" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="relative z-10 max-w-3xl">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline text-primary tracking-[0.05em] uppercase text-sm mb-4 block"
          >
            Expedition Gallery
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-6 leading-tight"
          >
            Sunset over <br /><span className="text-primary">Phu Quoc Island</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-secondary max-w-xl leading-relaxed"
          >
            A visual journal capturing the dramatic ocean views, tranquil lakes, and vibrant life on the pearl island.
          </motion.p>
        </div>
      </section>

      {/* The Sights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start pl-16 md:pl-28 relative">
        {/* Horizontal Circuit Branch */}
        <div className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-white/5 z-0" />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false, margin: "-20%" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left"
        />

        <div className="lg:col-span-4 sticky top-32 space-y-6">
          <div className="flex items-center gap-4 mb-4 -ml-5 md:-ml-8">
            <CircuitNode icon={Mountain} />
            <span className="font-tech text-[10px] uppercase tracking-widest text-cyan-400 font-bold opacity-80 backdrop-blur-md px-2 py-1 rounded bg-cyan-500/10 border border-cyan-400/20">NODE_01: LANDSCAPE</span>
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">The Sights</h2>
          <p className="text-secondary leading-relaxed font-body">
            Endless beaches and hidden lakes dot the island, creating a spectacular tropical escape. The changing light throughout the day casts dramatic shadows across the water.
          </p>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
              <img 
                src="/phu_quoc/pq_landscape_lake.jpg" 
                alt="Sights 1" 
                referrerPolicy="no-referrer"
                className="w-full h-80 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
              <img 
                src="/phu_quoc/pq_landscape_sea_.jpg" 
                alt="Sights 2" 
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          <div className="space-y-6 md:mt-12">
            <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
              <img 
                src="/phu_quoc/pq_landscape_lake_2.jpg" 
                alt="Sights 3" 
                referrerPolicy="no-referrer"
                className="w-full h-96 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Local Flavors */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center pl-16 md:pl-28 relative">
        {/* Horizontal Circuit Branch */}
        <div className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-white/5 z-0" />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false, margin: "-20%" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute left-6 md:left-12 top-6 w-10 md:w-16 h-[2px] bg-cyan-400 z-10 shadow-[0_0_10px_rgba(34,211,238,1)] origin-left"
        />

        <div className="lg:col-span-7 grid grid-cols-2 gap-4 order-2 lg:order-1">
          <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group col-span-2">
            <img 
              src="/phu_quoc/pq_landscape_cafe_highlands.jpg" 
              alt="Food 1" 
              referrerPolicy="no-referrer"
              className="w-full h-72 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
            <img 
              src="/phu_quoc/pq_landscape_sea_3.jpg" 
              alt="Food 2" 
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
            <img 
              src="/phu_quoc/pq_landscape_sea_2.jpg" 
              alt="Food 3" 
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
          <div className="flex items-center gap-4 mb-4 -ml-5 md:-ml-8">
            <CircuitNode icon={UtensilsCrossed} />
            <span className="font-tech text-[10px] uppercase tracking-widest text-cyan-400 font-bold opacity-80 backdrop-blur-md px-2 py-1 rounded bg-cyan-500/10 border border-cyan-400/20">NODE_02: FLAVORS</span>
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Local Flavors</h2>
          <p className="text-secondary leading-relaxed font-body">
            The local hangouts and views are as rich as the landscape. Quiet coffee shops perched over the water, fresh breezes, and the gentle sun create a sensory event at every turn.
          </p>
        </div>
      </section>
    </div>
  );
}
