"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, Flip, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { useRevealOnce } from "@/hooks/useRevealOnce";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useExperience } from "@/components/providers/ExperienceProvider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ParticleField } from "@/components/ui/ParticleField";
import { WeaponArtDefs } from "@/components/art/WeaponArt";
import { WeaponCard } from "@/components/weapons/WeaponCard";
import { WeaponDetail } from "@/components/weapons/WeaponDetail";
import { WEAPON_CATEGORIES, WEAPONS } from "@/lib/data/weapons";
import { playUi } from "@/lib/audio";
import type { Weapon, WeaponCategoryId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = WeaponCategoryId | "all";

export function WeaponVault() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFlip = useRef<Flip.FlipState | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<{
    weapon: Weapon;
    origin: HTMLElement;
  } | null>(null);

  /**
   * How many cards are actually in the DOM.
   *
   * `content-visibility` stops the browser *painting* off-screen cards, but it
   * still has to parse, style and lay out all thirty — and they ship in the
   * server HTML. Starting with the first row-and-a-bit and mounting the rest
   * once the browser is idle keeps the initial document small and gets the
   * section interactive sooner. The remainder lands long before anyone has
   * scrolled to it.
   */
  const [mountBudget, setMountBudget] = useState(8);

  const { setOverlayOpen, audioEnabled } = useExperience();
  const reduced = usePrefersReducedMotion();

  const matching =
    filter === "all" ? WEAPONS : WEAPONS.filter((w) => w.category === filter);
  const visible = matching.slice(0, mountBudget);

  /**
   * Mount the rest of the grid on the frame after first paint.
   *
   * This previously waited for `requestIdleCallback` (up to a 2.5s timeout).
   * That kept first paint cheap, but twenty-two extra cards arriving seconds
   * later added several thousand pixels to the document — so every section
   * below the vault shifted down long after their ScrollTriggers had measured.
   * Pins and reveals below were then positioned against a page that no longer
   * existed, which is why resizing the window (DevTools opening counts) fixed
   * everything: a resize forces a full re-measure.
   *
   * One frame is enough to stay off the critical path, and the document height
   * settles immediately instead of seconds later.
   */
  useEffect(() => {
    if (mountBudget >= WEAPONS.length) return;
    const frame = requestAnimationFrame(() => setMountBudget(WEAPONS.length));
    return () => cancelAnimationFrame(frame);
  }, [mountBudget]);

  /**
   * Re-measure *after* React has committed the new rows.
   *
   * The old code called refresh inside a `requestAnimationFrame` fired straight
   * after `setMountBudget`, which can run before React commits — so it measured
   * the short grid and cached those wrong positions. A layout effect keyed to
   * the budget runs after the DOM is updated, so the measurement is real.
   */
  useIsomorphicLayoutEffect(() => {
    ScrollTrigger.refresh();
  }, [mountBudget]);

  /* -------- Flip-animated filtering: cards glide to their new slots ------- */
  const changeFilter = useCallback(
    (next: Filter) => {
      if (next === filter) return;
      if (audioEnabled) playUi({ pitch: 1.2 });

      if (!reduced && gridRef.current) {
        pendingFlip.current = Flip.getState(
          gridRef.current.querySelectorAll(".weapon-card"),
          {
            props: "opacity",
          },
        );
      }
      setFilter(next);
    },
    [filter, reduced, audioEnabled],
  );

  useIsomorphicLayoutEffect(() => {
    const state = pendingFlip.current;
    if (!state) return;
    pendingFlip.current = null;

    Flip.from(state, {
      duration: 0.75,
      ease: "cinema",
      scale: true,
      absolute: true,
      stagger: 0.025,
      // Cards entering the filtered set rise in; cards leaving drop away.
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.86, y: 40 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            ease: "cinema",
            stagger: 0.03,
          },
        ),
      onLeave: (elements) =>
        gsap.to(elements, {
          opacity: 0,
          scale: 0.86,
          y: -30,
          duration: 0.4,
          ease: "power2.in",
        }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter]);

  /* ------------------------- Scroll choreography -------------------------
   * Entrances run on IntersectionObserver rather than ScrollTrigger. A
   * `gsap.from({ opacity: 0 })` whose trigger position is mis-measured never
   * plays, leaving the whole grid invisible — and pinned sections above this
   * one make mis-measurement easy. See useRevealOnce.
   */
  // Re-runs when the card set changes — on filter, and when the remaining
  // cards mount after first paint — so newly added cards are observed too.
  // Cards that have already played are never re-hidden.
  useRevealOnce(
    gridRef,
    ".weapon-card",
    { y: 60, duration: 0.8, stagger: 0.05 },
    [visible.length, filter],
  );
  useRevealOnce(sectionRef, ".filter-chip", {
    y: 20,
    duration: 0.55,
    stagger: 0.03,
  });

  useGsapContext(
    () => {
      if (reduced) return;

      // Slow background parallax on the vault's ambient glow.
      gsap.to(".vault-glow", {
        yPercent: -22,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    sectionRef,
    [reduced],
  );

  const openWeapon = useCallback(
    (weapon: Weapon, element: HTMLElement) => {
      setSelected({ weapon, origin: element });
      setOverlayOpen(true);
    },
    [setOverlayOpen],
  );

  const closeWeapon = useCallback(() => {
    setSelected(null);
    setOverlayOpen(false);
  }, [setOverlayOpen]);

  return (
    <section
      ref={sectionRef}
      id="vault"
      className="relative overflow-hidden bg-void py-28 sm:py-36"
      aria-label="Weapon vault"
    >
      {/* Gradient definitions shared by every low-detail card in the grid. */}
      <WeaponArtDefs />
      {/* Ambient */}
      <div
        aria-hidden
        className="vault-glow pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgb(255 106 26 / .14), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <ParticleField mode="dust" count={54} parallax={22} opacity={0.5} />
      </div>

      <div className="relative mx-auto w-full max-w-[100rem] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          index="01"
          eyebrow="The Armoury"
          title="WEAPON"
          accent="VAULT"
          description="Thirty platforms across ten classes, each modelled from its real ballistic profile. Select any weapon to take it to the range — inspect the machining, cycle the action, and put rounds downrange."
        />

        {/* --------------------------- Filter rail --------------------------- */}
        <div className="filter-rail mt-14 -mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            className="flex min-w-max items-center gap-2"
            role="tablist"
            aria-label="Weapon categories"
          >
            <FilterChip
              label="All Classes"
              short={String(WEAPONS.length)}
              active={filter === "all"}
              onClick={() => changeFilter("all")}
            />
            {WEAPON_CATEGORIES.map((category) => {
              const count = WEAPONS.filter(
                (w) => w.category === category.id,
              ).length;
              return (
                <FilterChip
                  key={category.id}
                  label={category.label}
                  short={String(count)}
                  active={filter === category.id}
                  onClick={() => changeFilter(category.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Active category blurb */}
        <p
          key={filter}
          className="mt-6 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-ash"
          style={{ animation: "none" }}
        >
          {filter === "all"
            ? "Full manifest — every class currently in circulation."
            : WEAPON_CATEGORIES.find((c) => c.id === filter)?.blurb}
        </p>

        {/* ------------------------------ Grid ------------------------------ */}
        <div
          ref={gridRef}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{ perspective: "1600px" }}
        >
          {visible.map((weapon, index) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              index={index}
              onSelect={openWeapon}
            />
          ))}
        </div>
      </div>

      {selected ? (
        <WeaponDetail
          weapon={selected.weapon}
          origin={selected.origin}
          onClose={closeWeapon}
        />
      ) : null}
    </section>
  );
}

function FilterChip({
  label,
  short,
  active,
  onClick,
}: {
  label: string;
  short: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-cursor="target"
      className={cn(
        "filter-chip group relative shrink-0 overflow-hidden rounded-full px-5 py-3",
        "font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-400 ease-[cubic-bezier(.16,1,.3,1)]",
        active
          ? "border border-ember/60 bg-ember/12 text-ember shadow-[0_0_28px_-8px_rgb(255_106_26/.9)]"
          : "border border-white/10 bg-white/[0.03] text-smoke hover:border-white/25 hover:text-chalk",
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-24deg] bg-white/12 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2.5">
        {label}
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] tabular-nums transition-colors",
            active ? "bg-ember/25 text-ember" : "bg-white/8 text-ash",
          )}
        >
          {short}
        </span>
      </span>
    </button>
  );
}
