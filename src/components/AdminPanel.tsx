import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Plus, Trash2, Edit3, Save, X, Image, MapPin, ChevronDown, ChevronLeft, ChevronRight,
  Check, AlertCircle, Loader2, Globe, FileText, Film, Star, Calendar,
  Archive, RotateCcw, Bold, Italic, Heading1, Heading2, List, ListOrdered, Link2, Quote, RefreshCcw
} from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

const API = API_BASE_URL;

const markdownComponents = {
  p: ({ children }: any) => <p className="text-secondary/90 leading-loose mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-2xl font-headline font-bold text-on-surface mb-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-headline font-bold text-on-surface mb-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-headline font-bold text-on-surface mb-2">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1 text-secondary/90 mb-3">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1 text-secondary/90 mb-3">{children}</ol>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-primary/40 pl-3 italic text-secondary/80 mb-3">{children}</blockquote>,
  strong: ({ children }: any) => <strong className="text-on-surface font-semibold">{children}</strong>,
};

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all font-body";
const reorderButtonCls = "p-2 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer";

const VN_PLACES: { name: string; lat: string; lng: string }[] = [
  { name: 'An Giang', lat: '10.5215', lng: '105.1259' },
  { name: 'Bà Rịa – Vũng Tàu', lat: '10.5417', lng: '107.2429' },
  { name: 'Bạc Liêu', lat: '9.2941', lng: '105.7244' },
  { name: 'Bình Định', lat: '13.7820', lng: '109.2197' },
  { name: 'Cần Thơ', lat: '10.0452', lng: '105.7469' },
  { name: 'Đà Lạt', lat: '11.9404', lng: '108.4583' },
  { name: 'Đà Nẵng', lat: '16.0544', lng: '108.2022' },
  { name: 'Đồng Nai', lat: '10.9451', lng: '106.8246' },
  { name: 'Hà Nội', lat: '21.0285', lng: '105.8542' },
  { name: 'Hải Phòng', lat: '20.8449', lng: '106.6881' },
  { name: 'Huế', lat: '16.4637', lng: '107.5909' },
  { name: 'Khánh Hòa', lat: '12.2585', lng: '109.0526' },
  { name: 'Kiên Giang', lat: '9.8250', lng: '105.1259' },
  { name: 'Lâm Đồng', lat: '11.9463', lng: '108.4419' },
  { name: 'Ninh Bình', lat: '20.2506', lng: '105.9745' },
  { name: 'Phú Quốc', lat: '10.2899', lng: '103.9840' },
  { name: 'Quảng Nam', lat: '15.5394', lng: '108.0191' },
  { name: 'Quảng Ninh', lat: '21.0064', lng: '107.2925' },
  { name: 'TP. Hồ Chí Minh', lat: '10.7769', lng: '106.7009' },
  { name: 'Vĩnh Long', lat: '10.2397', lng: '105.9571' },
];

const CHAPTERS = Array.from({ length: 20 }, (_, i) => {
  const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][i];
  return `Chapter ${roman}`;
});

const HIGHLIGHT_TYPES = [
  { value: 'secondary', label: 'Secondary', color: 'text-slate-300' },
  { value: 'primary', label: 'Primary', color: 'text-amber-300' },
  { value: 'highlight', label: 'Highlight', color: 'text-cyan-300' },
];

type GalleryNode = {
  uid: string;
  title: string;
  description: string;
  images: [string, string, string];
};

type Location = {
  id: string;
  name: string;
  chapter: string;
  short_desc: string;
  img: string;
  visited_date: string;
  highlight_type: string;
  lat: string;
  lng: string;
  hero_video: string;
  hero_poster: string;
  featured_images: [string, string, string];
  full_description: string;
  gallery_images: string[];
  gallery_nodes: GalleryNode[];
  is_archived: boolean;
  archived_at: string;
};

type ReviewItem = {
  id: number;
  location_id: string;
  stars: number;
  nickname: string;
  comment: string;
  created_at: string;
};

type ReviewsResponse = {
  reviews: ReviewItem[];
};

type LocationListTab = 'active' | 'archived';

type StoryMode = 'edit' | 'preview';
type MarkdownFormat = 'bold' | 'italic' | 'h1' | 'h2' | 'quote' | 'ul' | 'ol' | 'link';

