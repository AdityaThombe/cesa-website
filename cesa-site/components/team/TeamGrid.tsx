"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import MemberCard from "@/components/ui/MemberCard";
import type { Member } from "@/lib/content";
import { useHasPointer, useReducedMotion } from "@/lib/motion";

gsap.registerPlugin(Flip);

type Entry = Member & { group: string };

/** Matches MemberCard's own corner radius so glare and halo hug the card. */
const CARD_RADIUS = "7.16% / 5.59%";

/**
 * One grid cell. Three layers, each owning one kind of motion so none of them
 * fight over `transform`: the cell is moved by Flip when the filter changes,
 * `data-deal` by the entrance, and the tilt layer by the pointer.
 */
function Cell({ entry, hidden, hasPointer }: { entry: Entry; hidden: boolean; hasPointer: boolean }) {
  const tiltRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!hasPointer || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateY(-8px)`;
    el.style.setProperty("--mx", (x * 2).toFixed(3));
    el.style.setProperty("--my", (y * 2).toFixed(3));
    el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--hover", "1");
  }

  function onLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
    el.style.setProperty("--hover", "0");
  }

  return (
    <div data-cell data-group={entry.group} className="relative" style={{ display: hidden ? "none" : undefined }}>
      <div data-deal>
        {/* Halo: a soft light that tracks the cursor across the whole grid and
            catches the edges of every card it passes near (--lx/--ly are set
            by TeamGrid, in this cell's own px). Like the glare below, it only
            exists with a mouse: invisible on a phone anyway, the pair were
            still thirty extra composited layers — half of them blends — riding
            along with every scroll frame. */}
        {hasPointer && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[3px] opacity-[var(--spot,0)] transition-opacity duration-500"
            style={{
              borderRadius: CARD_RADIUS,
              background:
                "radial-gradient(260px circle at var(--lx, 50%) var(--ly, 50%), oklch(0.72 0.14 340 / 0.95), oklch(0.72 0.14 20 / 0.5) 45%, transparent 70%)",
            }}
          />
        )}
        <div
          ref={tiltRef}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="relative shadow-[0_18px_40px_-22px_rgba(42,26,46,0.55)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-entrance)] hover:shadow-[0_34px_60px_-24px_rgba(42,26,46,0.6)]"
          // The 3D context is for the mouse tilt; without one it only costs a layer.
          style={{ borderRadius: CARD_RADIUS, transformStyle: hasPointer ? "preserve-3d" : undefined }}
        >
          <MemberCard member={entry} />
          {/* Glare: a highlight that slides across the card under the cursor. */}
          {hasPointer && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[var(--hover,0)] mix-blend-soft-light transition-opacity duration-300"
              style={{
                borderRadius: CARD_RADIUS,
                background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 0%), rgba(255,255,255,0.75), transparent 55%)",
              }}
            />
          )}
          <span
            className="pointer-events-none absolute left-[7.3%] top-[5%] rounded-full bg-ink/75 px-[0.7em] py-[0.25em] font-mono uppercase tracking-[0.18em] text-washi lg:bg-ink/70 lg:backdrop-blur-sm"
            style={{ fontSize: "clamp(9px, 0.7vw, 11px)" }}
          >
            {entry.group}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The committee as a plain grid, with the life in the details:
 *
 * - cards are dealt in row by row as they scroll into view, settling from a
 *   slight tilt;
 * - team filters re-flow the grid with every card gliding to its new place
 *   (GSAP Flip) while leavers shrink out and newcomers rise in;
 * - a soft light follows the cursor over the grid, lighting the edges of the
 *   cards nearest to it, and the card under the cursor tilts with a glare
 *   and a little parallax inside its scene.
 */
export default function TeamGrid({ core, teams }: { core: Member[]; teams: Member[] }) {
  const entries = useMemo<Entry[]>(
    () => [
      ...core.map((m) => ({ ...m, group: "Core" })),
      ...teams.map((m) => ({ ...m, group: m.role.split(" — ")[0] })),
    ],
    [core, teams],
  );
  const groups = useMemo(() => ["All", ...new Set(entries.map((e) => e.group))], [entries]);

  const [filter, setFilter] = useState("All");
  const gridRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const reduced = useReducedMotion();
  const hasPointer = useHasPointer();

  const cells = () => Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-cell]") ?? []);

  function choose(group: string) {
    if (group === filter) return;
    if (!reduced) flipState.current = Flip.getState(cells());
    setFilter(group);
  }

  // Filter re-flow.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    Flip.from(state, {
      duration: 0.75,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.02,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, scale: 0.86, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, delay: 0.2, ease: "power3.out" }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.86, duration: 0.4, ease: "power2.in" }),
    });
  }, [filter]);

  // Entrance: dealt in as they arrive.
  useLayoutEffect(() => {
    if (reduced) return;
    const items = Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-deal]") ?? []);
    gsap.set(items, { opacity: 0, y: 70, rotate: (i) => (i % 2 ? 2.5 : -2.5), scale: 0.95 });

    const io = new IntersectionObserver(
      (records) => {
        const arrived = records.filter((r) => r.isIntersecting).map((r) => r.target);
        if (!arrived.length) return;
        arrived.forEach((el) => io.unobserve(el));
        gsap.to(arrived, { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 1, ease: "power3.out", stagger: 0.09 });
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  // Cursor light.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !hasPointer || reduced) return;

    let frame = 0;
    let last: PointerEvent | null = null;

    const paint = () => {
      frame = 0;
      if (!last) return;
      const g = grid.getBoundingClientRect();
      glowRef.current?.style.setProperty("translate", `${last.clientX - g.left}px ${last.clientY - g.top}px`);
      for (const cell of cells()) {
        const r = cell.getBoundingClientRect();
        if (!r.width) continue;
        cell.style.setProperty("--lx", `${last.clientX - r.left}px`);
        cell.style.setProperty("--ly", `${last.clientY - r.top}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onEnter = () => grid.style.setProperty("--spot", "1");
    const onLeave = () => grid.style.setProperty("--spot", "0");

    grid.addEventListener("pointermove", onMove);
    grid.addEventListener("pointerenter", onEnter);
    grid.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      grid.removeEventListener("pointermove", onMove);
      grid.removeEventListener("pointerenter", onEnter);
      grid.removeEventListener("pointerleave", onLeave);
    };
  }, [hasPointer, reduced]);

  const count = (g: string) => (g === "All" ? entries.length : entries.filter((e) => e.group === g).length);

  return (
    <>
      <div data-reveal className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2 px-6 sm:gap-3" style={{ ["--reveal-delay" as string]: "320ms" }}>
        {groups.map((g) => {
          const active = g === filter;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={active}
              onClick={() => choose(g)}
              className={`group relative flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] transition-[background-color,color,border-color,translate,box-shadow] duration-300 ease-[var(--ease-entrance)] hover:-translate-y-0.5 active:translate-y-0 ${
                active
                  ? "border-ink bg-ink text-washi shadow-[0_8px_20px_-10px_rgba(42,26,46,0.7)]"
                  : "border-ink/20 bg-washi/60 text-ink/70 hover:border-ink/50 hover:text-ink"
              }`}
            >
              {g}
              <span
                className={`rounded-full px-1.5 text-[0.62rem] tabular-nums transition-colors duration-300 ${
                  active ? "bg-washi/20 text-washi" : "bg-ink/10 text-ink/60 group-hover:bg-ink/15"
                }`}
              >
                {count(g)}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={gridRef} className="relative mx-auto mt-12 max-w-[1400px] px-6 pb-32 sm:mt-16 sm:px-10">
        {/* Ambient light following the cursor, under the cards. */}
        {hasPointer && (
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] -ml-[260px] -mt-[260px] rounded-full opacity-[calc(var(--spot,0)*0.55)] blur-3xl transition-[opacity,translate] duration-700 ease-out"
            style={{ background: "radial-gradient(circle, oklch(0.72 0.14 340 / 0.55), oklch(0.72 0.14 20 / 0.25) 50%, transparent 70%)" }}
          />
        )}
        <div className="relative grid grid-cols-1 gap-8 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-10">
          {entries.map((entry) => (
            <Cell key={entry.name} entry={entry} hidden={filter !== "All" && entry.group !== filter} hasPointer={hasPointer} />
          ))}
        </div>
      </div>
    </>
  );
}
