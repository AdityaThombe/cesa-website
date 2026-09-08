import Hero from "@/components/sections/Hero";
import TeamRoad3D from "@/components/scene/TeamRoad3D";
import { COMMITTEE } from "@/lib/content";

export default function Home() {
  return (
    <main>
      <Hero />

      {/* The torn paper edge that wipes up over the sunset. Sits at the top of
          the first cream section and overlaps the hero, so the tear reads as
          paper being laid over the scene rather than a band between two
          blocks. */}
      <section
        className="relative flow-root"
        style={{
          // Transition-2 hangs below this section's own box, and the walk is
          // the next sibling — without a stacking order of its own, the walk's
          // canvas paints over the tear and the seam goes hard-edged again.
          zIndex: 1,
          backgroundColor: "var(--color-washi)",
          backgroundImage: "url('/scene/washi-paper.webp')",
          // Figma places this at 1920x1281 — one large placed instance, not a
          // small repeating pattern (no blend mode either). Matching that
          // means sizing the first tile to the same ratio (1281/1920) instead
          // of my earlier small 512px multiply-blend tile, then repeating it
          // vertically only, since the real page runs taller than Figma's
          // fixed demo frame and the art is seamless top-to-bottom.
          backgroundSize: "100% 66.7188vw",
          backgroundRepeat: "repeat-y",
        }}
      >
        {/* Every box below is copied directly from the Figma node data (frame
            32:3, 1920x1072), converted to vw off the frame's own WIDTH for
            both axes — not eyeballed off a screenshot. That matters: the
            frame's width and height don't share a scale (1920 != 1072), so
            using vw for x and a height-based percentage for y would distort
            the proportions the layers were actually placed at. One ratio
            (px / 1920 * 100), applied to left/top/width/height alike, is
            what makes the numbers below the same numbers Figma has.
            None of these three are grouped under one frame in Figma — they
            're loose canvas objects the composition was proved out with —
            so each is positioned independently against the same origin
            (this section's top-left = frame 32:3's origin) rather than
            inheriting a parent's box. */}
        {/* Figma's "Transition-1" (node 9:79): two strips of the SAME
            torn-edge art, one plain and one flipped, that together read as
            two sheets of paper overlapping at the seam.

            The important part is that each strip is a CROP WINDOW, not a
            resize. Figma renders the art at its natural 487px height
            (25.375vw) inside a box only 69px / 95px tall, pulled up 27.7px
            so the window lands on the ragged edge itself. Scaling the whole
            487px sheet down into a 95px box instead — which is what
            `background-size: 100% 100%` was doing here — squashes the tear
            5x and it stops reading as torn paper at all. Hence the fixed
            inner <img> height plus overflow-hidden on the window. */}
        {[
          { top: "-5.1042vw", height: "3.5938vw", flip: false },
          { top: "-1.5104vw", height: "4.9479vw", flip: true },
        ].map((strip, i) => (
          <div
            key={i}
            aria-hidden="true"
            // z-20 keeps the tear above the hanging sign (z-10), so the rope
            // reads as coming out from BEHIND the torn paper instead of being
            // laid on top of it. The transition is the frontmost thing in
            // this section by design.
            className="pointer-events-none absolute z-20 overflow-hidden"
            style={{
              // Percent, not vw: `vw` counts the vertical scrollbar's ~15px
              // but the section's content box does not, so a 102vw strip
              // overhangs by just enough to raise a horizontal scrollbar on
              // the whole page. Percent resolves against the section itself.
              left: "-2.0833%",
              width: "102.0833%",
              top: strip.top,
              height: strip.height,
              transform: strip.flip ? "scaleY(-1)" : undefined,
            }}
          >
            <img
              src="/scene/torn-edge.webp"
              alt=""
              className="absolute max-w-none"
              style={{ left: "1.92%", top: "-1.4437vw", width: "100%", height: "25.375vw" }}
            />
          </div>
        ))}

        {/* Rope and wood sign move together as one rigid body — see
            .sign-swing in globals.css. Figma (node 9:26) swapped the plain
            plank for a full wood-grain board (the "Firefly_RemoveBackground"
            asset) with the heading and body copy set directly on it, so this
            wrapper's box is now the board's own 1360x895 box rather than the
            plank+heading pairing the previous version used. `transform-origin`
            sits at the hook's position (50% of the wrapper's width). */}
        {/* marginTop is the board's own offset below the paper's top edge:
            Figma puts the board at y1349 against a paper section starting at
            y1166, so 183px -> 9.5313vw. */}
        <div
          className="sign-swing relative z-10 mx-auto"
          style={{ width: "70.8333vw", marginTop: "9.5313vw" }}
        >
          {/* Same drop-shadow treatment as before: it's a filter on the
              rope's own alpha silhouette, so the shadow is hook-shaped and
              moves with the swing. */}
          {/* Hook top sits at the midpoint of the WHOLE Transition-1 group,
              not of its lower strip. The group spans y1068..y1232, so the
              midpoint is y1150; against a board at y1349 that is -199px ->
              -10.3646vw. (Figma's own y1185 is the lower strip's midpoint,
              which reads as the hook starting below the tear rather than
              out of the middle of it.) */}
          <img
            src="/scene/rope-hook.webp"
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: "-10.3646vw",
              width: "16.7708vw",
              height: "17.0833vw",
              filter: "drop-shadow(0.15vw 0.35vw 0.3vw rgba(20,14,18,0.5))",
            }}
          />
          <img
            src="/scene/about-frame.webp"
            alt=""
            aria-hidden="true"
            className="relative w-full"
          />

          {/* Heading + body copy, positioned as fractions of the board's own
              box (Figma nodes 9:58 and 9:77) rather than the viewport, so
              they stay put on the wood grain at any board width. Font sizes
              stay in vw off the 1920 frame like every other text node on
              this page — "About us" lands at the same 6.667vw the old
              "We Are CESA" heading used. */}
          <div
            className="absolute inset-0 flex flex-col items-center text-center"
            style={{ paddingTop: "4.8958vw", paddingLeft: "8%", paddingRight: "8%" }}
          >
            <h2
              className="font-display text-[6.667vw] uppercase leading-[1.05] text-washi"
              style={{ textShadow: "0 0.2vw 0.6vw rgba(20,14,18,0.55)" }}
            >
              About us
            </h2>
            <p
              className="mt-[2.5vw] font-body text-[2.0833vw] leading-[1.55] text-washi/95"
              style={{ textShadow: "0 0.1vw 0.4vw rgba(20,14,18,0.6)" }}
            >
              The Computer Engineering Student&rsquo;s Association (CESA) is the
              official body of the Computer Engineering Department at VIT. Focused
              on AI/ML and core computing domains, we create opportunities for
              students to learn, innovate, and collaborate. Our flagship event,
              Plethora, brings together coding competitions, AI/ML challenges,
              workshops, and hackathons that empowers students to showcase skills
              and build impactful solutions. Guided by our motto &ldquo;Code.
              Compete. Conquer.&rdquo; we strive to shape the next generation of
              tech leaders.
            </p>
          </div>
        </div>

        {/* No committee grid here. The two cards below this point in the
            Figma frame live in a group named "Team-page demo (do not
            implement this)" — they are a preview of the separate team page,
            not content for the home page. The walk below is what carries the
            committee on this route. */}
        <div style={{ height: "10.3125vw" }} />

        {/* "Transition-2" (Figma node 9:85) — the seam OUT of the paper
            section, mirroring Transition-1 at the top. Same 1960x95 box and
            the same crop window onto the torn-edge art; it sits at y2442
            against a paper section ending at 2447, so all but ~5px of it
            hangs below this section's own bottom edge and tears into the
            walk underneath. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: "-2.0833%",
            width: "102.0833%",
            bottom: "-4.6875vw",
            height: "4.9479vw",
            transform: "scaleY(-1)",
          }}
        >
          <img
            src="/scene/torn-edge.webp"
            alt=""
            className="absolute max-w-none"
            style={{ left: "1.92%", top: "-1.4437vw", width: "100%", height: "25.375vw" }}
          />
        </div>
      </section>

      {/* The committee walk — one-to-one port of the road scene from
          aditya-portfolio (github.com/AdityaThombe/aditya-portfolio),
          restyled into this site's palette. See TeamRoad3D.tsx for what
          carried over and what was trimmed for this first pass. */}
      <TeamRoad3D members={COMMITTEE} />
    </main>
  );
}
