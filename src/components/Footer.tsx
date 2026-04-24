import { motion } from 'framer-motion';
import { Mail, HeartHandshake, Landmark, Smartphone, Facebook, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t border-white/10 pt-12 pb-28 px-6 md:px-12 mt-auto relative z-50">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-headline text-2xl md:text-3xl font-bold text-on-surface"
        >
          Vo Hoang Ngan
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-5 text-secondary/80">
          {[
            { icon: Facebook, href: 'https://www.facebook.com/hoang.ngan.399/', label: 'Facebook' },
            { icon: Mail, href: 'mailto:vohoangngan85@gmail.com', label: 'Email' },
            { icon: Github, href: 'https://github.com/NganKaka', label: 'GitHub' },
            { icon: Smartphone, href: 'tel:+84336805251', label: 'Phone' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              aria-label={item.label}
              className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-secondary/70 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 hover:scale-110"
            >
              <item.icon size={18} className="transition-all group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 text-secondary/80">
          <a
            href="mailto:vohoangngan85@gmail.com"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
          >
            <Mail size={16} /> vohoangngan85@gmail.com
          </a>
          <a
            href="tel:+84336805251"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
          >
            <Smartphone size={16} /> +84 336805251
          </a>
        </div>

        <div className="grid w-full gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Landmark size={16} />
              <span className="text-[11px] font-tech uppercase tracking-[0.2em]">Vietcombank</span>
            </div>
            <p className="text-lg font-semibold text-on-surface">9336805251</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <HeartHandshake size={16} />
              <span className="text-[11px] font-tech uppercase tracking-[0.2em]">Momo</span>
            </div>
            <p className="text-lg font-semibold text-on-surface">0336805251</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
