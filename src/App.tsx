import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Send } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import GalleryView from './components/GalleryView';
import TripDetail from './components/TripDetail';
import Archives from './components/Archives';
import Constellations from './components/Constellations';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const compassRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setScrollPercent(Math.round(latest * 100));
    });
  }, [scrollYProgress]);

  const activeTabMapping: Record<string, string> = {
    '/': 'Dashboard',
    '/archives': 'Journal',
    '/gallery': 'Gallery',
    '/mission-detail': 'Destinations',
    '/stats': 'Stats'
  };

  const activeTab = activeTabMapping[location.pathname] || 'Dashboard';

  const setActiveTab = (tab: string) => {
    switch(tab) {
      case 'Dashboard': navigate('/'); break;
      case 'Journal': navigate('/archives'); break;
      case 'Gallery': navigate('/gallery'); break;
      case 'Destinations': navigate('/mission-detail'); break;
      case 'Stats': navigate('/stats'); break;
      default: navigate('/');
    }
  };

  useEffect(() => {
    // Only auto-scroll to top smoothly when route changes without clicking logo explicitly on same page
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative text-on-surface selection:bg-primary/30 selection:text-primary flex flex-col overflow-hidden">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {activeTab === 'Dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'Journal' && <Archives setActiveTab={setActiveTab} />}
            {activeTab === 'Gallery' && <GalleryView setActiveTab={setActiveTab} />}
            {activeTab === 'Destinations' && <TripDetail setActiveTab={setActiveTab} />}
            {activeTab === 'Stats' && (
              <div className="flex items-center justify-center py-40">
                <p className="text-secondary font-headline uppercase tracking-widest opacity-50">Exploration Metrics Coming Soon</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="z-10 relative"><Footer /></div>

      {/* HUD Compass & Back to Top */}
      <div className="fixed bottom-8 left-8 z-50 flex items-center gap-4 bg-surface-container/60 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="relative w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center bg-surface-container-high/80 shadow-[inset_0_0_10px_rgba(233,195,73,0.1)]">
          {/* Compass markings */}
          <div className="absolute top-1 text-[7px] font-tech text-primary/80 font-bold">N</div>
          <div className="absolute bottom-1 text-[7px] font-tech text-primary/80 font-bold">S</div>
          <div className="absolute left-1 text-[7px] font-tech text-primary/80 font-bold">W</div>
          <div className="absolute right-1 text-[7px] font-tech text-primary/80 font-bold">E</div>
          
          {/* Needle */}
          <motion.div 
            style={{ rotate: compassRotate }}
            className="w-[2px] h-4 bg-gradient-to-t from-transparent via-primary to-primary rounded-full absolute origin-bottom top-1 shadow-[0_0_10px_rgba(233,195,73,1)]"
          />
          <div className="w-1.5 h-1.5 bg-background rounded-full border border-primary absolute z-10" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-tech text-secondary/60 tracking-[0.2em] leading-tight">SCANNING</span>
          <span className="text-primary font-tech font-bold text-lg leading-tight drop-shadow-[0_0_8px_rgba(233,195,73,0.6)]">
            {scrollPercent < 10 ? `0${scrollPercent}` : scrollPercent}%
          </span>
        </div>
      </div>

      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-[5vh] right-[5vw] xl:right-16 z-[100] w-14 h-14 rounded-full neon-border-wrapper bg-surface-container shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-110 cursor-pointer ${scrollPercent > 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <div className="neon-border-content rounded-full">
          <Send size={22} className="text-primary hover:text-cyan-400 hover:drop-shadow-[0_0_15px_rgba(34,211,238,1)] transition-all duration-300 -translate-y-[1px] translate-x-[1px]" />
        </div>
      </button>

      {/* Dynamic Background with Gradient and Constellations */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep, glowing radial gradient keeping the theme alive */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1a364a] via-background to-background" />
        
        {/* Soft Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(233,195,73,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(233,195,73,0.03)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
        
        {/* Slow-connecting Constellation Layer */}
        <Constellations />
        
        {/* Large floating ambient orbs for depth */}
        <motion.div 
          animate={{ y: [0, -30, 0], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ y: [0, 40, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" 
        />
      </div>
    </div>
  );
}

