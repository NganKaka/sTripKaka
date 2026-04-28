import { motion, AnimatePresence } from 'framer-motion';
import { Mail, HeartHandshake, Landmark, Smartphone, Facebook, Github, Coffee, ChevronDown } from 'lucide-react';
import { useState, memo } from 'react';

const Footer = memo(function Footer() {
  const [showSupportOptions, setShowSupportOptions] = useState(false);

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

        <div className="w-full max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => setShowSupportOptions((prev) => !prev)}
            className="group mx-auto flex w-full max-w-md items-center justify-between rounded-[28px] border border-cyan-300/25 bg-cyan-950/10 px-6 py-4 text-left text-cyan-50 shadow-[0_0_25px_rgba(34,211,238,0.10)] backdrop-blur-sm transition-all hover:border-cyan-300/50 hover:bg-cyan-900/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 transition-all group-hover:scale-105 group-hover:bg-cyan-400/15">
                <Coffee size={20} />
              </div>
              <div>
                <p className="font-headline text-lg font-bold text-on-surface">Buy Me a Coffee</p>
                <p className="text-xs font-tech uppercase tracking-[0.22em] text-cyan-100/60">Tap to show payment QR</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-cyan-200 transition-transform duration-300 ${showSupportOptions ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSupportOptions && (
              <motion.div
                initial={{ opacity: 0, y: -28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                <div className="rounded-[28px] border border-cyan-300/20 bg-slate-950/45 p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.35)] backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-center gap-2 text-primary">
                    <Landmark size={16} />
                    <span className="text-[11px] font-tech uppercase tracking-[0.2em]">Vietcombank</span>
                  </div>
                  <div className="mx-auto mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 w-fit">
                    <img src="/vcb_qr.jpg" alt="Vietcombank QR" className="h-48 w-48 rounded-xl object-cover" />
                  </div>
                  <p className="text-lg font-semibold text-on-surface">9336805251</p>
                </div>

                <div className="rounded-[28px] border border-cyan-300/20 bg-slate-950/45 p-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.35)] backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-center gap-2 text-primary">
                    <HeartHandshake size={16} />
                    <span className="text-[11px] font-tech uppercase tracking-[0.2em]">Momo</span>
                  </div>
                  <div className="mx-auto mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 w-fit">
                    <img src="/momo_qr.jpg" alt="Momo QR" className="h-48 w-48 rounded-xl object-cover" />
                  </div>
                  <p className="text-lg font-semibold text-on-surface">0336805251</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-3 text-[10px] font-tech uppercase tracking-[0.2em] text-secondary/55">Vietcombank & Momo QR are available inside this support section</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
