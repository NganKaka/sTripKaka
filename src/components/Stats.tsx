import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Clock3, Flame, Star } from 'lucide-react';
import { MagneticCard } from './Dashboard';
import { apiUrl, fetchPopularThisWeek, fetchTrafficSeries, getRecentViews } from '../lib/api';

type LocationItem = {
  id: string;
  name: string;
  chapter: string;
  short_desc: string;
  img: string;
  visited_date: string;
  average_stars: number;
  total_reviews: number;
  weekly_views?: number;
};

interface StatsProps {
  setActiveTab: (tab: string) => void;
}

interface PopularWeeklyResponse {
  items: LocationItem[];
}

type TrafficRange = 7 | 30 | 90;

type TrafficPoint = {
  label: string;
  views: number;
};

interface TrafficSeriesResponse {
  range_days: TrafficRange;
  total_views: number;
  points: TrafficPoint[];
}

const trafficRangeOptions: { value: TrafficRange; label: string; description: string }[] = [
  { value: 7, label: '7 days', description: 'A short pulse of total trip views from the last week.' },
  { value: 30, label: '30 days', description: 'A monthly view of how often trips are being revisited.' },
  { value: 90, label: '90 days', description: 'A longer seasonal curve for sustained trip attention.' },
];

function TrafficLineGraph({ points }: { points: TrafficPoint[] }) {
  const width = 920;
  const height = 280;
  const padding = { top: 24, right: 28, bottom: 52, left: 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxViews = Math.max(...points.map(point => point.views), 1);

  const getX = (index: number) => padding.left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const getY = (views: number) => padding.top + chartHeight - (views / maxViews) * chartHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.views)}`)
    .join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    y: padding.top + chartHeight - ratio * chartHeight,
    value: Math.round(maxViews * ratio),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px] h-auto">
        <defs>
          <linearGradient id="trafficLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#e9c349" />
          </linearGradient>
          <filter id="trafficGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLines.map(line => (
          <g key={`grid-${line.y}`}>
            <line x1={padding.left} y1={line.y} x2={width - padding.right} y2={line.y} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 6" />
            <text x={padding.left - 8} y={line.y + 4} textAnchor="end" className="fill-secondary/50" style={{ fontSize: 10, letterSpacing: '0.08em' }}>
              {line.value}
            </text>
          </g>
        ))}

        <path d={linePath} fill="none" stroke="url(#trafficLineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#trafficGlow)" />

        {points.map((point, index) => {
          const x = getX(index);
          const y = getY(point.views);
          return (
            <g key={`point-${point.label}-${index}`}>
              <circle cx={x} cy={y} r="7" fill="rgba(233,195,73,0.18)" />
              <circle cx={x} cy={y} r="4" fill="#e9c349" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
              <text x={x} y={y - 12} textAnchor="middle" style={{ fontSize: 10, letterSpacing: '0.08em' }} className="fill-primary/90 font-tech uppercase">
                {point.views}
              </text>
              <text x={x} y={height - 20} textAnchor="middle" style={{ fontSize: 10, letterSpacing: '0.1em' }} className="fill-secondary/65 font-tech uppercase">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatsSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
  emptyText,
  metric,
  onOpen,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: any;
  items: LocationItem[];
  emptyText: string;
  metric: (item: LocationItem) => string;
  onOpen: (item: LocationItem) => void;
}) {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Icon size={18} />
          </div>
          <span className="text-primary font-tech tracking-[0.2em] font-bold text-xs uppercase">{eyebrow}</span>
        </div>
        <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface">{title}</h2>
        <p className="text-secondary text-base md:text-lg max-w-3xl leading-relaxed">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 ghost-border text-center">
          <p className="text-secondary/70 font-tech text-xs tracking-[0.2em] uppercase">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 perspective-1000">
          {items.map(item => (
            <MagneticCard
              key={`${eyebrow}-${item.id}`}
              attractOnProximity
              onClick={() => onOpen(item)}
              className="cursor-pointer"
            >
              <div className="glass-card rounded-2xl ghost-border overflow-hidden group relative h-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(233,195,73,0.15)]">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
                  <div className="absolute top-4 left-4 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-tech uppercase tracking-[0.2em] text-primary">
                    {item.chapter}
                  </div>
                  <div className="absolute top-4 right-4 rounded-full border border-white/10 bg-background/65 px-3 py-1 text-[10px] font-tech uppercase tracking-[0.15em] text-secondary">
                    {metric(item)}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface drop-shadow-md">{item.name}</h3>
                    <p className="text-secondary/80 text-sm mt-1 line-clamp-2">{item.short_desc}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-tech uppercase tracking-[0.16em] text-secondary/70">
                    <span>{item.visited_date}</span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <Star size={12} className="fill-primary" />
                      {Number.isFinite(item.average_stars) ? item.average_stars.toFixed(1) : '5.0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary/70 text-sm">{item.total_reviews} reviews</span>
                    <span className="inline-flex items-center gap-2 text-primary font-headline text-xs uppercase tracking-[0.12em]">
                      Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            </MagneticCard>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Stats({ setActiveTab }: StatsProps) {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [popularThisWeek, setPopularThisWeek] = useState<LocationItem[]>([]);
  const [trafficRange, setTrafficRange] = useState<TrafficRange>(7);
  const [trafficSeries, setTrafficSeries] = useState<TrafficSeriesResponse>({ range_days: 7, total_views: 0, points: [] });
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingTraffic, setLoadingTraffic] = useState(true);

  useEffect(() => {
    setLoadingLocations(true);
    fetch(apiUrl('/locations'))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch locations');
        return res.json();
      })
      .then((data: LocationItem[]) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]))
      .finally(() => setLoadingLocations(false));

    setLoadingPopular(true);
    fetchPopularThisWeek(6)
      .then((data: PopularWeeklyResponse) => setPopularThisWeek(Array.isArray(data.items) ? data.items : []))
      .catch(() => setPopularThisWeek([]))
      .finally(() => setLoadingPopular(false));
  }, []);

  useEffect(() => {
    setLoadingTraffic(true);
    fetchTrafficSeries(trafficRange)
      .then((data: TrafficSeriesResponse) => {
        setTrafficSeries({
          range_days: data.range_days,
          total_views: Number(data.total_views) || 0,
          points: Array.isArray(data.points) ? data.points : [],
        });
      })
      .catch(() => setTrafficSeries({ range_days: trafficRange, total_views: 0, points: [] }))
      .finally(() => setLoadingTraffic(false));
  }, [trafficRange]);

  const recentlyViewed = useMemo(() => {
    const ids = getRecentViews();
    if (!ids.length || !locations.length) return [];
    const map = new Map(locations.map(location => [location.id, location]));
    return ids.map(id => map.get(id)).filter(Boolean) as LocationItem[];
  }, [locations]);

  const mostLoved = useMemo(() => {
    return [...locations]
      .filter(location => Number(location.total_reviews) > 0)
      .sort((a, b) => {
        if (b.average_stars !== a.average_stars) return b.average_stars - a.average_stars;
        if (b.total_reviews !== a.total_reviews) return b.total_reviews - a.total_reviews;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [locations]);

  const trafficPoints = trafficSeries.points;
  const selectedTrafficRange = trafficRangeOptions.find(option => option.value === trafficRange) || trafficRangeOptions[0];

  const topAttentionLocation = popularThisWeek[0] || null;
  const isPageLoading = loadingLocations && loadingPopular;

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-secondary font-tech text-xs tracking-widest uppercase">Loading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      <section className="glass-card rounded-[2rem] ghost-border p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,195,73,0.12),transparent_40%)]" />
        <div className="relative z-10 space-y-5 max-w-4xl">
          <span className="text-primary font-tech tracking-[0.22em] font-bold text-xs uppercase">Exploration Stats</span>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight text-on-surface leading-tight">
            A living dashboard for what travelers are revisiting, loving, and exploring now.
          </h1>
          <p className="text-secondary text-lg md:text-xl leading-relaxed max-w-3xl">
            From your own recent journey trail to the places drawing the most attention this week, Stats turns the archive into a more personal discovery space.
          </p>
        </div>
      </section>

      <StatsSection
        eyebrow="Recently viewed"
        title="Pick up where you left off"
        description="Your most recent mission and gallery stops stay here so returning feels instant instead of cold."
        icon={Clock3}
        items={recentlyViewed}
        emptyText="Open a mission or gallery to start building your trail"
        metric={() => 'Recent'}
        onOpen={(item) => setActiveTab(`Destinations:${item.id}`)}
      />

      <section className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Flame size={18} />
            </div>
            <span className="text-primary font-tech tracking-[0.2em] font-bold text-xs uppercase">Traffic insights</span>
          </div>
          <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface">Total trip views over time</h2>
          <p className="text-secondary text-base md:text-lg max-w-3xl leading-relaxed">{selectedTrafficRange.description}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-8 items-start">
          <div className="glass-card rounded-[1.75rem] ghost-border p-6 md:p-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_40%)]" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-secondary/55">Traffic curve</p>
                  <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">{trafficSeries.total_views} total views</h3>
                  <p className="text-secondary/70 text-sm mt-1">Daily totals across mission-detail and gallery visits over the last {trafficRange} days.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trafficRangeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTrafficRange(option.value)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-tech uppercase tracking-[0.18em] transition-all cursor-pointer ${
                        trafficRange === option.value
                          ? 'border-primary/50 bg-primary/15 text-primary shadow-[0_0_18px_rgba(233,195,73,0.18)]'
                          : 'border-white/10 bg-white/5 text-secondary/70 hover:border-cyan-400/30 hover:text-cyan-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingTraffic ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                  <div className="mx-auto mb-4 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-secondary/65 font-tech text-xs uppercase tracking-[0.2em]">Loading traffic curve</p>
                </div>
              ) : trafficPoints.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
                  <p className="text-secondary/65 font-tech text-xs uppercase tracking-[0.2em]">No traffic yet for this range</p>
                </div>
              ) : (
                <TrafficLineGraph points={trafficPoints} />
              )}
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] ghost-border p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,195,73,0.12),transparent_45%)]" />
            <div className="relative z-10 space-y-5">
              <div>
                <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-primary/75">Most attention location</p>
                <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Current spotlight</h3>
              </div>

              {!topAttentionLocation ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                  <p className="text-secondary/65 font-tech text-xs uppercase tracking-[0.2em]">No weekly traffic yet</p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab(`Destinations:${topAttentionLocation.id}`)}
                    className="w-full text-left rounded-[1.5rem] overflow-hidden border border-white/10 bg-white/[0.03] hover:border-primary/30 hover:shadow-[0_0_30px_rgba(233,195,73,0.12)] transition-all cursor-pointer group"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img src={topAttentionLocation.img} alt={topAttentionLocation.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
                      <div className="absolute top-4 left-4 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-tech uppercase tracking-[0.2em] text-primary">
                        {topAttentionLocation.chapter}
                      </div>
                      <div className="absolute top-4 right-4 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-tech uppercase tracking-[0.18em] text-cyan-200">
                        {topAttentionLocation.weekly_views || 0} views
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="font-headline text-3xl font-bold tracking-tight text-on-surface drop-shadow-md">{topAttentionLocation.name}</h4>
                        <p className="text-secondary/80 text-sm mt-1 line-clamp-2">{topAttentionLocation.short_desc}</p>
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-tech uppercase tracking-[0.18em] text-secondary/50">Leading location this week</p>
                        <p className="text-secondary text-sm mt-1">Open the mission detail to see what’s attracting the most attention right now.</p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-primary font-headline text-xs uppercase tracking-[0.12em] shrink-0">
                        Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-secondary/45">Traffic ranking</p>
                    <div className="space-y-2.5">
                      {popularThisWeek.slice(0, 4).map((item, index) => (
                        <button
                          key={`traffic-rank-${item.id}`}
                          type="button"
                          onClick={() => setActiveTab(`Destinations:${item.id}`)}
                          className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 hover:border-primary/20 hover:bg-white/[0.04] transition-all cursor-pointer text-left"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-tech uppercase tracking-widest text-secondary/65 shrink-0">#{index + 1}</span>
                            <div className="min-w-0">
                              <p className="font-headline text-sm text-on-surface truncate">{item.name}</p>
                              <p className="text-[10px] font-tech uppercase tracking-[0.16em] text-secondary/45 truncate">{item.chapter}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-tech uppercase tracking-[0.16em] text-primary shrink-0">{item.weekly_views || 0} views</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </section>

      <StatsSection
        eyebrow="Most loved galleries"
        title="Highest rated visual journeys"
        description="Locations with the strongest review sentiment rise here first, making the best-loved galleries easier to discover."
        icon={BarChart3}
        items={mostLoved}
        emptyText="No gallery reviews yet"
        metric={(item) => `${item.total_reviews} reviews`}
        onOpen={(item) => setActiveTab(`Gallery:${item.id}`)}
      />
    </div>
  );
}
