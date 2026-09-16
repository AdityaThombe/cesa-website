import HashScroll from "@/components/mobile/HashScroll";

/**
 * The phone home page — Figma "CESA", frame "iPhone 13 & 14 - 1" (node 79:2),
 * a 390 x 3362 artboard.
 *
 * Built the same way as the desktop sections: every box is the node's own
 * frame-relative px, converted to vw off the 390px frame, so the composition
 * keeps the design's proportions on any phone. It is one continuous artboard
 * rather than four stacked sections because the design overlaps them — the
 * torn edges, the bulb and the footer sky all cross section boundaries.
 *
 * Section anchors use `data-anchor`, not `id`: the desktop sections already
 * own #about and #events, and only one of the two layouts is ever visible.
 */

const m = (px: number) => `${(px / 3.9).toFixed(4)}vw`;

const box = (x: number, y: number, w: number, h: number) => ({
  left: m(x),
  top: m(y),
  width: m(w),
  height: m(h),
});

function Pic({
  src,
  alt = "",
  className = "",
  style,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** First-screen art loads immediately; everything below the fold waits. */
  eager?: boolean;
}) {
  return (
    <picture>
      <source srcSet={`${src}.avif`} type="image/avif" />
      <img
        src={`${src}.webp`}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        className={className}
        style={style}
      />
    </picture>
  );
}

/** A window onto the torn-paper art, cropped the way the Figma node crops it. */
function Torn({ x, y, w, h, crop, flip = false }: { x: number; y: number; w: number; h: number; crop: { h: string; top: string }; flip?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 overflow-hidden"
      style={{ ...box(x, y, w, h), transform: flip ? "scaleY(-1)" : undefined }}
    >
      <img src="/scene/torn-edge.webp" alt="" className="absolute max-w-none" style={{ left: "1.92%", top: crop.top, width: "100%", height: crop.h }} />
    </div>
  );
}

/** Events & Projects cards (82:104, 82:111, 82:118): photo under the torn tan frame. */
const CARDS = [
  {
    caption: "Plathora 2025",
    photo: "photo-crowd",
    alt: "Participants gathered on the steps at Plethora",
    frame: [31.69, 2045, 327, 218],
    window: [42.54, 2054.85, 304.67, 162.58],
    radius: 20,
    crop: { left: "0%", top: "-5.96%", width: "100%", height: "140.55%" },
    captionAt: [67, 2217],
  },
  {
    caption: "Team 2025",
    photo: "photo-team",
    alt: "The CESA committee on stage",
    frame: [31.69, 2302, 331.5, 221],
    window: [43.36, 2312.93, 307.54, 164.19],
    radius: 11,
    crop: { left: "-0.03%", top: "-7.69%", width: "100.06%", height: "107.69%" },
    captionAt: [101, 2477],
  },
  {
    caption: "HackFest 2025",
    photo: "photo-crowd",
    alt: "Participants gathered at HackFest",
    frame: [34.4, 2563, 319.6, 213.07],
    window: [45.38, 2572.63, 297.78, 158.9],
    radius: 20,
    crop: { left: "0%", top: "-5.96%", width: "100%", height: "140.55%" },
    captionAt: [67, 2732],
  },
] as const;

/** Addresses match the desktop footer; GitHub and Discord have none yet. */
const SOCIALS = [
  { name: "LinkedIn", icon: "icon-linkedin", href: "https://www.linkedin.com/company/cesa-vit/", at: box(63.81, 3110.31, 41.21, 41.21) },
  { name: "GitHub", icon: "icon-github", href: "#", at: box(135.2, 3107.99, 41.79, 41.79) },
  { name: "YouTube", icon: "icon-youtube", href: "https://www.youtube.com/@cesavit153", at: box(189.76, 3090, 83, 83) },
  { name: "Discord", icon: "icon-discord", href: "#", at: box(285.53, 3113.11, 57.46, 36.78) },
];

