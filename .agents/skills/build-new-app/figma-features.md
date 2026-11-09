# figma-features.md — Phases 5–7

Figma is **Arabic, RTL**. Load `/figma-design-to-code` (skill `figma-design-to-code`) **before** every `get_design_context` call.

Dual: each app has its own Figma, splash node, `_schedule.md`, and Postman. Do not mix frames. Icons the user supplied per app stay in that app (`assets/svg/app_svg/`). Max 3 subagents **across both apps**.

**Coverage:** every phone FRAME in both Figma files is implemented and reachable from splash (onboarding → auth → home shell → the screen). Do not skip a frame because it looks like a state — states of one flow still get their own view or an explicit state on that view.

**One feature, both apps:** each subagent owns one feature in the user app **and** the provider app. Same feature folder name in both projects. Do not assign App B’s frames to a different feature agent.

**Icons:** use the SVG already in `assets/svg/app_svg/` via `AppAssets`. If the glyph is not in that folder, download it from Figma **as exported** (SVG, or GIF when the node is a gif) into that folder. Do not redraw, recolor, or swap it for a Material icon. Raster illustrations on a screen are downloaded the same way and used in place.

Project rules to read before any screen (new project copies):

Always: `flutter-feature-development.mdc`, `flutter-base-coding-standards.mdc`, `rtl-arabic.mdc`, `scaffold-statusbar.mdc`, `design-tokens.mdc`, `post-feature-review.mdc`

Then by type: `figma-to-flutter.mdc`, `figma-mcp-mapping.mdc`, `figma-widget-mapping.mdc`, `feature-prompt.mdc`, `api-pipeline.mdc`, `bloc-patterns.mdc`, `navigation-patterns.mdc`, `di-and-architecture.mdc`, plus the phase-8 rules (`notifications`, `session-guard`, `payment-webview`, `static-html-pages`).

Entry prompt: `.cursor/prompt/feature_prompt.md`.

---

## 5 — Splash

Implement **before** other features. See the splash steps below.

## 5b — Foundation before feature subagents

Do this in the app you are about to implement, before launching feature agents:

1. `ApiEndpoints` for that actor + shared endpoints. `ApiKeyInterceptor` (`x-api-key`, `Lang`). Envelope keys from [api-binding.md](api-binding.md).
2. `SocketService` from [socket.md](socket.md) when a socket spec exists.
3. Maps/location packages only if frames show a map. Ask for the Maps key; do not invent one.
4. Export shared chrome (back glyph, buttons, fields) once into `assets/svg/app_svg/`.
5. Register a `NamedRoutes` placeholder for every frame (orchestrator only).
6. Write `.cursor/prompt/tasks/_coverage.md`: node id, feature, screen class, route, endpoints, socket events, assets exported, screenshot compared, status `pending`.

Subagents must not start while `_coverage.md` is missing.

## 5 — Splash (steps)

Implement **before** other features.

1. Parse the splash Figma URL (`fileKey`, `nodeId` with `-` → `:`).
2. `get_design_context` + `get_screenshot`.
3. Create `lib/src/features/splash/presentation/` (UI-only is fine: view + widgets; no cubit required).
4. Replace `_SplashPlaceholder` in `lib/src/core/navigation/route_generator.dart`.
5. Keep `NamedRoutes.splash` as `'/'` / `initialRoute`.
6. After `ConstantManager.splashTimer` (and animations if Figma has them):

```dart
final loggedIn = injector<UserCubit>().isUserLoggedIn;
// UserCubit.init() already ran in main.dart
if (loggedIn) {
  Go.offAllNamed(NamedRoutes.home); // or offAll(HomeScreen) once home exists
} else {
  Go.offAllNamed(NamedRoutes.login);
}
```

If home/login are not built yet, route to a named placeholder registered in `NamedRoutes` so splash compiles. Subagents replace the destination widgets later; the **orchestrator** owns `named_routes.dart` / `route_generator.dart`.

Status bar: match splash background (`Helpers.changeStatusbarColor`). See `scaffold-statusbar.mdc`.

---

## 6 — Split Figma into features

Follow `.cursor/rules/figma-task-extractor.mdc` for **discovery**, then **group frames into features** (do not create one Dart feature folder per frame).

### 6.1 Discover

`get_metadata` on the file (all pages). Collect FRAME screens. Skip component libraries, cover art, hidden `._` layers, duplicates like `Login / Login-Error` (one task, error as a state).

### 6.2 Group

Typical buckets (adjust to the file):

| Feature folder | Frames |
|----------------|--------|
| `auth` | login, register, otp, forgot, reset, activation (`NeedActiveFailure`) |
| `onboarding` | walkthrough / guest intro |
| `home` | main tabs shell + home tab |
| `profile` | profile, edit, settings, language, delete-account, logout |
| `static_pages` | privacy, terms, about |
| `notifications_inbox` | notifications list |
| `chat` | threads + room — **UI only** until a socket `.md` arrives |
| `payment` | checkout that opens `PaymentWebViewScreen` |
| others | named from the domain (orders, products, …) |

One feature = one `lib/src/features/<name>/` tree (copy `products` layout / `./scripts/new_feature.sh`).

### 6.3 Task files

Write into **the new project**:

```
.cursor/prompt/tasks/_schedule.md
.cursor/prompt/tasks/<feature>.md
```

