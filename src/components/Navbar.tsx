import { motion } from 'framer-motion';
import { Bell, Settings, Search, Menu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs = ["Journal", "Stats"];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/60 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-12 py-6">
        <div 
          className="text-xl font-black text-primary tracking-tighter cursor-pointer"
          onClick={() => {
            if (activeTab === 'Dashboard') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setActiveTab('Dashboard');
            }
          }}
        >
          sTripKaka
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-headline tracking-tighter uppercase text-[12px] font-bold transition-all duration-300 relative pb-1 cursor-pointer ${
                activeTab === tab ? "text-primary border-b-2 border-primary" : "text-secondary/60 hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-primary hover:scale-110 transition-transform cursor-pointer">
            <Bell size={20} />
          </button>
          <button className="text-secondary hover:scale-110 transition-transform hidden sm:block cursor-pointer">
            <Settings size={20} />
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-background px-6 py-2 rounded-lg text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(233,195,73,0.6)] hover:shadow-[0_0_30px_rgba(233,195,73,1)] border border-primary/50 transition-shadow cursor-pointer relative overflow-hidden group"
          >
            <span className="relative z-10">Begin Journey</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
