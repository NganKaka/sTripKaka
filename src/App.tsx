import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import GalleryView from './components/GalleryView';
import TripDetail from './components/TripDetail';
import Archives from './components/Archives';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary/30 selection:text-primary flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {activeTab === 'Dashboard' && <Dashboard />}
            {activeTab === 'Journal' && <Archives />}
            {activeTab === 'Gallery' && <GalleryView />}
            {activeTab === 'Destinations' && <TripDetail />}
            {activeTab === 'Stats' && (
              <div className="flex items-center justify-center py-40">
                <p className="text-secondary font-headline uppercase tracking-widest opacity-50">Exploration Metrics Coming Soon</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Background Particles simulation */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-primary/20 rounded-full animate-pulse" style={{ top: '15%', left: '10%' }} />
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-secondary/20 rounded-full animate-pulse" style={{ top: '65%', left: '85%' }} />
        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-primary/10 rounded-full animate-pulse" style={{ top: '40%', left: '70%' }} />
      </div>
    </div>
  );
}

