'use client';

import { useEffect } from 'react';

/**
 * Route-level error boundary. The experience leans on WebGL and a long GSAP
 * timeline; if either throws, this keeps the page recoverable instead of
 * leaving a blank canvas.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Experience failed to mount:', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-void px-6">
      <div className="max-w-lg text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-blood">
          Critical failure
        </span>
        <h1 className="mt-6 font-display text-[clamp(2.5rem,10vw,6rem)] leading-[0.85] text-etched">
          MISSION ABORTED
        </h1>
        <p className="mt-5 leading-relaxed text-smoke">
          Something went wrong bringing the experience online. Re-establishing the link usually
          clears it.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-9 rounded-full border border-white/15 bg-white/[0.05] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.28em] text-bone transition-colors hover:border-ember/60 hover:text-chalk"
        >
          Re-establish link
        </button>
      </div>
    </main>
  );
}
