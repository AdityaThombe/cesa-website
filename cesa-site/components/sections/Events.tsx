import TornStrip from "@/components/ui/TornStrip";

const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

const box = (x: number, y: number, w: number, h: number) => ({
  left: vw(x),
  top: vw(y),
  width: vw(w),
  height: vw(h),
});

/**
 * The three photo cards (Figma "Cards", 46:43). Each is a photo under the torn
 * tan frame (a shape with a transparent window, the same export for all three)
 * with a hand-lettered caption. `crop` is the photo's own placement inside its
 * rounded window, straight from the export.
 */
const CARDS = [
  {
    caption: "Plathora 2025",
    photo: "photo-crowd",
    alt: "Participants gathered on the steps at Plethora",
    window: [79, 407, 495, 264] as const,
    radius: 20,
    crop: { left: "0%", top: "-5.96%", width: "100%", height: "140.55%" },
    frame: [62, 391] as const,
    captionAt: [150, 671] as const,
  },
  {
    caption: "Team 2025",
    photo: "photo-team",
    alt: "The CESA committee on stage",
    window: [709, 408.5, 493, 263] as const,
    radius: 11,
    crop: { left: "-0.03%", top: "-7.69%", width: "100.06%", height: "107.69%" },
    frame: [691, 391] as const,
    captionAt: [812, 671] as const,
  },
  {
    caption: "HackFest 2025",
    photo: "photo-crowd",
    alt: "Participants gathered at HackFest",
    window: [1333, 407, 495, 264] as const,
    radius: 20,
    crop: { left: "0%", top: "-5.96%", width: "100%", height: "140.55%" },
    frame: [1316, 391] as const,
    captionAt: [1402, 671] as const,
  },
];

/**
 * Figma "Events & Porjects" group (44:33). Frame origin for this section is the
 * background's top edge at y2448; Transition-2 sits 95px above it, over the
 * bottom of the About paper.
 */
export default function Events() {
  return (
    <section
      id="events"
      className="relative"
      style={{ height: vw(837), zIndex: 2, backgroundColor: "#eee3cf", overflowX: "clip" }}
    >
      <picture>
        <source srcSet="/home/events-bg.avif" type="image/avif" />
        <img
          src="/home/events-bg.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute object-cover"
          style={box(-278, 0, 2506, 837)}
        />
      </picture>

      {/* Transition-2 (9:85) — unflipped here, unlike the old seam. */}
      <TornStrip y={-95} h={95} />

      <picture>
        <source srcSet="/home/doodle-memories.avif" type="image/avif" />
        <img
          src="/home/doodle-memories.webp"
          alt="Collecting memories, not just certificates"
          data-depth="1.2"
          className="idle-wiggle absolute origin-top object-contain"
          style={{ ...box(13, 9, 228, 342), ["--dur" as string]: "6s" }}
        />
      </picture>
      <picture>
        <source srcSet="/home/doodle-build.avif" type="image/avif" />
        <img
          src="/home/doodle-build.webp"
          alt="Build, learn, share, repeat"
          data-depth="0.9"
          className="idle-wiggle absolute origin-top object-contain"
          style={{ ...box(1705, 31, 199, 297), ["--dur" as string]: "7.2s", ["--delay" as string]: "-2.5s" }}
        />
      </picture>

      <span aria-hidden="true" data-reveal className="absolute bg-black" style={{ ...box(424, 164, 197, 7), ["--reveal-delay" as string]: "120ms" }} />
      <h2
        data-reveal
        className="absolute whitespace-nowrap font-machine font-normal leading-none text-black"
        style={{ ...box(641, 113, 683, 114), fontSize: vw(92) }}
      >
        EVENTS &amp; PROJECTS
      </h2>
      <span aria-hidden="true" data-reveal className="absolute bg-black" style={{ ...box(1296, 163, 197, 7), ["--reveal-delay" as string]: "120ms" }} />
      <p
        data-reveal
        className="absolute whitespace-nowrap font-segoe text-black"
        style={{ ...box(633, 204, 708, 45), fontSize: vw(37), ["--reveal-delay" as string]: "200ms" }}
      >
        Moments that make the journey special.
      </p>

      {CARDS.map((card, i) => {
        const [fx, fy] = card.frame;
        const [wx, wy, ww, wh] = card.window;
        return (
          // The figure is the frame's own box and the only thing that moves, so
          // photo, frame and caption float as one card. Children are placed
          // relative to it; the idle float lives here and the hover lift on
          // the inner layer, since both would otherwise fight over `transform`.
          <figure
            key={card.caption}
            data-reveal
            className="idle-float absolute m-0"
            style={{
              ["--reveal-delay" as string]: `${280 + i * 140}ms`,
              ...box(fx, fy, 530, 354),
              ["--dur" as string]: `${6.5 + i * 0.9}s`,
              ["--delay" as string]: `${-i * 1.7}s`,
            }}
          >
            <div className="group relative h-full w-full transition-transform duration-300 ease-[var(--ease-entrance)] hover:-translate-y-[0.6vw] hover:rotate-[-0.8deg] hover:scale-[1.03]">
              <div
                className="absolute overflow-hidden"
                style={{ ...box(wx - fx, wy - fy, ww, wh), borderRadius: vw(card.radius) }}
              >
                <picture>
                  <source srcSet={`/home/${card.photo}.avif`} type="image/avif" />
                  <img
                    src={`/home/${card.photo}.webp`}
                    alt={card.alt}
                    loading="lazy"
                    className="absolute max-w-none object-cover transition-transform duration-500 ease-[var(--ease-entrance)] group-hover:scale-[1.06]"
                    style={card.crop}
                  />
                </picture>
              </div>
              <picture>
                <source srcSet="/home/card-frame.avif" type="image/avif" />
                <img
                  src="/home/card-frame.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                />
              </picture>
              <figcaption
                className="absolute whitespace-nowrap font-hand text-black"
                style={{
                  ...box(card.captionAt[0] - fx, card.captionAt[1] - fy, 456, 74),
                  fontSize: vw(40),
                  letterSpacing: vw(3),
                }}
              >
                {card.caption}
              </figcaption>
            </div>
          </figure>
        );
      })}
    </section>
  );
}
