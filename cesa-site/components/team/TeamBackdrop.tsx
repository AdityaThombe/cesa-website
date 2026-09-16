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
    /*
     * The walk is meant to sit soft and out of focus behind the paper. That
     * softness used to come from a CSS blur() on a full-screen, 2x-resolution
     * canvas — which the browser has to re-filter on every frame the canvas
     * changes, i.e. every frame of scrolling. On phones that was the lag.
     *
     * Now the canvas is simply drawn at half the CSS resolution and scaled up
     * by the browser: the same softness falls out of the upscale, there is no
     * filter to recompute, and each redraw fills a quarter of the pixels (or a
     * sixteenth, against the old 2x buffer).
     */
    const RENDER_SCALE = 0.5;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * RENDER_SCALE));
      canvas.height = Math.max(1, Math.round(height * RENDER_SCALE));
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.imageSmoothingQuality = "high";
      // The old CSS saturate(0.88), applied once per draw into this small
      // buffer instead of to the whole screen on every frame.
      ctx.filter = "saturate(0.88)";
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
      {/* Soft and a touch desaturated, so it never competes with a card —
          both baked into the half-resolution drawing above, not CSS filters. */}
      <canvas ref={canvasRef} className="h-full w-full" />
      {/* Paper veil. Opaque at both ends so the header and the page edges stay
          on washi, thinnest through the middle where the walk shows. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-washi) 0%, rgba(237,226,207,0.93) 12%, rgba(237,226,207,0.74) 40%, rgba(237,226,207,0.74) 62%, rgba(237,226,207,0.94) 88%, var(--color-washi) 100%)",
        }}
      />
      {/* Paper grain. Multiplied on desktop; on phones a plain translucent
          layer, because a full-screen blend over a canvas that redraws while
          scrolling makes the phone re-blend the whole screen every frame. */}
      <div
        className="absolute inset-0 opacity-35 lg:opacity-50 lg:mix-blend-multiply"
        style={{ backgroundImage: "url('/scene/washi-paper.avif')", backgroundSize: "1280px auto" }}
      />
    </div>
  );
}
