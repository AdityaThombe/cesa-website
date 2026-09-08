import ParallaxScene from "@/components/scene/ParallaxScene";
import PetalCanvas from "@/components/scene/PetalCanvas";

/**
 * Figma node 9:26 (file GCeABSi7E0WdNDYKKObWS9), "Nav-bar button" group.
 *
 * `w` is each pill's own width as a fraction of the 1920 frame, because they
 * are NOT uniform in the design: About Us is built from two 140px NAV-BUTTON
 * copies butted together (nodes 9:46 + 9:47, spanning 1358..1570 = 212px),
 * while the rest are single pills. Rendering all four at one width is the
 * single most visible way this nav reads as "not the design".
 */
const NAV = [
  { label: "Home", href: "#", w: "7.0313vw" },
  { label: "About Us", href: "#about", w: "11.0417vw" },
  { label: "Events", href: "#events", w: "7.2917vw" },
  { label: "Team", href: "#team", w: "7.2917vw" },
];

export default function Hero() {
  return (
    <ParallaxScene>
      <PetalCanvas />

      {/* A single flex column owning the full height: header, then the
          headline dropped into the space the courtyard's stone path leaves
          open on the left, matching the Figma frame's own text box. */}
      <div className="relative flex h-full flex-col">
        {/* Torn-paper strip behind the whole nav row (Figma node 9:41,
            "Nav-bar" group, newly split out from the header in the latest
            revision) — the same torn-edge asset the About section uses,
            flipped so its ragged edge hangs down over the top of the scene
            like a strip of paper glued along the frame's top edge. */}
        <img
          src="/scene/torn-edge.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 w-full"
          style={{ height: "4.9479vw", minHeight: "48px", transform: "scaleY(-1)" }}
        />

        {/* The CESA wordmark badge (Figma "Cesa-logo", node 9:54) — its own
            white card, placed flush in the top-left corner so its white
            background sits on the cream torn-paper strip rather than the
            dark sky (which is what made the black wordmark unreadable when
            it was chroma-keyed to transparent and floated over the purple
            gradient). Figma pins it at a NEGATIVE top (-39px of the 1920
            frame), poking up above the strip's own top edge — reproduced
            here with the same fraction. */}
        <a
          href="/"
          aria-label="CESA home"
          className="absolute left-0 top-[-2.03vw] z-10 block"
          style={{ width: "10.9375vw", minWidth: "88px" }}
        >
          <picture>
            <source srcSet="/scene/logo-badge.avif" type="image/avif" />
            <img
              src="/scene/logo-badge.webp"
              alt="CESA"
              // No border-radius or box-shadow: both paint against the img's
              // rectangular BOX, and this is a transparent cut-out, so they
              // draw a hard-edged panel around a logo that has no panel in
              // the design. Figma gives this node no effects at all.
              className="w-full"
            />
          </picture>
        </a>

        {/* Figma pins the pills at top 7-9px of the 1920 frame — right up
            against the strip's top edge. Tailwind's pt-9 is a fixed 36px no
            matter the viewport, which sat the whole row ~27px too low and
            dropped it out of the paper strip onto the sky. */}
        <header
          className="relative flex shrink-0 items-center justify-end"
          style={{ paddingRight: "2.0833vw", paddingTop: "0.4688vw" }}
        >
          {/* Each item sits on its own torn-paper pill (Figma's "NAV-BUTTON"
              asset), sized as a fraction of the 1920 frame like every other
              box on this page: per-item width from NAV above, 67px tall ->
              3.4896vw, 34px text -> 1.7708vw. These use max() rather than
              clamp(): an upper bound in the clamp stopped the type growing at
              exactly the width the design was drawn for, so at 1920 the nav
              read 22px against Figma's 34px. */}
          <nav className="hidden items-center lg:flex" style={{ gap: "0.5vw" }}>
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative inline-flex items-center justify-center text-washi transition-transform duration-200 ease-[var(--ease-entrance)] hover:-translate-y-[3px] active:translate-y-0"
                style={{
                  width: item.w,
                  minWidth: "84px",
                  height: "3.4896vw",
                  minHeight: "34px",
                }}
              >
                <picture>
                  <source srcSet="/scene/nav-pill.avif" type="image/avif" />
                  {/* The pill is paper, so it lifts and warms on hover
                      rather than changing colour outright — a flat tint would
                      fight the texture. Slight scale + saturation reads as
                      the sticker peeling up toward you. */}
                  <img
                    src="/scene/nav-pill.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full origin-center object-fill transition-[transform,filter] duration-200 ease-[var(--ease-entrance)] group-hover:scale-[1.06] group-hover:brightness-110 group-hover:saturate-125 group-hover:drop-shadow-[0_4px_10px_rgba(20,14,18,0.45)]"
                  />
                </picture>
                <span
                  className="relative whitespace-nowrap tracking-[0.02em] transition-[letter-spacing,text-shadow] duration-200 group-hover:tracking-[0.06em] group-hover:[text-shadow:0_1px_6px_rgba(20,14,18,0.5)]"
                  style={{ fontSize: "max(13px, 1.7708vw)" }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
        </header>

        {/* Headline — Figma node 9:40, box (162, 489) 838x436 in the
            1920x1072 frame. Positioned absolutely at those exact fractions
            rather than flex-centred: the design sits the block at 45.6% down
            the frame, ~9% BELOW the vertical centre, so centring it put the
            copy noticeably higher than the design against the same painted
            courtyard. Type is 64px -> 3.3333vw with a floor, no ceiling. */}
        <h1
          className="absolute font-body font-normal leading-[1.15]"
          style={{
            color: "#efffba",
            left: "8.4375vw",
            top: "45.6%",
            width: "43.6458vw",
            minWidth: "17rem",
            fontSize: "max(1.25rem, 3.3333vw)",
          }}
        >
          A vibrant community for Computer Engineering students to
          innovate, learn, and grow.
        </h1>
      </div>
    </ParallaxScene>
  );
}