export default function MobileHome() {
  return (
    <div className="relative overflow-hidden bg-washi lg:hidden" style={{ height: m(3362) }}>
      <HashScroll />

      {/* ------------------------------------------------------------ Hero */}
      <div data-anchor="home" className="absolute left-0 top-0" />
      <Pic src="/mobile/hero-bg" eager className="absolute max-w-none object-cover" style={box(-79, -186, 508, 1098)} />
      <div data-depth="-0.6" className="sun-pulse pointer-events-none absolute" style={box(88, 129, 326, 178)}>
        <Pic src="/mobile/hero-sun" eager className="h-full w-full max-w-none object-cover" />
      </div>
      {/* The blossom branch hangs in from the right; it sways from the trunk. */}
      <div data-depth="0.8" className="branch-sway pointer-events-none absolute" style={box(208, -122, 1306, 1205)}>
        <Pic src="/mobile/hero-tree" eager className="h-full w-full max-w-none object-cover" />
      </div>

      <div data-reveal className="absolute" style={box(37, 209, 190, 28)}>
        <p className="m-0 font-segoe text-[#fbfbfb]" style={{ fontSize: m(12), lineHeight: "normal" }}>
          COMPUTER ENGINEERING STUDENT&rsquo;S ASSOCIATION
        </p>
      </div>
      <h1
        data-reveal
        className="absolute m-0 whitespace-nowrap font-edo font-normal"
        style={{ left: m(37), top: m(250), fontSize: m(40), lineHeight: "normal", ["--reveal-delay" as string]: "90ms" }}
      >
        <span className="block text-[#fbfbfb]">LEARN</span>
        <span className="block text-[#ffe500]">INNOVATE</span>
        <span className="block text-white">COLLABORATE</span>
      </h1>
      <div data-reveal className="absolute" style={{ ...box(37, 392, 222, 16), ["--reveal-delay" as string]: "180ms" }}>
        <span
          aria-hidden="true"
          className="absolute block bg-white"
          style={{ left: 0, top: m(11), width: m(32), height: "1px", transform: "rotate(-1.79deg)" }}
        />
        <p className="absolute m-0 whitespace-nowrap font-segoe text-[#fbfbfb]" style={{ left: m(41), top: 0, fontSize: m(12), letterSpacing: m(1.44) }}>
          CODE. COMPETE. CONQUER
        </p>
      </div>

      <a
        href="#about"
        data-scroll-to="about"
        data-reveal
        className="group absolute flex items-center justify-center font-segoe font-bold text-white transition-transform duration-200 ease-[var(--ease-entrance)] active:scale-95"
        style={{ ...box(38.97, 422, 126.35, 60.78), ["--reveal-delay" as string]: "260ms" }}
      >
        <Pic
          src="/scene/nav-pill"
          eager
          className="absolute inset-0 h-full w-full object-fill transition-[filter] duration-200 group-active:brightness-110"
        />
        <span className="relative whitespace-nowrap" style={{ fontSize: m(19), paddingLeft: m(8) }}>
          Explore &rarr;
        </span>
      </a>

      {/* --------------------------------------------------------- About us */}
      <div data-anchor="about" className="absolute left-0" style={{ top: m(870) }} />
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          ...box(-465, 900, 1328, 886),
          backgroundImage: "url('/scene/washi-paper.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <Torn x={-180} y={843} w={1160} h={57} crop={{ h: "505.78%", top: "-0.72%" }} />

      {/* Bulb (82:54): the box is the rotated node's bounds. */}
      <div
        aria-hidden="true"
        data-depth="1"
        className="idle-swing pointer-events-none absolute z-30 flex items-center justify-center"
        style={{ ...box(292.28, 881, 136.73, 142.58), ["--dur" as string]: "4.6s" }}
      >
        <Pic src="/home/doodle-bulb" className="max-w-none object-cover" style={{ width: m(112.17), height: m(120.04), transform: "rotate(13.27deg)" }} />
      </div>

      <h2
        data-reveal
        className="absolute z-10 m-0 whitespace-nowrap text-center font-machine font-normal text-[#4c2d12]"
        style={{ left: m(91), top: m(965), width: m(208), fontSize: m(61), lineHeight: "normal" }}
      >
        About us
      </h2>
      <p
        data-reveal
        className="absolute z-10 m-0 font-jaini text-[#371903]"
        style={{ ...box(39, 1048, 319, 737), fontSize: m(32), lineHeight: m(44), ["--reveal-delay" as string]: "140ms" }}
      >
        CESA is the official student body of the Computer Engineering Department at VIT. We empower students to learn,
        innovate, and collaborate through coding competitions, AI/ML challenges, workshops, and hackathons. Guided by
        &ldquo;Code. Compete. Conquer.&rdquo;, we shape the next generation of tech leaders.
      </p>
      <div aria-hidden="true" data-depth="1.4" className="idle-drift pointer-events-none absolute z-10" style={box(-28, 1589, 168, 112)}>
        <Pic src="/home/doodle-plane" className="h-full w-full max-w-none object-cover" />
      </div>

      {/* Footer sky (82:127). Figma layers it beneath Events & Projects, whose
          paper runs down over its top edge. */}
      <div aria-hidden="true" data-depth="-0.4" className="absolute overflow-hidden" style={box(-416, 2802, 1611, 515.01)}>
        <Pic src="/mobile/footer-sky" className="absolute inset-0 h-full w-full max-w-none object-cover object-bottom" />
      </div>

      {/* --------------------------------------------------- Events & Projects */}
      <div data-anchor="events" className="absolute left-0" style={{ top: m(1760) }} />
      <div aria-hidden="true" className="absolute overflow-hidden" style={box(-879, 1779, 3344, 1117)}>
        <Pic src="/home/events-bg" className="absolute max-w-none" style={{ left: 0, top: "-2.15%", width: "100%", height: "100.02%" }} />
      </div>
      <Torn x={-150} y={1729} w={1160} h={57} crop={{ h: "505.78%", top: "-0.72%" }} />

      {/* Heading group (90:6), placed from its own origin at (32, 1855). */}
      <div data-reveal className="absolute z-10" style={box(32, 1855, 326, 98)}>
        <span aria-hidden="true" className="absolute block bg-black" style={{ left: 0, top: m(42.5), width: m(55), height: m(3) }} />
        <h2
          className="absolute m-0 text-center font-machine font-normal text-black"
          style={{ left: m(67), top: 0, width: m(192), fontSize: m(55), lineHeight: 0.9 }}
        >
          EVENTS &amp; PROJECTS
        </h2>
        <span aria-hidden="true" className="absolute block bg-black" style={{ left: m(272), top: m(42.5), width: m(54), height: m(3) }} />
      </div>
      <p
        data-reveal
        className="absolute z-10 m-0 whitespace-nowrap text-center font-segoe text-black"
        style={{ left: m(48), top: m(1961), width: m(294), fontSize: m(16), lineHeight: "normal", ["--reveal-delay" as string]: "120ms" }}
      >
        Moments that make the journey special.
      </p>

      {CARDS.map((card, i) => {
        const [fx, fy, fw, fh] = card.frame;
        const [wx, wy, ww, wh] = card.window;
        return (
          // Reveal on the figure, idle float inside it: both would otherwise
          // want the same element, and only one of them owns `transform`.
          <figure key={card.caption} data-reveal className="absolute z-10 m-0" style={box(fx, fy, fw, fh)}>
            <div
              className="idle-float relative h-full w-full"
              style={{ ["--dur" as string]: `${6.5 + i * 0.9}s`, ["--delay" as string]: `${-i * 1.7}s` }}
            >
              <div className="absolute overflow-hidden" style={{ ...box(wx - fx, wy - fy, ww, wh), borderRadius: m(card.radius) }}>
                <Pic src={`/home/${card.photo}`} alt={card.alt} className="absolute max-w-none object-cover" style={card.crop} />
              </div>
              <Pic src="/home/card-frame" className="pointer-events-none absolute inset-0 h-full w-full" />
              <figcaption
                className="absolute whitespace-nowrap font-hand text-black"
                style={{ left: m(card.captionAt[0] - fx), top: m(card.captionAt[1] - fy), fontSize: m(30), lineHeight: "normal", letterSpacing: m(2) }}
              >
                {card.caption}
              </figcaption>
            </div>
          </figure>
        );
      })}

      <Torn x={-617} y={2828} w={1960} h={79} crop={{ h: "512.89%", top: "-29.2%" }} flip />

      {/* ------------------------------------------------------------ Contact */}
      <div data-anchor="contact" className="absolute left-0" style={{ top: m(2880) }} />

      <h2
        data-reveal
        className="absolute z-10 m-0 whitespace-nowrap text-center font-machine font-normal text-white"
        style={{ left: 0, width: "100%", top: m(2935), fontSize: m(61), lineHeight: "normal" }}
      >
        Contact
      </h2>
      <p
        data-reveal
        className="absolute z-10 m-0 whitespace-nowrap text-center font-segoe text-white"
        style={{ left: 0, width: "100%", top: m(3022), fontSize: m(16), lineHeight: "normal", ["--reveal-delay" as string]: "100ms" }}
      >
        Email:{" "}
        <a href="mailto:cesa.vidyalankar@gmail.com" className="underline-offset-4 active:underline">
          cesa.vidyalankar@gmail.com
        </a>
      </p>
      <p
        data-reveal
        className="absolute z-10 m-0 text-center font-body text-white"
        style={{ ...box(33, 3054, 323, 37), fontSize: m(15), lineHeight: "normal", ["--reveal-delay" as string]: "180ms" }}
      >
        Location: Vidyalankar Institute of Technology, Wadala, Mumbai
      </p>

      <div
        aria-hidden="true"
        className="absolute z-10 bg-[rgba(240,211,211,0.47)] backdrop-blur-[2px]"
        style={{ ...box(34, 3102.77, 330, 56.88), borderRadius: m(21) }}
      />
      {SOCIALS.map((s, i) => (
        <a
          key={s.name}
          href={s.href}
          aria-label={s.name}
          target={s.href.startsWith("http") ? "_blank" : undefined}
          rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="absolute z-10 block transition-transform duration-200 active:scale-90"
          style={s.at}
        >
          <span className="idle-bob block h-full w-full" style={{ ["--dur" as string]: "3.8s", ["--delay" as string]: `${-i * 0.6}s` }}>
            <Pic src={`/home/${s.icon}`} className="h-full w-full object-contain" />
          </span>
        </a>
      ))}

      <div aria-hidden="true" className="absolute z-10" style={box(-609, 3202, 1218, 406)}>
        <Pic src="/home/footer-end" className="h-full w-full max-w-none object-cover" />
      </div>
      <p className="absolute z-10 m-0 text-center font-body text-white" style={{ ...box(15.5, 3317, 359, 28), fontSize: m(13), lineHeight: "normal" }}>
        &copy; 2026 Computer Engineering Student Association - VIT. All rights reserved.
      </p>
    </div>
  );
}
