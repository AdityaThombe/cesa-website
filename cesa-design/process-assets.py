"""Turn the generated scene art into web-ready parallax layers.

    python process-assets.py

Reads the raw PNGs out of Downloads, keys the chroma background, despills the
edges, crops/pads per layer, resizes, and writes WebP (plus AVIF where Pillow
supports it) into the site's public/scene directory.

Everything layer-specific lives in LAYERS below — that table is the spec.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path.home() / "Downloads"
OUT = Path(__file__).resolve().parent.parent / "cesa-site" / "public" / "scene"


@dataclass
class Layer:
    src: str
    out: str
    width: int
    key: str = "green"          # green | magenta | glow | white | none | alpha
    crop: tuple[float, float] = (0.0, 1.0)   # keep this vertical fraction
    pad: int = 0                # transparent bleed added on every side
    trim: bool = True           # cut fully-transparent margins before padding
    note: str = ""


# Order roughly back-to-front. Widths are the exported pixel width; the scene is
# composed at 2560 CSS px, so 2560 here is 1x and the smaller layers are sized
# to the space they actually occupy.
LAYERS: list[Layer] = [
    # Positions for these live in components/scene/sceneConfig.ts and come from
    # the aligned Figma frame. Crops here must not change: each Figma box was
    # measured against a specific export, so trimming a layer that was placed
    # untrimmed would silently shift it.
    Layer("background-nosun.png", "background", 1600, key="none",
          note="baked scene, sun disc painted out so it does not double with the placed sun"),
    Layer("sun.png", "sun", 1400, key="glow", trim=False,
          note="luminance alpha, un-premultiplied"),
    Layer("Tree trunk.png", "tree-trunk", 1500, key="green", pad=160),
    Layer("L6-canopy-1.png", "canopy-1", 760, key="green", pad=60),
    Layer("L6-canopy-2.png", "canopy-2", 620, key="green", pad=60),
    Layer("L6-canopy-3.png", "canopy-3", 820, key="green", pad=60,
          note="not in the current composition; kept so the file exists"),
    Layer("L6-canopy-4.png", "canopy-4", 900, key="white", trim=False,
          note="white screen - keyed on brightness, kept at full canvas"),
    Layer("Foreground branch.png", "branch", 1920, key="green", pad=220,
          note="not in the current composition; kept so the file exists"),
    Layer("L8-petals.png", "petals", 1600, key="green",
          note="sprite sheet - sliced separately"),
    Layer("torn-edge.png", "torn-edge", 2560, key="green"),
    Layer("washi-paper.png", "washi-paper", 1024, key="none",
          note="seamless tile - never pad or crop this"),
    Layer("Plethora spotlight scene (§S6).png", "plethora", 2400, key="none"),
    Layer("rope-hook-cutout.png", "rope-hook", 700, key="alpha",
          note="already keyed by unscreen.py; passed through, only resized"),
    Layer("sign-plank.png", "sign-plank", 700, key="alpha",
          note="already a transparent cutout, pulled straight from Figma"),
    Layer("member-card-github.png", "icon-github", 160, key="alpha",
          note="Member Card's GitHub badge, pulled straight from Figma"),
    Layer("cesa-lantern.png", "lantern", 700, key="green", pad=40,
          note="team-walk corridor prop, hung from lamp posts"),
    Layer("cesa-torii-gate.png", "torii-gate", 1400, key="green", pad=40,
          note="team-walk corridor entrance, replaces the procedural ink-box gate"),
    Layer("cesa-path-ground.png", "path-ground", 1600, key="none", trim=False,
          note="team-walk ground texture — flat top-down mud/petals, no green "
               "screen, meant to be tiled with RepeatWrapping not shown once"),
    Layer("cesa-side-plants.png", "side-plants", 900, key="green", pad=30,
          note="team-walk path-edge grass/flower clump, repeated along both shoulders"),
    Layer("cesa-ground-lantern.png", "ground-lantern", 600, key="green", pad=30,
          note="team-walk stone lantern (toro), replaces the procedural pole+bulb lamps"),
    Layer("cesa-roped-lanterns.png", "roped-lanterns", 1600, key="green", pad=20,
          note="team-walk overhead garland, strung across the path at each lamp stop"),
    Layer("cesa-field-grass.png", "field-grass", 1600, key="none", trim=False,
          note="team-walk side-field texture, flat top-down meadow, tiled with RepeatWrapping"),
    Layer("cesa-fence.png", "fence", 900, key="green", pad=20,
          note="team-walk low garden fence, repeated along both shoulders"),
    Layer("cesa-tree-a.png", "tree-a", 1200, key="green", pad=40,
          note="team-walk cherry tree variant A (leaning), alternated with tree-b"),
    Layer("cesa-tree-b.png", "tree-b", 1200, key="green", pad=40,
          note="team-walk cherry tree variant B (symmetric), alternated with tree-a"),
    Layer("cesa-end-wall.png", "end-wall", 2600, key="green", pad=20,
          note="team-walk closing backdrop, spans the full path width at the far end"),
    Layer("cesa-mountains-temple.png", "mountains-temple", 2400, key="none",
          note="team-walk far-horizon backdrop, no keying needed, full painted sky-to-ridge plate"),
]


def chroma_alpha(rgb: np.ndarray, key: str) -> np.ndarray:
    """Alpha in 0..1. 0 where the pixel is the key colour, 1 where it is art."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == "green":
        # How much green exceeds the strongest of the other two channels.
        excess = g - np.maximum(r, b)
    elif key == "magenta":
        excess = np.minimum(r, b) - g
    else:
        raise ValueError(key)

    # Below `lo` is certainly art, above `hi` certainly background; between the
    # two we get a soft edge, which is what keeps petal and leaf tips alive.
    lo, hi = 20.0, 90.0
    return 1.0 - np.clip((excess - lo) / (hi - lo), 0.0, 1.0)


