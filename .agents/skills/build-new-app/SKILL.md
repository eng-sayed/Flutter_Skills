---
name: build-new-app
description: >-
  Scaffold one or two Flutter apps (e.g. user + provider) from flutter_clean_arch_base
  (branch network-with-php-keys): ask if there will be two apps, duplicate, rename
  package/bundle IDs, share fonts/colors/icons across both, wire Firebase with flutterfire
  configure from a Console URL/project ID, replace awesome_notifications with
  firebase_messaging + flutter_local_notifications, bot_toast, session guard, payment
  WebView, HTML static pages, then split each Figma file into features and implement them
  with subagents. After verify, set the GitLab project card (description + launcher avatar,
  Adham format) on the repo URL the user provides. Use when the user says "build-new-app",
  "استخدم build-new-app", "اعمل اب جديد", "سكافولد مشروع", or provides a project name
  plus a full Figma URL.
---

# Skill: build-new-app

Works in Cursor, Claude Code, and Codex (`SKILL.md` Agent Skills format). **Never edit** `$HOME/Desktop/projects/flutter_clean_arch_base`. All code changes happen only in the duplicated project.

If `move_agent_to_root` is unavailable (Claude / Codex), `cd` to `$HOME/Desktop/projects/<project_name>` and keep using absolute paths.

## Hard rules

1. Base repo branch is **`network-with-php-keys`** — never `main`.
2. Duplicate **without** `.git`. Do **not** `git init` in the new project.
3. After duplicate, work only in `$HOME/Desktop/projects/<project_name>/` (dual: those two folders only).
4. Use the **new project's** `.cursor/rules/` + `.cursor/prompt/` for every feature. Read them before coding screens.
5. Figma is Arabic RTL. Layout uses `start`/`end`, never `left`/`right`.
6. Infrastructure (phase 4) **before** any Figma screen except splash (phase 5).
7. Stop and ask if a required input is missing. Do not invent bundle IDs, colors, or Firebase files — generate Firebase files only via **FlutterFire** from a project the user named (Console URL or project ID).
8. **First Phase 0 question:** one app or two (user + provider). If two, follow [dual-apps.md](dual-apps.md). Shared fonts / colors / icons / assets the user already listed apply to **both**. Each app still needs its own name, bundle ID, Figma, splash, and optional Postman.
9. **Android release signing is mandatory on every new project** (both apps in dual). Copy `$HOME/Downloads/key.properties` + `$HOME/Downloads/key.jks` and wire `signingConfigs.release` — see [scaffold.md](scaffold.md) §2.6. Do not invent a keystore, do not leave `release` on debug signing, do not paste passwords into chat or into this skill.
10. **Remove `USE_FULL_SCREEN_INTENT`** from `android/app/src/main/AndroidManifest.xml` when scaffolding (base copy includes it; delete the line in phase 2 — [scaffold.md](scaffold.md) §2.3). Re-check in phase 9 ([checklist.md](checklist.md)).

## Trigger phrases

| Phrase | Action |
|--------|--------|
| `build-new-app` / `استخدم build-new-app` | Full workflow from phase 0 — ask one-vs-two apps first |
| `اعمل اب جديد` / `سكافولد مشروع` | Full workflow — ask one-vs-two apps first |
| Project name + Figma URL in one message | Full workflow (ask one-vs-two if unknown, then only missing inputs) |
| Yes + second bundle / name / Figma / splash / Postman | Dual mode — [dual-apps.md](dual-apps.md) |
| Chat `.md` file later | Read [figma-features.md](figma-features.md) chat section only |
| Firebase Console URL or project ID | FlutterFire configure, then resume [infrastructure.md](infrastructure.md) §4.1 |

## Read in this order (this run)

