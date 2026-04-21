import { motion } from 'framer-motion';
import { Mail, Github, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-background/30 backdrop-blur-xl border-t border-white/5 py-12 px-6 md:px-12 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
        <div className="flex gap-8">
          {[Mail, Github, Facebook, Instagram].map((Icon, i) => (
            <motion.a
              key={i}
              href="#"
              whileHover={{ 
                scale: 1.1,
                textShadow: "0 0 8px rgba(233, 195, 73, 0.8)",
                color: "#e9c349"
              }}
              className="text-secondary/50 transition-colors"
            >
              <Icon size={24} />
            </motion.a>
          ))}
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          {["Journal Archive", "The Methodology", "Travel Logs", "Privacy"].map((item) => (
            <a
              key={item}
              href="#"
              className="font-headline text-[10px] uppercase tracking-widest text-secondary/50 hover:text-primary transition-colors font-bold"
            >
              {item}
            </a>
          ))}
        </div>
        
        <div className="font-headline text-[10px] uppercase tracking-widest text-secondary/30 text-center">
          © 2024 THE CELESTIAL CARTOGRAPHER. EXPLORATION IN QUIET LUXURY.
        </div>
      </div>
    </footer>
  );
}