def despill(rgb: np.ndarray, key: str) -> np.ndarray:
    """Pull the key colour back out of edge pixels that picked it up."""
    out = rgb.copy()
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    if key == "green":
        ceiling = np.maximum(r, b)
        out[..., 1] = np.where(g > ceiling, ceiling, g)
    elif key == "magenta":
        floor = np.minimum(r, b)
        # magenta spill lifts R and B together; clamp them toward G
        lift = np.maximum(floor - g, 0.0) * 0.5
        out[..., 0] = r - lift
        out[..., 2] = b - lift
    return out


def force_black_edges(rgb: np.ndarray) -> np.ndarray:
    """Radial falloff to true black, so `screen` blend shows no rectangle."""
    h, w = rgb.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    cy, cx = (h - 1) / 2, (w - 1) / 2
    # normalised radius, 0 at centre, 1 at the nearest edge midpoint
    dist = np.sqrt(((yy - cy) / cy) ** 2 + ((xx - cx) / cx) ** 2) / np.sqrt(2)
    falloff = np.clip((0.98 - dist) / 0.22, 0.0, 1.0)[..., None]
    return rgb * falloff


def save(img: Image.Image, stem: str) -> list[str]:
    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    webp = OUT / f"{stem}.webp"
    img.save(webp, "WEBP", quality=86, method=6)
    written.append(f"{webp.name} {webp.stat().st_size // 1024}KB")
    try:
        avif = OUT / f"{stem}.avif"
        img.save(avif, "AVIF", quality=62)
        written.append(f"{avif.name} {avif.stat().st_size // 1024}KB")
    except Exception:
        pass  # Pillow build without AVIF support; WebP alone is fine
    return written


