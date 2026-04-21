import { motion } from 'framer-motion';
import { Ship, Sun, Camera, Star, ArrowRight, Quote } from 'lucide-react';

export default function TripDetail() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] md:h-[700px] rounded-xl overflow-hidden ambient-shadow group">
        <img 
          src="https://images.unsplash.com/photo-1544833215-6677f240fc92?auto=format&fit=crop&q=80&w=2000" 
          alt="Ha Long Bay Hero" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 rounded-full font-headline text-[10px] uppercase tracking-[0.05em] text-secondary ghost-border">Vietnam</span>
              <span className="bg-surface-container-high/80 backdrop-blur-md px-3 py-1 rounded-full font-headline text-[10px] uppercase tracking-[0.05em] text-secondary ghost-border">7 Days</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight text-on-surface mb-4 leading-tight drop-shadow-lg">
              A Week in <span className="text-primary">Ha Long Bay</span>
            </h1>
          </div>
          
          <div className="glass-card rounded-xl p-6 ghost-border w-full md:w-auto shrink-0 self-stretch md:self-end flex flex-col justify-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(233,195,73,0.15)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                <img src="https://i.pravatar.cc/150?u=elena" alt="Elena" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
              </div>
              <div>
                <p className="font-headline text-[10px] text-secondary uppercase tracking-[0.05em]">Curated By</p>
                <p className="font-headline font-semibold text-on-surface">Elena R.</p>
              </div>
            </div>
            <button className="bg-primary text-background font-headline font-bold py-3 px-6 rounded-lg w-full transition-all hover:scale-[1.02] active:scale-95">
              View Map
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-6">
            <p className="text-lg md:text-xl font-medium text-on-surface leading-loose first-letter:text-6xl first-letter:font-headline first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:mt-2 font-body">
              Gliding through the emerald waters of the Gulf of Tonkin, the towering limestone karsts seemed to rise from the mist like ancient sleeping dragons. The silence was profound, broken only by the gentle lap of water against our wooden junk boat.
            </p>
            <p className="text-secondary/80 font-body">
              We spent our days exploring hidden caves illuminated by slivers of sunlight, kayaking through narrow archways into secluded lagoons, and watching the sun dip below the jagged horizon, painting the sky in hues of deep violet and gold.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Ship, label: "Transport", value: "Traditional Junk" },
              { icon: Sun, label: "Weather", value: "Misty & Warm" },
              { icon: Camera, label: "Photos", value: "142 Captured" },
              { icon: Star, label: "Highlight", value: "Sung Sot Cave" }
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-xl p-6 ghost-border transition-all hover:bg-white/10 group">
                <stat.icon className="text-secondary mb-3 group-hover:text-primary transition-colors" size={24} />
                <h4 className="font-headline text-[10px] uppercase tracking-[0.05em] text-secondary mb-1">{stat.label}</h4>
                <p className="font-headline font-semibold text-on-surface">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <h3 className="font-headline text-2xl font-bold text-on-surface">Journey Gallery</h3>
          <div className="grid grid-cols-2 gap-4 auto-rows-[200px]">
            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=1200" 
                alt="Main Gallery" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-0 left-0 p-6">
                <span className="font-headline text-[10px] uppercase tracking-[0.05em] text-primary mb-2 block">Day 2</span>
                <h4 className="font-headline text-xl font-bold text-on-surface">Luon Cave Expedition</h4>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1544833215-6677f240fc92?auto=format&fit=crop&q=80&w=600" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=600" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-8 flex flex-col justify-center items-center text-center ghost-border relative overflow-hidden group transition-all hover:bg-white/10">
            <Quote className="absolute top-4 left-4 text-white/5" size={64} />
            <p className="font-headline text-xl md:text-2xl font-medium text-secondary italic relative z-10">
              "The mist here doesn't obscure the view; it paints it, turning the landscape into a living watercolor."
            </p>
          </div>

          <div className="flex justify-center">
            <button className="glass-card group relative flex items-center gap-3 px-8 py-4 border border-primary/50 text-primary font-headline font-bold rounded-xl transition-all hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(233,195,73,0.3)]">
              <span className="tracking-wider uppercase text-xs">See all pictures</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
