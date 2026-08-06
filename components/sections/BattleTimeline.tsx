'use client';

import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { usePrefersReducedMotion, useIsMobile } from '@/hooks/useMediaQuery';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { ParticleField } from '@/components/ui/ParticleField';
import { TIMELINE } from '@/lib/data/world';
import type { TimelinePhase } from '@/lib/types';
import { cn } from '@/lib/utils';

/** The flight path the marker follows across the whole timeline. */
const FLIGHT_PATH =
  'M0,58 C120,10 240,96 360,52 C480,10 600,88 720,44 C840,6 960,72 1080,40 C1160,20 1220,52 1280,30';

/**
 * The battle timeline — seven phases of a match, pinned and scrolled
 * horizontally.
 *
 * Vertical scroll drives a horizontal translate on the track; each phase runs
 * its own entrance as it reaches centre frame, and an aircraft marker flies the
 * full-width flight path via MotionPath in lockstep with progress.
 */
export function BattleTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const progressRef = useRef<SVGPathElement>(null);

  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  useGsapContext(
    () => {
      if (reduced || isMobile) return;

      const track = trackRef.current;
      if (!track) return;

      const distance = () => track.scrollWidth - window.innerWidth;

      const scrollTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          // Scroll length matches the horizontal distance, so the mapping is 1:1
          // and the panels never feel like they are racing the scroll.
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Draw the trail in behind the aircraft marker.
            if (progressRef.current) {
              const length = progressRef.current.getTotalLength();
              progressRef.current.style.strokeDasharray = String(length);
              progressRef.current.style.strokeDashoffset = String(length * (1 - self.progress));
            }
          },
        },
      });

      // Marker rides the path, tied to the same ScrollTrigger.
      // `align` must be an element or selector — passing raw path data makes
      // MotionPath hand the string to querySelectorAll and throw. Reference the
      // rendered guide path by id instead, which also puts the marker in the
      // path's own coordinate space.
      gsap.to(markerRef.current, {
        motionPath: {
          path: '#tl-flight-path',
          align: '#tl-flight-path',
          alignOrigin: [0.5, 0.5],
          autoRotate: true,
        },
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      // Per-phase entrances, triggered horizontally via containerAnimation.
      gsap.utils.toArray<HTMLElement>('.phase-panel').forEach((panel) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: 'left 78%',
            end: 'right 22%',
            toggleActions: 'play none none reverse',
          },
        });

        tl.from(panel.querySelectorAll('.phase-index'), {
          scale: 0.4,
          opacity: 0,
          duration: 0.8,
          ease: 'recoil',
        })
          .from(
            panel.querySelectorAll('.phase-title'),
            { yPercent: 110, opacity: 0, duration: 0.9, ease: 'cinema' },
            '-=0.55',
          )
          .from(
            panel.querySelectorAll('.phase-body'),
            { y: 40, opacity: 0, duration: 0.8, ease: 'cinema', stagger: 0.08 },
            '-=0.6',
          )
          .from(
            panel.querySelectorAll('.phase-metric'),
            { y: 24, opacity: 0, duration: 0.6, ease: 'cinema', stagger: 0.07 },
            '-=0.5',
          )
          .from(
            panel.querySelectorAll('.phase-art'),
            { scale: 0.82, opacity: 0, rotate: -6, duration: 1, ease: 'cinema' },
            '-=0.9',
          );
      });
    },
    sectionRef,
    [reduced, isMobile],
  );

  // Mobile and reduced-motion fall back to a vertical stack — no pinning, no
  // horizontal hijack, all content still present.
  const stacked = reduced || isMobile;

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className={cn('relative bg-void', stacked ? 'py-24' : 'h-screen overflow-hidden')}
      aria-label="Battle timeline"
    >
      <div className="pointer-events-none absolute inset-0">
        <ParticleField mode="dust" count={44} parallax={18} opacity={0.4} />
      </div>

      {/* Flight path ribbon */}
      {!stacked ? (
        <div className="pointer-events-none absolute inset-x-0 top-[14vh] z-10">
          <svg viewBox="0 0 1280 110" className="w-full" preserveAspectRatio="none" aria-hidden>
            <path
              id="tl-flight-path"
              d={FLIGHT_PATH}
              fill="none"
              stroke="rgb(255 255 255 / .08)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
            />
            <path
              ref={progressRef}
              d={FLIGHT_PATH}
              fill="none"
              stroke="url(#tl-progress)"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px rgb(255 106 26 / .9))' }}
            />
            <defs>
              <linearGradient id="tl-progress" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c23d00" />
                <stop offset="60%" stopColor="#ff6a1a" />
                <stop offset="100%" stopColor="#ffd166" />
              </linearGradient>
            </defs>

            {/* The aircraft marker */}
            <g ref={markerRef}>
              <path d="M-13 0 L7 -5 L13 0 L7 5 Z" fill="#ffd166" />
              <path d="M-3 -4 L2 -13 L6 -13 L2 -4 Z" fill="#ff6a1a" />
              <path d="M-3 4 L2 13 L6 13 L2 4 Z" fill="#ff6a1a" />
              <circle cx="0" cy="0" r="12" fill="#ffd166" opacity="0.14" />
            </g>
          </svg>
        </div>
      ) : null}

      {/* Heading */}
      <div
        className={cn(
          'relative z-20 mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12',
          stacked ? '' : 'pt-24',
        )}
      >
        <SectionHeading
          index="08"
          eyebrow="Anatomy of a Match"
          title="BATTLE"
          accent="TIMELINE"
          className="max-w-2xl"
        />
      </div>

      {/* Track */}
      {stacked ? (
        <div className="mx-auto mt-14 grid w-full max-w-[100rem] gap-5 px-5 sm:px-8 lg:px-12">
          {TIMELINE.map((phase, i) => (
            <PhasePanel key={phase.id} phase={phase} index={i} stacked />
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="relative z-20 flex h-[62vh] items-stretch gap-6 pl-[6vw] pr-[12vw] will-change-transform"
        >
          {TIMELINE.map((phase, i) => (
            <PhasePanel key={phase.id} phase={phase} index={i} />
          ))}
        </div>
      )}

      {!stacked ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ash">
            Scroll — {TIMELINE.length} phases
          </span>
        </div>
      ) : null}
    </section>
  );
}

