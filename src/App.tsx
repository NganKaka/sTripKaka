import { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Constellations from './components/Constellations';
import { useMusic } from './contexts/MusicContext';

const Dashboard = lazy(() => import('./components/Dashboard'));
const GalleryView = lazy(() => import('./components/GalleryView'));
const TripDetail = lazy(() => import('./components/TripDetail'));
const Archives = lazy(() => import('./components/Archives'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Stats = lazy(() => import('./components/Stats'));

function PageLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </div>
        <span className="text-[10px] font-tech text-primary/60 uppercase tracking-[0.3em]">Loading</span>
      </div>
    </div>
  );
}

function MusicPlayerHUD() {
  const { activeLocationId, isBlocked, isPlaying, userPlay, userToggle } = useMusic();
  if (!activeLocationId) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-surface-container/70 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-[0_0_24px_rgba(0,0,0,0.5)] select-none">
      {isBlocked ? (
        <button
          type="button"
          onClick={userPlay}
          className="flex items-center gap-2 text-primary font-tech text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/70" />
          </span>
          Play music
        </button>
      ) : (
        <button
          type="button"
          onClick={userToggle}
          className="flex items-center gap-2 text-primary font-tech text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              <span>Now playing</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full border border-primary/60 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              </span>
              <span>Resume</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { deactivateMusic } = useMusic();
  const { scrollYProgress } = useScroll();
  const compassRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setScrollPercent(Math.round(latest * 100));
    });
  }, [scrollYProgress]);

  let activeTab = 'Dashboard';
  let locationId = 'phu_quoc';

  if (location.pathname === '/') activeTab = 'Dashboard';
  else if (location.pathname === '/archives') activeTab = 'Journal';
  else if (location.pathname === '/admin') activeTab = 'Admin';
  else if (location.pathname.startsWith('/gallery/')) {
    activeTab = 'Gallery';
    locationId = location.pathname.split('/')[2] || 'phu_quoc';
  }
  else if (location.pathname.startsWith('/mission-detail/')) {
    activeTab = 'Destinations';
    locationId = location.pathname.split('/')[2] || 'phu_quoc';
  }
  else if (location.pathname === '/stats') activeTab = 'Stats';

  const setActiveTab = (tab: string) => {
    if (tab.startsWith('Destinations:')) {
      const id = tab.split(':')[1] || 'phu_quoc';
      navigate(`/mission-detail/${id}`);
      return;
    }
    if (tab.startsWith('Gallery:')) {
      const id = tab.split(':')[1] || 'phu_quoc';
      navigate(`/gallery/${id}`);
      return;
    }

    switch(tab) {
      case 'Dashboard': navigate('/'); break;
      case 'Journal': navigate('/archives'); break;
      case 'Gallery': navigate(`/gallery/${locationId}`); break;
      case 'Stats': navigate('/stats'); break;
      case 'Admin': navigate('/admin'); break;
      default: navigate('/');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const inMusicScope = activeTab === 'Destinations' || activeTab === 'Gallery';
    if (!inMusicScope) deactivateMusic();
  }, [activeTab, deactivateMusic]);

  return (
    <div className="min-h-screen relative text-on-surface selection:bg-primary/30 selection:text-primary flex flex-col overflow-hidden">
      {!imageModalOpen && !slideshowActive && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.01 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Suspense fallback={<PageLoading />}>
              {activeTab === 'Dashboard' && <Dashboard setActiveTab={setActiveTab} />}
              {activeTab === 'Journal' && <Archives setActiveTab={setActiveTab} />}
              {activeTab === 'Gallery' && <GalleryView setActiveTab={setActiveTab} locationId={locationId} onImageModalChange={setImageModalOpen} onSlideshowChange={setSlideshowActive} />}
              {activeTab === 'Destinations' && <TripDetail setActiveTab={setActiveTab} locationId={locationId} />}
              {activeTab === 'Admin' && <AdminPanel />}
              {activeTab === 'Stats' && <Stats setActiveTab={setActiveTab} />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="z-10 relative"><Footer /></div>

      {/* HUD Compass */}
      {!imageModalOpen && !slideshowActive && (
      <div className="fixed bottom-8 left-8 z-50 flex items-center gap-4 bg-surface-container/60 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="relative w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center bg-surface-container-high/80 shadow-[inset_0_0_10px_rgba(233,195,73,0.1)]">
          <div className="absolute top-1 text-[7px] font-tech text-primary/80 font-bold">N</div>
          <div className="absolute bottom-1 text-[7px] font-tech text-primary/80 font-bold">S</div>
          <div className="absolute left-1 text-[7px] font-tech text-primary/80 font-bold">W</div>
          <div className="absolute right-1 text-[7px] font-tech text-primary/80 font-bold">E</div>
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
      )}

      <MusicPlayerHUD />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1a364a] via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(233,195,73,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(233,195,73,0.03)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
        <Constellations />
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

      {showBackToTop && createPortal(
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-8 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-background/80 text-on-surface/70 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all cursor-pointer backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </motion.button>,
        document.body
      )}

    </div>
  );
}
