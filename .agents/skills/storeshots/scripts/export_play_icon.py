#!/usr/bin/env python3
"""Export a Google Play hi-res icon: 512×512 PNG RGB, no alpha."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_bg(s: str) -> tuple[int, int, int]:
    s = s.strip().lstrip("#")
    if len(s) != 6:
        raise SystemExit(f"bad --bg {s!r}")
    return tuple(int(s[i : i + 2], 16) for i in (0, 2, 4))


def to_rgb(im: Image.Image, bg: tuple[int, int, int]) -> Image.Image:
    if im.mode == "RGB":
        return im
    if im.mode == "RGBA":
        base = Image.new("RGB", im.size, bg)
        base.paste(im, mask=im.split()[3])
        return base
    return im.convert("RGB")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--src", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--bg", default="#E4B16E", help="Flatten alpha onto this fill")
    p.add_argument("--size", type=int, default=512)
    args = p.parse_args()
    src = Path(args.src).expanduser().resolve()
    out = Path(args.out).expanduser().resolve()
    if not src.exists():
        raise SystemExit(f"missing {src}")
    out.parent.mkdir(parents=True, exist_ok=True)
    bg = parse_bg(args.bg)
    im = to_rgb(Image.open(src), bg).resize((args.size, args.size), Image.Resampling.LANCZOS)
    im.save(out, "PNG")
    print("OK", out, im.mode, im.size, out.stat().st_size)


if __name__ == "__main__":
    main()
