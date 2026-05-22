export default function PageLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </div>
        <span className="text-[10px] font-tech text-primary/60 uppercase tracking-[0.3em]">Loading</span>
      </div>
    </div>
  );
}
