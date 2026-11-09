# checklist.md — Phase 9 + reminders

Run from the **new** project root after features are merged. Dual: run this section in **each** project; list both paths/bundles in the report ([dual-apps.md](dual-apps.md)).

---

## 9 — Verify

```bash
dart run build_runner build --delete-conflicting-outputs
dart run generate/strings/main.dart    # stop watcher after first success
flutter analyze
```

- [ ] `flutter analyze` clean (or only pre-existing info you documented)
- [ ] No `awesome_notifications` in `pubspec.yaml` / `pubspec.lock` **after** FlutterFire (expected before the Firebase gate)
- [ ] No `package:clean_arch_base` imports
- [ ] No leftover `products` feature (unless the new app is actually a products app)
- [ ] `MessageUtils` does not use `ScaffoldMessenger` for app alerts
- [ ] `AuthInterceptor` receives `onAuthFailure: SessionManager...`
- [ ] Dropdown min height uses `sheetMinHeightFactor` (1/3)
- [ ] `UCropActivity` in AndroidManifest
- [ ] No `USE_FULL_SCREEN_INTENT` in `android/app/src/main/AndroidManifest.xml`
- [ ] iOS camera/photo usage strings + `UIBackgroundModes` + entitlements
- [ ] `BotToastInit` + `BotToastNavigatorObserver` on `MaterialApp`
- [ ] `_coverage.md` is 100% `done` for every phone frame in that app’s Figma
- [ ] `_endpoints.md` lists every collection request as wired or `no screen`
- [ ] Simulator smoke: login with the collection’s test account reaches home (say so if a device was unavailable)
- [ ] `.cursor/rules/notifications.mdc` forbids awesome_* and allows FCM + local notifications
- [ ] iOS foreground push: one banner when app open — FCM `alert: true` + defer local when `message.notification != null`; data-only uses `iosForegroundDetails` + local plugin permissions
- [ ] Phone display with `+` uses `TextDirection.ltr` on the phone `Text` (profile, OTP subtitle, contact cards — spot-check in ar locale)
- [ ] README placeholders (app name, bundle, base URL) updated
- [ ] `android/key.properties` + `android/app/key.jks` exist (copied from Downloads)
- [ ] `android/app/build.gradle.kts` release uses `signingConfigs.getByName("release")`, not debug

Do not `git init` unless the user asks.

---

## 9.5 — GitLab project card

See [gitlab-card.md](gitlab-card.md). Run **after** analyze unless the user skipped GitLab.

- [ ] GitLab repo URL(s) were collected in phase 0 (ask if missing)
- [ ] `scripts/gitlab_project_card.py` run for each app / repo
- [ ] Card line uses `{code} - Design - Admin (/admin/login) - Collection - app store - google play`
- [ ] Avatar from `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- [ ] Report any empty `[Design]()` or `[Collection]()` links

Present a short report: path, package name, bundle id, feature list, analyze result, **GitLab card status**, **open reminders** below.

---

## Reminders to tell the user (things this skill cannot finish)

Surface only items that still apply. Do not hide them inside the skill run.

### Store / identity

- **Launcher icon + native splash** — need a logo; then `flutter_launcher_icons` + `flutter_native_splash`.
- **Apple Sign-In** is mandatory if any other social login exists on iOS.

### Push

- Upload an **APNs** key/cert to Firebase Console.
- Enable **Push Notifications** (+ Background Modes) on the App ID / Xcode Signing & Capabilities. Entitlements in git use `aps-environment = development` until a release profile flips it to `production`.
- Confirm `GoogleService-Info.plist` is a member of the Runner target.

### Links / payment

- **App Links / Universal Links / custom URL scheme** if the payment provider redirects to the app instead of an https success URL the WebView can intercept.
- Confirm success/failure/cancel URL patterns with backend before production payments.

### API / ops

- `--dart-define=API_BASE_URL=...` (or Remote Config) for dev vs prod. `firebase_remote_config` is already a dependency — wire force-update / maintenance if the product needs it.
- Crashlytics + Analytics if they want crash/funnel data (`prod` / Firebase skills).

### Product screens often forgotten

- **Onboarding** + first-launch flag (SecureStorage).
- **Guest mode** — `visitor_pop_up.dart` exists; connect it if Figma has visitor CTAs.
- **OTP / `NeedActiveFailure`** — parser already returns it; needs an activation screen, not a session wipe.
- **Delete account** — confirm dialog + API + `SessionManager.endSession(deleteAccount)`. Apple and Google require in-app account deletion.
- **Accept terms** at register (open `StaticPageScreen`).
- **Notifications inbox + opt-in switch** (OS permission vs server mute).
- **Chat socket** — wait for the user’s `.md`; UI can ship first.

### QA

- Run the app in **ar** and **en** and confirm layout direction, back chevron, HTML pages, and dropdown sheet height (≥ 1/3 screen) + confirm-to-select.
- On a **physical iPhone or simulator**, send a test FCM while the app is foreground: expect **one** banner (Console notification message or data-only per §4.1).

---

## Resume hooks

| User later says | Do |
|-----------------|----|
| Drops Firebase json/plist **or** a Console URL / project ID | FlutterFire (`flutterfire configure --project=<id>`) then [infrastructure.md](infrastructure.md) §4.1 rewrite |
| Sends chat `.md` | [figma-features.md](figma-features.md) chat section |
| Sends Postman | Map endpoints; `device_id` = `Helpers.getFcmToken()`. Dual: map into the app that collection belongs to |
| Sends second-app bundle / Figma / splash / Postman | Switch to dual mode if Phase 0 was single; do not re-ask shared fonts/icons ([dual-apps.md](dual-apps.md)) |
| `build_test` / `prod` | Use those personal skills on the **new** project, not the base |
