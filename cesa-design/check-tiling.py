"""Check whether a texture tiles seamlessly.

Usage:  python check-tiling.py "C:/Users/adity/Downloads/grain.png"

Writes <name>-offset.png next to the source: the image wrapped by 50% in both
directions, so any seam appears as a cross through the middle. Look at it.
The numbers below tell you what to expect before you do.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image


def edge_report(a: np.ndarray, axis: int, label: str) -> bool:
    """Compare the wrap-around edge difference to normal interior differences."""
    if axis == 0:  # vertical seam: compare columns
        interior = np.abs(np.diff(a, axis=1)).mean()
        seam = np.abs(a[:, -1].astype(float) - a[:, 0].astype(float)).mean()
    else:  # horizontal seam: compare rows
        interior = np.abs(np.diff(a, axis=0)).mean()
        seam = np.abs(a[-1, :].astype(float) - a[0, :].astype(float)).mean()

    ratio = seam / interior if interior else float("inf")
    verdict = "OK" if ratio < 2.0 else "SEAM"
    print(f"  {label:<18} interior {interior:6.2f}   wrap {seam:6.2f}   "
          f"ratio {ratio:5.2f}   {verdict}")
    return ratio < 2.0


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    path = Path(sys.argv[1])
    img = Image.open(path)
    print(f"\n{path.name} — {img.width}x{img.height} {img.mode}")

    # float, not uint8: np.diff on uint8 wraps negative differences around to
    # large positives and the interior baseline becomes meaningless.
    a = np.asarray(img.convert("L")).astype(np.float64)

    # A seamless tile's opposite edges should differ no more than neighbouring
    # rows/columns do. Much more than that and you get a visible line.
    print("\nseam test (lower ratio is better, under 2.0 passes)")
    ok_v = edge_report(a, 0, "left <-> right")
    ok_h = edge_report(a, 1, "top <-> bottom")

    # Large-scale brightness drift shows up as blotches when tiled, even when
    # the edges themselves match.
    h, w = a.shape
    quads = [
        a[: h // 2, : w // 2], a[: h // 2, w // 2:],
        a[h // 2:, : w // 2], a[h // 2:, w // 2:],
    ]
    means = [q.mean() for q in quads]
    drift = max(means) - min(means)
    print(f"\nbrightness drift across quadrants: {drift:.2f} "
          f"({'OK' if drift < 6 else 'UNEVEN — will blotch when tiled'})")

    out = path.with_name(f"{path.stem}-offset.png")
    arr = np.asarray(img)
    rolled = np.roll(np.roll(arr, h // 2, axis=0), w // 2, axis=1)
    Image.fromarray(rolled).save(out)
    print(f"\nwrote {out.name} — open it and look for a cross-shaped seam\n")

    return 0 if (ok_v and ok_h) else 1


if __name__ == "__main__":
    raise SystemExit(main())
