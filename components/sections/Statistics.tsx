'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Counter } from '@/components/ui/Counter';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { Marquee } from '@/components/ui/Marquee';
import { ACHIEVEMENTS, GLOBAL_STATS, SESSION_STATS } from '@/lib/data/world';
import type { StatItem } from '@/lib/types';

const RADAR_AXES = [
  { label: 'Accuracy', value: 0.82 },
  { label: 'Survival', value: 0.68 },
  { label: 'Aggression', value: 0.91 },
  { label: 'Rotation', value: 0.74 },
  { label: 'Support', value: 0.58 },
  { label: 'Vision', value: 0.79 },
];

/**
 * Global intel: rolling counters, an SVG radar chart that draws itself with a
 * stroke-dashoffset sweep, and the achievement ledger.
 */
export function Statistics() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  // Content reveals run on IntersectionObserver; only the decorative SVG
  // line-drawing below stays on ScrollTrigger, because if that one fails to
  // fire the radar simply renders complete rather than disappearing.
  useRevealOnce(sectionRef, '.stat-tile', { y: 50, duration: 0.75, stagger: 0.05 });
  useRevealOnce(sectionRef, '.achievement-row', { y: 30, duration: 0.6, stagger: 0.045 });

  useGsapContext(
    () => {
      if (reduced) return;

      // SVG line-drawing: rings, then axes, then the plotted polygon.
      // The dasharray is set on the elements themselves; animating the offset
      // to zero draws each ring on, no DrawSVG plugin required.
      gsap.fromTo(
        '.radar-ring',
        { strokeDashoffset: 800 },
        {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: 'cinema',
          stagger: 0.12,
          scrollTrigger: { trigger: '.radar', start: 'top 82%', once: true },
        },
      );

      gsap.from('.radar-axis', {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.8,
        ease: 'cinema',
        stagger: 0.06,
        scrollTrigger: { trigger: '.radar', start: 'top 82%', once: true },
      });

      gsap.from('.radar-shape', {
        scale: 0,
        opacity: 0,
        transformOrigin: '50% 50%',
        duration: 1.3,
        ease: 'recoil',
        delay: 0.4,
        scrollTrigger: { trigger: '.radar', start: 'top 82%', once: true },
      });

      gsap.from('.radar-node', {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'recoil',
        stagger: 0.07,
        delay: 0.9,
        transformOrigin: '50% 50%',
        scrollTrigger: { trigger: '.radar', start: 'top 82%', once: true },
      });

    },
    sectionRef,
    [reduced],
  );

  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 112;

  const point = (index: number, scale: number) => {
    const angle = (index / RADAR_AXES.length) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * scale, cy + Math.sin(angle) * radius * scale] as const;
  };

  const polygon = RADAR_AXES.map((axis, i) => point(i, axis.value).join(',')).join(' ');

  return (
    <section
      ref={sectionRef}
      id="intel"
      className="relative overflow-hidden bg-void py-28 sm:py-36"
      aria-label="Statistics and achievements"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(60% 40% at 50% 20%, rgb(255 106 26 / .1), transparent 70%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          index="06"
          eyebrow="Global Intel"
          title="BY THE"
          accent="NUMBERS"
          description="Live telemetry from every server region since launch. The numbers are large; the ones that matter are the ones next to your callsign."
        />

        {/* -------------------------- Headline stats -------------------------- */}
        <div className="stat-grid mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GLOBAL_STATS.map((stat) => (
            <StatTile key={stat.label} stat={stat} large />
          ))}
        </div>

        {/* --------------------------- Radar + session ------------------------ */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Radar */}
          <div className="stat-tile glass-heavy relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
              Squad Profile · Season 05
            </span>

            <div className="radar mt-6 flex items-center justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[340px]" role="img" aria-label="Squad performance radar chart">
                <defs>
                  <radialGradient id="radar-fill" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#ff6a1a" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#e01730" stopOpacity="0.12" />
                  </radialGradient>
                </defs>

                {/* Concentric rings */}
                {[0.25, 0.5, 0.75, 1].map((scale) => (
                  <polygon
                    key={scale}
                    className="radar-ring"
                    points={RADAR_AXES.map((_, i) => point(i, scale).join(',')).join(' ')}
                    fill="none"
                    stroke="rgb(255 255 255 / .1)"
                    strokeWidth="1"
                    strokeDasharray="800"
                  />
                ))}

                {/* Axes */}
                {RADAR_AXES.map((axis, i) => {
                  const [x, y] = point(i, 1);
                  return (
                    <line
                      key={axis.label}
                      className="radar-axis"
                      x1={cx}
                      y1={cy}
                      x2={x}
                      y2={y}
                      stroke="rgb(255 255 255 / .12)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Plotted profile */}
                <polygon
                  className="radar-shape"
                  points={polygon}
                  fill="url(#radar-fill)"
                  stroke="#ff6a1a"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 12px rgb(255 106 26 / .7))' }}
                />

                {/* Nodes + labels */}
                {RADAR_AXES.map((axis, i) => {
                  const [x, y] = point(i, axis.value);
                  const [lx, ly] = point(i, 1.24);
                  return (
                    <g key={axis.label}>
                      <circle className="radar-node" cx={x} cy={y} r="4" fill="#ffd166" />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-smoke font-mono"
                        style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase' }}
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Session stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            {SESSION_STATS.map((stat) => (
              <StatTile key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        {/* ---------------------------- Achievements -------------------------- */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="achievement-list glass-heavy rounded-3xl p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
                Achievement Ledger
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
                Unlock rate
              </span>
            </div>

            <ul className="mt-6 divide-y divide-white/[0.06]">
              {ACHIEVEMENTS.map((achievement) => (
                <li
                  key={achievement.code}
                  data-scramble-host
                  className="achievement-row group flex items-center gap-4 py-4 transition-colors"
                >
                  {/* Animated medal icon */}
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-black/40 transition-colors duration-400 group-hover:border-ember/60">
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                      <path
                        d="M9 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L9 12.3l-4.2 2.2.8-4.7L2.2 6.5l4.7-.7z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        className="text-ash transition-colors duration-400 group-hover:text-ember"
                        style={{
                          strokeDasharray: 60,
                          strokeDashoffset: 0,
                        }}
                      />
                    </svg>
                    <span className="absolute inset-0 rounded-full bg-ember/20 opacity-0 blur-md transition-opacity duration-400 group-hover:opacity-100" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-ash">
                        {achievement.code}
                      </span>
                      <h4 className="truncate font-display text-xl leading-none text-chalk transition-colors group-hover:text-ember-100">
                        {achievement.name}
                      </h4>
                    </div>
                    <p className="mt-1.5 truncate text-[12px] text-smoke">{achievement.detail}</p>
                  </div>

                  <span className="shrink-0 font-mono text-sm tabular-nums text-bone">
                    <ScrambleText text={achievement.rate} hover onScroll speed={0.04} />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rank card */}
          <div className="stat-tile glass-heavy relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(closest-side, #ff6a1a, transparent)' }}
            />
            <div className="relative">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ember">
                Current Rank
              </span>
              <p className="mt-4 font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.85] text-etched">
                DIAMOND
                <span className="block text-outline">TIER III</span>
              </p>
            </div>

            <div className="relative mt-8">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ash">
                  Rating
                </span>
                <span className="font-display text-3xl leading-none text-chalk">
                  <Counter value={4382} />
                  <span className="ml-1 font-mono text-[10px] tracking-widest text-ash">RP</span>
                </span>
              </div>
              <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: '73%',
                    background: 'linear-gradient(90deg,#c23d00,#ff6a1a,#ffd166)',
                    boxShadow: '0 0 16px rgb(255 106 26 / .8)',
                  }}
                />
              </span>
              <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                618 RP to Master
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="relative mt-20 border-y border-white/[0.07] bg-abyss/60">
        <Marquee
          items={[
            'WINNER WINNER CHICKEN DINNER',
            '100 OPERATORS',
            'ZERO SECOND CHANCES',
            'SEASON 05 LIVE',
            '8 × 8 KM',
            'DROP · LOOT · SURVIVE',
          ]}
          className="font-display text-[clamp(2rem,5vw,4rem)] leading-none text-white/[0.14]"
          duration={30}
        />
      </div>
    </section>
  );
}

function StatTile({ stat, large = false }: { stat: StatItem; large?: boolean }) {
  return (
    <div className="stat-tile glass-heavy metal-edge group relative overflow-hidden rounded-3xl p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(80% 60% at 50% 0%, rgb(255 106 26 / .16), transparent 70%)',
        }}
      />
      <span className="relative font-mono text-[9px] uppercase tracking-[0.28em] text-ash">
        {stat.label}
      </span>
      <p
        className={
          large
            ? 'relative mt-3 font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-none text-etched'
            : 'relative mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-chalk'
        }
      >
        <Counter
          value={stat.value}
          decimals={stat.decimals ?? 0}
          prefix={stat.prefix}
          suffix={stat.suffix}
        />
      </p>
      <p className="relative mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
        {stat.detail}
      </p>
    </div>
  );
}
