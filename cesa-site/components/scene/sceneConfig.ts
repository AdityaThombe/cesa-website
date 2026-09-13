/**
 * The parallax layer stack, back to front.
 *
 * Every `box` is copied from the aligned Figma frame (originally
 * uav64g4IwAAc8mCVMwStho node 1:9, now GCeABSi7E0WdNDYKKObWS9 "CESA" node 9:26)
 * in STAGE pixels. The later revision moved and enlarged the school plate and
 * nudged the tree; those moves were applied as deltas onto the boxes below, so
 * the stage offset each layer was already aligned with is preserved. STAGE is
 * the 1920x1072 frame the composition was built in; ParallaxScene converts the
 * boxes to percentages of a
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
/**
 * How far the whole tree group is dropped below its Figma placement, in stage
 * px, applied to the trunk and every canopy alike so the cluster stays welded
 * to its own branches.
 *
 * Figma sits the trunk with only 203px of its base below the frame, which is
 * tight enough that the roots can graze the fold — and the tree is meant to
 * run off the bottom of the scene into the torn-paper seam, never to show
 * where it ends. Dropping the group buries the base for good.
 */
const TREE_DROP = 90;

export const LAYERS: SceneLayer[] = [
  {
    // The baked plate, in its own orientation. It used to carry
    // `scaleX(-1)` from an early composition that mirrored it to open the
    // right side for the tree. Figma's "school - new" (node 9:27) is this
    // exact file, byte for byte, placed with NO flip — so the mirror was
    // rendering the whole courtyard backwards against the design (clock
    // tower landing at 36% across instead of Figma's 61%). Every other box
    // in this file is already in Figma's unmirrored coordinate space, so
    // dropping the flip is what makes them agree.
    id: "background",
    src: "/scene/background",
    mouse: 0.22,
    scroll: 9,
    box: { left: -117, top: -24, width: 2147, height: 1198 },
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
    box: { left: 628, top: -100 + TREE_DROP, width: 1933, height: 1385 },
    keepBottomBelowFold: true,
  },
  {
    // canopy-1, first placement: the cluster out on the left-reaching branch.
    // `inner` is scaled to 85% of the Figma box (on top of its own crop
    // correction) to thin the foliage out — the box itself, and therefore the
    // cluster's anchor point on the branch, is untouched.
    id: "canopy-1a",
    src: "/scene/canopy-1",
    mouse: 0.46,
    scroll: 14,
    sway: 0,
    box: { left: 677.0, top: 84.0 + TREE_DROP, width: 367.746, height: 260.831 },
    transform: "rotate(1.09deg)",
    inner: { width: "83.90%", height: "82.77%" },
  },
  {
    // canopy-1 again, rotated hard, as the top-right mass.
    id: "canopy-1b",
    src: "/scene/canopy-1",
    mouse: 0.55,
    scroll: 16,
    sway: 1,
    box: { left: 1726, top: -110 + TREE_DROP, width: 466.558, height: 486.761 },
    transform: "rotate(128.15deg)",
    inner: { width: "72.76%", height: "48.82%" },
  },
  {
    id: "canopy-2",
    src: "/scene/canopy-2",
    mouse: 0.46,
    scroll: 14,
    sway: 2,
    box: { left: 1110, top: -110 + TREE_DROP, width: 396, height: 278 },
    inner: { width: "85%", height: "85%" },
  },
  {
    // Figma node 31:95 — a third canopy-1 cluster, new in the latest revision,
    // filling the upper-right between canopy-4 and the rotated top-right mass.
    // Box is the rotated node's axis-aligned bounds from the export; `inner`
    // follows the same (image / box) x 0.85 rule as the other rotated clusters.
    id: "canopy-1c",
    src: "/scene/canopy-1",
    mouse: 0.52,
    scroll: 15,
    sway: 4,
    box: { left: 1599.0, top: -200.0 + TREE_DROP, width: 399.952, height: 441.044 },
    transform: "rotate(119.54deg)",
    inner: { width: "77.15%", height: "48.95%" },
  },
  {
    // The white-screened canopy, now usable: keyed on brightness rather than
    // hue and kept at full canvas so its aspect still matches the Figma box.
    id: "canopy-4",
    src: "/scene/canopy-4",
    mouse: 0.46,
    scroll: 14,
    sway: 3,
    box: { left: 1359, top: -110 + TREE_DROP, width: 580, height: 324 },
    inner: { width: "85%", height: "85%" },
  },
];
