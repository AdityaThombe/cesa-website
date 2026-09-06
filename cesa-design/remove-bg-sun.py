"""Paint the sun disc out of the background plate.

    python remove-bg-sun.py

The plate has its own painted sun. The scene also places a separate sun layer,
and because the plate is mirrored the two land on top of each other — a double
sun. This removes the disc and its tight bloom from the plate while KEEPING the
broad horizon glow, which is correct for a sunset and which, once mirrored,
sits exactly where the placed sun goes.

Only the disc is touched. It lives entirely in clean sky above the hill ridge,
so the sky can be rebuilt by interpolating horizontally between two columns
either side of it — no cloning, no visible patch.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path.home() / "Downloads" / "background-hi.png"
DEST = Path.home() / "Downloads" / "background-nosun.png"

# Measured from the plate: the near-white core is x 214-256, y 480-503.
CENTRE = (234, 488)
# Elliptical falloff. The vertical radius is deliberately tight: it must reach
# zero BEFORE the hill ridge at y~533, or the horizontal rebuild smears the
# hills into a blurred band. Wide horizon glow is left alone either way.
RADIUS = (150, 40)
# Columns to rebuild the sky from, just outside the bloom on either side.
LEFT_REF, RIGHT_REF = 78, 392
BAND = (380, 528)  # rows to work on; the hill ridge starts at ~533


def main() -> int:
    if not SRC.exists():
        raise SystemExit(f"not found: {SRC}")

    img = Image.open(SRC).convert("RGB")
    arr = np.asarray(img).astype(np.float64)
    h, w = arr.shape[:2]

    y0, y1 = BAND
    rebuilt = arr.copy()

    # Rebuild the sky across the disc: for each row, a straight ramp between
    # the two reference columns. The sky there is a smooth gradient, so a
    # linear blend is indistinguishable from the real thing.
    span = RIGHT_REF - LEFT_REF
    left = arr[y0:y1, LEFT_REF - 3:LEFT_REF + 4].mean(axis=1)      # (rows, 3)
    right = arr[y0:y1, RIGHT_REF - 3:RIGHT_REF + 4].mean(axis=1)
    t = np.linspace(0.0, 1.0, span)[None, :, None]                  # (1, span, 1)
    ramp = left[:, None, :] * (1 - t) + right[:, None, :] * t
    rebuilt[y0:y1, LEFT_REF:RIGHT_REF] = ramp

    # Blend the rebuild in through a soft elliptical mask, so nothing shows a
    # seam and the surrounding glow is untouched.
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - CENTRE[0]) / RADIUS[0]) ** 2 +
                ((yy - CENTRE[1]) / RADIUS[1]) ** 2)
    mask = np.clip((1.0 - d) / 0.35, 0.0, 1.0)          # 1 inside, feathered out
    mask = (mask ** 2 * (3 - 2 * mask))[..., None]      # smoothstep

    out = arr * (1 - mask) + rebuilt * mask
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(DEST)

    before = arr[CENTRE[1] - 10:CENTRE[1] + 10, CENTRE[0] - 10:CENTRE[0] + 10].mean()
    after = out[CENTRE[1] - 10:CENTRE[1] + 10, CENTRE[0] - 10:CENTRE[0] + 10].mean()
    print(f"disc centre luminance {before:.0f} -> {after:.0f}")
    print(f"wrote {DEST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
