# gitlab-card.md — GitLab project card (Adham format)

After the Flutter project exists on GitLab (empty repo or after first push), set **project description** + **avatar** so the group list shows: code, Design, Admin, Collection, app store, google play — same as `icraftsa/flutter/adham-hisham`.

**Do not** commit these changes into the repo. Updates are GitLab project settings only.

---

## When to run

| Moment | Action |
|--------|--------|
| End of **build-new-app** (phase 9.5) | Default: run card update for every GitLab URL collected in phase 0 |
| Repo not created yet | Ask user to create the project on GitLab (or give you the empty project URL), then run the script |
| Dual apps | One card per repo URL (App A + App B) |

Skip only if the user explicitly says they do not want GitLab cards.

---

## Phase 0 input (orchestrator asks)

Ask **after** one-vs-two apps, with the other required fields (or when they send the GitLab link):

> **لينك/لينكات GitLab اللي هترفع عليه المشروع؟**  
> مثال: `https://git.aait.cloud/icraftsa/flutter/sayed-ashraf/my-app`  
> (لو اتنين: لينك اليوزر ولينك البروفايدر)

Optional if the folder name already contains the ticket:

> **كود المشروع على GitLab؟** (مثل `CS54497` / `AA60347` / `2429`)  
> If omitted, derive from folder name: `maak-cs54497` → `CS54497`, `tawazon-2429` → `2429`.

---

## Description line (exact shape)

One line only (no Arabic paragraph before it):

```text
{CODE} - [Design](FIGMA) - [Admin]({BASE}/admin/login) - [Collection](POSTMAN) - [app store]() - [google play]()
```

| Field | Source in build-new-app |
|-------|-------------------------|
| `CODE` | Phase 0 project code or derived from folder |
| `Design` | Full **Figma URL** from phase 0 (user app → user Figma; provider → provider Figma). Empty → `[Design]()` |
| `Admin` | `{API base origin}/admin/login` — strip path after host (e.g. `https://foo.com/api/v1/` → `https://foo.com/admin/login`). Never use `/admin/dashboard`. |
| `Collection` | `documenter.getpostman.com/...` from Postman `info.description` if present; else Slack file URL; else `[Collection]()` |
| Stores | `[app store]()` / `[google play]()` unless user gave store URLs |

---

## Avatar

Use launcher from the **local project folder** (after rename):

`android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

GitLab max ~200 KiB; PNG from mipmap is fine.

---

## How to apply (agent MUST run)

This GitLab instance allows **GET** API with session cookie but **not** `PUT /projects/:id` (401). Use the **web form** via the skill script:

```bash
python3 ~/.cursor/skills/build-new-app/scripts/gitlab_project_card.py \
  --repo-url "https://git.aait.cloud/icraftsa/flutter/sayed-ashraf/<slug>" \
  --code "CS54497" \
  --figma "https://www.figma.com/proto/..." \
  --admin "https://example.com/admin/login" \
  --postman "https://documenter.getpostman.com/view/..." \
  --project-dir "$HOME/Desktop/projects/<slug>"
```

- `--postman` may be omitted (empty Collection link).
- `--figma` may be omitted (empty Design link).
- Script logs `desc_ok` / `avatar_ok`; on failure, report path and HTTP hint — do not guess links.

---

## Dual apps

Run the script **twice** with each repo URL, each `--project-dir`, and that app’s Figma / Postman / admin (admin may be shared).

---

## Relation to `git init` / push

- **Card update** does not require a git push; an empty GitLab project is enough if you have Maintainer access.
- **Push** is still separate: only `git init` / push when the user asks ([checklist.md](checklist.md)).
- Typical order: finish app → user creates GitLab project (or you use URL they gave) → **gitlab card** → optional push later.

---

## Slack fallback

If Postman has no public documenter link, search Slack for the project slug + `documenter.getpostman.com` or a `.postman_collection.json` file link (same pattern as adham-hisham group). Do not invent URLs.
