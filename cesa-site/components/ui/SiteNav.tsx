import Link from "next/link";

import MobileNav from "@/components/mobile/MobileNav";

/** px in the 1920-wide Figma frame -> vw, the unit every box on the site uses. */
const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

/**
 * Figma "Nav-bar button" group (file GCeABSi7E0WdNDYKKObWS9, node 21:8).
 *
 * Every pill is placed at its own x/y/size rather than flowed with a gap:
 * the design spaces them unevenly (9-26px apart) and sizes them per label —
 * About Us is two NAV-BUTTON copies butted together (212px), LOGIN is a taller
 * 152x73 pill with 32px type. A shared gap and width would flatten both.
 */
const NAV = [
  // Memories was added after the design: the first three pills moved 210px
  // left to make room, keeping the design's own gaps between each of them.
  { label: "Home", href: "/", x: 811, y: 11, w: 135, h: 64.945, size: 34 },
  { label: "About Us", href: "/#about", x: 968, y: 11, w: 212, h: 67, size: 34 },
  { label: "Events", href: "/#events", x: 1201, y: 11, w: 140, h: 67, size: 34 },
  { label: "Memories", href: "/memories", x: 1351, y: 10, w: 190, h: 67, size: 34 },
  { label: "Team", href: "/team", x: 1560, y: 9, w: 140, h: 67, size: 34 },
  // No auth exists yet — this is the design's slot for it.
  { label: "LOGIN", href: "#", x: 1726, y: 6.91, w: 152, h: 73.123, size: 32 },
];

/**
 * The torn-paper strip, CESA badge and pill nav along the top of a page.
 * Absolutely positioned: the parent must be `relative`.
 */
export default function SiteNav() {
  return (
    <>
      {/* Figma node 9:41 — the torn-edge art flipped so its ragged edge hangs
          down over whatever sits beneath, like a strip glued along the top. */}
      <div
        aria-hidden="true"
        className="art-torn pointer-events-none absolute left-0 top-0 z-10 hidden w-full lg:block"
        style={{ height: vw(95), minHeight: "48px", transform: "scaleY(-1)" }}
      />

      {/* Figma "Cesa-logo" (9:54), pinned at a negative top so it pokes above
          the strip. No radius/shadow — both would paint against the img's box,
          drawing a hard panel around a transparent cut-out. */}
      <Link
        href="/"
        aria-label="CESA home"
        className="absolute left-0 z-20 hidden lg:block"
        style={{ top: vw(-39), width: vw(210), minWidth: "88px" }}
      >
        <picture>
          <source srcSet="/scene/logo-badge.avif" type="image/avif" />
          <img src="/scene/logo-badge.webp" alt="CESA" className="w-full" />
        </picture>
      </Link>

      {/* Below laptop width the bar is the phone design's, with its own menu. */}
      <MobileNav />

      <nav className="absolute inset-x-0 top-0 z-20 hidden lg:block" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group absolute flex items-center justify-center text-washi transition-transform duration-200 ease-[var(--ease-entrance)] hover:-translate-y-[3px] active:translate-y-0"
            style={{ left: vw(item.x), top: vw(item.y), width: vw(item.w), height: vw(item.h) }}
          >
            {/* Paper lifts and warms on hover rather than changing colour — a
                flat tint would fight the texture. */}
            <span
              aria-hidden="true"
              className="art-pill absolute inset-0 transition-[transform,filter] duration-200 ease-[var(--ease-entrance)] group-hover:scale-[1.06] group-hover:brightness-110 group-hover:saturate-125 group-hover:drop-shadow-[0_4px_10px_rgba(20,14,18,0.45)]"
            />
            <span
              className="relative whitespace-nowrap font-itim tracking-[0.02em] transition-[letter-spacing,text-shadow] duration-200 group-hover:tracking-[0.06em] group-hover:[text-shadow:0_1px_6px_rgba(20,14,18,0.5)]"
              style={{ fontSize: `max(12px, ${vw(item.size)})` }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
