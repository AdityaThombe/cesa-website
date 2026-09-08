"use client";

import { useRef } from "react";

import type { Member } from "@/lib/content";
import { useHasPointer, useReducedMotion } from "@/lib/motion";

/** Rotated through by a hash of the name — no photo yet, so the arch gets a
 *  gradient instead of going blank. Swap for a real portrait per member once
 *  photos exist; the arch and initials are strictly a placeholder. */
const PALETTES: [string, string][] = [
  ["#ea7ba9", "#f4796f"],
  ["#f4796f", "#ffbe8f"],
  ["#a86a86", "#ea7ba9"],
  ["#6b4a7a", "#a86a86"],
];

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function TeamCard({ member }: { member: Member }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasPointer = useHasPointer();
  const reduced = useReducedMotion();
  const [c1, c2] = PALETTES[hash(member.name) % PALETTES.length];

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!hasPointer || reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform =
      `perspective(800px) rotateX(${(-y * 9).toFixed(2)}deg) ` +
      `rotateY(${(x * 9).toFixed(2)}deg) translateY(-6px)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="w-full max-w-[15.5rem] shrink-0 rounded-sm p-5 shadow-[0_10px_30px_-12px_rgba(42,26,46,0.35)] transition-transform duration-300 ease-out"
      style={{
        backgroundImage: "url('/scene/washi-paper.webp')",
        backgroundSize: "260px",
        backgroundColor: "var(--color-washi)",
      }}
    >
      <div
        className="arch mx-auto flex h-36 w-36 items-center justify-center"
        style={{ background: `linear-gradient(155deg, ${c1}, ${c2})` }}
      >
        <span className="font-display text-3xl text-washi">{initials(member.name)}</span>
      </div>
      <p className="mt-4 text-center font-display text-lg leading-tight text-ink">
        {member.name}
      </p>
      <p className="mt-1.5 flex items-center justify-center gap-2 text-center font-mono text-[0.625rem] tracking-[0.16em] text-muted">
        <span className="h-1 w-1 rounded-full bg-torii" />
        {member.role.toUpperCase()}
      </p>
    </div>
  );
}
