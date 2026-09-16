"use client";

import { useEffect, useRef } from "react";

import { clamp, lerp, useReducedMotion } from "@/lib/motion";

/** public/scene/team-bg/frame-001..030 — a dolly forward down the avenue. */
const FRAMES = 30;
const frameSrc = (i: number) => `/scene/team-bg/frame-${String(i + 1).padStart(3, "0")}.webp`;

/**
 * The walk, kept as a backdrop.
 *
 * The old /team page put the committee inside a three.js courtyard; the grid
 * replaced it, but the sense of moving through a space was worth keeping. So
 * the rendered dolly frames scrub with the page: scrolling the grid walks the
 * camera down the avenue behind it, trees passing on both shoulders, while a
 * paper veil holds the cards readable over the top.
 *
 * Frames are drawn to a canvas rather than swapped as <img> src, so a frame
 * that hasn't decoded yet leaves the previous one up instead of flashing.
 * The scrubbed position is eased, never assigned, and the two frames either
 * side of it are cross-faded — thirty stills stepping one to the next reads as
 * a filmstrip, while blending across the gap reads as one continuous walk.
 */
export default function TeamBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const images: HTMLImageElement[] = [];
    let ready = 0;

    // Frame 1 now: it is the one on screen at the top of the page. The other
    // 29 (about 1.7MB) only matter once the reader starts to scroll, which is
    // what moves the walk — so they wait for the first scroll, wheel, touch or
    // key press, then come in order while the browser is idle. Someone who
    // reads the top of the page and leaves never downloads them.
    const loadFrame = (i: number, onDone?: () => void) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        // `ready` is a count of consecutive frames from the start, so a later
        // frame that happens to arrive early can never be scrubbed to past a
        // gap.
        while (ready < FRAMES && images[ready]?.complete && images[ready].naturalWidth) ready++;
        if (i === 0) draw(0);
        onDone?.();
      };
      img.onerror = () => onDone?.();
      img.src = frameSrc(i);
      images[i] = img;
    };

    let cancelled = false;
    const idle = (fn: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 200);
    };
    const loadRest = (i: number) => {
      if (cancelled || i >= FRAMES) return;
      loadFrame(i, () => idle(() => loadRest(i + 1)));
    };
    const INTENT = ["scroll", "wheel", "touchstart", "keydown"] as const;
    let started = false;
    const startRest = () => {
      if (started) return;
      started = true;
      INTENT.forEach((type) => window.removeEventListener(type, startRest));
      idle(() => loadRest(1));
    };

    loadFrame(0);
    // Under reduced motion the walk never moves, so only frame 1 is needed.
    if (!reduced) {
      INTENT.forEach((type) => window.addEventListener(type, startRest, { passive: true }));
      // Arriving already scrolled (a reload mid-page) counts as intent too.
      if (window.scrollY > 0) startRest();
    }

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let drawn = -1;
    /** Cover-fit, biased 6% down: the path matters more than the sky. */
    function paint(img: HTMLImageElement, alpha: number) {
      if (!img?.complete || !img.naturalWidth) return;
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx!.globalAlpha = alpha;
      ctx!.drawImage(img, (width - w) / 2, (height - h) * 0.56, w, h);
      ctx!.globalAlpha = 1;
    }

    /** `position` is fractional: the walk between two rendered frames. */
    function draw(position: number) {
      if (!width) return;
      const limit = Math.max(ready - 1, 0);
      const pos = Math.min(Math.max(position, 0), limit);
      const lo = Math.floor(pos);
      const mix = pos - lo;
      const first = images[lo];
      if (!first?.complete) return;
      ctx!.clearRect(0, 0, width, height);
      paint(first, 1);
      if (mix > 0.01 && images[lo + 1]?.complete) paint(images[lo + 1], mix);
      drawn = pos;
    }

    resize();
    // ResizeObserver, not a window listener: the canvas also changes size when
    // the pane around it does, with no window resize event to hear.
    const ro = new ResizeObserver(() => {
      resize();
      draw(Math.max(drawn, 0));
    });
    ro.observe(canvas);

    if (reduced) {
      const first = images[0];
      if (first.complete) draw(0);
      else first.addEventListener("load", () => draw(0), { once: true });
      return () => {
        cancelled = true;
        ro.disconnect();
        INTENT.forEach((type) => window.removeEventListener(type, startRest));
      };
    }

    let eased = 0;
    let frame = 0;
    const tick = () => {
      const doc = document.documentElement;
      const travel = doc.scrollHeight - window.innerHeight;
      const progress = travel > 0 ? clamp(window.scrollY / travel, 0, 1) : 0;
      // Eased, so the walk carries a little momentum past where you stop.
      eased = lerp(eased, progress * (FRAMES - 1), 0.07);

      // A twentieth of a frame is under a pixel of movement on screen; below
      // that there is nothing to redraw.
      if (ready > 0 && Math.abs(eased - drawn) > 0.05) draw(eased);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      INTENT.forEach((type) => window.removeEventListener(type, startRest));
    };
  }, [reduced]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        // Pushed back behind the paper: slightly soft and a touch desaturated,
        // so it never competes with a card for attention.
        style={{ filter: "blur(2px) saturate(0.88)", transform: "scale(1.04)" }}
      />
      {/* Paper veil. Opaque at both ends so the header and the page edges stay
          on washi, thinnest through the middle where the walk shows. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-washi) 0%, rgba(237,226,207,0.93) 12%, rgba(237,226,207,0.74) 40%, rgba(237,226,207,0.74) 62%, rgba(237,226,207,0.94) 88%, var(--color-washi) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: "url('/scene/washi-paper.avif')", backgroundSize: "1280px auto", mixBlendMode: "multiply" }}
      />
    </div>
  );
}