const createNodeUid = () => `node_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const createEmptyNode = (): GalleryNode => ({
  uid: createNodeUid(),
  title: '',
  description: '',
  images: ['', '', ''],
});

const createDefaultNodes = (): GalleryNode[] => [createEmptyNode(), createEmptyNode(), createEmptyNode()];

const EMPTY_FORM: Location = {
  id: '',
  name: '',
  chapter: 'Chapter I',
  short_desc: '',
  img: '',
  visited_date: '',
  highlight_type: 'secondary',
  lat: '',
  lng: '',
  hero_video: '',
  hero_poster: '',
  featured_images: ['', '', ''],
  full_description: '',
  gallery_images: [],
  gallery_nodes: createDefaultNodes(),
  is_archived: false,
  archived_at: '',
};

function slugify(str: string) {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_');
}

function swapItems<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function normalizeNode(node: any): GalleryNode {
  return {
    uid: node?.uid || createNodeUid(),
    title: node?.title || '',
    description: node?.description || '',
    images: [node?.images?.[0] || '', node?.images?.[1] || '', node?.images?.[2] || ''],
  };
}

function nodesFromLegacyImages(images: string[] = []): GalleryNode[] {
  if (!images.length) return createDefaultNodes();
  const nodes: GalleryNode[] = [];
  for (let i = 0; i < images.length; i += 3) {
    nodes.push({ uid: createNodeUid(), title: `Node ${nodes.length + 1}`, description: '', images: [images[i] || '', images[i + 1] || '', images[i + 2] || ''] });
  }
  return nodes;
}

function flattenNodeImages(nodes: GalleryNode[]): string[] {
  return nodes.flatMap(node => node.images).filter(Boolean);
}

function normalizeFeaturedImages(images: [string, string, string]): [string, string, string] {
  const next = [...images].filter(Boolean);
  while (next.length < 3) next.push('');
  return next.slice(0, 3) as [string, string, string];
}

function applyMarkdownFormat(value: string, selectionStart: number, selectionEnd: number, format: MarkdownFormat) {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);

  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const lineEndIndex = value.indexOf('\n', selectionEnd);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const currentLine = value.slice(lineStart, lineEnd);

  const wrap = (prefix: string, suffix: string = prefix, placeholder = '', trimSelection = false) => {
    const rawContent = selectedText || placeholder;
    const content = trimSelection ? rawContent.trim() : rawContent;
    const nextValue = `${before}${prefix}${content}${suffix}${after}`;
    const selectionOffset = prefix.length;
    const contentLength = content.length;
    return {
      value: nextValue,
      selectionStart: selectionStart + selectionOffset,
      selectionEnd: selectionStart + selectionOffset + contentLength,
    };
  };

  const trimWrappedSelection = (marker: string, placeholder: string) => {
    if (!selectedText) return wrap(marker, marker, placeholder, true);
    const leadingSpaces = selectedText.match(/^\s*/)?.[0] || '';
    const trailingSpaces = selectedText.match(/\s*$/)?.[0] || '';
    const core = selectedText.trim();
    const nextValue = `${before}${leadingSpaces}${marker}${core}${marker}${trailingSpaces}${after}`;
    return {
      value: nextValue,
      selectionStart: selectionStart + leadingSpaces.length + marker.length,
      selectionEnd: selectionStart + leadingSpaces.length + marker.length + core.length,
    };
  };

  const wrapLink = () => {
    const rawContent = selectedText || 'link text';
    const leadingSpaces = rawContent.match(/^\s*/)?.[0] || '';
    const trailingSpaces = rawContent.match(/\s*$/)?.[0] || '';
    const core = rawContent.trim() || 'link text';
    const wrapped = `[${core}](https://example.com)`;
    const nextValue = `${before}${leadingSpaces}${wrapped}${trailingSpaces}${after}`;
    return {
      value: nextValue,
      selectionStart: selectionStart + leadingSpaces.length + 1,
      selectionEnd: selectionStart + leadingSpaces.length + 1 + core.length,
    };
  };

  const wrapInlineSelection = (marker: string, placeholder: string) => {
    if (marker === '[') return wrapLink();
    return trimWrappedSelection(marker, placeholder);
  };

  const wrapForFormat = (format: MarkdownFormat) => {
    switch (format) {
      case 'bold':
        return wrapInlineSelection('**', 'bold text');
      case 'italic':
        return wrapInlineSelection('*', 'italic text');
      case 'link':
        return wrapLink();
      default:
        return { value, selectionStart, selectionEnd };
    }
  };

  const prefixForFormat = (format: MarkdownFormat) => {
    switch (format) {
      case 'h1':
        return prefixLine('# ', 'Heading');
      case 'h2':
        return prefixLine('## ', 'Heading');
      case 'quote':
        return prefixLine('> ', 'Quote');
      case 'ul':
        return prefixLine('- ', 'List item');
      case 'ol':
        return prefixLine('1. ', 'List item');
      default:
        return { value, selectionStart, selectionEnd };
    }
  };

  const inlineFormats: MarkdownFormat[] = ['bold', 'italic', 'link'];
  if (inlineFormats.includes(format)) {
    return wrapForFormat(format);
  }

  const blockFormats: MarkdownFormat[] = ['h1', 'h2', 'quote', 'ul', 'ol'];
  if (blockFormats.includes(format)) {
    return prefixForFormat(format);
  }

  return { value, selectionStart, selectionEnd };

  const prefixLine = (prefix: string, fallback = '') => {
    const content = currentLine || fallback;
    const nextLine = content.startsWith(prefix) ? content : `${prefix}${content}`;
    const nextValue = `${value.slice(0, lineStart)}${nextLine}${value.slice(lineEnd)}`;
    const nextSelectionStart = selectedText ? selectionStart + (content.startsWith(prefix) ? 0 : prefix.length) : lineStart + prefix.length;
    const nextSelectionEnd = selectedText ? selectionEnd + (content.startsWith(prefix) ? 0 : prefix.length) : nextSelectionStart + (currentLine ? currentLine.length : fallback.length);
    return {
      value: nextValue,
      selectionStart: nextSelectionStart,
      selectionEnd: nextSelectionEnd,
    };
  };

}

function normalizeLocationFromApi(loc: any): Location {
  const galleryNodes = Array.isArray(loc?.gallery_nodes) && loc.gallery_nodes.length
    ? loc.gallery_nodes.map(normalizeNode)
    : nodesFromLegacyImages(loc?.gallery_images || []);

  const featured = Array.isArray(loc?.featured_images)
    ? [loc.featured_images[0] || '', loc.featured_images[1] || '', loc.featured_images[2] || '']
    : ['', '', ''];

  return {
    ...EMPTY_FORM,
    ...loc,
    featured_images: normalizeFeaturedImages(featured as [string, string, string]),
    gallery_nodes: galleryNodes,
    gallery_images: loc?.gallery_images || flattenNodeImages(galleryNodes),
    is_archived: Boolean(loc?.is_archived),
    archived_at: loc?.archived_at || '',
  };
}

