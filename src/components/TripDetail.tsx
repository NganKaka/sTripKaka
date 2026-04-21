import { motion, useScroll, useSpring } from 'framer-motion';
import { Ship, Sun, Camera, Star, ArrowRight, Quote, ArrowLeft } from 'lucide-react';

interface TripDetailProps {
  setActiveTab: (tab: string) => void;
}

export default function TripDetail({ setActiveTab }: TripDetailProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left shadow-[0_0_15px_rgba(233,195,73,1)]"
        style={{ scaleX }}
      />
      <div className="space-y-16">
        {/* Back Button */}
      <div className="flex items-center">
        <button 
          onClick={() => setActiveTab('Journal')}
          className="flex items-center gap-2 text-secondary hover:text-cyan-400 transition-colors font-tech text-xs tracking-widest group cursor-pointer drop-shadow-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2]" />
          <span>RETURN TO ARCHIVES</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden ambient-shadow flex flex-col justify-end bg-surface">
        
        {/* Mask Reveal Video Layer */}
        <motion.div 
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 1.5 }}
          className="absolute inset-0 w-full h-full z-0"
        >
          <motion.video 
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 4, ease: "easeOut", delay: 1.5 }}
            autoPlay 
            loop 
            muted 
            playsInline
            poster="/phu_quoc/pq_landscape_sea.jpg"
            className="w-full h-full object-cover opacity-80"
          >
            <source src="/videos/phu_quoc.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </motion.video>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0 pointer-events-none" 
        />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row justify-between items-end gap-6 pointer-events-none">
          <div className="max-w-3xl pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.8 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 rounded-full font-headline text-[10px] uppercase tracking-[0.05em] text-secondary ghost-border shadow-[0_0_10px_rgba(255,255,255,0.05)]">Vietnam</span>
              <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 rounded-full font-headline text-[10px] uppercase tracking-[0.05em] text-secondary ghost-border shadow-[0_0_10px_rgba(255,255,255,0.05)]">7 Days</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight text-on-surface mb-4 leading-tight drop-shadow-[0_0_30px_rgba(0,0,0,1)]"
            >
              Sunset over <span className="text-primary drop-shadow-[0_0_15px_rgba(233,195,73,0.5)]">Phu Quoc</span>
            </motion.h1>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 0.8 }}
            className="glass-card rounded-xl p-6 ghost-border w-full md:w-auto shrink-0 self-stretch md:self-end flex flex-col justify-center transition-all duration-300 hover:shadow-[0_0_30px_rgba(233,195,73,0.2)] pointer-events-auto"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                <img src="https://i.pravatar.cc/150?u=elena" alt="Elena" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
              </div>
              <div>
                <p className="font-headline text-[10px] text-secondary uppercase tracking-[0.05em]">Curated By</p>
                <p className="font-headline font-semibold text-on-surface drop-shadow-sm">Elena R.</p>
              </div>
            </div>
            <button className="bg-primary text-background font-headline font-bold py-3 px-6 rounded-lg w-full transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(233,195,73,0.5)] hover:shadow-[0_0_30px_rgba(233,195,73,0.8)] cursor-pointer">
              View Map
            </button>
          </motion.div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-6">
            <p className="text-lg md:text-xl font-medium text-on-surface leading-loose first-letter:text-6xl first-letter:font-headline first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:mt-2 font-body drop-shadow-sm">
              Riding along the coastal roads of Phu Quoc, the endless ocean seemed to stretch into eternity. The silence was profound, broken only by the gentle lap of water and the distant hum of island life.
            </p>
            <p className="text-secondary/80 font-body">
              We spent our days exploring hidden beaches illuminated by slivers of sunlight, sipping coffee at Highlands overlooking the calm lake, and watching the sun dip below the jagged horizon, painting the sky in hues of deep violet and gold.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Ship, label: "Transport", value: "Scooter" },
              { icon: Sun, label: "Weather", value: "Clear & Breezy" },
              { icon: Camera, label: "Photos", value: "240 Captured" },
              { icon: Star, label: "Highlight", value: "Highlands Lake" }
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-xl p-6 ghost-border transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(233,195,73,0.1)] group">
                <stat.icon className="text-secondary mb-3 group-hover:text-primary transition-colors drop-shadow-sm" size={24} />
                <h4 className="font-headline text-[10px] uppercase tracking-[0.05em] text-secondary mb-1">{stat.label}</h4>
                <p className="font-headline font-semibold text-on-surface group-hover:drop-shadow-[0_0_5px_rgba(233,195,73,0.5)]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <h3 className="font-headline text-2xl font-bold text-on-surface drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Journey Gallery</h3>
          <div className="grid grid-cols-2 gap-4 auto-rows-[200px]">
            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden relative group">
              <img 
                src="/phu_quoc/pq_landscape_sea.jpg" 
                alt="Main Gallery" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-0 left-0 p-6">
                <span className="font-headline text-[10px] uppercase tracking-[0.05em] text-primary mb-2 block drop-shadow-[0_0_8px_rgba(233,195,73,0.8)]">Day 2</span>
                <h4 className="font-headline text-xl font-bold text-on-surface drop-shadow-md">Ocean Horizon</h4>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden group">
              <img 
                src="/phu_quoc/pq_landscape_lake.jpg" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="rounded-xl overflow-hidden group">
              <img 
                src="/phu_quoc/pq_landscape_cafe_highlands.jpg" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-8 flex flex-col justify-center items-center text-center ghost-border relative overflow-hidden group transition-all hover:bg-white/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <Quote className="absolute top-4 left-4 text-white/5" size={64} />
            <p className="font-headline text-xl md:text-2xl font-medium text-secondary italic relative z-10 group-hover:text-cyan-100 transition-colors">
              "The mist here doesn't obscure the view; it paints it, turning the landscape into a living watercolor."
            </p>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setActiveTab('Gallery')}
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
