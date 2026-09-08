"use client";

import { useEffect, useRef } from "react";

import { FOLLOW, MOUSE_TRAVEL, clamp, lerp, useHasPointer, useReducedMotion } from "@/lib/motion";
import { LAYERS, STAGE } from "./sceneConfig";

/** Keep this much of a layer's base below the fold even at full travel.
 *  Generous on purpose: the trunk's cut-off end must never come near the
 *  bottom edge, where it would read as the tree stopping mid-air rather than
 *  running on into the torn-paper seam. */
const BOTTOM_MARGIN = 140;

const pct = (value: number, of: number) => `${((value / of) * 100).toFixed(4)}%`;

/**
 * The hero scene.
 *
 * Layers sit on a fixed-aspect STAGE that is scaled to cover the viewport, so
 * the composition holds together at any window size — the alignment was done
 * once, in Figma, against a 1920x1072 frame, and everything here is expressed
 * as a fraction of that frame.
 *
 * One rAF loop drives every layer by writing transforms directly to the DOM.
 * Nothing goes through React state — a re-render per frame across the stack
 * would drop frames on exactly the mid-range laptops most students use.
 */
export default function ParallaxScene({ children }: { children?: React.ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();
  const hasPointer = useHasPointer();

  useEffect(() => {
    if (reduced) return;

    // pointer target and its eased follower, both in -1..1
    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let progress = 0; // 0..1 across the sticky hero
    let frame = 0;
    let running = true;

    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    if (hasPointer) window.addEventListener("pointermove", onMove, { passive: true });

    // Pause entirely when the hero leaves the viewport. Transform maths for a
    // scene nobody is looking at is pure battery drain.
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

      eased.x = lerp(eased.x, target.x, FOLLOW);
      eased.y = lerp(eased.y, target.y, FOLLOW);

      const el = wrapper.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const raw = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
        // Smoothstep, not the raw ratio. Raw progress runs at constant speed
        // right up to 1 — and 1 lands on the exact scroll position where the
        // sticky container releases and the whole hero starts scrolling away
        // at 1:1. Two velocity changes on the same frame is what made the
        // trunk visibly lurch. Smoothstep's derivative is zero at both ends,
        // so the layers have already coasted to a stop by the time the
        // release happens and only one thing changes at a time.
        progress = raw * raw * (3 - 2 * raw);
      }

      const vh = window.innerHeight / 100;

      // Untransformed stage geometry, read once per frame. Layer transforms do
      // not affect it, so it is a stable reference for the clamp below.
      const stageRect = stage.current?.getBoundingClientRect();
      const stageScale = stageRect ? stageRect.height / STAGE.height : 1;

      LAYERS.forEach((layer, i) => {
        const node = layers.current[i];
        if (!node) return;

        let x = eased.x * -MOUSE_TRAVEL * layer.mouse;
        // Negative: layers rise as you scroll. The nearer a layer is, the
        // faster it lifts out of frame, so the camera reads as tilting up
        // through the tree rather than sinking into the courtyard.
        let y = eased.y * -MOUSE_TRAVEL * layer.mouse - progress * layer.scroll * vh;
        let rotate = 0;

        // Canopy clusters get a staggered breeze on top of the depth parallax:
        // each lags the one before it, so the movement reads as wind travelling
        // through the branches rather than a rigid sheet following the cursor.
        if (layer.sway !== undefined) {
          const lag = 1 - layer.sway * 0.18;
          x += eased.x * 10 * lag;
          y += eased.y * 6 * lag;
          rotate = eased.x * 1.5 * lag;
        }

        // A layer drawn with its base (the trunk and its roots) must never
        // lift that base into frame, or the tree floats. Computed from live
        // geometry, so it holds at any window size.
        //
        // Eased into, not clamped. `Math.max` stopped the trunk dead on a
        // single frame partway through the scroll — the layer was travelling
        // at full speed and then simply wasn't, which reads as the tree
        // jerking to a halt. tanh is the identity for small travel and bends
        // off asymptotically as it nears the limit, so the trunk decelerates
        // into its stop and never crosses it.
        if (layer.keepBottomBelowFold && stageRect) {
          // Derived from the stage's SIZE, never its live `top`. The stage is
          // centred in the sticky 100vh box, so while the hero is pinned its
          // top is exactly (innerHeight - stageHeight) / 2 — the same number
          // the rect reports, but one that does not move.
          //
          // Reading `stageRect.top` instead made this limit shrink frame by
          // frame the moment the sticky container released and began
          // scrolling away, which walked the trunk back DOWN the screen while
          // the page scrolled it up. The trunk visibly fought the scroll and
          // stuttered at exactly that handoff.
          const restingTop = (window.innerHeight - stageRect.height) / 2;
          const restingBottom =
            restingTop + (layer.box.top + layer.box.height) * stageScale;
          const limit = Math.max(restingBottom - window.innerHeight - BOTTOM_MARGIN, 0);
          y = limit > 0 ? -limit * Math.tanh(-y / limit) : Math.max(y, 0);
        }

        const scale = layer.scale ? lerp(layer.scale[0], layer.scale[1], progress) : 1;

        node.style.transform =
          `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)` +
          (rotate ? ` rotate(${rotate.toFixed(3)}deg)` : "") +
          (scale !== 1 ? ` scale(${scale.toFixed(4)})` : "");
      });

      frame = requestAnimationFrame(tick);
    }

    if (wrapper.current) observer.observe(wrapper.current);
    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced, hasPointer]);

  return (
    // 112vh, down from 240vh. The painted plate only has so much art to give:
    // at 240vh the hero held the screen for 140vh of scrolling on a still that
    // has already finished moving, so the courtyard sat there looking spent
    // and the torn-paper seam arrived far too late. 12vh of travel is about
    // the floor: the parallax still reads, but the seam is barely a flick of
    // the wheel away. Below 100vh there is no travel at all and the layers
    // would stop moving entirely.
    <div ref={wrapper} className="relative h-[112vh]">
      {/* The ramp behind the painted plate. It matches the art closely enough
          that a slow connection sees a dusk gradient rather than a flash of
          flat colour, and it is what renders if the image never arrives. */}
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{
          background:
            "linear-gradient(178deg, var(--color-sky-zenith) 0%, " +
            "var(--color-sky-upper) 32%, var(--color-sky-mid) 58%, " +
            "var(--color-sky-low) 80%, var(--color-sky-horizon) 100%)",
        }}
      >
        <div ref={stage} className="stage">
          {LAYERS.map((layer, i) => (
            <div
              key={layer.id}
              ref={(node) => {
                layers.current[i] = node;
              }}
              className="layer flex items-center justify-center"
              style={{
                left: pct(layer.box.left, STAGE.width),
                top: pct(layer.box.top, STAGE.height),
                width: pct(layer.box.width, STAGE.width),
                height: pct(layer.box.height, STAGE.height),
                transformOrigin: layer.sway !== undefined ? "50% 100%" : undefined,
              }}
            >
              {/* The static flip/rotation lives on an inner element so the rAF
                  loop can own the outer element's transform outright. */}
              <picture
                style={{
                  width: layer.inner?.width ?? "100%",
                  height: layer.inner?.height ?? "100%",
                  transform: layer.transform,
                }}
              >
                <source srcSet={`${layer.src}.avif`} type="image/avif" />
                <img
                  src={`${layer.src}.webp`}
                  alt=""
                  aria-hidden="true"
                  // Every layer is above the fold, so none may lazy-load —
                  // deferring them leaves the hero as a bare gradient.
                  loading="eager"
                  fetchPriority={layer.id === "background" ? "high" : "auto"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </picture>
            </div>
          ))}
        </div>

        {/* Film grain, generated rather than shipped: feTurbulence tiles
            perfectly at any viewport size and costs nothing to download. */}
        <svg className="grain" aria-hidden="true">
          <filter id="hero-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>

        {/* Scrim. Three soft gradients rather than one flat wash, so the sunset
            still shows through and nothing reads as a panel. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(100deg, rgba(45,24,48,.72) 0%, rgba(45,24,48,.45) 34%, rgba(45,24,48,0) 62%)",
              "linear-gradient(to bottom, rgba(45,24,48,.68) 0%, rgba(45,24,48,.3) 11%, rgba(45,24,48,0) 22%)",
              "linear-gradient(to top, rgba(45,24,48,.55) 0%, rgba(45,24,48,0) 16%)",
            ].join(","),
          }}
        />

        {/* Copy sits above the scene, the grain and the scrim. */}
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}
