"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/lib/motion";

const SPRITE_COUNT = 8;
const DESKTOP_PETALS = 40;
const MOBILE_PETALS = 12;

/** Cursor push: petals inside this radius drift away from the pointer. */
const REPEL_RADIUS = 120;

/** Pointer travel, in px, that shakes one petal loose. */
const PX_PER_PETAL = 24;

/** Frames a new petal takes to fade in, so it never pops into existence. */
const FADE_IN = 18;

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  swayPhase: number;
  swaySpeed: number;
  sprite: number;
  alpha: number;
  active: boolean;
  age: number;
};

export default function PetalCanvas({ sizeScale = 1, count: countProp }: { sizeScale?: number; count?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    const sprites: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= SPRITE_COUNT; i++) {
      const img = new Image();
      img.src = `/petals/petal-${i}.webp`;
      img.onload = () => {
        loaded++;
      };
      sprites.push(img);
    }

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = el.clientWidth;
      height = el.clientHeight;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = countProp ?? (window.innerWidth < 768 ? MOBILE_PETALS : DESKTOP_PETALS);

    // Fixed pool, nothing allocated per frame. Petals only exist while the
    // pointer is moving: every PX_PER_PETAL of travel wakes one sleeping
    // petal just above the cursor, and a petal that falls off-screen goes
    // back to sleep instead of respawning. A still cursor means an empty sky.
    const release = (petal: Petal, x: number, y: number) => {
      petal.x = x + (Math.random() - 0.5) * 140;
      petal.y = y - 20 - Math.random() * 140;
      petal.vx = -0.25 - Math.random() * 0.5;
      petal.vy = 0.5 + Math.random() * 0.9;
      petal.size = (14 + Math.random() * 20) * sizeScale;
      petal.rotation = Math.random() * Math.PI * 2;
      petal.spin = (Math.random() - 0.5) * 0.02;
      petal.swayPhase = Math.random() * Math.PI * 2;
      petal.swaySpeed = 0.008 + Math.random() * 0.012;
      petal.sprite = Math.floor(Math.random() * SPRITE_COUNT);
      petal.alpha = 0.55 + Math.random() * 0.45;
      petal.age = 0;
      petal.active = true;
    };

    const petals: Petal[] = Array.from({ length: count }, () => ({ active: false }) as Petal);

    const pointer = { x: -9999, y: -9999 };
    let lastPointer: { x: number; y: number } | null = null;
    let travel = 0;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (lastPointer) travel += Math.hypot(pointer.x - lastPointer.x, pointer.y - lastPointer.y);
      lastPointer = { x: pointer.x, y: pointer.y };

      while (travel >= PX_PER_PETAL) {
        travel -= PX_PER_PETAL;
        const sleeping = petals.find((p) => !p.active);
        if (!sleeping) {
          travel = 0; // pool is full — don't bank a burst for later
          break;
        }
        release(sleeping, pointer.x, pointer.y);
      }
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      lastPointer = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    let frame = 0;
    let running = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running && !frame) frame = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    observer.observe(el);

    function tick() {
      if (!running) {
        frame = 0;
        return;
      }
      ctx!.clearRect(0, 0, width, height);

      for (const petal of petals) {
        if (!petal.active) continue;
        petal.age++;
        petal.swayPhase += petal.swaySpeed;
        petal.x += petal.vx + Math.sin(petal.swayPhase) * 0.6;
        petal.y += petal.vy;
        petal.rotation += petal.spin;

        // Push away from the cursor, with falloff. This is the bit people
        // actually play with, so it is worth the per-frame distance check.
        const dx = petal.x - pointer.x;
        const dy = petal.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < REPEL_RADIUS * REPEL_RADIUS) {
          const dist = Math.sqrt(distSq) || 1;
          const push = (1 - dist / REPEL_RADIUS) * 2.2;
          petal.x += (dx / dist) * push;
          petal.y += (dy / dist) * push;
        }

        if (petal.y > height + 60 || petal.x < -80) {
          petal.active = false;
          continue;
        }

        const sprite = sprites[petal.sprite];
        if (!sprite?.complete || !sprite.naturalWidth) continue;

        const w = petal.size;
        const h = (sprite.naturalHeight / sprite.naturalWidth) * w;

        ctx!.save();
        ctx!.globalAlpha = petal.alpha * Math.min(1, petal.age / FADE_IN);
        ctx!.translate(petal.x, petal.y);
        ctx!.rotate(petal.rotation);
        // Flip on a slow cycle so petals tumble rather than spin flat. The
        // squash is floored at 0.3: a true edge-on petal collapses to a
        // one-pixel sliver, which reads as a scratch on the glass rather than
        // a falling petal.
        const flip = Math.cos(petal.swayPhase * 0.5);
        ctx!.scale(Math.sign(flip) * (0.3 + 0.7 * Math.abs(flip)), 1);
        ctx!.drawImage(sprite, -w / 2, -h / 2, w, h);
        ctx!.restore();
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, [reduced, sizeScale, countProp]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