function PhasePanel({
  phase,
  index,
  stacked = false,
}: {
  phase: TimelinePhase;
  index: number;
  stacked?: boolean;
}) {
  return (
    <article
      className={cn(
        'phase-panel group relative isolate flex flex-col justify-between overflow-hidden rounded-3xl carbon metal-edge p-7 sm:p-9',
        stacked ? 'w-full' : 'w-[min(82vw,540px)] shrink-0',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-500 group-hover:opacity-90"
        style={{
          background: `radial-gradient(90% 60% at ${20 + index * 10}% 0%, rgb(255 106 26 / .16), transparent 68%)`,
        }}
      />

      {/* Oversized ghost index */}
      <span
        aria-hidden
        className="phase-index pointer-events-none absolute -right-4 -top-8 select-none font-display text-[clamp(7rem,16vw,13rem)] leading-none text-white/[0.035]"
      >
        {phase.index}
      </span>

      <header className="relative">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-ember/40 bg-ember/10 font-mono text-[10px] text-ember">
            {phase.index}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ash">
            {phase.altitude}
          </span>
        </div>

        <h3 className="mt-5 overflow-hidden">
          <span className="phase-title block font-display text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[0.86] text-etched">
            {phase.title}
          </span>
        </h3>
        <p className="phase-body mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ember">
          {phase.subtitle}
        </p>
      </header>

      {/* Phase artwork */}
      <div className="phase-art relative my-6 flex justify-center">
        <PhaseArt id={phase.id} />
      </div>

      <div className="relative">
        <p className="phase-body text-[13px] leading-relaxed text-smoke">{phase.detail}</p>

        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-5">
          {phase.metrics.map((metric) => (
            <div key={metric.label} className="phase-metric" data-scramble-host>
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-ash">
                {metric.label}
              </dt>
              <dd className="mt-1.5 font-mono text-xs text-bone">
                <ScrambleText text={metric.value} hover onScroll={false} speed={0.03} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

/** Small vector vignette for each phase. */
function PhaseArt({ id }: { id: string }) {
  const common = 'h-28 w-full max-w-[220px]';

  switch (id) {
    case 'takeoff':
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <path d="M0 84 L200 76" stroke="#2a3136" strokeWidth="3" />
          <path d="M20 84 L180 80" stroke="#ff6a1a" strokeWidth="1" strokeDasharray="8 10" opacity="0.6" />
          <g transform="translate(112 44) rotate(-11)">
            <path d="M-40 0 Q-28 -8 6 -9 L44 -9 Q58 -9 64 0 Q58 9 44 9 L6 9 Q-28 8 -40 0 Z" fill="#2a3136" />
            <path d="M6 -8 L32 -26 L44 -26 L26 -8 Z" fill="#1a1f24" />
            <path d="M-34 -2 L-44 -20 L-34 -20 L-22 -4 Z" fill="#1a1f24" />
            <circle cx="56" cy="0" r="2.4" fill="#ff2b44" />
          </g>
        </svg>
      );
    case 'jump':
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <path d="M8 16 L60 22" stroke="#2a3136" strokeWidth="6" strokeLinecap="round" />
          <path d="M56 20 L74 30 L58 34 Z" fill="#12161a" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${86 + i * 26} ${34 + i * 13})`}>
              <circle cx="0" cy="-7" r="4.4" fill="#e8ecef" opacity={1 - i * 0.16} />
              <path d="M-3 -3 L-4 12 L4 12 L3 -3 Z" fill="#c8ced3" opacity={1 - i * 0.16} />
              <path d="M-4 0 L-15 8 M4 0 L15 8" stroke="#c8ced3" strokeWidth="2.4" strokeLinecap="round" opacity={1 - i * 0.16} />
            </g>
          ))}
        </svg>
      );
    case 'parachute':
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <g transform="translate(100 12)">
            {[0, 1, 2, 3, 4].map((i) => {
              const x0 = -50 + i * 20;
              return (
                <path
                  key={i}
                  d={`M${x0} 30 Q${x0 + 10} -8 ${x0 + 20} 30 Q${x0 + 10} 40 ${x0} 30 Z`}
                  fill={i % 2 ? '#c9503a' : '#d8cdb4'}
                />
              );
            })}
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${-44 + i * 29} 32 L0 62`} stroke="#c8bfa8" strokeWidth="1" opacity="0.7" />
            ))}
            <circle cx="0" cy="66" r="5" fill="#e8ecef" />
            <path d="M-4 70 L-5 82 L5 82 L4 70 Z" fill="#c8ced3" />
          </g>
        </svg>
      );
    case 'landing':
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <path d="M0 78 Q50 66 100 76 T200 70 L200 100 L0 100 Z" fill="#0a0d10" />
          <g transform="translate(84 46)">
            <circle cx="0" cy="0" r="7" fill="#e8ecef" />
            <path d="M-5 6 L-7 30 L7 30 L5 6 Z" fill="#c8ced3" />
            <path d="M-6 12 L-22 20" stroke="#c8ced3" strokeWidth="3.4" strokeLinecap="round" />
          </g>
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={70 + i * 18} cy={78} rx={16 - i} ry={5} fill="#8b8069" opacity={0.28 - i * 0.04} />
          ))}
          <rect x="128" y="52" width="46" height="26" rx="3" fill="#1a1f24" />
          <rect x="140" y="60" width="22" height="18" fill="#0a0d10" />
        </svg>
      );
    case 'loot':
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <rect x="18" y="40" width="52" height="44" rx="4" fill="#3d3221" />
          <rect x="18" y="52" width="52" height="4" fill="#241d13" />
          <rect x="84" y="30" width="38" height="54" rx="5" fill="#1a1f24" />
          <path d="M92 44 h22 v6 h-22 Z" fill="#ff6a1a" opacity="0.7" />
          <path d="M92 56 h22 v6 h-22 Z" fill="#4dabff" opacity="0.6" />
          <circle cx="158" cy="46" r="16" fill="none" stroke="#8b969e" strokeWidth="3" />
          <path d="M158 36 v10 h8" stroke="#ffd166" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x="140" y="68" width="36" height="16" rx="4" fill="#2a3136" />
        </svg>
      );
    case 'combat':
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <rect x="14" y="46" width="120" height="14" rx="4" fill="#2a3136" />
          <rect x="14" y="42" width="70" height="6" rx="2" fill="#39424a" />
          <path d="M40 60 L36 82 L54 82 L52 60 Z" fill="#1a1f24" />
          <rect x="96" y="58" width="26" height="26" rx="4" fill="#1a1f24" />
          <g>
            <circle cx="150" cy="52" r="12" fill="#ffd166" opacity="0.9" />
            <path d="M150 32 L154 48 L172 52 L154 56 L150 74 L146 56 L128 52 L146 48 Z" fill="#ff8a2e" opacity="0.8" />
          </g>
          <path d="M162 52 L200 52" stroke="#ffd166" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={72 + i * 9} y={26 + i * 4} width="4" height="9" rx="2" fill="#c69334" opacity={0.85 - i * 0.2} />
          ))}
        </svg>
      );
    case 'victory':
    default:
      return (
        <svg viewBox="0 0 200 100" className={common} aria-hidden>
          <defs>
            <linearGradient id="pan-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe9a8" />
              <stop offset="55%" stopColor="#ffb84d" />
              <stop offset="100%" stopColor="#a3651a" />
            </linearGradient>
          </defs>
          {/* Rays */}
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M100 52 L104 8 L96 8 Z"
              fill="#ffd166"
              opacity="0.16"
              transform={`rotate(${i * 30} 100 52)`}
            />
          ))}
          {/* Plate */}
          <ellipse cx="100" cy="66" rx="56" ry="15" fill="#2a3136" />
          <ellipse cx="100" cy="63" rx="56" ry="15" fill="#39424a" />
          {/* Chicken dinner, unapologetically */}
          <ellipse cx="100" cy="54" rx="34" ry="20" fill="url(#pan-gold)" />
          <ellipse cx="90" cy="48" rx="10" ry="6" fill="#fff" opacity="0.28" />
          <path d="M132 56 L152 66 L146 70 L128 60 Z" fill="#c9902f" />
          <path d="M68 56 L48 66 L54 70 L72 60 Z" fill="#c9902f" />
        </svg>
      );
  }
}
