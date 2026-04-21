import { motion } from 'framer-motion';
import { Mountain, UtensilsCrossed, Ship } from 'lucide-react';

export default function GalleryView() {
  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden min-h-[600px] flex items-end pb-16 px-8 md:px-16 glass-card ghost-border ambient-shadow group">
        <img 
          src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=2000" 
          alt="Ha Long Bay" 
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
            A Week in <br /><span className="text-primary">Ha Long Bay</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-secondary max-w-xl leading-relaxed"
          >
            A visual journal capturing the dramatic limestone pillars, vibrant floating villages, and the timeless rhythm of life on the emerald waters.
          </motion.p>
        </div>
      </section>

      {/* The Sights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
        <div className="lg:col-span-4 sticky top-32 space-y-6">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-8 ghost-border">
            <Mountain className="text-primary" size={24} />
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">The Sights</h2>
          <p className="text-secondary leading-relaxed font-body">
            Over 1,600 limestone islands and islets dot the bay, creating a spectacular seascape of limestone pillars. The changing light throughout the day casts dramatic shadows across the rugged karst topography.
          </p>
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=1000" 
                alt="Sights 1" 
                referrerPolicy="no-referrer"
                className="w-full h-80 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=1000" 
                alt="Sights 2" 
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          <div className="space-y-6 md:mt-12">
            <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1544833215-6677f240fc92?auto=format&fit=crop&q=80&w=1000" 
                alt="Sights 3" 
                referrerPolicy="no-referrer"
                className="w-full h-96 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Local Flavors */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
        <div className="lg:col-span-7 grid grid-cols-2 gap-4 order-2 lg:order-1">
          <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group col-span-2">
            <img 
              src="https://images.unsplash.com/photo-1534422298391-e4f8c170db0a?auto=format&fit=crop&q=80&w=1200" 
              alt="Food 1" 
              referrerPolicy="no-referrer"
              className="w-full h-72 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=600" 
              alt="Food 2" 
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="glass-card rounded-xl p-2 ghost-border overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=600" 
              alt="Food 3" 
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-8 ghost-border">
            <UtensilsCrossed className="text-primary" size={24} />
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Local Flavors</h2>
          <p className="text-secondary leading-relaxed font-body">
            The culinary journey here is as rich as the landscape. Freshly caught squid, prawns, and fish are prepared with bright herbs and delicate broths. Dining aboard a junk boat transforms every meal into a sensory event.
          </p>
        </div>
      </section>
    </div>
  );
}
