'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ExperienceState = {
  /** True once the weapon-assembly loader has handed off to the hero. */
  ready: boolean;
  markReady: () => void;
  /** Sound is opt-in — browsers block autoplay and it is the polite default. */
  audioEnabled: boolean;
  toggleAudio: () => void;
  /** Any fullscreen overlay (weapon detail, lightbox) locks scroll + cursor. */
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
};

const ExperienceContext = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const markReady = useCallback(() => setReady(true), []);
  const toggleAudio = useCallback(() => setAudioEnabled((v) => !v), []);

  const value = useMemo(
    () => ({ ready, markReady, audioEnabled, toggleAudio, overlayOpen, setOverlayOpen }),
    [ready, markReady, audioEnabled, toggleAudio, overlayOpen],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceState {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return ctx;
}
