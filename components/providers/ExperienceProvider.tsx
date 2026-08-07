'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { unlockAudio } from '@/lib/audio';

type ExperienceState = {
  /** True once the weapon-assembly loader has handed off to the hero. */
  ready: boolean;
  markReady: () => void;
  /**
   * Set shortly before the loader finishes, while the detonation is playing.
   *
   * Creating a WebGL context and compiling its shaders blocks the main thread.
   * If that happens on the same frame the loader hands off, it stutters exactly
   * as the hero is revealed — the worst possible moment. Mounting the canvas
   * during the explosion instead hides the cost behind an animation that is
   * already violent, and the scene is warm by the time the iris opens.
   */
  preparing: boolean;
  markPreparing: () => void;
  /** Sound is on by default; the toggle lets anyone mute the whole experience. */
  audioEnabled: boolean;
  toggleAudio: () => void;
  /** Any fullscreen overlay (weapon detail, lightbox) locks scroll + cursor. */
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
};

const ExperienceContext = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const markReady = useCallback(() => setReady(true), []);
  const markPreparing = useCallback(() => setPreparing(true), []);
  const toggleAudio = useCallback(() => {
    // Build/resume the AudioContext inside this click. Leaving it to whatever
    // sound fires first risks doing it outside a user gesture — and the browser
    // drops that one on the floor.
    if (!audioEnabled) unlockAudio();
    setAudioEnabled((v) => !v);
  }, [audioEnabled]);

  /**
   * Sound starts on, but a page that has never been touched has no audio
   * permission — an AudioContext built outside a gesture comes up suspended and
   * everything scheduled into it is lost. So prime it on the very first
   * interaction of any kind, then get out of the way.
   */
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    const detach = () => events.forEach((e) => window.removeEventListener(e, prime));
    function prime() {
      unlockAudio();
      detach();
    }
    events.forEach((e) => window.addEventListener(e, prime, { passive: true }));
    return detach;
  }, []);

  const value = useMemo(
    () => ({
      ready,
      markReady,
      preparing,
      markPreparing,
      audioEnabled,
      toggleAudio,
      overlayOpen,
      setOverlayOpen,
    }),
    [ready, markReady, preparing, markPreparing, audioEnabled, toggleAudio, overlayOpen],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceState {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return ctx;
}