1. This file (orchestrator).
2. [dual-apps.md](dual-apps.md) — only if they said two apps.
3. [scaffold.md](scaffold.md) — phases 1–3.
4. [infrastructure.md](infrastructure.md) — phase 4 + `.cursor` rule patches.
5. [figma-features.md](figma-features.md) — phases 5–7.
6. [figma-fidelity.md](figma-fidelity.md) — every frame, exported assets, screenshot check.
7. [api-binding.md](api-binding.md) — Postman inventory, headers, envelope.
8. [socket.md](socket.md) — only when a socket `.md` is attached.
9. [checklist.md](checklist.md) — phase 9 + reminders to surface to the user.
10. [gitlab-card.md](gitlab-card.md) — phase 9.5 GitLab description + avatar.

Copy this checklist and keep it updated (if two apps, use the dual checklist in [dual-apps.md](dual-apps.md)):

```
Progress:
- [ ] 0 Pre-flight
- [ ] 1 Pull + duplicate
- [ ] 2 Rename (Dart / Android / iOS) + Android release signing
- [ ] 3 Fonts / colors / icons
- [ ] 4 Infrastructure
- [ ] 5 Splash
- [ ] 6 Figma file check + features + task files + _coverage.md
- [ ] 6b Foundation (endpoints, headers, socket, design kit, routes)
- [ ] 7 Subagents implement features (coverage gate)
- [ ] 8 Patch .cursor rules in the NEW project
- [ ] 9 Analyze + reminders
- [ ] 9.5 GitLab project card (description + avatar) on user’s repo URL(s)
```

---

## Phase 0 — Collect inputs, then pre-flight

**Ask this first, verbatim**, before any other field and before touching git or the filesystem:

> هل هتعمل مشروعين؟ زي يوزر وبروفايدر مثلاً؟

- **No** → one project. Table below once.
- **Yes** → two projects. Read [dual-apps.md](dual-apps.md). Collect App A + App B identity/Figma/splash/Postman. Fonts, colors, icons, and assets they already listed are **shared** — do not re-ask for the second app.

**Figma file check (before scaffolding):** open the file’s pages. Confirm splash, brand colors, and screen names match the Postman product (ride vs a different product). If the link is a different product, stop and ask which file is the source. Record the chosen `fileKey` in `.cursor/prompt/tasks/_schedule.md`.

If any **required** field is missing, ask before touching git or the filesystem.

| Input | Required | Notes |
|-------|----------|--------|
| One app or two (user + provider) | yes — ask first | If two: [dual-apps.md](dual-apps.md) |
| Project name | yes | Folder name + Dart package (`snake_case`, valid Dart identifier). Dual: one per app |
| App display name (ar / en) | yes | Android `android:label`, iOS `CFBundleDisplayName`. Dual: one per app |
| Package / Bundle ID | yes | e.g. `com.company.app` — Android `applicationId`/`namespace` **and** iOS `PRODUCT_BUNDLE_IDENTIFIER`. Dual: unique per app |
| Full Figma URL | yes | Arabic RTL file. Dual: one file/link per app |
| Splash screen Figma URL | yes | Separate node. Dual: one per app |
| Font files + family + weights | yes | `.ttf`/`.otf`. Dual: **once**, copy A → B |
| Color palette | yes | Mapped into `AppColors`. Dual: **once**, unless they give a second palette |
| Icons | optional | Missing icons from Figma. Dual: same set as the user app; extras only if B’s Figma has new glyphs |
| Postman collection | optional | Any key named `device_id` = FCM token. Dual: its own collection if they have one |
| API base URL | ask | Written to `ConstantManager.baseUrl`. Dual: ask if B differs |
| **GitLab repo URL** | **yes** (before 9.5) | Where the project will live — e.g. `https://git.aait.cloud/icraftsa/flutter/sayed-ashraf/<slug>`. Dual: **one URL per app** |
| Project code (ticket) | ask if unclear | Shown in GitLab card line (`CS54497`, `AA60347`, `2429`). Derive from folder name when obvious |
| Firebase Console URL or project ID | optional until 4.1 | FlutterFire only. Dual: same project ID OK; configure **each** bundle separately |
| Chat socket `.md` | optional | Later is fine — do not invent a protocol |
| Delete `macos/` `linux/` `windows/` `web/`? | ask | Default: yes (mobile-only). Dual: same answer for both |
| Android keystore | **no — automatic** | Always copy `$HOME/Downloads/key.properties` + `key.jks` ([scaffold.md](scaffold.md) §2.6). Do not ask |

