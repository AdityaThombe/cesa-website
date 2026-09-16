import TornStrip from "@/components/ui/TornStrip";

const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

/** An absolutely placed box in this section's frame px (origin = Figma y1166). */
const box = (x: number, y: number, w: number, h: number) => ({
  left: vw(x),
  top: vw(y),
  width: vw(w),
  height: vw(h),
});

/**
 * Figma "About-us" group (node 21:11). Every coordinate below is the Figma node
 * box minus this section's origin (0, 1166) and converted to vw off the 1920
 * frame, for both axes, so the composition keeps the design's proportions at
 * any width.
 */
export default function About() {
  return (
    <section
      id="about"
      className="relative"
      style={{
        height: vw(1281),
        // Transition-1 hangs above this section over the hero, and the doodles
        // sit over its neighbours; this keeps both above the sticky hero.
        zIndex: 1,
        backgroundColor: "var(--color-washi)",
        backgroundImage: "url('/scene/washi-paper.webp')",
        backgroundSize: "100% 100%",
        // Doodles run off both edges by design (the laptop sits at x -58).
        overflowX: "clip",
      }}
    >
      {/* Transition-1 (9:79): two strips of the same torn art, one flipped. */}
      <TornStrip y={-98} h={69} />
      <TornStrip y={-29} h={95} flip />

      {/* Board glows (54:112, 54:108) — soft amber pools behind the board's
          corners. The exported SVG is a blurred ellipse larger than its node,
          hence the negative inset. */}
      {[
        [272, 206],
        [1424, 862],
      ].map(([x, y]) => (
        <div key={x} aria-hidden="true" className="glow-breathe pointer-events-none absolute" style={{ ...box(x, y, 211, 216), ["--delay" as string]: x > 1000 ? "-2s" : "0s" }}>
          <img
            src="/home/board-glow.svg"
            alt=""
            className="absolute max-w-none"
            // Explicit size, not inset: an <img> does not stretch between its
            // insets like a div does — it falls back to the SVG's intrinsic
            // size. Box + 2 x the export's overflow on each axis.
            style={{ left: "-44.74%", top: "-43.7%", width: "189.48%", height: "187.4%" }}
          />
        </div>
      ))}

      <picture>
        <source srcSet="/home/doodle-computer.avif" type="image/avif" />
        <img
          src="/home/doodle-computer.webp"
          alt=""
          aria-hidden="true"
          data-depth="1.4"
          className="idle-rock pointer-events-none absolute object-contain"
          style={{ ...box(-58, 668, 398, 265), ["--dur" as string]: "6.5s" }}
        />
      </picture>

      {/* Rope and board swing as one rigid body from the hook (.sign-swing).
          The wrapper's box is the board's own (255, 183) 1360x895. */}
      <div className="sign-swing absolute z-10" style={box(255, 183, 1360, 895)}>
        {/* Hook top at the midpoint of the whole Transition-1 group (y1150),
            so the rope emerges out of the middle of the tear. */}
        <img
          src="/scene/rope-hook.webp"
          alt=""
          aria-hidden="true"
          className="absolute"
          style={{
            ...box(519, -199, 322, 328),
            filter: "drop-shadow(0.15vw 0.35vw 0.3vw rgba(20,14,18,0.5))",
          }}
        />
        <img src="/scene/about-frame.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />

        {/* Board blur (46:45): a warm, heavily blurred ellipse over the grain
            that lifts the centre of the board behind the copy. */}
        <div aria-hidden="true" className="pointer-events-none absolute" style={box(29, 23, 1314, 852)}>
          <img
            src="/home/board-blur.svg"
            alt=""
            className="absolute max-w-none"
            style={{ left: "-20.24%", top: "-31.21%", width: "140.48%", height: "162.42%" }}
          />
        </div>

        <h2
          data-reveal
          className="absolute whitespace-nowrap font-machine font-normal leading-none text-[#4c2d12]"
          style={{ ...box(463, 98, 446, 132), fontSize: vw(128) }}
        >
          About us
        </h2>

        <p
          data-reveal
          className="absolute text-center font-jaini text-[#371903]"
          style={{ ...box(217, 267, 975, 436), ["--reveal-delay" as string]: "180ms", fontSize: vw(40), lineHeight: vw(70), letterSpacing: vw(2) }}
        >
          CESA is the official student body of the Computer Engineering Department at
          VIT. We empower students to learn, innovate, and collaborate through coding
          competitions, AI/ML challenges, workshops, and hackathons. Guided by
          &ldquo;Code. Compete. Conquer.&rdquo;, we shape the next generation of tech
          leaders.
        </p>
      </div>

      <picture>
        <source srcSet="/home/doodle-plane.avif" type="image/avif" />
        <img
          src="/home/doodle-plane.webp"
          alt=""
          aria-hidden="true"
          data-depth="1.8"
          className="idle-drift pointer-events-none absolute z-10 object-contain"
          style={box(1569, 886, 400, 267)}
        />
      </picture>

      {/* Bulb (58:128): the box is the rotated node's bounds; the image is
          its own 230.9x247.1 turned 13.27deg inside it. */}
      <div aria-hidden="true" data-depth="1.1" className="idle-swing pointer-events-none absolute z-10 flex items-center justify-center" style={{ ...box(1639, 105, 281.456, 293.5), ["--dur" as string]: "4.6s" }}>
        <picture>
          <source srcSet="/home/doodle-bulb.avif" type="image/avif" />
          <img
            src="/home/doodle-bulb.webp"
            alt=""
            className="max-w-none object-contain"
            style={{ width: vw(230.902), height: vw(247.096), transform: "rotate(13.27deg)" }}
          />
        </picture>
      </div>
    </section>
  );
}
