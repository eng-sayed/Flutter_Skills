# Flutter_Skills — icraft

Agent Skills for iCraft Flutter work. Same `SKILL.md` format on **Cursor**, **Claude Code**, and **Codex**.

Branch: **`icraft`**

## Skills on this branch

| Skill | Trigger | What it does |
|-------|---------|----------------|
| `storeshots` | `/storeshots` · سكرينات الاستور | App Store + Play screenshots, Feature Graphic, 512 icon, listing copy |
| `prod` | `/prod` · release | iOS archive then (on request) Android appbundle |
| `build_test` | `/build_test` · ارفع تيست | Android APK → Firebase App Distribution (`testers`) |
| `build-new-app` | `/build-new-app` · اعمل اب جديد | Scaffold from `flutter_clean_arch_base` |

Canonical files live in **`.agents/skills/`** (Codex + Cursor).  
`.claude/skills/`, `.cursor/skills/`, and `.codex/skills/` are **symlinks** to the same folders so opening this repo in any of those tools loads the skills.

## Install (every machine)

```bash
git clone -b icraft https://github.com/eng-sayed/Flutter_Skills.git
cd Flutter_Skills
./install.sh
```

`install.sh` symlinks the four skills into:

| Tool | User (all projects) | Project (this repo) |
|------|---------------------|---------------------|
| Cursor | `~/.cursor/skills/` and `~/.agents/skills/` | `.cursor/skills/` · `.agents/skills/` |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` · `~/.codex/skills/` | `.agents/skills/` · `.codex/skills/` |

Restart the app/CLI after install. Then invoke `/prod`, `/build_test`, `/build-new-app`, or `/storeshots`.

`storeshots` also needs Python once: `install.sh` runs its `setup.sh` (`pillow` + Playwright Chromium).

## Layout

```
.agents/skills/          ← source of truth
  storeshots/            ← includes tool/ HTML + fonts + scripts
  prod/
  build_test/
  build-new-app/
.claude/skills/ → symlink
.cursor/skills/ → symlink
.codex/skills/  → symlink
install.sh
```

## Notes

- Paths use `$HOME/Desktop/projects` and `$HOME/Downloads` — not a specific username.
- `storeshots`: copy the **whole folder** (`tool/` is required). Do not send `SKILL.md` alone.
- `build-new-app` expects the base repo at `$HOME/Desktop/projects/flutter_clean_arch_base`.
