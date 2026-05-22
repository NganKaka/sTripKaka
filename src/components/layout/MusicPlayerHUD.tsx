import { useMusic } from '../../contexts/MusicContext';

export default function MusicPlayerHUD() {
  const { activeLocationId, isBlocked, isPlaying, userPlay, userToggle } = useMusic();
  if (!activeLocationId) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-surface-container/70 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-[0_0_24px_rgba(0,0,0,0.5)] select-none">
      {isBlocked ? (
        <button
          type="button"
          onClick={userPlay}
          className="flex items-center gap-2 text-primary font-tech text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/70" />
          </span>
          Play music
        </button>
      ) : (
        <button
          type="button"
          onClick={userToggle}
          className="flex items-center gap-2 text-primary font-tech text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              <span>Now playing</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full border border-primary/60 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              </span>
              <span>Resume</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
