"""One-off processor for the three new hero/about assets pulled from the
Figma file GCeABSi7E0WdNDYKKObWS9 (node 9:26): the CESA wordmark badge (white
bg), the nav pill shape (solid dark-teal bg), and the About-Us wood sign
(already alpha, Adobe Firefly background-removal output).
"""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(__file__).resolve().parent
OUT = SRC.parent / "cesa-site" / "public" / "scene"


def save(img: Image.Image, stem: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{stem}.webp", "WEBP", quality=90, method=6)
    try:
        img.save(OUT / f"{stem}.avif", "AVIF", quality=68)
    except Exception:
        pass


def trim(img: Image.Image) -> Image.Image:
    box = img.getchannel("A").getbbox()
    return img.crop(box) if box else img


# --- logo badge: white background -> alpha, keep the black wordmark -------
logo = Image.open(SRC / "logo-badge-raw.png").convert("RGBA")
arr = np.asarray(logo).astype(np.float32)
rgb, a = arr[..., :3], arr[..., 3]
# distance from pure white; art (near-black) is far from white, bg is close
dist = 255.0 - rgb.min(axis=-1)  # 0 where pixel is white, up to 255 where black
alpha = np.clip((dist - 12) / (60 - 12), 0, 1) * (a / 255.0)
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
logo_img = trim(Image.fromarray(out, "RGBA"))
save(logo_img, "logo-badge")
print("logo-badge", logo_img.size)

# --- nav pill: solid dark-teal background -> alpha -------------------------
pill = Image.open(SRC / "nav-pill-raw.png").convert("RGBA")
arr = np.asarray(pill).astype(np.float32)
rgb = arr[..., :3]
bg = rgb[2, 2]  # sample a corner pixel as the background colour
d = np.sqrt(((rgb - bg) ** 2).sum(axis=-1))
lo, hi = 18.0, 55.0
alpha = np.clip((d - lo) / (hi - lo), 0, 1)
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
pill_img = trim(Image.fromarray(out, "RGBA"))
save(pill_img, "nav-pill")
print("nav-pill", pill_img.size, "bg sampled", bg)

# --- about frame: already alpha, just trim -------------------------------
frame = Image.open(SRC / "about-frame-raw.png").convert("RGBA")
frame_img = trim(frame)
save(frame_img, "about-frame")
print("about-frame", frame_img.size)
