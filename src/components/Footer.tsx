import { motion } from 'framer-motion';
import { Mail, Github, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t border-white/10 py-12 px-6 md:px-12 mt-auto relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
        <div className="flex gap-8">
          {[
            { icon: Mail, href: "mailto:vohoangngan85@gmail.com" },
            { icon: Github, href: "https://github.com/NganKaka" },
            { icon: Facebook, href: "https://www.facebook.com/hoang.ngan.399/" },
            { icon: Instagram, href: "https://www.instagram.com/auag.hoang/" }
          ].map((social, i) => (
            <motion.a
              key={i}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ 
                scale: 1.1,
                color: "#22d3ee" // Cyan glowing
              }}
              className="text-secondary/50 transition-colors cursor-pointer group"
            >
              <social.icon size={24} className="group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all" />
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
