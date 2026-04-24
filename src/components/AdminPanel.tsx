import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit3, Save, X, Image, MapPin, ChevronDown,
  Check, AlertCircle, Loader2, Globe, FileText, Film, Star, Calendar,
  Upload, ImagePlus, ArrowUp, ArrowDown
} from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

// ── Vietnam provinces with coordinates ────────────────────────────────────────
const VN_PLACES: { name: string; lat: string; lng: string }[] = [
  { name: "An Giang",           lat: "10.5215",  lng: "105.1259" },
  { name: "Bà Rịa – Vũng Tàu", lat: "10.5417",  lng: "107.2429" },
  { name: "Bạc Liêu",           lat: "9.2941",   lng: "105.7244" },
  { name: "Bắc Giang",          lat: "21.2819",  lng: "106.1975" },
  { name: "Bắc Kạn",            lat: "22.1474",  lng: "105.8348" },
  { name: "Bắc Ninh",           lat: "21.1861",  lng: "106.0763" },
  { name: "Bến Tre",            lat: "10.2434",  lng: "106.3756" },
  { name: "Bình Dương",         lat: "11.3254",  lng: "106.4770" },
  { name: "Bình Định",          lat: "13.7820",  lng: "109.2197" },
  { name: "Bình Phước",         lat: "11.7512",  lng: "106.7234" },
  { name: "Bình Thuận",         lat: "11.0904",  lng: "108.0721" },
  { name: "Cà Mau",             lat: "9.1769",   lng: "105.1500" },
  { name: "Cần Thơ",            lat: "10.0452",  lng: "105.7469" },
  { name: "Cao Bằng",           lat: "22.6657",  lng: "106.2522" },
  { name: "Đà Lạt",             lat: "11.9404",  lng: "108.4583" },
  { name: "Đà Nẵng",            lat: "16.0544",  lng: "108.2022" },
  { name: "Đắk Lắk",            lat: "12.7100",  lng: "108.2378" },
  { name: "Đắk Nông",           lat: "12.2646",  lng: "107.6098" },
  { name: "Điện Biên",          lat: "21.3860",  lng: "103.0230" },
  { name: "Đồng Nai",           lat: "10.9451",  lng: "106.8246" },
  { name: "Đồng Tháp",          lat: "10.4938",  lng: "105.6882" },
  { name: "Gia Lai",             lat: "13.9833",  lng: "108.0000" },
  { name: "Hà Giang",            lat: "22.8026",  lng: "104.9784" },
  { name: "Hà Nam",              lat: "20.5835",  lng: "105.9230" },
  { name: "Hà Nội",              lat: "21.0285",  lng: "105.8542" },
  { name: "Hà Tĩnh",             lat: "18.3559",  lng: "105.8877" },
  { name: "Hải Dương",           lat: "20.9373",  lng: "106.3147" },
  { name: "Hải Phòng",           lat: "20.8449",  lng: "106.6881" },
  { name: "Hậu Giang",           lat: "9.7579",   lng: "105.6413" },
  { name: "Hòa Bình",            lat: "20.8131",  lng: "105.3383" },
  { name: "Hội An",              lat: "15.8800",  lng: "108.3380" },
  { name: "Huế",                 lat: "16.4637",  lng: "107.5909" },
  { name: "Hưng Yên",            lat: "20.6465",  lng: "106.0514" },
  { name: "Khánh Hòa",           lat: "12.2585",  lng: "109.0526" },
  { name: "Kiên Giang",          lat: "9.8250",   lng: "105.1259" },
  { name: "Kon Tum",             lat: "14.3497",  lng: "108.0005" },
  { name: "Lai Châu",            lat: "22.3964",  lng: "103.4591" },
  { name: "Lạng Sơn",            lat: "21.8537",  lng: "106.7614" },
  { name: "Lào Cai",             lat: "22.4809",  lng: "103.9754" },
  { name: "Lâm Đồng",            lat: "11.9463",  lng: "108.4419" },
  { name: "Long An",             lat: "10.5354",  lng: "106.4052" },
  { name: "Mộc Châu",            lat: "20.8300",  lng: "104.6667" },
  { name: "Mũi Né",              lat: "10.9333",  lng: "108.2833" },
  { name: "Mỹ Tho",              lat: "10.3602",  lng: "106.3598" },
  { name: "Nam Định",            lat: "20.4333",  lng: "106.1833" },
  { name: "Nghệ An",             lat: "19.2342",  lng: "104.9200" },
  { name: "Ninh Bình",           lat: "20.2506",  lng: "105.9745" },
  { name: "Ninh Thuận",          lat: "11.5654",  lng: "108.9880" },
  { name: "Nha Trang",           lat: "12.2388",  lng: "109.1967" },
  { name: "Phú Quốc",            lat: "10.2899",  lng: "103.9840" },
  { name: "Phú Thọ",             lat: "21.4220",  lng: "105.2286" },
  { name: "Phú Yên",             lat: "13.0882",  lng: "109.0929" },
  { name: "Quảng Bình",          lat: "17.6102",  lng: "106.3487" },
  { name: "Quảng Nam",           lat: "15.5394",  lng: "108.0191" },
  { name: "Quảng Ngãi",          lat: "15.1206",  lng: "108.8044" },
  { name: "Quảng Ninh",          lat: "21.0064",  lng: "107.2925" },
  { name: "Quảng Trị",           lat: "16.7943",  lng: "107.0442" },
  { name: "Sapa",                lat: "22.3364",  lng: "103.8438" },
  { name: "Sóc Trăng",           lat: "9.6025",   lng: "105.9740" },
  { name: "Sơn La",              lat: "21.3273",  lng: "103.9140" },
  { name: "Tây Ninh",            lat: "11.3351",  lng: "106.1099" },
  { name: "Thái Bình",           lat: "20.4500",  lng: "106.3400" },
  { name: "Thái Nguyên",         lat: "21.5942",  lng: "105.8480" },
  { name: "Thanh Hóa",           lat: "19.8079",  lng: "105.7762" },
  { name: "Thừa Thiên Huế",      lat: "16.4637",  lng: "107.5909" },
  { name: "Tiền Giang",          lat: "10.4493",  lng: "106.3421" },
  { name: "TP. Hồ Chí Minh",     lat: "10.7769",  lng: "106.7009" },
  { name: "Trà Vinh",            lat: "9.9508",   lng: "106.3428" },
  { name: "Tuyên Quang",         lat: "21.8236",  lng: "105.2180" },
  { name: "Vĩnh Long",           lat: "10.2397",  lng: "105.9571" },
  { name: "Vĩnh Phúc",           lat: "21.3609",  lng: "105.5474" },
  { name: "Yên Bái",             lat: "21.7051",  lng: "104.9049" },
];

