"""Remove a flat chroma background from an image and write a transparent PNG.

    python unscreen.py "C:/Users/adity/Downloads/whatever.png"
    python unscreen.py input.png --key green --out cleaned.png --no-trim

The key colour is detected from the border pixels unless you name one. Handles
green, magenta, blue and white screens; white is keyed on brightness rather
than hue, so pale subjects on white will lose their lightest edges — that is a
limit of white screens, not of this script.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

# Soft edge: below `lo` is certainly subject, above `hi` certainly background.
# The ramp between them is what keeps petal tips and fine branches alive.
LO, HI = 20.0, 90.0


def detect_key(rgb: np.ndarray) -> str:
    """Guess the screen colour from a border sample."""
    h, w = rgb.shape[:2]
    band = max(2, min(h, w) // 100)
    border = np.concatenate([
        rgb[:band].reshape(-1, 3), rgb[-band:].reshape(-1, 3),
        rgb[:, :band].reshape(-1, 3), rgb[:, -band:].reshape(-1, 3),
    ])
    r, g, b = border.mean(axis=0)

    if g > r + 40 and g > b + 40:
        return "green"
    if r > g + 40 and b > g + 40:
        return "magenta"
    if b > r + 40 and b > g + 40:
        return "blue"
    if min(r, g, b) > 200:
        return "white"
    if max(r, g, b) < 40:
        return "black"
    raise SystemExit(
        f"Could not identify a flat background (border averages "
        f"R{r:.0f} G{g:.0f} B{b:.0f}). Pass --key explicitly."
    )


def alpha_for(rgb: np.ndarray, key: str) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "green":
        excess = g - np.maximum(r, b)
    elif key == "magenta":
        excess = np.minimum(r, b) - g
    elif key == "blue":
        excess = b - np.maximum(r, g)
    elif key == "white":
        # No hue to key on, so use distance from white. Wide ramp, because the
        # subject's own highlights sit close to the background.
        excess = 255.0 - (255.0 - np.minimum(np.minimum(r, g), b)) * 3.0
    elif key == "black":
        excess = 255.0 - np.maximum(np.maximum(r, g), b) * 3.0
    elif key == "glow":
        # A glow on black is already premultiplied: its brightness IS its
        # coverage. Threshold it and you get a hard-edged disc; take alpha
        # from luminance and the falloff survives intact.
        return np.clip(np.maximum(np.maximum(r, g), b) / 255.0, 0.0, 1.0)
    else:
        raise SystemExit(f"unknown key: {key}")
    return 1.0 - np.clip((excess - LO) / (HI - LO), 0.0, 1.0)


def despill(rgb: np.ndarray, key: str) -> np.ndarray:
    """Pull the screen colour back out of edge pixels that picked it up."""
    out = rgb.copy()
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    if key == "green":
        out[..., 1] = np.minimum(g, np.maximum(r, b))
    elif key == "magenta":
        lift = np.maximum(np.minimum(r, b) - g, 0.0) * 0.5
        out[..., 0] = r - lift
        out[..., 2] = b - lift
    elif key == "blue":
        out[..., 2] = np.minimum(b, np.maximum(r, g))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--out")
    ap.add_argument("--key", choices=["green", "magenta", "blue", "white", "black", "glow"])
    ap.add_argument("--no-trim", action="store_true",
                    help="keep fully transparent margins instead of cropping")
    args = ap.parse_args()

    src = Path(args.input)
    if not src.exists():
        raise SystemExit(f"not found: {src}")

    img = Image.open(src).convert("RGB")
    arr = np.asarray(img).astype(np.float64)

    key = args.key or detect_key(arr)
    alpha = alpha_for(arr, key)
    rgb = despill(arr, key)

    if key == "glow":
        # Un-premultiply, so the PNG carries straight alpha and composites
        # correctly over any background instead of only over black.
        safe = np.maximum(alpha, 1e-3)[..., None]
        rgb = np.clip(rgb / safe, 0, 255)

    out = Image.fromarray(
        np.clip(np.dstack([rgb, alpha * 255.0]), 0, 255).astype(np.uint8), "RGBA"
    )

    if not args.no_trim:
        # Alpha only: keyed-out pixels keep their RGB, so a whole-image getbbox
        # would find nothing to trim.
        box = out.getchannel("A").getbbox()
        if box:
            out = out.crop(box)

    dest = Path(args.out) if args.out else src.with_name(f"{src.stem}-cut.png")
    out.save(dest)

    clear = float((alpha < 0.04).mean()) * 100
    print(f"{src.name}  key={key}  {img.width}x{img.height} -> {out.width}x{out.height}")
    print(f"  {clear:.1f}% removed   wrote {dest}")
    if clear < 5:
        print("  WARNING: almost nothing was removed — wrong key, or the "
              "background is not flat.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
