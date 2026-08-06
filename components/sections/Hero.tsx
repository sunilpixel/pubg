'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useGsapContext } from '@/hooks/useGsapContext';
import { useIsMobile, usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { usePointerParallax } from '@/hooks/usePointerParallax';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ParticleField } from '@/components/ui/ParticleField';
import { ScrambleText } from '@/components/ui/ScrambleText';
import { VolumetricSmoke } from '@/components/ui/VolumetricSmoke';

/**
 * WebGL is the single heaviest thing on the page, so it is code-split and only
 * requested on the client. The section is fully legible without it — the 3D is
 * an enhancement layered over a designed CSS backdrop, not a dependency.
 */
const Battlefield = dynamic(() => import('@/components/three/Battlefield'), {
  ssr: false,
  loading: () => null,
});

const HUD_READOUT = [
  { label: 'Sector', value: 'ERANGEL-07' },
  { label: 'Operators', value: '100' },
  { label: 'Zone', value: 'CLOSING' },
  { label: 'Drop', value: 'T-00:38' },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef(0);

  const { ready } = useExperience();
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  usePointerParallax(stageRef, { x: 22, y: 14 });

  /* ---------------- Entrance: plays once the loader hands off ------------- */
  useEffect(() => {
    if (!ready || reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'cinema' } });

      tl.from('.hero-line', {
        yPercent: 118,
        rotateX: 48,
        opacity: 0,
        duration: 1.35,
        stagger: 0.11,
        transformOrigin: '50% 100% -80px',
      })
        .from('.hero-rule', { scaleX: 0, duration: 1.1, transformOrigin: 'left center' }, '-=0.85')
        .from('.hero-copy', { y: 42, opacity: 0, duration: 1 }, '-=0.9')
        .from('.hero-cta', { y: 34, opacity: 0, duration: 0.85, stagger: 0.1 }, '-=0.75')
        .from('.hero-hud-item', { y: 24, opacity: 0, duration: 0.7, stagger: 0.07 }, '-=0.7')
        .from('.hero-scroll', { opacity: 0, y: -18, duration: 0.8 }, '-=0.5');
    }, sectionRef);

    return () => ctx.revert();
  }, [ready, reduced]);

  /* ---------------- Pinned cinematic scroll ------------------------------- */
  useGsapContext(
    () => {
      if (reduced) return;

      // Pin the hero and hand scroll progress to the 3D camera rig.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=260%',
        pin: stageRef.current,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });

      // The title and HUD recede as the camera flies in.
      gsap.to('.hero-content', {
        yPercent: -22,
        opacity: 0,
        filter: 'blur(14px)',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          scrub: 1,
        },
      });

      // Letterbox bars close in, turning the hero into a widescreen frame.
      gsap.fromTo(
        '.letterbox',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=80%',
            scrub: 1,
          },
        },
      );

      // Final beat: the whole scene dims into the section below.
      gsap.to('.hero-dim', {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top+=180% top',
          end: '+=80%',
          scrub: true,
        },
      });
    },
    sectionRef,
    [reduced],
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative h-[360vh] w-full"
      aria-label="Blackout Protocol — battlefield reveal"
    >
      <div ref={stageRef} className="relative h-screen w-full overflow-hidden">
        {/* ------------------------- Backdrop layers ------------------------ */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 80%, #14100c 0%, #080a0c 45%, #030405 100%)',
          }}
        />

        {/* 3D battlefield — mounted only after the loader clears so the intro
            never competes with shader compilation for the main thread. */}
        {ready && !reduced ? (
          <div className="absolute inset-0">
            <Battlefield progress={progressRef} quality={isMobile ? 'low' : 'high'} />
          </div>
        ) : null}

        {/* Volumetric haze sitting in front of the 3D */}
        <VolumetricSmoke plumes={4} tone="warm" intensity={0.55} seed={11} className="z-[2]" />

        {/* Atmospheric particles */}
        <div className="pointer-events-none absolute inset-0 z-[3]">
          <ParticleField mode="ash" count={70} parallax={34} opacity={0.7} />
          <ParticleField mode="ember" count={34} parallax={54} opacity={0.85} />
          <ParticleField mode="shell" count={12} parallax={16} opacity={0.5} />
        </div>

        {/* Horizon glow */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-1/2"
          style={{
            background:
              'linear-gradient(0deg, rgb(3 4 5 / .96) 0%, rgb(3 4 5 / .5) 40%, transparent 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] h-40 -translate-y-1/2 opacity-45 blur-3xl"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgb(255 106 26 / .5) 30%, rgb(224 23 48 / .35) 62%, transparent)',
          }}
        />

        {/* Letterbox */}
        <div className="letterbox pointer-events-none absolute inset-x-0 top-0 z-[40] h-[9vh] origin-top bg-void" />
        <div className="letterbox pointer-events-none absolute inset-x-0 bottom-0 z-[40] h-[9vh] origin-bottom bg-void" />

        {/* ---------------------------- Content ---------------------------- */}
        <div className="hero-content relative z-30 flex h-full flex-col justify-between px-6 pb-10 pt-28 sm:px-10 lg:px-16">
          {/* Top HUD strip */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="hero-hud-item glass metal-edge rounded-full px-5 py-2.5">
              <span className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-smoke">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blood" />
                </span>
                Live Operation
              </span>
            </div>

            <dl className="hidden gap-8 md:flex">
              {HUD_READOUT.map((item) => (
                <div key={item.label} className="hero-hud-item text-right">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.34em] text-ash">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-bone">
                    <ScrambleText text={item.value} onScroll={false} speed={0.05} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Masthead */}
          <div className="max-w-5xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="hero-rule block h-px w-16 bg-linear-to-r from-ember to-transparent" />
              <ScrambleText
                text="SEASON 05 · GLOBAL REVEAL"
                onScroll={false}
                delay={0.6}
                className="font-mono text-[10px] uppercase tracking-[0.44em] text-ember"
              />
            </div>

            <h1
              ref={titleRef}
              className="font-display text-[clamp(3.6rem,13.5vw,13rem)] leading-[0.82]"
              style={{ perspective: '900px' }}
            >
              <span className="block overflow-hidden">
                <span className="hero-line text-etched block">BLACKOUT</span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line text-outline block" data-cursor="view">
                  PROTOCOL
                </span>
              </span>
            </h1>

            <p className="hero-copy mt-8 max-w-xl text-pretty text-base leading-relaxed text-smoke sm:text-lg">
              One hundred operators. Eight square kilometres of contested ground. A shrinking
              circle that does not negotiate. Drop in, kit up, and be the last thing standing
              when the dust settles.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="hero-cta">
                <MagneticButton href="#vault" variant="primary">
                  Enter the Armoury
                </MagneticButton>
              </div>
              <div className="hero-cta">
                <MagneticButton href="#timeline" variant="outline" strength={0.28}>
                  Watch the Drop
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="hero-scroll flex items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-ash">
                Scroll to deploy
              </span>
              <span className="relative block h-12 w-px overflow-hidden bg-white/12">
                <span
                  className="absolute inset-x-0 top-0 h-4 bg-ember"
                  style={{ animation: 'scan 2.4s cubic-bezier(.7,0,.2,1) infinite' }}
                />
              </span>
            </div>

            <div className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-ash sm:block">
              <span className="text-ember">4K</span> · 120 FPS · HDR
            </div>
          </div>
        </div>

        {/* Dim-out into the next scene */}
        <div className="hero-dim pointer-events-none absolute inset-0 z-[45] bg-void opacity-0" />
      </div>
    </section>
  );
}