Each `<feature>.md` lists **all** frames for that feature (name + Figma URL + node id), Postman folders/endpoints if any, and mode (UI only vs UI+API).

`_schedule.md` columns: feature, screens, Postman, status (`pending` / `in_progress` / `done`), notes.

Show the user the grouping **before** launching subagents. Adjust names if they disagree. Attach Postman collection mappings (`device_id` → FCM token).

### 6.4 Orchestrator-owned files

Subagents **must not** edit:

- `lib/src/core/navigation/named_routes.dart`
- `lib/src/core/navigation/route_generator.dart`
- `assets/translations/lang.json`
- `pubspec.yaml`
- `android/**` and `ios/**` permission manifests (unless the orchestrator asked them to)
- `.cursor/rules/**`

They write `.cursor/prompt/tasks/<feature>.pending.md`:

```markdown
# pending — <feature>
## routes
- NamedRoutes.login → '/login' → LoginScreen
## lang.json
- "logout #$ Log out": "تسجيل الخروج"
## pubspec
- (none)
## notes
```

Orchestrator merges routes/keys/packages on a **single-writer** pass, then:

```bash
dart run generate/strings/main.dart   # stop after first gen
dart run build_runner build --delete-conflicting-outputs
```

---

## 7 — Subagents

### Parallelism

- Max **3** `Task` subagents at once (`subagent_type: generalPurpose`).
- Feature implementation subagents **MUST** use model slug `composer-2.5-fast`.
- After each feature returns, launch a review subagent with model slug `grok-4.7-low` (Grok 4.7 medium is not available — do not invent it). Review checks Figma fidelity **and** that every Postman path used is in the collection and wired correctly. Fix gaps before marking that feature’s `_coverage.md` rows `done`.
- Do not leave any phone screen, bottom sheet, or GIF unimplemented; match Figma exactly ([figma-fidelity.md](figma-fidelity.md)).
- Static HTML pages (privacy, terms, etc.) use package `flutter_html`; links must be tappable (`onLinkTap` / `url_launcher`).
- Each subagent implements its feature in **both** apps before it returns.
- Prefer independent features (profile + static_pages + notifications_inbox).
- `auth` first if other features need login. `home` shell (bottom nav) before tab bodies if they share `IndexedStack`.

### Prompt each subagent must receive

- Absolute new-project path
- Feature name + list of Figma URLs/node ids
- Relevant Postman endpoints (and `device_id` = FCM token)
- “Read `.cursor/rules/*` listed in figma-features.md; follow `feature_prompt.md`”
- RTL + unified `ArrowWidget` unless this screen’s Figma differs
- Displayed phone numbers with `+` → `Text(..., textDirection: TextDirection.ltr)` (§4.9 in infrastructure.md)
- `MessageUtils` / bot_toast, not SnackBar
- Session ends go through `SessionManager`
- Privacy/terms → `StaticPageScreen`
- Payment URLs → `PaymentWebViewScreen`
- Do not edit orchestrator-owned files; write `<feature>.pending.md`
- Implement **and** self-review with `post-feature-review.mdc`
- Run `flutter analyze` on files you added (or report why not)
- Return: files touched, pending.md summary, analyze issues, score from post-feature-review

### What the subagent implements

1. `./scripts/new_feature.sh <feature>` if the folder does not exist (or copy the products template if the script was removed).
2. UI from Figma MCP — tokens only (`AppColors`, `AppSize`, `AppPadding`, `AppAssets`, `LocaleKeys`).
3. API via `BaseRemoteSource.request` → repository → usecase → `AsyncCubit` / `PaginatedAsyncCubit`.
4. Navigation via `Go.*` only.
5. Forms: `FormMixin` + `LoadingButton`.
6. Logout / delete-account: confirm dialog, API, then `SessionManager.endSession`.

### After each subagent

1. Merge `pending.md` into routes + `lang.json` + pubspec.
2. Mark `_schedule.md` and the matching `_coverage.md` rows.
3. Fix obvious conflicts yourself (duplicate widgets, broken imports).
4. Do not start a 4th agent until one of the three has finished.
5. Order waves by dependency (auth before home, home before trip). Finish the user app’s coverage before the second app when the user asked for that order.

### Handoff

When a session ends before coverage is 100%, write `.cursor/prompt/tasks/_handoff.md`: shipped features, open rows, API/socket decisions. The next session starts from that file.

### Chat (deferred)

If the file has chat frames:

- Build UI (list + bubbles) with placeholders for send/connect.
- Images: `cached_network_image` / `CustomImage`. Videos: `video_player` / `UniversalMediaWidget`. URLs in text: `TapGestureRecognizer` or `CustomHtmlWidget`.
- **Do not** guess socket events, rooms, or auth headers.
- When the user sends a `.md` spec: read `chat-socket.mdc` + the spec, implement in the existing `chat` feature, keep media + clickable links.

---

## Figma quality bar (every screen)

- Pixel mapping from `figma-mcp-mapping.mdc` (font −1–2 sp on mid sizes, padding tweaks).
- Extract copy to `lang.json` **before** hardcoding Arabic in widgets (via pending.md).
- Icons from `AppAssets` as-is (no color filter unless Figma uses a tinted instance).
- Lists: `ListView.builder` / slivers, not `shrinkWrap` + `Column` of children.
- Back button unified.
- Test mental RTL: first `Row` child is the physical **right** in Arabic.
