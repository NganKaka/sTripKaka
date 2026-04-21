import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, Save, X, Image, MapPin, ChevronDown,
  Check, AlertCircle, Loader2, Globe, FileText, Film, Star, Calendar
} from 'lucide-react';

// ── Vietnam provinces for autocomplete ────────────────────────────────────────
const VN_PLACES = [
  "An Giang","Bà Rịa – Vũng Tàu","Bạc Liêu","Bắc Giang","Bắc Kạn","Bắc Ninh",
  "Bến Tre","Bình Dương","Bình Định","Bình Phước","Bình Thuận","Cà Mau",
  "Cần Thơ","Cao Bằng","Đà Lạt","Đà Nẵng","Đắk Lắk","Đắk Nông","Điện Biên",
  "Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Nội","Hà Tĩnh",
  "Hải Dương","Hải Phòng","Hậu Giang","Hòa Bình","Hội An","Huế",
  "Hưng Yên","Khánh Hòa","Kiên Giang","Kon Tum","Lai Châu","Lạng Sơn",
  "Lào Cai","Lâm Đồng","Long An","Mộc Châu","Mũi Né","Mỹ Tho","Nam Định",
  "Nghệ An","Ninh Bình","Ninh Thuận","Nha Trang","Phú Quốc","Phú Thọ",
  "Phú Yên","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh","Quảng Trị",
  "Sapa","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa",
  "Thừa Thiên Huế","Tiền Giang","TP. Hồ Chí Minh","Trà Vinh","Tuyên Quang",
  "Vĩnh Long","Vĩnh Phúc","Yên Bái",
];

const CHAPTERS = Array.from({ length: 20 }, (_, i) => {
  const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][i];
  return `Chapter ${roman}`;
});

const API = 'http://localhost:8000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_');
}

const EMPTY_FORM = {
  id: '', name: '', chapter: 'Chapter I', short_desc: '', img: '',
  visited_date: '', highlight_type: 'secondary', lat: '', lng: '',
  hero_video: '', hero_poster: '', full_description: '',
  gallery_images: [] as string[],
};

type Location = typeof EMPTY_FORM;

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

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all";
const selectCls = inputCls + " cursor-pointer";

function Autocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = VN_PLACES.filter(p =>
    p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
      query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
  ).slice(0, 8);

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
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 w-full bg-surface-container/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            {filtered.map(p => (
              <li
                key={p}
                className="px-4 py-2.5 text-sm text-on-surface hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors flex items-center gap-2"
                onMouseDown={() => { setQuery(p); onChange(p); setOpen(false); }}
              >
                <MapPin size={12} className="text-primary/50 shrink-0" />
                {p}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function GalleryInput({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [newUrl, setNewUrl] = useState('');
  const add = () => { if (newUrl.trim()) { onChange([...images, newUrl.trim()]); setNewUrl(''); } };
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className={inputCls + ' flex-1'}
          placeholder="https://... or /hue/image.jpg"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" onClick={add}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-primary text-xs font-bold transition-all flex items-center gap-1">
          <Plus size={14} /> Add
        </button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {images.map((src, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden aspect-video bg-white/5 border border-white/10">
              <img src={src} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 p-1 rounded-full bg-background/80">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-1 text-[9px] text-white/60 truncate bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {src.split('/').pop()}
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<Location>({ ...EMPTY_FORM });
  const [editing, setEditing] = useState<string | null>(null); // location id being edited
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'form'>('list');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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

  // Auto-generate ID from name
  const handleNameChange = (name: string) => {
    const newId = slugify(name);
    setForm(f => ({ ...f, name, id: editing ? f.id : newId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.short_desc || !form.img) {
      showToast('Name, short description and thumbnail are required.', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        gallery_images: form.gallery_images.length ? form.gallery_images : null,
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

      setForm({ ...EMPTY_FORM });
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
    setForm({ ...loc, gallery_images: loc.gallery_images || [] });
    setEditing(loc.id);
    setActiveSection('form');
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
  };

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
        <button
          onClick={() => { cancelForm(); setActiveSection(activeSection === 'form' ? 'list' : 'form'); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-headline font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:shadow-[0_0_30px_rgba(233,195,73,0.7)] transition-all hover:scale-[1.02] cursor-pointer"
        >
          {activeSection === 'form' ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Location</>}
        </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {locations.map(loc => (
                  <motion.div key={loc.id}
                    layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-xl overflow-hidden ghost-border group hover:shadow-[0_0_30px_rgba(233,195,73,0.08)] transition-all">
                    {/* Thumbnail */}
                    <div className="relative h-40 overflow-hidden">
                      <img src={loc.img} alt={loc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 flex gap-1">
                        <span className={`text-[9px] font-tech uppercase tracking-wider px-2 py-1 rounded-full font-bold
                          ${loc.highlight_type === 'highlight' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                            : loc.highlight_type === 'primary' ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-white/10 text-secondary border border-white/20'}`}>
                          {loc.highlight_type}
                        </span>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[10px] font-tech text-primary/70 uppercase tracking-widest">{loc.chapter}</p>
                          <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">{loc.name}</h3>
                          <p className="text-secondary/60 text-xs mt-0.5">{loc.short_desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <span className="text-[10px] text-secondary/40 font-tech flex items-center gap-1">
                          <Calendar size={10} /> {loc.visited_date || '—'}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(loc)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-primary/15 hover:text-primary text-secondary/50 transition-all cursor-pointer">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(loc.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-secondary/50 transition-all cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                  <Autocomplete value={form.name} onChange={handleNameChange} />
                </Field>

                <Field label="Auto ID (slug)" icon={FileText}>
                  <input className={inputCls} value={form.id}
                    onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                    placeholder="auto-generated" readOnly={!!editing}
                    style={editing ? { opacity: 0.5 } : {}}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Chapter" icon={Star}>
                    <select className={selectCls} value={form.chapter}
                      onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))}>
                      {CHAPTERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field label="Type" icon={ChevronDown}>
                    <select className={selectCls} value={form.highlight_type}
                      onChange={e => setForm(f => ({ ...f, highlight_type: e.target.value }))}>
                      <option value="secondary">Secondary</option>
                      <option value="primary">Primary</option>
                      <option value="highlight">Highlight</option>
                    </select>
                  </Field>
                </div>

                <Field label="Short Description (card subtitle)" icon={FileText}>
                  <input className={inputCls} value={form.short_desc}
                    onChange={e => setForm(f => ({ ...f, short_desc: e.target.value }))}
                    placeholder="e.g. Golden Hour Escape" maxLength={60}
                  />
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
              </div>

              {/* Media */}
              <div className="glass-card rounded-xl p-6 ghost-border space-y-5">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <Image size={16} className="text-primary" /> Media
                </h2>

                <Field label="Thumbnail Image URL" icon={Image}>
                  <input className={inputCls} value={form.img}
                    onChange={e => setForm(f => ({ ...f, img: e.target.value }))}
                    placeholder="/hue/hue_landscape_1.jpg or https://..." />
                  {form.img && (
                    <div className="mt-2 rounded-lg overflow-hidden h-28 bg-white/5">
                      <img src={form.img} alt="preview" className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    </div>
                  )}
                </Field>

                <Field label="Hero Poster URL (TripDetail header)" icon={Image}>
                  <input className={inputCls} value={form.hero_poster}
                    onChange={e => setForm(f => ({ ...f, hero_poster: e.target.value }))}
                    placeholder="Leave blank to use thumbnail" />
                </Field>

                <Field label="Hero Video URL (optional)" icon={Film}>
                  <input className={inputCls} value={form.hero_video}
                    onChange={e => setForm(f => ({ ...f, hero_video: e.target.value }))}
                    placeholder="/videos/phu_quoc.mp4" />
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
                    placeholder="Write your travel story here…&#10;&#10;Supports multiple paragraphs."
                  />
                </Field>
              </div>

              {/* Gallery */}
              <div className="glass-card rounded-xl p-6 ghost-border space-y-4">
                <h2 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                  <Image size={16} className="text-primary" /> Gallery Images
                  <span className="ml-auto text-[10px] font-tech text-secondary/40 uppercase tracking-wider">
                    {form.gallery_images.length} images
                  </span>
                </h2>
                <GalleryInput images={form.gallery_images}
                  onChange={imgs => setForm(f => ({ ...f, gallery_images: imgs }))} />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
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
              </div>
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

      {/* Toast notification */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
