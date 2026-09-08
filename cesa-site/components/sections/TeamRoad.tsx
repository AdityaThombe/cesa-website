"use client";

import { useEffect, useRef } from "react";

import type { Member } from "@/lib/content";
import { clamp, useReducedMotion } from "@/lib/motion";
import TeamCard from "@/components/ui/TeamCard";

/** Px of travel each column gets, from one end of the section to the other.
 *  Columns move in opposite directions — the "cards streaming past on both
 *  shoulders" read, translated from a driving scene to a vertical page:
 *  scrolling reads as passing between two rows of people rather than one
 *  flat list scrolling by at a single, uniform speed. */
const DRIFT = 130;

export default function TeamRoad({ members }: { members: Member[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const colARef = useRef<HTMLDivElement>(null);
  const colBRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const colA = members.filter((_, i) => i % 2 === 0);
  const colB = members.filter((_, i) => i % 2 === 1);

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let running = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running && !frame) frame = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );

    function tick() {
      if (!running) {
        frame = 0;
        return;
      }
      const el = wrapperRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        // 0 as the section enters from below, 1 as it leaves at the top —
        // shifted to -1..1 so both columns sit at rest (no drift) when the
        // section is centred in view, and reach full drift at the edges.
        const progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0.5;
        const shift = (progress - 0.5) * 2 * DRIFT;
        if (colARef.current) colARef.current.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
        if (colBRef.current) colBRef.current.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
      }
      frame = requestAnimationFrame(tick);
    }

    if (wrapperRef.current) observer.observe(wrapperRef.current);
    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);

  return (
    <div ref={wrapperRef} className="relative overflow-hidden py-20">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-6 sm:gap-10 sm:px-10">
        <div
          ref={colARef}
          className="flex flex-col items-end gap-8 will-change-transform sm:gap-10"
          style={{ paddingTop: DRIFT }}
        >
          {colA.map((m) => (
            <TeamCard key={m.name} member={m} />
          ))}
        </div>
        <div
          ref={colBRef}
          className="flex flex-col items-start gap-8 will-change-transform sm:gap-10"
          style={{ paddingTop: DRIFT * 2, paddingBottom: DRIFT }}
        >
          {colB.map((m) => (
            <TeamCard key={m.name} member={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
