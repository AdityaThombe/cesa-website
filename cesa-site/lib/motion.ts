import { useEffect, useState } from "react";

/** Frame-rate-independent enough for our purposes at 60fps. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * How fast a followed value catches up to its target, per frame.
 * Deliberately low: assigning the target directly makes layers feel glued to
 * the cursor, while easing toward it reads as air.
 */
export const FOLLOW = 0.08;

/** Maximum layer travel from mouse, in px, at a depth coefficient of 1. */
export const MOUSE_TRAVEL = 18;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * True once the viewport is wide enough for a real pointer. Mouse parallax is
 * disabled below this: touch devices have no cursor, and pointer events fired
 * during a scroll gesture make layers lurch.
 */
export function useHasPointer(): boolean {
  const [has, setHas] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    setHas(query.matches);

    const onChange = (e: MediaQueryListEvent) => setHas(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return has;
}
