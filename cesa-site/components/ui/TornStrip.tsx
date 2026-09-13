const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

/**
 * One of the Figma "Transition" torn-paper seams: a 1960px-wide window onto the
 * torn-edge art, centred on the 1920 frame (so it overhangs 40px left).
 *
 * It is a CROP WINDOW, not a resize. Figma draws the art at a fixed height
 * inside a short box, pulled up so the window lands on the ragged edge itself;
 * squeezing the whole sheet into the box instead flattens the tear until it no
 * longer reads as paper. `artH`/`artTop` are that fixed art height and offset
 * in frame px — 487.2/-27.7 for the 95px and 69px strips, 405.2/-23.1 for the
 * 79px one, which Figma draws at a smaller scale.
 *
 * Positioned against a `relative` parent whose top-left is the frame origin of
 * the section; `y` is the strip's top in frame px from there.
 */
export default function TornStrip({
  y,
  h,
  artH = 487.2,
  artTop = -27.7,
  flip = false,
}: {
  y: number;
  h: number;
  artH?: number;
  artTop?: number;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 overflow-hidden"
      style={{
        // Percent, not vw, horizontally: vw counts the vertical scrollbar but
        // the section's box does not, so a 102vw strip raises a sideways
        // scrollbar on the whole page.
        left: "-2.0833%",
        width: "102.0833%",
        top: vw(y),
        height: vw(h),
        transform: flip ? "scaleY(-1)" : undefined,
      }}
    >
      <img
        src="/scene/torn-edge.webp"
        alt=""
        className="absolute max-w-none"
        style={{ left: "1.92%", top: vw(artTop), width: "100%", height: vw(artH) }}
      />
    </div>
  );
}
