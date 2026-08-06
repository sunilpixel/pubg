import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Signal Lost',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-void px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 40%, rgb(255 106 26 / .12), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="carbon pointer-events-none absolute inset-0 opacity-40"
      />

      <div className="relative max-w-xl text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-ember">
          Error 404 · Grid reference invalid
        </span>

        <h1 className="mt-6 font-display text-[clamp(4rem,18vw,12rem)] leading-[0.82]">
          <span className="text-etched block">SIGNAL</span>
          <span className="text-outline block">LOST</span>
        </h1>

        <p className="mt-6 text-pretty leading-relaxed text-smoke">
          That sector is outside the playable area. The circle has already moved on — rotate back
          to the drop zone before the blue catches you.
        </p>

        <Link
          href="/"
          className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden rounded-full bg-linear-to-b from-ember-300 via-ember to-ember-700 px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-void shadow-[0_10px_40px_-10px_rgb(255_106_26/.85)]"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-24deg] bg-white/40 transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-full" />
          <span className="relative">Return to drop zone</span>
        </Link>
      </div>
    </main>
  );
}
