"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { useReducedMotion } from "@/lib/motion";

/**
 * Lenis smooth scroll.
 *
 * Skipped entirely under prefers-reduced-motion — smoothing is momentum, and
 * momentum is exactly what that setting asks us not to add.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
