"""Cut individual petal sprites out of the generated sheet.

    python slice-petals.py

The sheet is a rough 4x3 grid but the spacing is irregular, so slicing it as
even cells clips edges. Instead we find connected regions of non-transparent
pixels and cut each to its own bounding box.

Four cells came back as whole blossoms and multi-petal clumps rather than single
petals (row 1 cols 1-2, row 2 cols 1-2). Those are dropped by grid position --
see REJECT below. Eight sprites is ample: at 20-40px on screen with ~40 petals
falling, repetition across eight is invisible.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path.home() / "Downloads" / "L8-petals.png"
OUT = Path(__file__).resolve().parent.parent / "cesa-site" / "public" / "petals"

# grid positions (row, col), 0-indexed, that are not single petals
REJECT = {(0, 0), (0, 1), (1, 0), (1, 1)}

MIN_AREA = 4000       # ignore stray specks and keying noise
ALPHA_CUTOFF = 128


def components(mask: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Bounding boxes of connected true-regions. Iterative BFS: the sheet is
    ~4MP and recursion would blow the stack."""
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    boxes = []

    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            queue = deque([(sy, sx)])
            seen[sy, sx] = True
            top = bottom = sy
            left = right = sx
            area = 0

            while queue:
                y, x = queue.popleft()
                area += 1
                top = min(top, y); bottom = max(bottom, y)
                left = min(left, x); right = max(right, x)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))

            if area >= MIN_AREA:
                boxes.append((left, top, right + 1, bottom + 1))
    return boxes


def main() -> int:
    if not SRC.exists():
        print(f"not found: {SRC}")
        return 2

    img = Image.open(SRC).convert("RGB")
    arr = np.asarray(img).astype(np.float64)

    # same green key as the main pipeline
    excess = arr[..., 1] - np.maximum(arr[..., 0], arr[..., 2])
    alpha = 1.0 - np.clip((excess - 20.0) / 70.0, 0.0, 1.0)

    ceiling = np.maximum(arr[..., 0], arr[..., 2])
    arr[..., 1] = np.minimum(arr[..., 1], ceiling)   # despill

    rgba = Image.fromarray(
        np.clip(np.dstack([arr, alpha * 255.0]), 0, 255).astype(np.uint8), "RGBA"
    )

    boxes = components(alpha * 255 >= ALPHA_CUTOFF)
    print(f"\n{len(boxes)} regions found in {img.width}x{img.height}")
    if not boxes:
        return 1

    # Assign each region to a grid cell by its centre, so REJECT can be
    # expressed in the terms we reviewed the sheet in.
    h, w = alpha.shape
    OUT.mkdir(parents=True, exist_ok=True)
    kept = 0

    for left, top, right, bottom in sorted(boxes, key=lambda b: (b[1], b[0])):
        cy = (top + bottom) / 2 / h
        cx = (left + right) / 2 / w
        row = min(2, int(cy * 3))
        col = min(3, int(cx * 4))

        tag = "reject" if (row, col) in REJECT else "keep"
        size = f"{right - left}x{bottom - top}"
        print(f"  r{row} c{col}  {size:>10}  {tag}")
        if tag == "reject":
            continue

        kept += 1
        sprite = rgba.crop((left, top, right, bottom))
        # 128px longest edge: canvas draws these at up to ~40px, 2x for retina
        scale = 128 / max(sprite.width, sprite.height)
        sprite = sprite.resize(
            (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
            Image.LANCZOS,
        )
        sprite.save(OUT / f"petal-{kept}.webp", "WEBP", quality=90, method=6)

    total = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    print(f"\nwrote {kept} sprites to {OUT}  ({total / 1024:.1f} KB total)\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
