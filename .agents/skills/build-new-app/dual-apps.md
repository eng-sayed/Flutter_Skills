# dual-apps.md — Two apps (user + provider)

Ask this **before** any other Phase 0 field, and before touching git or the filesystem.

## The question (ask verbatim)

> هل هتعمل مشروعين؟ زي يوزر وبروفايدر مثلاً؟

Wait for a yes/no. Do not assume two apps.

| Answer | Mode |
|--------|------|
| No / مشروع واحد | Single-app. Continue Phase 0 as today. Ignore this file. |
| Yes / اتنين / يوزر وبروفايدر | Dual-app. Collect **App A** + **App B** + **shared design**, then run the same phases **twice**. |

Roles are labels only (user / provider, client / captain, …). The user names them.

---

## What is shared vs per-app

### Shared (collect **once**, apply to **both**)

If the user already listed fonts, colors, icons, or assets in their answers, those answers are **canonical for both apps**. Do not ask again for the second app. Do not invent a second icon set.

| Input | Rule |
|-------|------|
| Font files + family + weights | Same `assets/fonts/` + `pubspec` `fonts:` + `ConstantManager.fontFamily` |
| Color palette | Same `AppColors` tokens unless they explicitly give a second palette |
| Icons / assets they named | Same files and `AppAssets` names. User-app icons ≈ provider-app icons |
| Android release signing | Same Downloads `key.properties` + `key.jks` in **both** apps ([scaffold.md](scaffold.md) §2.6). Do not invent a second keystore |
| Delete `macos/` `linux/` `windows/` `web/`? | Same answer for both (default yes) |

Copy shared design **from App A after Phase 3**, do not download fonts/icons twice.

### Per-app (collect **separately** — do not invent)

When they say yes, they will send (or you must ask for) the second app’s identity and links:

| Input | App A | App B |
|-------|-------|-------|
| Project name (folder + Dart package) | required | required |
| Display name (ar / en) | required | required |
| Package / Bundle ID | required | required — **must differ** from App A |
| Full Figma URL | required | required |
| Splash Figma URL | required | required |
| Postman collection | optional | optional — its own collection if they have one |
| API base URL | ask | ask (may differ) |
| Firebase Console URL or project ID | optional until 4.1 | optional until 4.1 — same Console project is fine; **apps** are per bundle |
| Chat socket `.md` | optional | optional |
| **GitLab repo URL** | required for 9.5 | required — **separate repo per app** |
| Project code (ticket) | ask if unclear | ask if unclear (may share prefix, e.g. `AA54422`) |

Two folders: `$HOME/Desktop/projects/<app_a>/` and `$HOME/Desktop/projects/<app_b>/`.

Never reuse App A’s bundle ID, package name, or folder name for App B.

---

## Dual Phase 0 extras

Ask (after the yes):

1. Role labels + which folder is App A (usually the **user** app first).
2. Every per-app required field above for **both** apps.
3. Shared fonts / colors / icons if not already in the message.

If any required dual field is missing → stop and ask. Do not start App B with a guessed bundle ID.

Pre-flight additions:

- Both target folders must **not** exist.
- Bundle IDs must be unique.
- Base repo still must be clean (one check).

Workspace: stay at `$HOME/Desktop/projects` so both folders are visible. Use absolute paths. Do **not** `move_agent_to_root` into only one app and then forget the other.

---

## Running the phases twice

Same skill order as a single app. App A first through Phase 3, then clone shared design into App B, then continue each app independently.

```
Progress (dual):
App A (<name>, <role>):
- [ ] 0–3 Scaffold + rename + fonts/colors/icons
- [ ] 4 Infrastructure
- [ ] 5 Splash
- [ ] 6 Figma → features + task files
- [ ] 7 Subagents
- [ ] 8 Rules (with Phase 4)
- [ ] 9 Analyze + reminders

App B (<name>, <role>):
- [ ] 0–3 Scaffold + rename + copy shared design from A
- [ ] 4 Infrastructure
- [ ] 5 Splash
- [ ] 6 Figma → features + task files
- [ ] 7 Subagents
- [ ] 8 Rules (with Phase 4)
- [ ] 9 Analyze + reminders
```

### 1–2 Duplicate + rename

1. Pre-flight once.
2. `rsync` base → App A (no `.git`). Rename Dart / Android / iOS for App A (`scaffold.md` §1–2) including §2.6 signing from Downloads.
3. `rsync` base → App B (no `.git`). Rename for App B with **its** package + bundle, then the same §2.6 signing copy from Downloads (not from App A).
4. Drop desktop/web in **both** if agreed.

`git init` in neither project.

### 3 Fonts / colors / icons

1. Apply fonts, `AppColors`, and user-supplied icons **only in App A** (`scaffold.md` §3).
2. Missing icons: download from **App A** Figma into App A `assets/svg/app_svg/`.
3. Copy into App B (overwrite the scaffold copies):

```bash
rsync -a \
  "$HOME/Desktop/projects/<app_a>/assets/fonts/" \
  "$HOME/Desktop/projects/<app_b>/assets/fonts/"

rsync -a \
  "$HOME/Desktop/projects/<app_a>/assets/svg/app_svg/" \
  "$HOME/Desktop/projects/<app_b>/assets/svg/app_svg/"
```

4. Mirror App A’s `pubspec.yaml` `fonts:` block and `ConstantManager.fontFamily`.
5. Copy `lib/src/config/res/color_manager.dart` from A → B (then keep B’s `constants_manager.dart` identity fields: name, bundle, baseUrl).
6. `dart run build_runner` in **both** so `AppAssets` names match.
7. Extra glyphs that exist **only** on App B’s Figma: download those extras into B. Do not rebuild the shared set from scratch.

### 4 + 8 Infrastructure

Run [infrastructure.md](infrastructure.md) in App A, then in App B.

- Postman / `device_id` / `baseUrl` are **per app**.
- FlutterFire is **per app**: `--android-package-name` and `--ios-bundle-id` = that app’s bundle. Same Firebase project ID is allowed; configs must land in that app’s tree only.
- `./scripts/remove_demo.sh` in both, at the end of each app’s Phase 4.
- Patch `.cursor` rules in **both** projects.

Do not copy `google-services.json`, `GoogleService-Info.plist`, or `firebase_options.dart` from A to B.

### 5–7 Splash + features

Each app has its **own** Figma, splash node, `_schedule.md`, and feature folders.

- Splash from **that** app’s splash URL.
- Discover/group frames from **that** app’s Figma only.
- Subagents get that app’s absolute path + its Postman + its Figma nodes.
- Max **3** subagents **globally** (not 3 per app). Prefer finishing App A’s schedule before App B features, unless two apps have independent pending features and you still stay at ≤3.
- Orchestrator-owned files are per project (`named_routes`, `lang.json`, `pubspec` of that app).

Do not share screens, routes, or API mappings across apps.

### 9 Verify

Run [checklist.md](checklist.md) in **each** project root. Reminders that apply to both (APNs, delete-account, …) — say them once and name both bundles. Do not tell the user to create an Android keystore.

### 9.5 GitLab cards

Run [gitlab-card.md](gitlab-card.md) **twice** — one script call per GitLab repo URL and matching `--project-dir`.

---

## Do not (dual)

- Start App B without its bundle ID, project name, Figma URL, and splash URL.
- Copy Firebase native/Dart files between apps.
- Re-ask fonts / icons / assets after the user already listed them for the pair.
- Use App A’s Postman as App B’s API unless they said it is the same collection.
- `git init` / commit in either project unless asked.
