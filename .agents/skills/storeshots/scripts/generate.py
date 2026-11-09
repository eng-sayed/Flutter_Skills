#!/usr/bin/env python3
"""Generate App Store / Play screenshots and Play Feature Graphic via StoreShots."""
from __future__ import annotations

import argparse
import http.server
import shutil
import socket
import threading
import zipfile
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

SKILL_ROOT = Path(__file__).resolve().parent.parent
TOOL = SKILL_ROOT / "tool"
BUNDLED_FONT = SKILL_ROOT / "assets" / "fonts" / "ThmanyahSans-Black.woff2"
SCREEN_PRESETS = ["1206x2622", "1179x2556", "1080x1920"]
APPLE_HEADERS = ["5244x2950", "3840x1646"]
PLAY_FEATURE = "1024x500"
MAX_FEATURE_BYTES = 15 * 1024 * 1024


def tool_dir() -> Path:
    if (TOOL / "index.html").exists():
        return TOOL
    raise SystemExit(
        f"StoreShots tool missing at {TOOL}. Copy the whole storeshots folder "
        "(SKILL.md + scripts/ + tool/ + assets/)."
    )


def resolve_font(explicit: str) -> Path | None:
    if explicit:
        p = Path(explicit).expanduser().resolve()
        if p.exists():
            return p
        raise SystemExit(f"missing font: {p}")
    if BUNDLED_FONT.exists():
        return BUNDLED_FONT
    return None


def flatten_rgb(im: Image.Image, fallback=(31, 59, 97)) -> Image.Image:
    if im.mode == "RGB":
        return im
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, fallback)
        bg.paste(im, mask=im.split()[3])
        return bg
    return im.convert("RGB")


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def serve(root: Path, port: int) -> http.server.HTTPServer:
    handler = lambda *a, **k: http.server.SimpleHTTPRequestHandler(*a, directory=str(root), **k)
    httpd = http.server.HTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="StoreShots exporter")
    p.add_argument("--shots", nargs="+", required=True, help="App screenshots in order")
    p.add_argument("--titles", nargs="*", default=[], help="Headline per screenshot")
    p.add_argument("--c1", default="#1F3B61")
    p.add_argument("--c2", default="#0079FD")
    p.add_argument("--logo", default="")
    p.add_argument("--name", default="app")
    p.add_argument("--out", default=str(Path.home() / "Downloads"))
    p.add_argument("--apple-headers", action="store_true")
    p.add_argument("--square", action="store_true")
    p.add_argument(
        "--font",
        default="",
        help="Optional woff2. Default: bundled assets/fonts/ThmanyahSans-Black.woff2",
    )
    return p.parse_args()


def apply_brand(page, titles, c1, c2):
    page.evaluate(
        """([titles, c1, c2]) => {
          state.background = "gradient";
          state.gradientStart = c1;
          state.gradientEnd = c2;
          state.gradientAngle = 90;
          state.frame = "island";
          state.frameColor = "#E8F0F6";
          state.headlineColor = "#ffffff";
          state.headlineSize = 78;
          state.headlineY = 12;
          state.headlineVisible = true;
          state.decorations = true;
          state.decorationStyle = "rings";
          state.decorationColor = "#ffffff";
          state.decorationOpacity = 28;
          state.shadow = true;
          state.scale = 78;
          state.x = 50;
          state.y = 59;
          state.rotation = 0;
          state.pages.forEach((p, i) => { p.headline = titles[i] || ""; });
          document.getElementById("exportFormat").value = "png";
          document.getElementById("exportQuality").value = "0.92";
          syncControls(); updateQualityLabels(); updateExportLabel(); render();
        }""",
        [titles, c1, c2],
    )


def set_preset(page, value: str):
    page.evaluate(
        """(value) => {
          const sel = document.getElementById("canvasPreset");
          sel.value = value;
          sel.dispatchEvent(new Event("change", {bubbles: true}));
        }""",
        value,
    )
    page.wait_for_timeout(200)


def download_click(page, dest: Path, timeout=180000) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with page.expect_download(timeout=timeout) as info:
        page.click("#exportButton")
    info.value.save_as(str(dest))
    print("OK", dest, dest.stat().st_size)
    return dest


def unpack_screens(zip_path: Path, dest_dir: Path, expected: tuple[int, int], fill) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    tmp = dest_dir.parent / f".tmp-{dest_dir.name}"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir()
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(tmp)
    files = sorted(tmp.glob("*.png")) + sorted(tmp.glob("*.jpg"))
    for i, src in enumerate(files, 1):
        im = flatten_rgb(Image.open(src), fill)
        if im.size != expected:
            raise SystemExit(f"size mismatch {src.name}: {im.size} != {expected}")
        im.save(dest_dir / f"screenshot_{i:02d}.png", "PNG")
    shutil.rmtree(tmp)


