# Flutter_Skills

Agent Skills for Flutter work. Same `SKILL.md` format on **Cursor**, **Claude Code**, and **Codex**.

Branch: **`main`** — public pack (`storeshots`, `prod`, `build_test`, `codex-plan`).  
iCraft-only skills (`build-new-app`, `clone`) live on branch **`icraft`**.

## Skills on this branch

| Skill | Trigger | What it does |
|-------|---------|----------------|
| `storeshots` | `/storeshots` · سكرينات الاستور | App Store + Play screenshots, Feature Graphic, 512 icon, listing copy |
| `prod` | `/prod` · release | iOS archive then (on request) Android appbundle |
| `build_test` | `/build_test` · ارفع تيست | Android APK → Firebase App Distribution (`testers`) |
| `codex-plan` | `/codex-plan` · `cp:` | Codex plans (read-only), Cursor executes |

Canonical files live in **`.agents/skills/`** (Codex + Cursor).  
`.claude/skills/`, `.cursor/skills/`, and `.codex/skills/` are **symlinks** to the same folders so opening this repo in any of those tools loads the skills.

## Install (every machine)

```bash
git clone https://github.com/eng-sayed/Flutter_Skills.git
cd Flutter_Skills
./install.sh
```

`install.sh` symlinks the skills into:

| Tool | User (all projects) | Project (this repo) |
|------|---------------------|---------------------|
| Cursor | `~/.cursor/skills/` and `~/.agents/skills/` | `.cursor/skills/` · `.agents/skills/` |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` · `~/.codex/skills/` | `.agents/skills/` · `.codex/skills/` |

Restart the app/CLI after install. Then invoke `/prod`, `/build_test`, `/codex-plan`, or `/storeshots`.

`storeshots` also needs Python once: `install.sh` runs its `setup.sh` (`pillow` + Playwright Chromium).

## Layout

```
.agents/skills/          ← source of truth
  storeshots/            ← includes tool/ HTML + fonts + scripts
  prod/
  build_test/
  codex-plan/
.claude/skills/ → symlink
.cursor/skills/ → symlink
.codex/skills/  → symlink
install.sh
```

## Notes

- Paths use `$HOME/Desktop/projects` and `$HOME/Downloads` — not a specific username.
- `storeshots`: copy the **whole folder** (`tool/` is required). Do not send `SKILL.md` alone.
