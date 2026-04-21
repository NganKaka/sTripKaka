import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Globe, Plane, Map as MapIcon, Compass } from 'lucide-react';
import InteractiveMap from './InteractiveMap';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

function AnimatedCounter({ value, className }: { value: number, className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 120, damping: 15 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplay(Math.floor(latest));
    });
  }, [springValue]);

  return <span ref={ref} className={className}>{display}</span>;
}

function AnimatedIcon({ icon: Icon, size }: { icon: any, size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className={inView ? "draw-icon" : ""}>
      <Icon size={size} className="group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
    </div>
  );
}

function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[index];
    const typingSpeed = isDeleting ? 75 : 150;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.substring(0, text.length + 1));
        if (text === currentWord) {
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        setText(currentWord.substring(0, text.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, text === currentWord ? 2500 : typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, words]);

  return (
    <span className="text-primary inline-flex relative min-h-[1.2em]">
      {text}
      <span className="animate-pulse absolute -right-[0.5em]">_</span>
    </span>
  );
}

export function MagneticCard({ children, onClick, className }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
      onClick={onClick}
      className={className}
    >
      <div style={{ transform: "translateZ(30px)" }} className="w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -250]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -80]);
  const metrics = [
    { icon: Globe, value: "42", label: "Coordinates Explored" },
    { icon: Plane, value: "18", label: "Expeditions" },
    { icon: MapIcon, value: "7", label: "Regions Mapped" }
  ];

  const chapters = [
    { title: "Sunset over Phu Quoc", loc: "Phu Quoc, VN", desc: "Golden hour painting the ocean. A perfect escape into the warm coastal breeze.", img: "/phu_quoc/pq_landscape_sea.jpg" },
    { title: "Neon Reflections", loc: "Seoul, KR", desc: "The rain washed away the daytime noise, leaving only the reflection of thousand neon signs.", img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800" },
    { title: "The Silent Pines", loc: "Hokkaido, JP", desc: "Deep in the northern forests, absolute silence reigns supreme. A stark contrast to the buzzing cities.", img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800" }
  ];

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[500px]">
        <div className="space-y-6">
          <span className="text-primary font-tech tracking-[0.2em] font-bold text-sm">CHAPTER IV</span>
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-on-surface">
            The Ngan's<br /><Typewriter words={["Voyager", "Explorer", "Nomad", "Observer"]} />
          </h1>
          <p className="text-secondary text-lg md:text-xl max-w-lg leading-relaxed font-body">
            Chronicling silent explorations through nocturnal cities, forgotten trails, and the quiet spaces between coordinates.
          </p>
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('Journal')}
              className="bg-primary text-background px-8 py-4 rounded-xl text-sm font-bold tracking-wide hover:scale-105 transition-all shadow-[0_0_20px_rgba(233,195,73,0.6)] hover:shadow-[0_0_40px_rgba(233,195,73,1)] border border-primary/50 relative overflow-hidden group cursor-pointer"
            >
              <span className="relative z-10">Explore Chapters</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            <button className="glass-card text-on-surface px-8 py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-white/10 transition-all cursor-pointer">
              View Map
            </button>
          </div>
        </div>

        <div className="relative h-[500px] hidden md:block">
          <motion.div style={{ y: y1 }} className="absolute top-0 right-12 z-20">
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
              className="w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </motion.div>
          </motion.div>
          
          <motion.div style={{ y: y2 }} className="absolute top-32 right-64 z-30">
            <motion.div 
              animate={{ y: [0, 25, 0] }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
              className="w-56 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </motion.div>
          </motion.div>
          
          <motion.div style={{ y: y3 }} className="absolute top-10 right-[-20px] z-40">
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
              className="w-40 h-40 rounded-full overflow-hidden shadow-2xl border-4 border-background"
            >
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Cartography of Memories Map Block */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-surface-container/30 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
      >
        {/* Subtle glow behind the map */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 z-10">
            <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Cartography of Memories</h2>
            <p className="text-secondary text-lg max-w-md font-body leading-relaxed">
              A visual representation of the paths taken. Each point represents a documented memory, a silent observation recorded in the digital log.
            </p>
            <div className="pt-8">
              <span className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2 block">Current Focus</span>
              <h3 className="font-headline text-3xl font-bold text-on-surface drop-shadow-[0_0_15px_rgba(233,195,73,0.4)]">Southeast Asia Trails</h3>
            </div>
          </div>

          <div className="relative">
            <InteractiveMap />
          </div>
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="rounded-3xl p-12 relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-60 pointer-events-none" />
        <div className="absolute inset-[0.5px] rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', padding: '1px', borderRadius: 'inherit' }} />
        <h2 className="font-display text-3xl font-bold tracking-tight mb-12 text-on-surface relative z-10">Voyage Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {metrics.map((m, i) => (
            <div key={i} className="group relative flex items-center gap-6 p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-cyan-400/30 hover:bg-white/[0.08] hover:shadow-[0_0_40px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500 cursor-default">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="w-16 h-16 rounded-xl bg-primary/10 backdrop-blur-sm flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 group-hover:bg-cyan-500/15 group-hover:border-cyan-400/50 group-hover:text-cyan-400 transition-all duration-300 relative z-10">
                <AnimatedIcon icon={m.icon} size={32} />
              </div>
              <div className="relative z-10">
                <div className="text-4xl font-bold text-on-surface font-tech tracking-tight drop-shadow-sm group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] transition-all duration-500 transform group-hover:translate-x-2">
                  <AnimatedCounter value={parseInt(m.value)} />
                </div>
                <div className="text-[10px] text-secondary font-tech uppercase tracking-widest mt-1 opacity-80 group-hover:opacity-100 group-hover:text-cyan-100 transition-all duration-300 transform group-hover:translate-x-1">{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Recent Chapters */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-12"
      >
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Recent Chapters</h2>
            <p className="text-secondary mt-2 font-body">Latest entries from the nocturnal log.</p>
          </div>
          <button onClick={() => setActiveTab('Journal')} className="text-primary font-bold text-sm tracking-wide hover:underline underline-offset-8 transition-all cursor-pointer">
            View Archive
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-1000">
          {chapters.map((c, i) => (
            <MagneticCard 
              key={i} 
              onClick={() => setActiveTab('Destinations')}
              className="group relative rounded-2xl overflow-hidden bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-cyan-400/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500 cursor-pointer"
            >
              {/* Scanline Effect */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,1)] -translate-y-[10px] group-hover:animate-scan z-50 pointer-events-none opacity-0 group-hover:opacity-100" />
              
              <div className="h-48 overflow-hidden relative">
                {/* Coordinates UI overlay */}
                <div className="absolute top-2 left-2 z-20 text-[8px] font-tech text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                  [LAT: {(Math.random() * 90).toFixed(4)}° N]
                </div>
                <div className="absolute top-2 right-2 z-20 text-[8px] font-tech text-cyan-400/80 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                  [LNG: {(Math.random() * 180).toFixed(4)}° E]
                </div>

                <img 
                  src={c.img} 
                  alt={c.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 group-hover:glitch-img" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-[10px] text-primary font-bold tracking-wider shadow-[0_0_10px_rgba(233,195,73,0.2)]">{c.loc}</div>
              </div>
              <div className="p-6 relative">
                <h3 className="text-xl font-bold text-on-surface mb-3 group-hover:text-cyan-400 transition-colors drop-shadow-sm">{c.title}</h3>
                <p className="text-secondary text-sm line-clamp-2 font-body">{c.desc}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[10px] font-tech tracking-widest text-secondary/60">FILE_REF: {i}00X</span>
                  {/* Waveform visualizer */}
                  <div className="flex items-end gap-[2px] h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {[1, 2, 3, 4, 5].map(bar => (
                      <div key={bar} className="w-[1px] bg-cyan-400 waveform-bar" style={{ animationDelay: `${bar * 0.15}s`, height: '2px' }} />
                    ))}
                  </div>
                </div>
              </div>
            </MagneticCard>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
