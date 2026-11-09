#!/usr/bin/env python3
"""Rasterize an SVG/PNG logo onto a solid brand square (never white)."""
from __future__ import annotations

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright
from PIL import Image


def parse_bg(s: str) -> str:
    s = s.strip()
    if not s.startswith("#"):
        s = "#" + s
    if len(s) != 7:
        raise SystemExit(f"bad --bg {s!r}, expected #RRGGBB")
    return s


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--svg", help="SVG path")
    p.add_argument("--src", help="PNG/JPG fallback if no SVG")
    p.add_argument("--bg", required=True, help="Brand fill #RRGGBB (splash color)")
    p.add_argument("--out", required=True)
    p.add_argument("--size", type=int, default=1024)
    args = p.parse_args()
    bg = parse_bg(args.bg)
    out = Path(args.out).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    size = args.size

    src = args.svg or args.src
    if not src:
        raise SystemExit("pass --svg or --src")
    src_p = Path(src).expanduser().resolve()
    if not src_p.exists():
        raise SystemExit(f"missing {src_p}")

    if src_p.suffix.lower() == ".svg":
        html = f"""<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:{bg};width:{size}px;height:{size}px;display:flex;align-items:center;justify-content:center;">
  <img src="{src_p.as_uri()}" style="width:78%;height:auto;" />
</body></html>"""
        page_path = out.parent / f".{out.stem}-logo.html"
        page_path.write_text(html)
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": size, "height": size})
            page.goto(page_path.as_uri(), wait_until="networkidle")
            page.screenshot(path=str(out), type="png")
            browser.close()
        page_path.unlink(missing_ok=True)
    else:
        im = Image.open(src_p).convert("RGBA")
        canvas = Image.new("RGB", (size, size), tuple(int(bg[i : i + 2], 16) for i in (1, 3, 5)))
        fit = min(size, int(size * 0.78))
        im.thumbnail((fit, fit), Image.Resampling.LANCZOS)
        x = (size - im.width) // 2
        y = (size - im.height) // 2
        canvas.paste(im, (x, y), im)
        canvas.save(out, "PNG")
    print("OK", out, Image.open(out).size)


if __name__ == "__main__":
    main()
