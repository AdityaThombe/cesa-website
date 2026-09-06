/**
 * The parallax layer stack, back to front.
 *
 * Every `box` is copied from the aligned Figma frame
 * (uav64g4IwAAc8mCVMwStho, node 1:9) in STAGE pixels — the 1920x1072 frame the
 * composition was built in. ParallaxScene converts them to percentages of a
 * stage that scales to cover the viewport, so the scene holds together at any
 * window size and the tree stays exactly where it was placed.
 *
 * Do not "tidy" these numbers. Each box was measured against a specific export
 * crop; the asset pipeline is pinned to match, and changing either side alone
 * shifts the layer.
 *
 * `mouse`  multiplier on cursor travel (MOUSE_TRAVEL px at 1.0)
 * `scroll` how far the layer drifts over the sticky hero, in vh
 * `sway`   canopy clusters only: stagger index for the breeze
 */

/** The frame the composition was aligned in. */
export const STAGE = { width: 1920, height: 1072 };
export const STAGE_ASPECT = STAGE.width / STAGE.height;

export type SceneLayer = {
  id: string;
  src: string;
  mouse: number;
  scroll: number;
  scale?: [number, number];
  sway?: number;
  /** Position within the stage, in stage pixels. */
  box: { left: number; top: number; width: number; height: number };
  /** Static transform on the image inside its box — Figma's flip/rotation.
   *  Kept off the wrapper, which the rAF loop owns. */
  transform?: string;
  /** Inner size as a fraction of the box, for rotated layers whose box is the
   *  axis-aligned bounding box rather than the image itself. */
  inner?: { width: string; height: string };
  /** Never let this layer's bottom edge rise into frame. The trunk is drawn
   *  with its roots and ground contact, so the moment its base clears the
   *  fold the tree reads as floating. ParallaxScene clamps the upward travel
   *  per frame, which holds at every viewport size rather than only the one
   *  the numbers were tuned against. */
  keepBottomBelowFold?: boolean;
};

/**
 * Motion budget — why these numbers are small.
 *
 * The tree is rooted in ground that is painted into the background plate, so
 * it cannot out-travel that ground without visibly lifting out of the soil.
 * The trunk's base sits only 203 stage px below the frame; at the original
 * 22vh it rose into view and the whole tree read as a sticker.
 *
 * So the plate moves more than it used to and the tree moves much less: the
 * gap between them is now 4vh rather than 18vh. Depth still reads, because
 * relative motion is what the eye measures, but the tree stays planted.
 *
 * If you want a stronger parallax than this, the fix is not a bigger number —
 * it is to push the tree further down so its base can never enter frame, which
 * means re-aligning it in Figma.
 */
export const LAYERS: SceneLayer[] = [
  {
    // The baked plate, mirrored — which is what puts the school on the left
    // and opens the right side for the tree.
    id: "background",
    src: "/scene/background",
    mouse: 0.22,
    scroll: 9,
    box: { left: 0, top: -1, width: 1921, height: 1072 },
    transform: "scaleX(-1)",
  },
  {
    // Sits behind the tree, so the branches read against the disc.
    id: "sun",
    src: "/scene/sun",
    mouse: 0.28,
    scroll: 10,
    box: { left: 959, top: 29, width: 974, height: 531 },
  },
  {
    id: "tree-trunk",
    src: "/scene/tree-trunk",
    mouse: 0.42,
    scroll: 13,
    box: { left: 479, top: -110, width: 1933, height: 1385 },
    keepBottomBelowFold: true,
  },
  {
    // canopy-1, first placement: the cluster out on the left-reaching branch.
    id: "canopy-1a",
    src: "/scene/canopy-1",
    mouse: 0.46,
    scroll: 14,
    sway: 0,
    box: { left: 541.63, top: 108.58, width: 367.746, height: 260.831 },
    transform: "rotate(1.09deg)",
    inner: { width: "98.71%", height: "97.38%" },
  },
  {
    // canopy-1 again, rotated hard, as the top-right mass.
    id: "canopy-1b",
    src: "/scene/canopy-1",
    mouse: 0.55,
    scroll: 16,
    sway: 1,
    box: { left: 1577, top: -110, width: 466.558, height: 486.761 },
    transform: "rotate(128.15deg)",
    inner: { width: "85.60%", height: "57.43%" },
  },
  {
    id: "canopy-2",
    src: "/scene/canopy-2",
    mouse: 0.46,
    scroll: 14,
    sway: 2,
    box: { left: 961, top: -110, width: 396, height: 278 },
  },
  {
    // The white-screened canopy, now usable: keyed on brightness rather than
    // hue and kept at full canvas so its aspect still matches the Figma box.
    id: "canopy-4",
    src: "/scene/canopy-4",
    mouse: 0.46,
    scroll: 14,
    sway: 3,
    box: { left: 1210, top: -110, width: 580, height: 324 },
  },
];