def process(layer: Layer) -> None:
    path = SRC / layer.src
    if not path.exists():
        print(f"  MISSING  {layer.src}")
        return

    if layer.key == "alpha":
        # Already a real transparent cutout (keyed elsewhere, or exported
        # straight off a Figma layer with its own alpha) — pass it through
        # untouched instead of flattening to opaque RGB.
        out = Image.open(path).convert("RGBA")
        if layer.trim:
            box = out.getchannel("A").getbbox()
            if box:
                out = out.crop(box)
        if layer.pad:
            padded = Image.new("RGBA", (out.width + layer.pad * 2,
                                        out.height + layer.pad * 2), (0, 0, 0, 0))
            padded.paste(out, (layer.pad, layer.pad))
            out = padded
        target = layer.width
        if target > out.width:
            print(f"  NOTE     {layer.out}: source is only {out.width}px wide, "
                  f"wanted {target}px — exporting at source size rather than "
                  f"upscaling.")
            target = out.width
        if out.width != target:
            h = round(out.height * target / out.width)
            out = out.resize((target, h), Image.LANCZOS)
        files = save(out, layer.out)
        tail = f"  ({layer.note})" if layer.note else ""
        print(f"  {layer.out:<14} {out.width}x{out.height}  " + "  ".join(files) + tail)
        return

    img = Image.open(path).convert("RGB")
    arr = np.asarray(img).astype(np.float64)

    top, bottom = layer.crop
    if (top, bottom) != (0.0, 1.0):
        h = arr.shape[0]
        arr = arr[int(h * top):int(h * bottom), :, :]

    if layer.key in ("green", "magenta"):
        alpha = chroma_alpha(arr, layer.key)
        arr = despill(arr, layer.key)
        rgba = np.dstack([arr, alpha * 255.0])
    elif layer.key == "glow":
        # A glow painted on black is premultiplied: brightness IS coverage.
        # Take alpha from luminance, then un-premultiply so it composites over
        # the sky rather than only over black.
        alpha = np.clip(arr.max(axis=2) / 255.0, 0.0, 1.0)
        rgba = np.dstack([np.clip(arr / np.maximum(alpha, 1e-3)[..., None], 0, 255),
                          alpha * 255.0])
    elif layer.key == "white":
        # No hue to key on, so key on distance from white. Wide ramp, because
        # the subject's own highlights sit close to the background.
        excess = 255.0 - (255.0 - arr.min(axis=2)) * 3.0
        alpha = 1.0 - np.clip((excess - 20.0) / 70.0, 0.0, 1.0)
        rgba = np.dstack([arr, alpha * 255.0])
    else:
        rgba = np.dstack([arr, np.full(arr.shape[:2], 255.0)])

    out = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")

    # The generator leaves wide empty margins around most subjects, and those
    # margins make the layer's CSS box far bigger than the art inside it — so
    # sizing by percentage puts the visible content in the wrong place. Trim to
    # the content, then add deliberate bleed.
    if layer.trim and layer.key in ("green", "magenta"):
        # Alpha channel only: keyed-out pixels keep their (despilled) RGB, so a
        # whole-image getbbox would find no margin to trim at all.
        box = out.getchannel("A").getbbox()
        if box:
            out = out.crop(box)

    if layer.pad:
        padded = Image.new("RGBA", (out.width + layer.pad * 2,
                                    out.height + layer.pad * 2), (0, 0, 0, 0))
        padded.paste(out, (layer.pad, layer.pad))
        out = padded

    target = layer.width
    if target > out.width:
        print(f"  NOTE     {layer.out}: source is only {out.width}px wide, "
              f"wanted {target}px — exporting at source size rather than "
              f"upscaling. Re-download this asset at full resolution.")
        target = out.width
    if out.width != target:
        h = round(out.height * target / out.width)
        out = out.resize((target, h), Image.LANCZOS)

    if layer.key == "none":
        out = out.convert("RGB")

    files = save(out, layer.out)
    tail = f"  ({layer.note})" if layer.note else ""
    print(f"  {layer.out:<14} {out.width}x{out.height}  " + "  ".join(files) + tail)


def main() -> int:
    if not SRC.exists():
        print(f"source directory not found: {SRC}")
        return 2
    print(f"\nsource {SRC}\noutput {OUT}\n")
    for layer in LAYERS:
        process(layer)

    total = sum(f.stat().st_size for f in OUT.glob("*") if f.is_file())
    print(f"\ntotal {total / 1_048_576:.2f} MB written")
    print("(budget is 1.6 MB for the layers the hero actually loads;\n"
          " plethora, washi and petals load later or on other routes)\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