def main() -> None:
    args = parse_args()
    shots = [Path(s).expanduser().resolve() for s in args.shots]
    missing = [str(s) for s in shots if not s.exists()]
    if missing:
        raise SystemExit("missing shots: " + ", ".join(missing))
    titles = list(args.titles)
    while len(titles) < len(shots):
        titles.append("")
    logo = Path(args.logo).expanduser().resolve() if args.logo else None
    if logo and not logo.exists():
        raise SystemExit(f"missing logo: {logo}")

    out_root = Path(args.out).expanduser().resolve()
    work = out_root / f".{args.name}-storeshots-work"
    final = work / "pack"
    if work.exists():
        shutil.rmtree(work)
    final.mkdir(parents=True)

    fill = tuple(int(args.c1.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4))
    port = free_port()
    httpd = serve(tool_dir(), port)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_context(accept_downloads=True, viewport={"width": 1600, "height": 1100}).new_page()
            page.goto(f"http://127.0.0.1:{port}/", wait_until="networkidle", timeout=30000)
            page.wait_for_function("() => typeof state !== 'undefined' && typeof addScreenshots === 'function'")

            font = resolve_font(args.font)
            if font:
                import base64
                b64 = base64.b64encode(font.read_bytes()).decode()
                page.evaluate(
                    """async (b64) => {
                      const face = new FontFace("Noto Sans Arabic", `url(data:font/woff2;base64,${b64})`, {weight: "800"});
                      await face.load(); document.fonts.add(face);
                    }""",
                    b64,
                )

            page.set_input_files("#screenshotInput", [str(s) for s in shots])
            page.wait_for_function(f"() => state.pages.length === {len(shots)}", timeout=30000)
            apply_brand(page, titles, args.c1, args.c2)

            presets = list(SCREEN_PRESETS)
            if args.square:
                presets.append("1080x1080")
            folder_names = {
                "1206x2622": "AppStore_1206x2622",
                "1179x2556": "AppStore_1179x2556",
                "1080x1920": "Play_1080x1920",
                "1080x1080": "Square_1080x1080",
            }
            for preset in presets:
                set_preset(page, preset)
                zpath = work / f"screenshots-{preset}.zip"
                download_click(page, zpath)
                w, h = map(int, preset.split("x"))
                unpack_screens(zpath, final / folder_names[preset], (w, h), fill)

            if logo:
                page.set_input_files("#coverLogoInput", str(logo))
                page.wait_for_function("() => state.coverLogo", timeout=15000)
            if titles:
                page.evaluate("(t) => { if (state.pages[0]) state.pages[0].headline = t; }", titles[0])
            page.evaluate("() => { state.coverShowHeadline = true; applyCoverLayout('angled'); }")

            page.evaluate(
                """() => {
                  document.getElementById("exportFormat").value = "jpeg";
                  document.getElementById("exportQuality").value = "0.92";
                  updateQualityLabels(); updateExportLabel();
                }"""
            )
            set_preset(page, PLAY_FEATURE)
            feature_src = work / "play-feature-graphic-1024x500.jpg"
            download_click(page, feature_src)
            feat = flatten_rgb(Image.open(feature_src), fill)
            if feat.size != (1024, 500):
                raise SystemExit(f"feature graphic size {feat.size}")
            feat.save(final / "play-feature-graphic-1024x500.jpg", "JPEG", quality=92)
            size = (final / "play-feature-graphic-1024x500.jpg").stat().st_size
            if size > MAX_FEATURE_BYTES:
                raise SystemExit(f"feature graphic {size} bytes > 15 MB")

            if args.apple_headers:
                page.evaluate(
                    """() => {
                      document.getElementById("exportFormat").value = "png";
                      document.getElementById("exportQuality").value = "0.92";
                      updateQualityLabels(); updateExportLabel();
                    }"""
                )
                for preset in APPLE_HEADERS:
                    set_preset(page, preset)
                    src = work / f"apple-header-{preset}.png"
                    download_click(page, src)
                    w, h = map(int, preset.split("x"))
                    im = flatten_rgb(Image.open(src), fill)
                    if im.size != (w, h):
                        raise SystemExit(f"header {preset} size {im.size}")
                    im.save(final / f"apple-header-{preset}.png", "PNG")

            browser.close()
    finally:
        httpd.shutdown()

    zip_path = out_root / f"{args.name}-store-screenshots.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(final.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(final))
    shutil.copy(final / "play-feature-graphic-1024x500.jpg", out_root / f"{args.name}-play-feature-graphic-1024x500.jpg")
    shutil.rmtree(work)
    print("ZIP", zip_path, zip_path.stat().st_size)


if __name__ == "__main__":
    main()