**Pre-flight** (see [scaffold.md](scaffold.md) §0): Flutter available, base repo exists, working tree **clean**. If dirty → **stop**.

Then follow phases 1–3 in [scaffold.md](scaffold.md). Dual: duplicate + rename **twice**; shared design copy is in [dual-apps.md](dual-apps.md).

After the copy exists:

1. **One app:** Discover `cursor-app-control` / `move_agent_to_root`, then call it with `rootPath: $HOME/Desktop/projects/<project_name>`. All later edits target that project only.
2. **Two apps:** Keep the workspace at `$HOME/Desktop/projects`. Edit only the two new folders (never the base). Use absolute paths.

---

## Phase 4 — Infrastructure

Follow [infrastructure.md](infrastructure.md) **in order**. Dual: run the whole phase in App A, then App B. Firebase is a hard gate **per app**: do not rewrite that app’s notifications until FlutterFire has produced `google-services.json`, `GoogleService-Info.plist`, and `firebase_options.dart` for **that** bundle. Never copy those files from A to B.

Summary of what phase 4 must leave behind:

- `firebase_messaging` + `flutter_local_notifications` (awesome packages **removed**)
- `bot_toast` wired in `lib/src/app.dart`; `MessageUtils` uses it
- `SessionManager.endSession` on logout / delete-account / 401 / `unauthenticated` / `blocked` — PHP `key: unauthenticated` (HTTP 200) must end the session when there is no refresh token or after a failed/already-retried refresh, not only show `UnauthorizedFailure` on the screen ([infrastructure.md](infrastructure.md) §4.3)
- Dropdown sheet min height = **1/3 of screen**; selection commits only on confirm
- `image_cropper` Android `UCropActivity` + iOS photo/camera usage strings
- `PaymentWebViewScreen` + HTML static pages with clickable links
- Unified back button via `ArrowWidget` / `DefaultScaffold`
- Locale persisted (`EasyLocalization` + `SecureStorage` key `app_locale`)
- Login/register bodies send FCM token as `device_id`
- iOS **foreground** push: one banner (FCM presentation + skip duplicate local when message has `notification` payload; data-only → local with `presentBanner`) — [infrastructure.md](infrastructure.md) §4.1
- Phone numbers shown with `+` → `TextDirection.ltr` on that text in RTL screens — [infrastructure.md](infrastructure.md) §4.9

Also complete **phase 8** (rule patches) during phase 4 so feature subagents inherit the new stack. Details are in [infrastructure.md](infrastructure.md) §8.

Remove the `products` demo at the **end of phase 4**, before splash/features. `./scripts/remove_demo.sh` asks for confirmation — delete `lib/src/features/products` directly, grep leftover `ProductsScreen` / `features/products` imports, then `dart run build_runner build`.

---

## Phase 5–7 — Splash + Figma features

Follow [figma-features.md](figma-features.md). Dual: each app uses **its** splash URL and **its** Figma; do not mix frames or Postman mappings.