const CHAPTERS = Array.from({ length: 20 }, (_, i) => {
  const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][i];
  return `Chapter ${roman}`;
});

const HIGHLIGHT_TYPES = [
  { value: 'secondary', label: 'Secondary', color: 'text-slate-300' },
  { value: 'primary',   label: 'Primary',   color: 'text-amber-300' },
  { value: 'highlight', label: 'Highlight', color: 'text-cyan-300'  },
];

const API = API_BASE_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_');
}

type GalleryNode = {
  uid: string;
  title: string;
  description: string;
  images: [string, string, string];
};

const createNodeUid = () => `node_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const createEmptyNode = (): GalleryNode => ({
  uid: createNodeUid(),
  title: '',
  description: '',
  images: ['', '', ''],
});

const createDefaultNodes = (): GalleryNode[] => [createEmptyNode(), createEmptyNode(), createEmptyNode()];

const normalizeNode = (node: any): GalleryNode => ({
  uid: node?.uid || createNodeUid(),
  title: node?.title || '',
  description: node?.description || '',
  images: [node?.images?.[0] || '', node?.images?.[1] || '', node?.images?.[2] || ''],
});

const nodesFromLegacyImages = (images: string[] = []): GalleryNode[] => {
  if (!images.length) return createDefaultNodes();
  const nodes: GalleryNode[] = [];
  for (let i = 0; i < images.length; i += 3) {
    nodes.push({
      uid: createNodeUid(),
      title: `Node ${nodes.length + 1}`,
      description: '',
      images: [images[i] || '', images[i + 1] || '', images[i + 2] || ''],
    });
  }
  return nodes;
};

const flattenNodeImages = (nodes: GalleryNode[]): string[] => nodes.flatMap(node => node.images).filter(Boolean);
const serializeNodesForPayload = (nodes: GalleryNode[]) => nodes.map(({ title, description, images }) => ({ title, description, images }));

const EMPTY_FORM = {
  id: '', name: '', chapter: 'Chapter I', short_desc: '', img: '',
  visited_date: '', highlight_type: 'secondary', lat: '', lng: '',
  hero_video: '', hero_poster: '', featured_images: ['', '', ''] as [string, string, string], full_description: '',
  gallery_images: [] as string[],
  gallery_nodes: createDefaultNodes(),
};
type Location = typeof EMPTY_FORM;

type ReviewItem = {
  id: number;
  location_id: string;
  stars: number;
  nickname: string;
  comment: string;
  created_at: string;
};

type ReviewsResponse = {
  average_stars: number;
  total_reviews: number;
  reviews: ReviewItem[];
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[11px] font-tech uppercase tracking-widest text-secondary/70">
        <Icon size={12} className="text-primary/60" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all font-body";

// ── Custom Dropdown ────────────────────────────────────────────────────────────
function CustomSelect({
  value, onChange, options
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; color?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface hover:border-primary/40 focus:outline-none focus:border-primary/50 transition-all cursor-pointer group"
      >
        <span className={`font-body font-medium ${selected?.color || 'text-on-surface/80'}`}>{selected?.label || '—'}</span>
        <ChevronDown size={14} className={`text-secondary/50 group-hover:text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] top-full mt-2 w-full rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] border border-white/10 glass-morphism py-2"
            style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)' }}
          >
            {options.map(opt => (
              <li
                key={opt.value}
                onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all hover:bg-primary/10 font-body relative group/item
                  ${opt.value === value ? 'bg-primary/5 text-primary' : 'text-on-surface/70 hover:text-on-surface'}`}
              >
                <div className="flex items-center gap-3">
                  {opt.value === value && <motion.div layoutId="active-dot" className="w-1 h-4 bg-primary rounded-full" />}
                  <span className={`${opt.color || ''} group-hover/item:translate-x-1 transition-transform`}>{opt.label}</span>
                </div>
                {opt.value === value && <Check size={14} className="text-primary" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── helpers ─────────────────
function toRoman(num: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  for (const [v, s] of map) {
    while (num >= v) { res += s; num -= v; }
  }
  return res || 'I';
}

function ChapterSelector({
  value,
  onChange,
  takenChapters,
}: {
  value: string;
  onChange: (v: string) => void;
  takenChapters: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = CHAPTERS.filter(chapter => chapter === value || !takenChapters.includes(chapter));

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative z-10">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface hover:border-primary/40 focus:outline-none focus:border-primary/50 transition-all cursor-pointer group"
      >
        <span className="font-tech font-bold text-primary">{value}</span>
        <ChevronDown size={14} className={`text-secondary/40 group-hover:text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute z-[120] top-full mt-2 w-full rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden glass-morphism py-1.5"
            style={{ background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)' }}
          >
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
              {options.map(chapter => {
                const isSelected = value === chapter;
                return (
                  <li
                    key={chapter}
                    onMouseDown={() => { onChange(chapter); setOpen(false); }}
                    className={`px-4 py-2 text-sm cursor-pointer transition-all hover:bg-primary/10 font-body flex items-center justify-between
                      ${isSelected ? 'bg-primary/5 text-primary' : 'text-on-surface/60 hover:text-on-surface'}`}
                  >
                    <span>{chapter}</span>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </li>
                );
              })}
              {options.length === 0 && (
                <li className="px-4 py-3 text-xs text-secondary/50 font-tech uppercase tracking-widest">No chapter available</li>
              )}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Autocomplete ──────────────────────────────────────────────────────────────
function Autocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (place: { name: string; lat: string; lng: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = VN_PLACES.filter(p =>
    normalize(p.name).includes(normalize(query))
  );

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        className={inputCls}
        placeholder="e.g. Hội An, Đà Lạt…"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-[100] top-full mt-2 w-full rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.8)] border border-white/10 overflow-y-auto custom-scrollbar py-2"
            style={{
              maxHeight: '320px',
              background: 'rgba(15, 23, 42, 0.98)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {filtered.map(p => (
              <li
                key={p.name}
                className="px-4 py-3 text-sm text-on-surface/80 hover:bg-primary/10 hover:text-primary cursor-pointer transition-all flex items-center gap-3 font-body border-b border-white/5 last:border-0 group"
                onMouseDown={() => { setQuery(p.name); onSelect(p); setOpen(false); }}
              >
                <div className="p-1.5 rounded-lg bg-white/5 text-primary/40 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <MapPin size={12} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] font-tech text-secondary/30 uppercase tracking-tighter">Location Coordinate Found</span>
                </div>
                <div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-tech text-primary/50 tracking-widest">{p.lat}°N</span>
                  <span className="text-[9px] font-tech text-primary/50 tracking-widest">{p.lng}°E</span>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(233,195,73,0.2); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(233,195,73,0.4); }
      `}</style>
    </div>
  );
}

// ── Gallery Nodes Input ───────────────────────────────────────────────────────
function GalleryNodesInput({
  nodes,
  onChange,
  locationId,
  getNextIndex,
}: {
  nodes: GalleryNode[];
  onChange: (nodes: GalleryNode[]) => void;
  locationId: string;
  getNextIndex: () => number;
}) {
  const updateNode = (uid: string, patch: Partial<GalleryNode>) => {
    onChange(nodes.map(node => node.uid === uid ? { ...node, ...patch } : node));
  };

  const updateNodeImage = (nodeUid: string, imageIndex: number, value: string) => {
    onChange(nodes.map(node => {
      if (node.uid !== nodeUid) return node;
      const images: [string, string, string] = [...node.images] as [string, string, string];
      images[imageIndex] = value;
      return { ...node, images };
    }));
  };

  const addNode = () => onChange([...nodes, createEmptyNode()]);
  const deleteNode = (index: number) => onChange(nodes.filter((_, i) => i !== index));
  const moveNode = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= nodes.length) return;
    const nextNodes = [...nodes];
    [nextNodes[index], nextNodes[nextIndex]] = [nextNodes[nextIndex], nextNodes[index]];
    onChange(nextNodes);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-tech text-secondary/40 uppercase tracking-wider">{nodes.length} nodes</span>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {nodes.map((node, index) => (
          <motion.div
            key={node.uid}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ layout: { duration: 0.28, ease: 'easeInOut' }, duration: 0.24, ease: 'easeOut' }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 hover:border-primary/20 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-tech text-primary uppercase tracking-[0.25em]">NODE_{String(index + 1).padStart(2, '0')}</p>
                <p className="text-xs text-secondary/50 mt-1">Each node contains title, description and exactly 3 images.</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={index === 0 ? undefined : { y: -2, scale: 1.05 }}
                  whileTap={index === 0 ? undefined : { scale: 0.95 }}
                  type="button"
                  onClick={() => moveNode(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 hover:shadow-[0_0_18px_rgba(233,195,73,0.16)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ArrowUp size={14} />
                </motion.button>
                <motion.button
                  whileHover={index === nodes.length - 1 ? undefined : { y: 2, scale: 1.05 }}
                  whileTap={index === nodes.length - 1 ? undefined : { scale: 0.95 }}
                  type="button"
                  onClick={() => moveNode(index, 1)}
                  disabled={index === nodes.length - 1}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 hover:shadow-[0_0_18px_rgba(233,195,73,0.16)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ArrowDown size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => deleteNode(index)}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-400/35 hover:shadow-[0_0_20px_rgba(239,68,68,0.18)] transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Node Header" icon={FileText}>
                <input
                  className={inputCls}
                  value={node.title}
                  onChange={e => updateNode(node.uid, { title: e.target.value })}
                  placeholder={`Node ${index + 1} title`}
                />
              </Field>

              <Field label="Node Description" icon={FileText}>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={4}
                  value={node.description}
                  onChange={e => updateNode(node.uid, { description: e.target.value })}
                  placeholder="Write node description here..."
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {node.images.map((image, imageIndex) => (
                  <div key={`${node.uid}-image-${imageIndex}`}>
                    <Field label={`Image ${imageIndex + 1}`} icon={Image}>
                      <SingleFileUpload
                        value={image}
                        onChange={value => updateNodeImage(node.uid, imageIndex, value)}
                        locationId={locationId}
                        getNextIndex={getNextIndex}
                      />
                    </Field>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => deleteNode(index)}
                  className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-400/35 transition-all cursor-pointer text-xs font-bold"
                >
                  Delete Node
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex justify-center pt-2">
        <motion.button
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={addNode}
          className="px-5 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-xl text-primary text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 shadow-[0_0_18px_rgba(233,195,73,0.14)] hover:shadow-[0_0_26px_rgba(233,195,73,0.22)]"
        >
          <Plus size={14} /> Add 1 Node
        </motion.button>
      </div>
    </div>
  );
}


// ── Single File Upload ───────────────────────────────────────────────────────
function SingleFileUpload({
  value,
  onChange,
  accept = 'image/*',
  locationId,
  getNextIndex,
}: {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  locationId: string;
  getNextIndex: () => number;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes('video');

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
      const base = locationId || 'location';
      const idx = getNextIndex();
      const newFilename = `${base}_${idx}.${ext}`;
      const fd = new FormData();
      fd.append('file', new File([file], newFilename, { type: file.type }));
      const res = await fetch(`${API}/upload`, { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />

      <AnimatePresence mode="wait" initial={false}>
        {value && !uploading ? (
          <motion.div
            key="uploaded-file"
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {!isVideo ? (
                  <img
                    src={value}
                    alt="Uploaded preview"
                    className="w-12 h-12 rounded-lg object-cover border border-white/10 bg-white/5"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Film size={16} className="text-primary/50" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-on-surface/80 truncate">{value.split('/').pop()}</p>
                  <p className="text-[10px] font-tech text-secondary/40 uppercase tracking-wider">{isVideo ? 'Video uploaded' : 'Image uploaded'}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 rounded-full bg-background/70 border border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all"
              >
                <Trash2 size={12} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload-dropzone"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10, filter: 'blur(5px)' }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f && !uploading) uploadFile(f);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 cursor-pointer transition-all duration-200 select-none overflow-hidden
              ${dragging ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(233,195,73,0.2)] scale-[1.01]' : 'border-white/10 hover:border-primary/40 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(233,195,73,0.08)]'}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-primary animate-spin" />
                <span className="text-[10px] font-tech text-primary uppercase tracking-widest">Uploading...</span>
              </div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  className="p-2.5 rounded-full bg-white/5 border border-white/10 transition-all"
                >
                  {isVideo ? <Film size={18} className="text-primary/50" /> : <Image size={18} className="text-primary/50" />}
                </motion.div>
                <p className="text-xs font-body text-secondary/50 text-center px-4 transition-colors hover:text-secondary/70">
                  <span className="text-primary font-semibold">Click to browse</span> or drag file here
                </p>
                {locationId && (
                  <p className="text-[9px] font-tech text-secondary/30 uppercase tracking-widest">
                    → {locationId}_n.{isVideo ? 'mp4' : 'jpg/png'}
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium
        ${type === 'success' ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' : 'bg-red-500/15 border-red-400/30 text-red-300'}`}
    >
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {msg}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<Location>({ ...EMPTY_FORM, gallery_nodes: createDefaultNodes() });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'form'>('list');
  const [selectedLocationForReviews, setSelectedLocationForReviews] = useState<string | null>(null);
  const [reviewsByLocation, setReviewsByLocation] = useState<Record<string, ReviewItem[]>>({});
  const [reviewsLoadingByLocation, setReviewsLoadingByLocation] = useState<Record<string, boolean>>({});
  const uploadCounterRef = useRef(1);
  const getNextIndex = useCallback(() => uploadCounterRef.current++, []);

  const selectedLocation = useMemo(
    () => locations.find(loc => loc.id === selectedLocationForReviews) || null,
    [locations, selectedLocationForReviews]
  );

  const selectedReviews = useMemo(
    () => (selectedLocationForReviews ? reviewsByLocation[selectedLocationForReviews] || [] : []),
    [reviewsByLocation, selectedLocationForReviews]
  );

  const selectedReviewsLoading = selectedLocationForReviews ? !!reviewsLoadingByLocation[selectedLocationForReviews] : false;

  const formatReviewDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchReviewsForLocation = async (locationId: string) => {
    setReviewsLoadingByLocation(prev => ({ ...prev, [locationId]: true }));
    try {
      const res = await fetch(`${API}/locations/${locationId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data: ReviewsResponse = await res.json();
      setReviewsByLocation(prev => ({ ...prev, [locationId]: Array.isArray(data.reviews) ? data.reviews : [] }));
    } catch {
      setReviewsByLocation(prev => ({ ...prev, [locationId]: [] }));
    } finally {
      setReviewsLoadingByLocation(prev => ({ ...prev, [locationId]: false }));
    }
  };

  const handleSelectLocationForReviews = (locationId: string) => {
    setSelectedLocationForReviews(locationId);
    fetchReviewsForLocation(locationId);
  };

  const handleDeleteReview = async (locationId: string, reviewId: number) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API}/locations/${locationId}/reviews/${reviewId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const data: ReviewsResponse = await res.json();
      setReviewsByLocation(prev => ({ ...prev, [locationId]: Array.isArray(data.reviews) ? data.reviews : [] }));
      showToast('Comment deleted.', 'success');
      fetchLocations();
    } catch {
      showToast('Delete comment failed.', 'error');
    }
  };

  const handleDeleteAllReviewsForLocation = async (locationId: string) => {
    const confirmed = window.confirm('Delete all comments for this location?');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API}/locations/${locationId}/reviews`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete all failed');
      const data: ReviewsResponse = await res.json();
      setReviewsByLocation(prev => ({ ...prev, [locationId]: Array.isArray(data.reviews) ? data.reviews : [] }));
      showToast('All comments deleted for this location.', 'success');
      fetchLocations();
    } catch {
      showToast('Delete all comments failed.', 'error');
    }
  };

  const handleOpenReviewFromAdmin = (locationId: string, reviewId: number) => {
    localStorage.setItem('reviewTarget', `${locationId}:${reviewId}`);
    navigate(`/gallery/${locationId}`);
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'vohoangngan85' && password === 'vohoangngan85') {
      setIsLoggedIn(true);
      setLoginError('');
      showToast('Login successful', 'success');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API}/locations`);
      const data = await res.json();
      setLocations(data);
    } catch {
      showToast('Cannot connect to backend. Is the server running?', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  // Auto-generate ID from name + fill lat/lng from preset
  const handleNameChange = (name: string) => {
    const newId = slugify(name);
    setForm(f => ({ ...f, name, id: editing ? f.id : newId }));
  };

  const handlePlaceSelect = (place: { name: string; lat: string; lng: string }) => {
    const newId = slugify(place.name);
    setForm(f => ({
      ...f,
      name: place.name,
      id: editing ? f.id : newId,
      lat: place.lat,
      lng: place.lng,
    }));
  };

  const takenChapters = useMemo(
    () => locations.filter(loc => loc.id !== editing).map(loc => loc.chapter),
    [locations, editing]
  );

  const isChapterTaken = useCallback((chapter: string) => {
    return takenChapters.includes(chapter);
  }, [takenChapters]);

  const handleChapterChange = (chapter: string) => {
    if (isChapterTaken(chapter)) {
      showToast(`${chapter} is already used by another location.`, 'error');
      return;
    }
    setForm(f => ({ ...f, chapter }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.short_desc || !form.img) {
      showToast('Name, short description and thumbnail are required.', 'error');
      return;
    }
    if (isChapterTaken(form.chapter)) {
      showToast(`${form.chapter} is already used by another location.`, 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        gallery_nodes: serializeNodesForPayload(form.gallery_nodes),
        gallery_images: flattenNodeImages(form.gallery_nodes).length ? flattenNodeImages(form.gallery_nodes) : null,
        featured_images: form.featured_images,
        hero_video: form.hero_video || null,
        hero_poster: form.hero_poster || null,
        full_description: form.full_description || null,
      };

      if (editing) {
        const res = await fetch(`${API}/locations/${editing}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        showToast(`"${form.name}" updated successfully!`, 'success');
      } else {
        const res = await fetch(`${API}/locations`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Error'); }
        showToast(`"${form.name}" added to the journey!`, 'success');
      }

      setForm({ ...EMPTY_FORM, gallery_nodes: createDefaultNodes() });
      setEditing(null);
      setActiveSection('list');
      uploadCounterRef.current = 1;
      fetchLocations();
    } catch (err: any) {
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc: any) => {
    const legacyImages: string[] = loc.gallery_images || [];
    const nodes: GalleryNode[] = Array.isArray(loc.gallery_nodes) && loc.gallery_nodes.length
      ? loc.gallery_nodes.map(normalizeNode)
      : nodesFromLegacyImages(legacyImages);
    const featuredImages = Array.isArray(loc.featured_images) && loc.featured_images.length
      ? [loc.featured_images[0] || '', loc.featured_images[1] || '', loc.featured_images[2] || ''] as [string, string, string]
      : [loc.hero_poster || '', '', ''] as [string, string, string];

    const normalized = {
      ...EMPTY_FORM,
      ...loc,
      featured_images: featuredImages,
      gallery_nodes: nodes,
      gallery_images: legacyImages,
    };

    setForm(normalized);
    setEditing(loc.id);
    setActiveSection('form');
    uploadCounterRef.current = flattenNodeImages(nodes).length + 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Location deleted.', 'success');
      setDeleteConfirm(null);
      fetchLocations();
    } catch {
      showToast('Delete failed.', 'error');
    }
  };

  const cancelForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setActiveSection('list');
    uploadCounterRef.current = 1;
  };

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 ghost-border max-w-sm w-full mx-4 space-y-6 bg-surface-container/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Star size={32} className="text-primary" />
            </div>
            <h1 className="font-headline text-2xl font-black text-on-surface">sTripKaka Admin</h1>
            <p className="text-secondary/60 text-xs uppercase tracking-widest font-tech mt-1">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-tech uppercase tracking-widest text-secondary/70 ml-1">Username</label>
              <input type="text" className={inputCls} value={username}
                onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-tech uppercase tracking-widest text-secondary/70 ml-1">Password</label>
              <input type="password" className={inputCls} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            {loginError && (
              <p className="text-red-400 text-xs flex items-center gap-1.5 px-1">
                <AlertCircle size={14} /> {loginError}
              </p>
            )}
            <button type="submit"
              className="w-full py-3 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.3)] hover:shadow-[0_0_30px_rgba(233,195,73,0.5)] transition-all hover:scale-[1.02] cursor-pointer">
              Access Command Center
            </button>
          </form>
        </motion.div>

        <AnimatePresence>
          {toast && <Toast msg={toast.msg} type={toast.type} />}
        </AnimatePresence>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-tech text-[10px] uppercase tracking-widest text-primary/60 block mb-1">Control Center</span>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">
            Journey <span className="text-primary">Admin</span>
          </h1>
          <p className="text-secondary/60 text-sm mt-1">Manage your travel locations database</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 text-secondary hover:text-on-surface font-headline font-bold rounded-xl text-sm border border-white/10 transition-all cursor-pointer">
            Logout
          </button>
          <button
            onClick={() => { cancelForm(); setActiveSection(activeSection === 'form' ? 'list' : 'form'); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:shadow-[0_0_30px_rgba(233,195,73,0.7)] transition-all hover:scale-[1.02] cursor-pointer">
            {activeSection === 'form' ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Location</>}
          </button>
        </div>
      </div>

      {/* Tab Row */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(['list', 'form'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveSection(tab); if (tab === 'list') cancelForm(); }}
            className={`px-5 py-2.5 font-headline text-xs uppercase tracking-widest font-bold transition-all rounded-t-lg -mb-px
              ${activeSection === tab ? 'text-primary border-b-2 border-primary' : 'text-secondary/40 hover:text-secondary'}`}>
            {tab === 'list' ? `Locations (${locations.length})` : editing ? 'Edit Location' : 'Add New'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
        {activeSection === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="text-primary animate-spin" />
              </div>
            ) : locations.length === 0 ? (
              <div className="glass-card rounded-xl p-16 flex flex-col items-center gap-4 ghost-border text-center">
                <Globe size={40} className="text-secondary/30" />
                <p className="text-secondary/50 font-tech text-xs uppercase tracking-widest">No locations yet</p>
                <button onClick={() => setActiveSection('form')}
                  className="px-6 py-2.5 border border-primary/40 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-all cursor-pointer">
                  Add your first destination
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {locations.map(loc => (
                    <motion.div key={loc.id}
                      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectLocationForReviews(loc.id)}
                      className={`glass-card rounded-xl overflow-hidden ghost-border group hover:shadow-[0_0_30px_rgba(233,195,73,0.08)] transition-all cursor-pointer ${selectedLocationForReviews === loc.id ? 'ring-1 ring-primary/40 border-primary/30' : ''}`}>
                      <div className="relative h-40 overflow-hidden">
                        <img src={loc.img} alt={loc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className={`text-[9px] font-tech uppercase tracking-wider px-2 py-1 rounded-full font-bold
                            ${loc.highlight_type === 'highlight' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                              : loc.highlight_type === 'primary' ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-white/10 text-secondary border border-white/20'}`}>
                            {loc.highlight_type}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-tech text-primary/70 uppercase tracking-widest">{loc.chapter}</p>
                        <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">{loc.name}</h3>
                        <p className="text-secondary/60 text-xs mt-0.5">{loc.short_desc}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <span className="text-[10px] text-secondary/40 font-tech flex items-center gap-1">
                            <Calendar size={10} /> {loc.visited_date || '—'}
                          </span>
                          <div className="flex gap-2">
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleEdit(loc); }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-primary/15 hover:text-primary text-secondary/50 transition-all cursor-pointer">
                              <Edit3 size={14} />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(loc.id); }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-secondary/50 transition-all cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-tech text-primary/70 uppercase tracking-widest">Location comments</p>
                      <h3 className="font-headline font-bold text-on-surface text-xl">
                        {selectedLocation ? selectedLocation.name : 'Select a location'}
                      </h3>
                      <p className="text-secondary/60 text-sm mt-1">
                        {selectedLocation ? 'Manage comments for the selected location.' : 'Click a location card above to load its comments.'}
                      </p>
                    </div>
                    {selectedLocation && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAllReviewsForLocation(selectedLocation.id)}
                        disabled={selectedReviewsLoading || selectedReviews.length === 0}
                        className="px-4 py-2.5 rounded-xl border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-all text-xs font-headline font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Delete all
                      </button>
                    )}
                  </div>

                  {!selectedLocation ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-secondary/50 text-sm">
                      No location selected.
                    </div>
                  ) : selectedReviewsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={24} className="text-primary animate-spin" />
                    </div>
                  ) : selectedReviews.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-secondary/50 text-sm">
                      This location has no comments yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReviews.map(review => (
                        <div key={`admin-review-${review.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <button
                            type="button"
                            onClick={() => handleOpenReviewFromAdmin(review.location_id, review.id)}
                            className="space-y-2 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-headline text-on-surface text-sm">{review.nickname || 'Guest'}</span>
                              <span className="text-[10px] font-tech tracking-widest text-primary uppercase">★ {review.stars}/5</span>
                              <span className="text-[10px] font-tech tracking-widest text-secondary/40 uppercase">{formatReviewDate(review.created_at)}</span>
                            </div>
                            <p className="text-sm text-secondary leading-relaxed break-words">{review.comment}</p>
                            <span className="inline-block text-[10px] font-tech uppercase tracking-widest text-primary/70 transition-all duration-200 hover:text-cyan-300 hover:tracking-[0.2em] hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]">Open in gallery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.location_id, review.id)}
                            className="shrink-0 self-start p-2 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-secondary/50 transition-all cursor-pointer"
                            aria-label="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── FORM VIEW ─────────────────────────────────────────────────────── */}
        {activeSection === 'form' && (
          <motion.form key="form" onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-5">
              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> Basic Info
                </h2>

                <Field label="Destination Name" icon={MapPin}>
                  <Autocomplete
                    value={form.name}
                    onChange={handleNameChange}
                    onSelect={handlePlaceSelect}
                  />
                </Field>

                <Field label="Auto ID (slug)" icon={FileText}>
                  <input className={inputCls} value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                    placeholder="auto-generated" readOnly={!!editing}
                    style={editing ? { opacity: 0.5 } : {}} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Chapter" icon={Star}>
                    <ChapterSelector
                      value={form.chapter}
                      onChange={handleChapterChange}
                      takenChapters={takenChapters}
                    />
                  </Field>

                  <Field label="Type" icon={ChevronDown}>
                    <CustomSelect
                      value={form.highlight_type}
                      onChange={v => setForm(f => ({ ...f, highlight_type: v }))}
                      options={HIGHLIGHT_TYPES}
                    />
                  </Field>
                </div>

                <Field label="Short Description (card subtitle)" icon={FileText}>
                  <input className={inputCls} value={form.short_desc}
                    onChange={e => setForm(f => ({ ...f, short_desc: e.target.value }))}
                    placeholder="e.g. Golden Hour Escape" maxLength={60} />
                </Field>

                <Field label="Visited Date" icon={Calendar}>
                  <input type="date" className={inputCls} value={form.visited_date}
                    onChange={e => setForm(f => ({ ...f, visited_date: e.target.value }))} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude" icon={MapPin}>
                    <input className={inputCls} value={form.lat} placeholder="e.g. 16.4637"
                      onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                  </Field>
                  <Field label="Longitude" icon={MapPin}>
                    <input className={inputCls} value={form.lng} placeholder="e.g. 107.5909"
                      onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                  </Field>
                </div>

                {/* Lat/Lng hint */}
                {(form.lat || form.lng) && (
                  <p className="text-[10px] font-tech text-primary/50 flex items-center gap-1.5 -mt-2">
                    <MapPin size={10} />
                    Auto-filled from destination — you can adjust manually
                  </p>
                )}
              </div>

              {/* Media */}
              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <Image size={16} className="text-primary" /> Media
                </h2>

                <Field label="Thumbnail Image" icon={Image}>
                  <SingleFileUpload
                    value={form.img}
                    onChange={v => setForm(f => ({ ...f, img: v }))}
                    locationId={form.id}
                    getNextIndex={getNextIndex}
                  />
                </Field>

                <Field label="Hero Video (optional)" icon={Film}>
                  <SingleFileUpload
                    value={form.hero_video}
                    onChange={v => setForm(f => ({ ...f, hero_video: v }))}
                    accept="video/*"
                    locationId={form.id}
                    getNextIndex={getNextIndex}
                  />
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-tech uppercase tracking-widest text-secondary/70">Featured Images (Top 3)</p>
                    <span className="text-[10px] font-tech text-secondary/40 uppercase tracking-wider">Used in TripDetail hero/gallery</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {form.featured_images.map((image, index) => (
                      <div key={`featured-image-${index}`}>
                        <Field label={`Featured ${index + 1}`} icon={Image}>
                          <SingleFileUpload
                            value={image}
                            onChange={v => setForm(f => {
                              const next: [string, string, string] = [...f.featured_images] as [string, string, string];
                              next[index] = v;
                              return { ...f, featured_images: next };
                            })}
                            locationId={form.id}
                            getNextIndex={getNextIndex}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                </div>

                <Field label="Legacy Hero Poster (fallback only)" icon={Image}>
                  <SingleFileUpload
                    value={form.hero_poster}
                    onChange={v => setForm(f => ({ ...f, hero_poster: v }))}
                    locationId={form.id}
                    getNextIndex={getNextIndex}
                  />
                </Field>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-5">
              {/* Full Description */}
              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <FileText size={16} className="text-primary" /> Story
                </h2>
                <Field label="Full Description (TripDetail body)" icon={FileText}>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={10}
                    value={form.full_description}
                    onChange={e => setForm(f => ({ ...f, full_description: e.target.value }))}
                    placeholder={"Write your travel story here…\n\nSupports multiple paragraphs."}
                  />
                </Field>
              </div>

              {/* Gallery */}
              <div className="glass-card rounded-xl p-6 ghost-border space-y-4">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <Image size={16} className="text-primary" /> Gallery Nodes
                  <span className="ml-auto text-[10px] font-tech text-secondary/40 uppercase tracking-wider">
                    {form.gallery_nodes.length} nodes
                  </span>
                </h2>
                <GalleryNodesInput
                  nodes={form.gallery_nodes}
                  onChange={nodes => setForm(f => ({ ...f, gallery_nodes: nodes, gallery_images: flattenNodeImages(nodes) }))}
                  locationId={form.id}
                  getNextIndex={getNextIndex}
                />
              </div>

              {/* Submit */}
              <motion.div layout transition={{ layout: { duration: 0.28, ease: 'easeInOut' } }} className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:shadow-[0_0_30px_rgba(233,195,73,0.7)] transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {loading ? 'Saving…' : editing ? 'Update Location' : 'Save Location'}
                </button>
                {editing && (
                  <button type="button" onClick={cancelForm}
                    className="px-5 py-3.5 border border-white/10 text-secondary/60 hover:text-secondary rounded-xl text-sm font-bold transition-all cursor-pointer">
                    Cancel
                  </button>
                )}
              </motion.div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 ghost-border max-w-sm w-full mx-4 space-y-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface">Delete Location</h3>
                  <p className="text-secondary/50 text-xs">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-secondary text-sm">
                Are you sure you want to delete <strong className="text-on-surface">"{locations.find(l => l.id === deleteConfirm)?.name}"</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 rounded-xl text-sm font-bold transition-all cursor-pointer">
                  Yes, Delete
                </button>
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-secondary rounded-xl text-sm font-bold transition-all cursor-pointer">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
