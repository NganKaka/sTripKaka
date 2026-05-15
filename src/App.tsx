import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppBackground from './components/layout/AppBackground';
import AppRoutes from './components/layout/AppRoutes';
import BackToTopButton from './components/layout/BackToTopButton';
import MusicPlayerHUD from './components/layout/MusicPlayerHUD';
import ScrollCompass from './components/layout/ScrollCompass';
import { useMusic } from './contexts/MusicContext';
import { useActiveRoute } from './hooks/useActiveRoute';
import { useBackToTop } from './hooks/useBackToTop';
import { isMusicRoute } from './lib/navigation';

const Chatbot = lazy(() => import('./components/Chatbot'));

export default function App() {
  const { activeTab, locationId, pathname, setActiveTab } = useActiveRoute();
  const { deactivateMusic } = useMusic();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [slideshowActive, setSlideshowActive] = useState(false);
  const showBackToTop = useBackToTop();
  const chromeHidden = imageModalOpen || slideshowActive;
  const inMusicScope = isMusicRoute(activeTab);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    if (!inMusicScope) deactivateMusic();
  }, [deactivateMusic, inMusicScope]);

  return (
    <div className="min-h-screen relative text-on-surface selection:bg-primary/30 selection:text-primary flex flex-col overflow-hidden">
      {!chromeHidden && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <AppRoutes
              activeTab={activeTab}
              locationId={locationId}
              setActiveTab={setActiveTab}
              onImageModalChange={setImageModalOpen}
              onSlideshowChange={setSlideshowActive}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {!chromeHidden && (
        <Suspense fallback={null}>
          <Chatbot setActiveTab={setActiveTab} currentLocationId={inMusicScope ? locationId : undefined} />
        </Suspense>
      )}

      <div className="z-10 relative"><Footer /></div>

      {/* HUD Compass */}
      {!chromeHidden && <ScrollCompass />}

      <MusicPlayerHUD />

      <AppBackground />

      <BackToTopButton visible={showBackToTop} />

    </div>
  );
}
