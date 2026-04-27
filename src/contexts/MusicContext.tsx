import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface MusicContextValue {
  activeLocationId: string | null;
  isBlocked: boolean;
  isPlaying: boolean;
  activateMusic: (locationId: string, musicUrl: string | null | undefined) => void;
  deactivateMusic: () => void;
  userPlay: () => void;
  userToggle: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeMusicUrl, setActiveMusicUrl] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = 0.55;
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const activateMusic = useCallback((locationId: string, musicUrl: string | null | undefined) => {
    if (!musicUrl) {
      // no music configured for this location
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setActiveLocationId(null);
      setActiveMusicUrl(null);
      setIsBlocked(false);
      setIsPlaying(false);
      return;
    }

    const audio = ensureAudio();

    // Same location + same url → already playing or was blocked, do nothing
    if (locationId === activeLocationId && musicUrl === activeMusicUrl) return;

    if (audio.src !== musicUrl) {
      audio.src = musicUrl;
      audio.load();
    }
    setActiveLocationId(locationId);
    setActiveMusicUrl(musicUrl);
    setIsBlocked(false);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setIsBlocked(true);
        setIsPlaying(false);
      });
    }
  }, [activeLocationId, activeMusicUrl]);

  const deactivateMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setActiveLocationId(null);
    setActiveMusicUrl(null);
    setIsBlocked(false);
    setIsPlaying(false);
  }, []);

  const userPlay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => {
      setIsBlocked(false);
    }).catch(() => {});
  }, []);

  const userToggle = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().then(() => setIsBlocked(false)).catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <MusicContext.Provider value={{ activeLocationId, isBlocked, isPlaying, activateMusic, deactivateMusic, userPlay, userToggle }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used inside MusicProvider');
  return ctx;
}
