import { motion } from 'framer-motion';
import { Bell, Settings, Search, Menu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = ["Journal", "Gallery", "Destinations", "Stats"];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/60 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-12 py-6">
        <div 
          className="text-xl font-black text-primary tracking-tighter cursor-pointer"
          onClick={() => setActiveTab('Dashboard')}
        >
          Voyager
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-headline tracking-tighter uppercase text-[12px] font-bold transition-all duration-300 relative pb-1 ${
                activeTab === tab ? "text-primary border-b-2 border-primary" : "text-secondary/60 hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-primary hover:scale-110 transition-transform">
            <Bell size={20} />
          </button>
          <button className="text-secondary hover:scale-110 transition-transform hidden sm:block">
            <Settings size={20} />
          </button>
          <motion.button 
            whileHover={{ scale: 0.95 }}
            whileTap={{ scale: 0.9 }}
            className="bg-gradient-to-r from-primary to-primary/80 text-background px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(233,195,73,0.15)]"
          >
            Begin Journey
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