function buildLocationPayload(form: Location) {
  const featured = normalizeFeaturedImages(form.featured_images);
  const galleryNodes = form.gallery_nodes.map(({ title, description, images }) => ({ title, description, images }));
  const galleryImages = flattenNodeImages(form.gallery_nodes);

  return {
    ...form,
    featured_images: featured,
    gallery_nodes: galleryNodes,
    gallery_images: galleryImages.length ? galleryImages : null,
    hero_video: form.hero_video || null,
    hero_poster: form.hero_poster || null,
    full_description: form.full_description || null,
    is_archived: Boolean(form.is_archived),
    archived_at: form.archived_at || null,
  };
}

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

function CustomSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; color?: string }[]; }) {
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
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface hover:border-primary/40 transition-all cursor-pointer group">
        <span className={`font-body font-medium ${selected?.color || 'text-on-surface/80'}`}>{selected?.label || '—'}</span>
        <ChevronDown size={14} className={`text-secondary/50 group-hover:text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="absolute z-[100] top-full mt-2 w-full rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] border border-white/10 glass-morphism py-2" style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)' }}>
            {options.map(opt => (
              <li key={opt.value} onMouseDown={() => { onChange(opt.value); setOpen(false); }} className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all hover:bg-primary/10 font-body ${opt.value === value ? 'bg-primary/5 text-primary' : 'text-on-surface/70 hover:text-on-surface'}`}>
                <span className={opt.color || ''}>{opt.label}</span>
                {opt.value === value && <Check size={14} className="text-primary" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChapterSelector({ value, onChange, takenChapters }: { value: string; onChange: (v: string) => void; takenChapters: string[]; }) {
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
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface hover:border-primary/40 transition-all cursor-pointer group">
        <span className="font-tech font-bold text-primary">{value}</span>
        <ChevronDown size={14} className={`text-secondary/40 group-hover:text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-[120] top-full mt-2 w-full rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden glass-morphism py-1.5" style={{ background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)' }}>
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
              {options.map(chapter => {
                const isSelected = value === chapter;
                return (
                  <li key={chapter} onMouseDown={() => { onChange(chapter); setOpen(false); }} className={`px-4 py-2 text-sm cursor-pointer transition-all hover:bg-primary/10 font-body flex items-center justify-between ${isSelected ? 'bg-primary/5 text-primary' : 'text-on-surface/60 hover:text-on-surface'}`}>
                    <span>{chapter}</span>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Autocomplete({ value, onChange, onSelect }: { value: string; onChange: (v: string) => void; onSelect: (place: { name: string; lat: string; lng: string }) => void; }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const filtered = VN_PLACES.filter(p => normalize(p.name).includes(normalize(query)));

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input className={inputCls} placeholder="e.g. Hội An, Đà Lạt…" value={query} onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="absolute z-[100] top-full mt-2 w-full rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.8)] border border-white/10 overflow-y-auto custom-scrollbar py-2" style={{ maxHeight: '320px', background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)' }}>
            {filtered.map(p => (
              <li key={p.name} className="px-4 py-3 text-sm text-on-surface/80 hover:bg-primary/10 hover:text-primary cursor-pointer transition-all flex items-center gap-3 font-body border-b border-white/5 last:border-0 group" onMouseDown={() => { setQuery(p.name); onSelect(p); setOpen(false); }}>
                <div className="p-1.5 rounded-lg bg-white/5 text-primary/40 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <MapPin size={12} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] font-tech text-secondary/30 uppercase tracking-tighter">Location Coordinate Found</span>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.02);border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(233,195,73,0.2);border-radius:10px;border:1px solid rgba(255,255,255,0.05)}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(233,195,73,0.4)}`}</style>
    </div>
  );
}

function SingleFileUpload({
  value,
  onChange,
  accept = 'image/*',
  actionSlot,
}: {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  actionSlot?: (controls: { openPicker: () => void; clear: () => void }) => React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes('video');

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const newFilename = `${uniqueSuffix}.${ext}`;
      const fd = new FormData();
      fd.append('file', new File([file], newFilename, { type: file.type }));
      const res = await fetch(`${API}/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onChange(data.url);
    } finally {
      setUploading(false);
    }
  };

  const openPicker = () => fileInputRef.current?.click();
  const clear = () => onChange('');

  return (
    <div className="space-y-2">
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
      <AnimatePresence mode="wait" initial={false}>
        {value && !uploading ? (
          <motion.div key="uploaded-file" initial={{ opacity: 0, scale: 0.95, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                {!isVideo ? (
                  <img src={value} alt="Uploaded preview" className="w-12 h-12 rounded-lg object-cover border border-white/10 bg-white/5" />
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
              {actionSlot ? (
                <div className="pt-1">{actionSlot({ openPicker, clear })}</div>
              ) : (
                <div className="flex items-center gap-2 justify-start">
                  <button type="button" onClick={openPicker} className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-[10px] font-tech uppercase tracking-widest text-secondary/60 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
                    Replace
                  </button>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} type="button" onClick={clear} className="p-1.5 rounded-full bg-background/70 border border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all">
                    <Trash2 size={12} />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="upload-dropzone" initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -10 }} transition={{ duration: 0.24, ease: 'easeOut' }} onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f && !uploading) uploadFile(f); }} onClick={() => !uploading && fileInputRef.current?.click()} className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 cursor-pointer transition-all duration-200 select-none overflow-hidden ${dragging ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(233,195,73,0.2)] scale-[1.01]' : 'border-white/10 hover:border-primary/40 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(233,195,73,0.08)]'}`}>
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-primary animate-spin" />
                <span className="text-[10px] font-tech text-primary uppercase tracking-widest">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="p-2.5 rounded-full bg-white/5 border border-white/10 transition-all">
                  {isVideo ? <Film size={18} className="text-primary/50" /> : <Image size={18} className="text-primary/50" />}
                </div>
                <p className="text-xs font-body text-secondary/50 text-center px-4 transition-colors hover:text-secondary/70">
                  <span className="text-primary font-semibold">Click to browse</span> or drag file here
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeaturedImagesInput({ images, onChange }: { images: [string, string, string]; onChange: (images: [string, string, string]) => void; }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div key={`featured-image-${index}`} className="space-y-2">
          <Field label={`Featured ${index + 1}`} icon={Image}>
            <SingleFileUpload
              value={image}
              onChange={value => {
                const next = [...images] as [string, string, string];
                next[index] = value;
                onChange(normalizeFeaturedImages(next));
              }}
              actionSlot={({ openPicker, clear }) => (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={openPicker} className="p-1.5 rounded-full bg-background/70 border border-white/10 text-secondary/70 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all" title="Replace">
                      <RefreshCcw size={11} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={clear} className="p-1.5 rounded-full bg-background/70 border border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all" title="Delete">
                      <Trash2 size={11} />
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.button whileTap={{ x: -6, scale: 0.95 }} type="button" onClick={() => onChange(normalizeFeaturedImages(swapItems(images, index, index - 1) as [string, string, string]))} disabled={index === 0} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"><ChevronLeft size={12} /></motion.button>
                    <motion.button whileTap={{ x: 6, scale: 0.95 }} type="button" onClick={() => onChange(normalizeFeaturedImages(swapItems(images, index, index + 1) as [string, string, string]))} disabled={index === images.length - 1} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"><ChevronRight size={12} /></motion.button>
                  </div>
                </div>
              )}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

function StoryMarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void; }) {
  const [mode, setMode] = useState<StoryMode>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: MarkdownFormat) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const next = applyMarkdownFormat(value, selectionStart, selectionEnd, format);
    onChange(next.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  };

  const toolbarButtons: { key: MarkdownFormat; label: string; icon: any }[] = [
    { key: 'bold', label: 'Bold', icon: Bold },
    { key: 'italic', label: 'Italic', icon: Italic },
    { key: 'h1', label: 'H1', icon: Heading1 },
    { key: 'h2', label: 'H2', icon: Heading2 },
    { key: 'quote', label: 'Quote', icon: Quote },
    { key: 'ul', label: 'Bullet list', icon: List },
    { key: 'ol', label: 'Numbered list', icon: ListOrdered },
    { key: 'link', label: 'Link', icon: Link2 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-tech uppercase tracking-widest text-secondary/40">Supports Markdown: headings, lists, bold, italic, quote, link</span>
        <div className="flex items-center gap-2">
          {(['edit', 'preview'] as StoryMode[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-tech uppercase tracking-widest border transition-all cursor-pointer ${mode === tab ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/10 text-secondary/50 hover:text-secondary hover:border-white/20'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {toolbarButtons.map(button => {
              const Icon = button.icon;
              return (
                <button
                  key={button.key}
                  type="button"
                  onClick={() => applyFormat(button.key)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-tech uppercase tracking-widest text-secondary/60 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                  title={button.label}
                >
                  <Icon size={12} />
                  <span>{button.key === 'bold' ? 'B' : button.key === 'italic' ? 'I' : button.key.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
          <textarea ref={textareaRef} className={inputCls + ' resize-none'} rows={10} value={value} onChange={e => onChange(e.target.value.replace(/\r\n/g, '\n'))} placeholder={"Write your travel story in Markdown…\n\n## Heading\n- bullet\n**bold**\n> quote"} />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-[10px] font-tech uppercase tracking-widest text-secondary/40 mb-1.5">Markdown quick guide</p>
            <p className="text-xs text-secondary/60 leading-relaxed"># Heading · ## Subheading · **bold** · *italic* · - bullet · 1. item · &gt; quote · [text](https://...)</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 min-h-[220px] prose prose-invert max-w-none">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{value}</ReactMarkdown>
          ) : (
            <p className="text-secondary/40 text-sm">Markdown preview will appear here.</p>
          )}
        </div>
      )}
    </div>
  );
}

function GalleryNodesInput({ nodes, onChange }: { nodes: GalleryNode[]; onChange: (updater: (nodes: GalleryNode[]) => GalleryNode[]) => void; }) {
  const updateNode = (uid: string, patch: Partial<GalleryNode>) => {
    onChange(currentNodes => currentNodes.map(node => node.uid === uid ? { ...node, ...patch } : node));
  };

  const updateNodeImage = (nodeUid: string, imageIndex: number, value: string) => {
    onChange(currentNodes => currentNodes.map(node => {
      if (node.uid !== nodeUid) return node;
      const images: [string, string, string] = [...node.images] as [string, string, string];
      images[imageIndex] = value;
      return { ...node, images };
    }));
  };

  const moveNodeImage = (nodeUid: string, imageIndex: number, direction: -1 | 1) => {
    onChange(currentNodes => currentNodes.map(node => {
      if (node.uid !== nodeUid) return node;
      const next = swapItems(node.images, imageIndex, imageIndex + direction) as [string, string, string];
      return { ...node, images: next };
    }));
  };

  const addNode = () => onChange(currentNodes => [...currentNodes, createEmptyNode()]);
  const deleteNode = (index: number) => onChange(currentNodes => currentNodes.filter((_, i) => i !== index));
  const moveNode = (index: number, direction: -1 | 1) => {
    onChange(currentNodes => swapItems(currentNodes, index, index + direction));
  };

  return (
    <div className="space-y-5">
      <AnimatePresence initial={false} mode="popLayout">
        {nodes.map((node, index) => (
          <motion.div key={node.uid} layout initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.96 }} transition={{ layout: { duration: 0.28, ease: 'easeInOut' }, duration: 0.24, ease: 'easeOut' }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 hover:border-primary/20 hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-tech text-primary uppercase tracking-[0.25em]">NODE_{String(index + 1).padStart(2, '0')}</p>
                <p className="text-xs text-secondary/50 mt-1">Each node contains title, description and exactly 3 images.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveNode(index, -1)} disabled={index === 0} className={reorderButtonCls}><ChevronDown className="rotate-180" size={14} /></button>
                <button type="button" onClick={() => moveNode(index, 1)} disabled={index === nodes.length - 1} className={reorderButtonCls}><ChevronDown size={14} /></button>
                <button type="button" onClick={() => deleteNode(index)} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>

            <Field label="Node Header" icon={FileText}>
              <input className={inputCls} value={node.title} onChange={e => updateNode(node.uid, { title: e.target.value })} placeholder={`Node ${index + 1} title`} />
            </Field>

            <Field label="Node Description" icon={FileText}>
              <textarea className={inputCls + ' resize-none'} rows={4} value={node.description} onChange={e => updateNode(node.uid, { description: e.target.value })} placeholder="Write node description here..." />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatePresence initial={false} mode="popLayout">
                {node.images.map((image, imageIndex) => (
                  <motion.div
                    key={`${node.uid}-${imageIndex}-${image || 'empty'}`}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ layout: { duration: 0.28, ease: 'easeInOut' }, duration: 0.2, ease: 'easeOut' }}
                    className="space-y-2"
                  >
                    <Field label={`Image ${imageIndex + 1}`} icon={Image}>
                      <SingleFileUpload
                        value={image}
                        onChange={value => updateNodeImage(node.uid, imageIndex, value)}
                        actionSlot={({ openPicker, clear }) => (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={openPicker} className="p-1.5 rounded-full bg-background/70 border border-white/10 text-secondary/70 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all" title="Replace">
                                <RefreshCcw size={11} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={clear} className="p-1.5 rounded-full bg-background/70 border border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-400/40 transition-all" title="Delete">
                                <Trash2 size={11} />
                              </motion.button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <motion.button whileTap={{ x: -6, scale: 0.95 }} type="button" onClick={() => moveNodeImage(node.uid, imageIndex, -1)} disabled={imageIndex === 0} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"><ChevronLeft size={12} /></motion.button>
                              <motion.button whileTap={{ x: 6, scale: 0.95 }} type="button" onClick={() => moveNodeImage(node.uid, imageIndex, 1)} disabled={imageIndex === 2} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-secondary/60 hover:text-primary hover:border-primary/30 hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"><ChevronRight size={12} /></motion.button>
                            </div>
                          </div>
                        )}
                      />
                    </Field>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex justify-center pt-2">
        <button type="button" onClick={addNode} className="px-5 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-xl text-primary text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
          <Plus size={14} /> Add 1 Node
        </button>
      </div>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium ${type === 'success' ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' : 'bg-red-500/15 border-red-400/30 text-red-300'}`}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      {msg}
    </motion.div>
  );
}

function ArchiveConfirmModal({
  openId,
  locations,
  onClose,
  onConfirm,
}: {
  openId: string | null;
  locations: Location[];
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!openId) return null;
  const location = locations.find(l => l.id === openId);
  const archivedMode = Boolean(location?.is_archived);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-2xl p-8 ghost-border max-w-sm w-full mx-4 space-y-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
              {archivedMode ? <RotateCcw size={18} className="text-emerald-300" /> : <Archive size={18} className="text-red-400" />}
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">{archivedMode ? 'Restore Location' : 'Archive Location'}</h3>
              <p className="text-secondary/50 text-xs">{archivedMode ? 'This will make it visible again.' : 'It will stay in admin and disappear from public pages.'}</p>
            </div>
          </div>
          <p className="text-secondary text-sm">{archivedMode ? `Restore "${location?.name}" back to the active journey list?` : `Archive "${location?.name}" so it disappears from the public site but stays available in admin?`}</p>
          <div className="flex gap-3">
            <button onClick={() => onConfirm(openId)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${archivedMode ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30' : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'}`}>
              {archivedMode ? 'Yes, Restore' : 'Yes, Archive'}
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-secondary rounded-xl text-sm font-bold transition-all cursor-pointer">Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


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
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'form'>('list');
  const [listTab, setListTab] = useState<LocationListTab>('active');
  const [selectedLocationForReviews, setSelectedLocationForReviews] = useState<string | null>(null);
  const [reviewsByLocation, setReviewsByLocation] = useState<Record<string, ReviewItem[]>>({});
  const [reviewsLoadingByLocation, setReviewsLoadingByLocation] = useState<Record<string, boolean>>({});

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API}/locations?include_archived=true`);
      const data = await res.json();
      setLocations(Array.isArray(data) ? data.map(normalizeLocationFromApi) : []);
    } catch {
      showToast('Cannot connect to backend. Is the server running?', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const visibleLocations = useMemo(
    () => locations.filter(loc => listTab === 'archived' ? loc.is_archived : !loc.is_archived),
    [locations, listTab]
  );

  useEffect(() => {
    if (!selectedLocationForReviews) {
      setSelectedLocationForReviews(visibleLocations[0]?.id || null);
      return;
    }
    const stillVisible = visibleLocations.some(loc => loc.id === selectedLocationForReviews);
    if (!stillVisible) setSelectedLocationForReviews(visibleLocations[0]?.id || null);
  }, [visibleLocations, selectedLocationForReviews]);

  const selectedLocation = useMemo(
    () => locations.find(loc => loc.id === selectedLocationForReviews) || null,
    [locations, selectedLocationForReviews]
  );

  const selectedReviews = useMemo(
    () => (selectedLocationForReviews ? reviewsByLocation[selectedLocationForReviews] || [] : []),
    [reviewsByLocation, selectedLocationForReviews]
  );

  const selectedReviewsLoading = selectedLocationForReviews ? !!reviewsLoadingByLocation[selectedLocationForReviews] : false;

  const activeCount = useMemo(() => locations.filter(l => !l.is_archived).length, [locations]);
  const archivedCount = useMemo(() => locations.filter(l => l.is_archived).length, [locations]);

  const fetchReviewsForLocation = async (locationId: string) => {
    setReviewsLoadingByLocation(prev => ({ ...prev, [locationId]: true }));
    try {
      const res = await fetch(`${API}/locations/${locationId}/reviews`);
      if (!res.ok) throw new Error();
      const data: ReviewsResponse = await res.json();
      setReviewsByLocation(prev => ({ ...prev, [locationId]: Array.isArray(data.reviews) ? data.reviews : [] }));
    } catch {
      setReviewsByLocation(prev => ({ ...prev, [locationId]: [] }));
    } finally {
      setReviewsLoadingByLocation(prev => ({ ...prev, [locationId]: false }));
    }
  };

  useEffect(() => {
    if (selectedLocationForReviews) fetchReviewsForLocation(selectedLocationForReviews);
  }, [selectedLocationForReviews]);

  const handleSelectLocationForReviews = (locationId: string) => {
    setSelectedLocationForReviews(locationId);
  };

  const handleDeleteReview = async (locationId: string, reviewId: number) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`${API}/locations/${locationId}/reviews/${reviewId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      const data: ReviewsResponse = await res.json();
      setReviewsByLocation(prev => ({ ...prev, [locationId]: Array.isArray(data.reviews) ? data.reviews : [] }));
      showToast('Comment deleted.', 'success');
    } catch {
      showToast('Delete comment failed.', 'error');
    }
  };

  const handleDeleteAllReviewsForLocation = async (locationId: string) => {
    if (!window.confirm('Delete all comments for this location?')) return;
    try {
      const res = await fetch(`${API}/locations/${locationId}/reviews`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      const data: ReviewsResponse = await res.json();
      setReviewsByLocation(prev => ({ ...prev, [locationId]: Array.isArray(data.reviews) ? data.reviews : [] }));
      showToast('All comments deleted for this location.', 'success');
    } catch {
      showToast('Delete all comments failed.', 'error');
    }
  };

  const handleOpenReviewFromAdmin = (locationId: string, reviewId: number) => {
    localStorage.setItem('reviewTarget', `${locationId}:${reviewId}`);
    navigate(`/gallery/${locationId}`);
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

  const handleNameChange = (name: string) => {
    const newId = slugify(name);
    setForm(f => ({ ...f, name, id: editing ? f.id : newId }));
  };

  const handlePlaceSelect = (place: { name: string; lat: string; lng: string }) => {
    const newId = slugify(place.name);
    setForm(f => ({ ...f, name: place.name, id: editing ? f.id : newId, lat: place.lat, lng: place.lng }));
  };

  const takenChapters = useMemo(
    () => locations.filter(loc => loc.id !== editing && !loc.is_archived).map(loc => loc.chapter),
    [locations, editing]
  );

  const isChapterTaken = useCallback((chapter: string) => takenChapters.includes(chapter), [takenChapters]);

  const handleChapterChange = (chapter: string) => {
    if (isChapterTaken(chapter)) {
      showToast(`${chapter} is already used by another active location.`, 'error');
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
      showToast(`${form.chapter} is already used by another active location.`, 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = buildLocationPayload(form);
      if (editing) {
        const res = await fetch(`${API}/locations/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        showToast(`"${form.name}" updated successfully!`, 'success');
      } else {
        const res = await fetch(`${API}/locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Error');
        }
        showToast(`"${form.name}" added to the journey!`, 'success');
      }

      setForm({ ...EMPTY_FORM, gallery_nodes: createDefaultNodes() });
      setEditing(null);
      setActiveSection('list');
      fetchLocations();
    } catch (err: any) {
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc: Location) => {
    setForm(normalizeLocationFromApi(loc));
    setEditing(loc.id);
    setActiveSection('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArchiveOrRestore = async (id: string) => {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    try {
      if (loc.is_archived) {
        const res = await fetch(`${API}/locations/${id}/restore`, { method: 'POST' });
        if (!res.ok) throw new Error();
        showToast(`"${loc.name}" restored.`, 'success');
      } else {
        const res = await fetch(`${API}/locations/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast(`"${loc.name}" archived.`, 'success');
      }
      setArchiveConfirm(null);
      fetchLocations();
    } catch {
      showToast(loc.is_archived ? 'Restore failed.' : 'Archive failed.', 'error');
    }
  };

  const cancelForm = () => {
    setForm({ ...EMPTY_FORM, gallery_nodes: createDefaultNodes() });
    setEditing(null);
    setActiveSection('list');
  };

  const formatReviewDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 ghost-border max-w-sm w-full mx-4 space-y-6 bg-surface-container/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20"><Star size={32} className="text-primary" /></div>
            <h1 className="font-headline text-2xl font-black text-on-surface">sTripKaka Admin</h1>
            <p className="text-secondary/60 text-xs uppercase tracking-widest font-tech mt-1">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-tech uppercase tracking-widest text-secondary/70 ml-1">Username</label>
              <input type="text" className={inputCls} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-tech uppercase tracking-widest text-secondary/70 ml-1">Password</label>
              <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            {loginError && <p className="text-red-400 text-xs flex items-center gap-1.5 px-1"><AlertCircle size={14} /> {loginError}</p>}
            <button type="submit" className="w-full py-3 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.3)] hover:shadow-[0_0_30px_rgba(233,195,73,0.5)] transition-all hover:scale-[1.02] cursor-pointer">
              Access Command Center
            </button>
          </form>
        </motion.div>

        <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-tech text-[10px] uppercase tracking-widest text-primary/60 block mb-1">Control Center</span>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">Journey <span className="text-primary">Admin</span></h1>
          <p className="text-secondary/60 text-sm mt-1">Manage your travel locations database</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-2 px-4 py-3 bg-white/5 text-secondary hover:text-on-surface font-headline font-bold rounded-xl text-sm border border-white/10 transition-all cursor-pointer">Logout</button>
          <button onClick={() => { cancelForm(); setActiveSection(activeSection === 'form' ? 'list' : 'form'); }} className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:shadow-[0_0_30px_rgba(233,195,73,0.7)] transition-all hover:scale-[1.02] cursor-pointer">
            {activeSection === 'form' ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Location</>}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(['list', 'form'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveSection(tab); if (tab === 'list') cancelForm(); }} className={`px-5 py-2.5 font-headline text-xs uppercase tracking-widest font-bold transition-all rounded-t-lg -mb-px ${activeSection === tab ? 'text-primary border-b-2 border-primary' : 'text-secondary/40 hover:text-secondary'}`}>
            {tab === 'list' ? `Locations (${locations.length})` : editing ? 'Edit Location' : 'Add New'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex gap-2">
              <button type="button" onClick={() => setListTab('active')} className={`px-4 py-2 rounded-xl text-xs font-headline uppercase tracking-widest transition-all cursor-pointer ${listTab === 'active' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-white/5 text-secondary/50 border border-white/10 hover:text-secondary'}`}>Active ({activeCount})</button>
              <button type="button" onClick={() => setListTab('archived')} className={`px-4 py-2 rounded-xl text-xs font-headline uppercase tracking-widest transition-all cursor-pointer ${listTab === 'archived' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-white/5 text-secondary/50 border border-white/10 hover:text-secondary'}`}>Archived ({archivedCount})</button>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-primary animate-spin" /></div>
            ) : visibleLocations.length === 0 ? (
              <div className="glass-card rounded-xl p-16 flex flex-col items-center gap-4 ghost-border text-center">
                <Globe size={40} className="text-secondary/30" />
                <p className="text-secondary/50 font-tech text-xs uppercase tracking-widest">{listTab === 'archived' ? 'No archived locations yet' : 'No locations yet'}</p>
                {listTab === 'active' ? (
                  <button onClick={() => setActiveSection('form')} className="px-6 py-2.5 border border-primary/40 text-primary text-xs font-bold rounded-lg hover:bg-primary/10 transition-all cursor-pointer">Add your first destination</button>
                ) : (
                  <p className="text-secondary/40 text-sm">Archive a location to see it here</p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {visibleLocations.map(loc => (
                    <motion.div key={loc.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleSelectLocationForReviews(loc.id)} className={`glass-card rounded-xl overflow-hidden ghost-border group hover:shadow-[0_0_30px_rgba(233,195,73,0.08)] transition-all cursor-pointer ${selectedLocationForReviews === loc.id ? 'ring-1 ring-primary/40 border-primary/30' : ''}`}>
                      <div className="relative h-40 overflow-hidden">
                        <img src={loc.img} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).src = '/hue/hue_landscape_1.jpg'; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`text-[9px] font-tech uppercase tracking-wider px-2 py-1 rounded-full font-bold ${loc.highlight_type === 'highlight' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : loc.highlight_type === 'primary' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-secondary border border-white/20'}`}>{loc.highlight_type}</span>
                          {loc.is_archived && <span className="text-[9px] font-tech uppercase tracking-wider px-2 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">Archived</span>}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-tech text-primary/70 uppercase tracking-widest">{loc.chapter}</p>
                        <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">{loc.name}</h3>
                        <p className="text-secondary/60 text-xs mt-0.5">{loc.is_archived && loc.archived_at ? `Archived ${new Date(loc.archived_at).toLocaleDateString()}` : loc.short_desc}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <span className="text-[10px] text-secondary/40 font-tech flex items-center gap-1"><Calendar size={10} /> {loc.visited_date || '—'}</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={e => { e.stopPropagation(); handleEdit(loc); }} className="p-2 rounded-lg bg-white/5 hover:bg-primary/15 hover:text-primary text-secondary/50 transition-all cursor-pointer"><Edit3 size={14} /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); setArchiveConfirm(loc.id); }} className={`p-2 rounded-lg bg-white/5 transition-all cursor-pointer ${loc.is_archived ? 'hover:bg-emerald-500/15 hover:text-emerald-300' : 'hover:bg-red-500/15 hover:text-red-400'} text-secondary/50`}>
                              {loc.is_archived ? <RotateCcw size={14} /> : <Archive size={14} />}
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
                      <h3 className="font-headline font-bold text-on-surface text-xl">{selectedLocation ? selectedLocation.name : listTab === 'archived' ? 'Select an archived location' : 'Select a location'}</h3>
                      <p className="text-secondary/60 text-sm mt-1">{selectedLocation ? 'Manage comments for the selected location.' : `Click a ${listTab === 'archived' ? 'archived ' : ''}location card above to load its comments.`}</p>
                    </div>
                    {selectedLocation && (
                      <button type="button" onClick={() => handleDeleteAllReviewsForLocation(selectedLocation.id)} disabled={selectedReviewsLoading || selectedReviews.length === 0} className="px-4 py-2.5 rounded-xl border border-red-400/30 text-red-300 hover:bg-red-500/10 transition-all text-xs font-headline font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Delete all</button>
                    )}
                  </div>

                  {!selectedLocation ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-secondary/50 text-sm">No location selected.</div>
                  ) : selectedReviewsLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 size={24} className="text-primary animate-spin" /></div>
                  ) : selectedReviews.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-secondary/50 text-sm">This location has no comments yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReviews.map(review => (
                        <div key={`admin-review-${review.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <button type="button" onClick={() => handleOpenReviewFromAdmin(review.location_id, review.id)} className="space-y-2 min-w-0 flex-1 text-left cursor-pointer hover:opacity-90 transition-opacity">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-headline text-on-surface text-sm">{review.nickname || 'Guest'}</span>
                              <span className="text-[10px] font-tech tracking-widest text-primary uppercase">★ {review.stars}/5</span>
                              <span className="text-[10px] font-tech tracking-widest text-secondary/40 uppercase">{formatReviewDate(review.created_at)}</span>
                            </div>
                            <p className="text-sm text-secondary leading-relaxed break-words">{review.comment}</p>
                            <span className="inline-block text-[10px] font-tech uppercase tracking-widest text-primary/70">Open in gallery</span>
                          </button>
                          <button type="button" onClick={() => handleDeleteReview(review.location_id, review.id)} className="shrink-0 self-start p-2 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-secondary/50 transition-all cursor-pointer" aria-label="Delete comment">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeSection === 'form' && (
          <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2"><MapPin size={16} className="text-primary" /> Basic Info</h2>
                <Field label="Destination Name" icon={MapPin}><Autocomplete value={form.name} onChange={handleNameChange} onSelect={handlePlaceSelect} /></Field>
                <Field label="Auto ID (slug)" icon={FileText}><input className={inputCls} value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="auto-generated" readOnly={!!editing} style={editing ? { opacity: 0.5 } : {}} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Chapter" icon={Star}><ChapterSelector value={form.chapter} onChange={handleChapterChange} takenChapters={takenChapters} /></Field>
                  <Field label="Type" icon={ChevronDown}><CustomSelect value={form.highlight_type} onChange={v => setForm(f => ({ ...f, highlight_type: v }))} options={HIGHLIGHT_TYPES} /></Field>
                </div>
                <Field label="Short Description (card subtitle)" icon={FileText}><input className={inputCls} value={form.short_desc} onChange={e => setForm(f => ({ ...f, short_desc: e.target.value }))} placeholder="e.g. Golden Hour Escape" maxLength={60} /></Field>
                <Field label="Visited Date" icon={Calendar}><input type="date" className={inputCls} value={form.visited_date} onChange={e => setForm(f => ({ ...f, visited_date: e.target.value }))} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude" icon={MapPin}><input className={inputCls} value={form.lat} placeholder="e.g. 16.4637" onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} /></Field>
                  <Field label="Longitude" icon={MapPin}><input className={inputCls} value={form.lng} placeholder="e.g. 107.5909" onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} /></Field>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2"><Image size={16} className="text-primary" /> Media</h2>
                <Field label="Thumbnail Image" icon={Image}><SingleFileUpload value={form.img} onChange={v => setForm(f => ({ ...f, img: v }))} /></Field>
                <Field label="Hero Video (optional)" icon={Film}><SingleFileUpload value={form.hero_video} onChange={v => setForm(f => ({ ...f, hero_video: v }))} accept="video/*" /></Field>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-tech uppercase tracking-widest text-secondary/70">Featured Images (Top 3)</p>
                    <span className="text-[10px] font-tech text-secondary/40 uppercase tracking-wider">Used in TripDetail hero/gallery</span>
                  </div>
                  <FeaturedImagesInput images={form.featured_images} onChange={featured => setForm(f => ({ ...f, featured_images: featured }))} />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2"><FileText size={16} className="text-primary" /> Story</h2>
                <Field label="Full Description (TripDetail body, Markdown supported)" icon={FileText}>
                  <StoryMarkdownEditor value={form.full_description} onChange={value => setForm(f => ({ ...f, full_description: value }))} />
                </Field>
              </div>

              <div className="glass-card rounded-xl p-6 ghost-border space-y-4">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <Image size={16} className="text-primary" /> Gallery Nodes
                  <span className="ml-auto text-[10px] font-tech text-secondary/40 uppercase tracking-wider">{form.gallery_nodes.length} nodes</span>
                </h2>
                <GalleryNodesInput
                  nodes={form.gallery_nodes}
                  onChange={updater => setForm(f => {
                    const gallery_nodes = updater(f.gallery_nodes);
                    return { ...f, gallery_nodes, gallery_images: flattenNodeImages(gallery_nodes) };
                  })}
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:shadow-[0_0_30px_rgba(233,195,73,0.7)] transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {loading ? 'Saving…' : editing ? 'Update Location' : 'Save Location'}
                </button>
                {editing && <button type="button" onClick={cancelForm} className="px-5 py-3.5 border border-white/10 text-secondary/60 hover:text-secondary rounded-xl text-sm font-bold transition-all cursor-pointer">Cancel</button>}
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <ArchiveConfirmModal openId={archiveConfirm} locations={locations} onClose={() => setArchiveConfirm(null)} onConfirm={handleArchiveOrRestore} />

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
    </div>
  );
}
