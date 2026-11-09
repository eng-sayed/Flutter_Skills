# figma-fidelity.md — Every phone frame, pixel-faithful

A feature is not done until **every phone FRAME** assigned to it is implemented, reachable from splash, and checked against its Figma screenshot.

## Before writing UI

For each frame:

1. `get_design_context` and `get_screenshot` on that node (load `/figma-design-to-code` first).
2. Export every fill that is an image, SVG, PNG, or GIF with Figma export / `download_figma_images`. Save **unchanged** into `assets/svg/app_svg/` or `assets/images/`. Do not redraw, recolor, simplify, or replace with `Icons.*`.
3. If a back control exists in the frame, use that exported glyph (size and asset from Figma). Do not substitute a different chevron.
4. State variants (empty, selected, error, success) are their own frames or explicit states on the same screen. Do not drop them.

## While writing UI

- Tokens only: `AppColors`, `AppSize` / `AppPadding` / `AppCircular`, `AppAssets`, `LocaleKeys`.
- RTL: `start` / `end`. First `Row` child is the physical right in Arabic.
- Font sizes: Figma ≤ 13 keep; 14–18 reduce 1–2; ≥ 20 reduce 2. Screen body padding > 12 reduce 2–4.
- No hardcoded Arabic/English in widgets. Keys go through the orchestrator `lang.json` (`<feature>.pending.md`).

## Done means

- Screenshot compared (spacing, order, assets, colors).
- Loading, empty, and error states exist for every API-backed screen.
- The frame’s row in `.cursor/prompt/tasks/_coverage.md` is `done`.