- Splash first, from the dedicated Figma node, then `UserCubit.init()` → home or login.
- Group Figma frames into **features** (auth, home, profile, …), not one folder per frame.
- Max **3** subagents in parallel. Each subagent owns one feature in **both** apps. Shared files protocol is mandatory (routes, `lang.json`, `pubspec.yaml` are orchestrator-only).
- Feature implementation subagents **MUST** use model slug `composer-2.5-fast`.
- After each feature returns, launch a review subagent with model slug `grok-4.7-low` (Grok 4.7 medium is not available — do not invent it). Review checks Figma fidelity **and** that every Postman path used is in the collection and wired correctly. Fix gaps before marking coverage `done`.
- Do not leave any phone screen, bottom sheet, or GIF unimplemented; match Figma exactly ([figma-fidelity.md](figma-fidelity.md)).
- Static HTML pages (privacy, terms, etc.) use package `flutter_html`; links must be tappable (`onLinkTap` / `url_launcher`).
- Every Figma phone frame is implemented and linked from splash. Follow [figma-fidelity.md](figma-fidelity.md): export SVG/GIF/PNG unchanged, back button from that frame, `_coverage.md` row `done`.
- Postman binding follows [api-binding.md](api-binding.md). Socket follows [socket.md](socket.md) when a spec exists.
- Each subagent implements **and** self-reviews with the new project's `post-feature-review.mdc`.
- Before closing phase 9, write `.cursor/prompt/tasks/_handoff.md` (what shipped, open rows, decisions).

---

## Phase 9 — Verify

Follow [checklist.md](checklist.md): `build_runner`, `generate/strings`, `flutter analyze`, then present the reminder list to the user (APNs, deep links, delete-account, Apple Sign-In, …). Dual: run the verify commands in **each** project; name both bundles in reminders. Do **not** remind the user to create an Android keystore — this skill already installs it.

---

## Phase 9.5 — GitLab project card

Follow [gitlab-card.md](gitlab-card.md). **Required** unless the user opts out.

1. Use the **GitLab repo URL(s)** from phase 0 (ask now if still missing):
   > لينك/لينكات GitLab اللي هترفع عليه المشروع؟
2. Build the Adham-style description from: project code, Figma URL(s), `{API origin}/admin/login`, Postman documenter (or empty `()`).
3. Run `scripts/gitlab_project_card.py` once per repo (dual: twice).
4. Report success or missing figma/postman links; do not edit the plan file or commit card text into the repo.

The GitLab project may be empty; push is **not** required for the card. Push/`git init` only if the user asks separately.

---

## Example

User:

> build-new-app
> المشروع: `qatra` — bundle `com.qatra.app`
> فيجما: `https://www.figma.com/design/xxx/App?node-id=0-1`
> سبلاش: `https://www.figma.com/design/xxx/App?node-id=12-40`
> الفونتات والألوان في المرفقات — Postman هبعته

Agent: ask «هل هتعمل مشروعين؟» first → collect remaining inputs → phase 0–3 → if Firebase Console URL / project ID is present, FlutterFire + 4.1; else pause notifications rewrite → finish 4 + 8 → splash → feature schedule → max 3 subagents → analyze + reminders.

User (two apps):

> اه هيبقي اتنين — يوزر `qatra` bundle `com.qatra.app` — بروفايدر `qatra_provider` bundle `com.qatra.provider`
> فيجما/سبلاش/بوستمان لكل واحد — الفونتات والأيقونات من اليوزر

Agent: do not re-ask fonts/icons → duplicate + rename both → Phase 3 on user → rsync fonts/`app_svg`/colors to provider → infrastructure + splash + features per Figma → analyze both.

---

## Do not

- Edit the base repo, its rules, or its pubspec.
- `git init` / commit in the new project unless the user asks.
- Use `awesome_notifications`, `SnackBar` for user alerts, or a second back-button widget.
- Auto-select a dropdown item on tap (confirm button only).
- Invent Firebase configs, socket events, or payment callback URLs. Firebase native/Dart files come from `flutterfire configure` only.
- Skip Android signing, leave `release` on debug keys, generate a new keystore, or print `key.properties` passwords.
- Start feature subagents before infrastructure + splash + task files exist.
- Leave a Figma phone frame unimplemented, or redraw an icon that should be downloaded as SVG/GIF.
- Ship a feature whose `_coverage.md` rows are still `pending`.
- Call an API path that is not in the Postman collection.
- In dual mode: guess App B’s bundle/name/Figma; copy Firebase files A → B; re-ask fonts/icons after the user already listed them for the pair.
- Skip GitLab card setup without asking for repo URL(s), or invent admin/postman/figma links for the card line.
