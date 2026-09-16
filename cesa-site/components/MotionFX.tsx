"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { FOLLOW, lerp, useHasPointer, useReducedMotion } from "@/lib/motion";

/**
 * Site-wide ambient motion, declared in markup instead of wired per section:
 *
 * - `data-reveal` fades an element up the first time it scrolls into view.
 *   `--reveal-delay` staggers siblings.
 * - `data-depth="n"` drifts an element against the scroll and away from the
 *   cursor, scaled by n (0.5 is subtle, 2 is pronounced). Positive depths
 *   feel nearer, negative ones further away.
 *
 * Both write CSS variables consumed by the `translate` rule in globals.css,
 * so they compose with each element's own idle keyframes.
 */

/** Px of scroll drift per viewport-height of distance from centre, at depth 1. */
const SCROLL_DRIFT = 26;
/** Px of cursor drift at the screen edge, at depth 1. */
const POINTER_DRIFT = 10;

export default function MotionFX() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const hasPointer = useHasPointer();

  // Reveals.
  useEffect(() => {
    const root = document.documentElement;
    if (reduced) {
      root.classList.remove("fx");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    const track = (el: Element) => {
      if (el.classList.contains("is-in")) return;
      const r = el.getBoundingClientRect();
      // Already on screen when we arrive: show it as-is rather than hiding
      // something the reader is looking at.
      if (!root.classList.contains("fx") && r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("is-in");
        return;
      }
      io.observe(el);
    };

    document.querySelectorAll("[data-reveal]").forEach(track);
    root.classList.add("fx");

    // Client components can mount reveal targets later.
    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        rec.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches("[data-reveal]")) track(n);
          n.querySelectorAll("[data-reveal]").forEach(track);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname, reduced]);

  // Parallax.
  useEffect(() => {
    if (reduced) return;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (hasPointer) window.addEventListener("pointermove", onMove, { passive: true });

    const applied = new WeakMap<HTMLElement, { x: number; y: number }>();
    let frame = 0;

    const tick = () => {
      pointer.x = lerp(pointer.x, pointer.tx, FOLLOW);
      pointer.y = lerp(pointer.y, pointer.ty, FOLLOW);
      const vh = window.innerHeight;

      document.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
        const depth = Number(el.dataset.depth) || 0;
        const prev = applied.get(el) ?? { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        // Undo our own offset so the element doesn't chase itself.
        const top = r.top - prev.y;
        if (top > vh * 1.5 || top + r.height < -vh * 0.5) return;

        const fromCentre = (top + r.height / 2 - vh / 2) / vh;
        const x = -pointer.x * POINTER_DRIFT * depth;
        const y = -fromCentre * SCROLL_DRIFT * depth - pointer.y * POINTER_DRIFT * 0.6 * depth;
        if (Math.abs(x - prev.x) < 0.05 && Math.abs(y - prev.y) < 0.05) return;

        applied.set(el, { x, y });
        el.style.setProperty("--px", `${x.toFixed(2)}px`);
        el.style.setProperty("--py", `${y.toFixed(2)}px`);
      });

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [pathname, reduced, hasPointer]);

  return null;
}
