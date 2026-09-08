"""Small GUI for unscreen.py — pick a file, pick a key, save the cutout.

    python unscreen-gui.py

Reuses the exact keying/despill logic from unscreen.py so results are
identical to the CLI. Standard library + Pillow + numpy only, nothing new
to install if unscreen.py already runs on this machine.
"""

from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

import numpy as np
from PIL import Image, ImageTk

from unscreen import alpha_for, despill, detect_key

PREVIEW_MAX = 340
CHECKER = 10


def checkerboard(size: tuple[int, int]) -> Image.Image:
    w, h = size
    board = Image.new("RGB", (w, h))
    px = board.load()
    for y in range(h):
        for x in range(w):
            light = (x // CHECKER + y // CHECKER) % 2 == 0
            px[x, y] = (240, 240, 240) if light else (206, 206, 206)
    return board


def fit(img: Image.Image, max_side: int) -> Image.Image:
    scale = min(max_side / img.width, max_side / img.height, 1.0)
    if scale == 1.0:
        return img
    return img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Unscreen")
        self.resizable(False, False)
        self.configure(padx=14, pady=14, bg="#1e1c20")

        self.src_path: Path | None = None
        self.result: Image.Image | None = None
        self.src_photo: ImageTk.PhotoImage | None = None
        self.result_photo: ImageTk.PhotoImage | None = None

        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TLabel", background="#1e1c20", foreground="#ede2cf")
        style.configure("TButton", padding=6)
        style.configure("TCheckbutton", background="#1e1c20", foreground="#ede2cf")
        style.configure("TFrame", background="#1e1c20")

        top = ttk.Frame(self)
        top.pack(fill="x", pady=(0, 10))
        ttk.Button(top, text="Open image…", command=self.open_image).pack(side="left")
        self.path_label = ttk.Label(top, text="No file chosen", foreground="#a89a86")
        self.path_label.pack(side="left", padx=10)

        controls = ttk.Frame(self)
        controls.pack(fill="x", pady=(0, 10))

        ttk.Label(controls, text="Key").pack(side="left")
        self.key_var = tk.StringVar(value="auto")
        key_menu = ttk.Combobox(
            controls, textvariable=self.key_var, state="readonly", width=10,
            values=["auto", "green", "magenta", "blue", "white", "black", "glow"],
        )
        key_menu.pack(side="left", padx=(6, 18))
        key_menu.bind("<<ComboboxSelected>>", lambda e: self.process())

        self.trim_var = tk.BooleanVar(value=True)
        trim_check = ttk.Checkbutton(controls, text="Trim transparent margin", variable=self.trim_var,
                                      command=self.process)
        trim_check.pack(side="left")

        previews = ttk.Frame(self)
        previews.pack()
        src_col = ttk.Frame(previews)
        src_col.pack(side="left", padx=(0, 10))
        ttk.Label(src_col, text="Source").pack()
        self.src_canvas = tk.Label(src_col, bg="#2a2730", width=PREVIEW_MAX, height=PREVIEW_MAX)
        self.src_canvas.pack()

        result_col = ttk.Frame(previews)
        result_col.pack(side="left")
        ttk.Label(result_col, text="Cutout").pack()
        self.result_canvas = tk.Label(result_col, bg="#2a2730", width=PREVIEW_MAX, height=PREVIEW_MAX)
        self.result_canvas.pack()

        self.status = ttk.Label(self, text="", foreground="#a89a86")
        self.status.pack(fill="x", pady=(10, 6))

        bottom = ttk.Frame(self)
        bottom.pack(fill="x")
        self.save_button = ttk.Button(bottom, text="Save As…", command=self.save_as, state="disabled")
        self.save_button.pack(side="right")

    def open_image(self) -> None:
        chosen = filedialog.askopenfilename(
            title="Choose an image",
            filetypes=[("Images", "*.png *.jpg *.jpeg *.webp *.bmp"), ("All files", "*.*")],
        )
        if not chosen:
            return
        self.src_path = Path(chosen)
        self.path_label.configure(text=self.src_path.name)
        self.key_var.set("auto")
        self.show_source()
        self.process()

    def show_source(self) -> None:
        assert self.src_path is not None
        img = Image.open(self.src_path).convert("RGB")
        thumb = fit(img, PREVIEW_MAX)
        self.src_photo = ImageTk.PhotoImage(thumb)
        self.src_canvas.configure(image=self.src_photo)

    def process(self) -> None:
        if self.src_path is None:
            return
        try:
            img = Image.open(self.src_path).convert("RGB")
            arr = np.asarray(img).astype(np.float64)

            key = self.key_var.get()
            if key == "auto":
                key = detect_key(arr)
                self.key_var.set(key)

            alpha = alpha_for(arr, key)
            rgb = despill(arr, key)
            if key == "glow":
                safe = np.maximum(alpha, 1e-3)[..., None]
                rgb = np.clip(rgb / safe, 0, 255)

            out = Image.fromarray(
                np.clip(np.dstack([rgb, alpha * 255.0]), 0, 255).astype(np.uint8), "RGBA"
            )
            if self.trim_var.get():
                box = out.getchannel("A").getbbox()
                if box:
                    out = out.crop(box)

            self.result = out
            self.render_result()

            clear = float((alpha < 0.04).mean()) * 100
            note = "  (looks wrong — try a different key)" if clear < 5 else ""
            self.status.configure(text=f"key={key}   {out.width}x{out.height}   {clear:.1f}% removed{note}")
            self.save_button.configure(state="normal")
        except SystemExit as e:
            self.status.configure(text=str(e))
            self.save_button.configure(state="disabled")

    def render_result(self) -> None:
        assert self.result is not None
        thumb = fit(self.result, PREVIEW_MAX)
        board = checkerboard(thumb.size)
        board.paste(thumb, (0, 0), thumb)
        self.result_photo = ImageTk.PhotoImage(board)
        self.result_canvas.configure(image=self.result_photo)

    def save_as(self) -> None:
        if self.result is None or self.src_path is None:
            return
        dest = filedialog.asksaveasfilename(
            title="Save cutout",
            initialdir=self.src_path.parent,
            initialfile=f"{self.src_path.stem}-cut.png",
            defaultextension=".png",
            filetypes=[("PNG", "*.png")],
        )
        if not dest:
            return
        self.result.save(dest)
        messagebox.showinfo("Saved", f"Wrote {dest}")


if __name__ == "__main__":
    App().mainloop()
