import type { Member } from "@/lib/content";

/**
 * The Figma "Member Card" (node 72:11), pulled exactly — the scene image is
 * the SAME asset already in the pipeline as `/scene/plethora`, the two torn
 * seams reuse `/scene/torn-edge` (one flipped 180deg, per the source), and
 * every position/size below is copied from the node's own px values as a
 * fraction of the card's 698x894 box, not eyeballed.
 *
 * Sized with CSS container queries (`cqw`), not vw or rem: this card has to
 * look right whether it's 220px wide in a dense grid or 400px as a featured
 * card, and cqw ties every measurement to the card's OWN rendered width
 * wherever it's placed — the same reason the hero uses STAGE-relative
 * percentages instead of viewport units.
 *
 * Name uses Reggae One, not Figma's "The Last Shuriken" — personal-use-only,
 * same call made for the About section's "We Are CESA" heading. "Position"
 * substitutes this site's body font (Zen Kaku Gothic New) for Figma's Inter,
 * to avoid loading a second sans-serif for one small label.
 *
 * The GitHub badge is the exact Figma asset. The LinkedIn badge is a
 * standard "in" glyph, not pulled from Figma — that specific node hit this
 * session's Figma API rate limit before it could be fetched.
 *
 * Sizing is the classic `height:0; padding-top:<ratio>%` box, not the
 * `aspect-ratio` property — this is not a style preference. `aspect-ratio`
 * combined with `overflow:hidden` fails to clip an absolutely-positioned,
 * oversized child (exactly what the scene image below is: -39%/+185% of
 * the box) in this rendering engine. Confirmed by isolated test: identical
 * markup clips correctly with the padding-top box and does not with
 * `aspect-ratio`, with every other variable held fixed. That is what was
 * making every corner render sharp despite `border-radius` being set
 * correctly the whole time.
 */
export default function MemberCard({ member }: { member: Member }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-washi"
      style={{ height: 0, paddingTop: "128.0803%", borderRadius: "7.16% / 5.59%", containerType: "inline-size" }}
    >
      <div className="absolute" style={{ left: "-39.255%", top: 0, width: "184.6705%", height: "80.5369%" }}>
        <picture>
          <source srcSet="/scene/plethora.avif" type="image/avif" />
          <img src="/scene/plethora.webp" alt="" aria-hidden="true" className="h-full w-full object-cover" />
        </picture>
      </div>

      {/* Standing in for a real photo: a generic silhouette on the path,
          not a blank rectangle or another texture. Swap this <svg> for a
          real portrait per member once photos exist — nothing else on the
          card needs to change to support that. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 130"
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: "32%", height: "42%", fill: "rgba(42,26,46,0.62)" }}
      >
        <circle cx="50" cy="30" r="28" />
        <path d="M50 62c-30 0-46 20-46 50v18h92v-18c0-30-16-50-46-50z" />
      </svg>

      {/* top seam — ragged edge pointing down, cut into the scene */}
      <div
        aria-hidden="true"
        className="absolute overflow-hidden"
        style={{ left: 0, top: "-7.2707%", width: "100%", height: "18.5682%", transform: "rotate(180deg)" }}
      >
        <img src="/scene/torn-edge.webp" alt="" className="h-full w-full object-cover" />
      </div>

      {/* bottom seam — ragged edge pointing up, the handoff into paper */}
      <div
        aria-hidden="true"
        className="absolute overflow-hidden"
        style={{ left: "-37.9656%", top: "71.4765%", width: "171.0602%", height: "31.3199%" }}
      >
        <img src="/scene/torn-edge.webp" alt="" className="h-full w-full object-cover" />
      </div>

      {/* Figma pinned Name and Position at independent fixed offsets, sized
          for its own 4-character placeholder ("Name"). A real name like
          "Bhavika Yashwantrao" wraps to two lines at that size and pushes
          the role clean out of the card's clipped bottom edge — not a
          layout nudge, the type scale itself has to come down so two lines
          of a real name plus the role still fit the fixed text zone Figma
          allotted (19.46% of the card's height). Stacking them in flow
          (Position simply follows Name) keeps the left edge and starting
          height from Figma while surviving names of any length. */}
      <div className="absolute" style={{ left: "7.3066%", top: "80.5369%", width: "78%" }}>
        <p className="font-display leading-[1.05]" style={{ fontSize: "7cqw", color: "#c36866" }}>
          {member.name}
        </p>
        <p className="font-body leading-tight" style={{ marginTop: "0.8cqw", fontSize: "5cqw", color: "#555" }}>
          {member.role}
        </p>
      </div>

      <a
        href="#"
        aria-label={`${member.name} on LinkedIn`}
        className="absolute block rounded-[20%] bg-[#0A66C2] p-[18%]"
        style={{ left: "73.3524%", top: "86.8009%", width: "8.1662%", aspectRatio: "1 / 1" }}
      >
        <svg viewBox="0 0 24 24" fill="white" className="h-full w-full">
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
        </svg>
      </a>
      <a
        href="#"
        aria-label={`${member.name} on GitHub`}
        className="absolute block opacity-75"
        style={{ left: "86.1032%", top: "86.8009%", width: "8.1662%", aspectRatio: "1 / 1" }}
      >
        <picture>
          <source srcSet="/scene/icon-github.avif" type="image/avif" />
          <img src="/scene/icon-github.webp" alt="" className="h-full w-full object-contain" />
        </picture>
      </a>
    </div>
  );
}
