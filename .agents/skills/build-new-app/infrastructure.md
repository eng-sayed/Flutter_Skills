# infrastructure.md — Phase 4 + rule patches (phase 8)

All paths are in the **new** project. Do this **before** Figma feature screens (splash is phase 5). Dual: run this file once per app; FlutterFire args use **that** app’s bundle — never copy `google-services.json` / `GoogleService-Info.plist` / `firebase_options.dart` between apps ([dual-apps.md](dual-apps.md)).

Order: 4.2 bot_toast → 4.3 session → 4.4 dropdown → 4.5 cropper → 4.6 payment → 4.7 HTML → 4.8 back → 4.9 locale → 4.1 notifications (Firebase gate) → 4.10 device_id → demo removal → §8 rules.

Notifications wait on FlutterFire (`flutterfire configure` from the user’s Console project). Everything else can proceed.

---

## 4.1 Notifications — `firebase_messaging` + `flutter_local_notifications`

### Packages

`pubspec.yaml` — **remove**:

```yaml
awesome_notifications: ^0.11.0
awesome_notifications_fcm: ^0.11.0
```

**add** (latest compatible with current `firebase_core`):

```yaml
firebase_messaging: ^<compatible>
flutter_local_notifications: ^<compatible>
```

Strip every `package:awesome_notifications` / `awesome_notifications_fcm` import.

### Firebase gate (hard stop)

Do **not** invent `google-services.json`, `GoogleService-Info.plist`, or `firebase_options.dart`.

When the user gives a **Firebase Console URL** (`https://console.firebase.google.com/.../project/<project-id>/...`) or a **project ID**, wire the Flutter app with **FlutterFire** — do not send them to download files by hand.

1. Confirm Firebase CLI login (`npx -y firebase-tools@latest login` / MCP `firebase_login`).
2. Extract `<project-id>` from the URL (the path segment after `/project/`).
3. Register Android + iOS apps if they are missing, using the same `<bundle>`:
   - Android package name = `<bundle>`
   - iOS bundle ID = `<bundle>`
   FlutterFire creates them when needed; otherwise `firebase_create_app` / Console.
4. From the **new** project root:

```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=<project-id> --yes \
  --platforms=android,ios \
  --android-package-name=<bundle> \
  --ios-bundle-id=<bundle> \
  --out=lib/firebase_options.dart
```

This writes:

| File | Path |
|------|------|
| `google-services.json` | `android/app/google-services.json` |
| `GoogleService-Info.plist` | `ios/Runner/GoogleService-Info.plist` (FlutterFire adds it to the Xcode Runner target) |
| `firebase_options.dart` | `lib/firebase_options.dart` |
| `firebase.json` | project root (FlutterFire mapping) |

5. Then rewrite the notification Dart layer (packages + `NotificationManager` / `Helpers.getFcmToken()` / `main.dart` `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)` + `onBackgroundMessage`).

If the user has **not** given a project yet: finish 4.2–4.10 and features with `awesome_notifications` still compiling. Resume this gate when they send the Console URL or project ID.

If FlutterFire CLI is unavailable **and** the two native files already exist, write `lib/firebase_options.dart` from them.

`lib/main.dart` must become:

```dart
await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
```

### Keep vs rewrite

| Keep | Rewrite |
|------|---------|
| `notification_router.dart` — sealed `NotificationAction` + `AppNotificationRouter` | `notification_manager.dart` |
| `models/notification_payload.dart` — bilingual `fromMap` | `notification_controller.dart` |
| `models/notification_enums.dart` | `Helpers.getFcmToken()` |
| Isolate-safe routing via `Go.navigatorKey` | `EXPLANATION.md` (update or delete) |

### Required behaviour

Top-level (not a class method):

```dart
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await NotificationController.showFromRemoteMessage(message);
}
```

Register **before** `runApp`:

```dart
FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
```

`NotificationManager.initialize`:

1. Init `FlutterLocalNotificationsPlugin` (Android default channel `high_importance_channel`, icon `@drawable/ic_notification`).
2. iOS foreground presentation — see **iOS foreground banner (mandatory)** below.
3. `onMessage` → `NotificationController.showFromRemoteMessage` (not raw `show` — dedupe logic lives in the controller).
4. `onMessageOpenedApp` → parse payload → `router.route`.
5. `getInitialMessage` → same (terminated tap).
6. Local-notification tap stream → same router.
7. `onTokenRefresh` → `SecureStorage.write('cached_fcm_token', token)`.
8. Guard `_initialized` so `initialize` is not called twice (a second `onMessage.listen` duplicates banners).

`requestPermissions`:

- iOS FCM: `FirebaseMessaging.instance.requestPermission(alert, badge, sound)`
- iOS local plugin: `IOSFlutterLocalNotificationsPlugin.requestPermissions(alert, badge, sound)` on the **same** `FlutterLocalNotificationsPlugin` instance used in `initialize`
- Android 13+: `AndroidFlutterLocalNotificationsPlugin.requestNotificationsPermission()`

### iOS foreground banner (mandatory)

When the app is **open (resumed)** on iPhone, the user must see **one** notification banner — not zero, not two.

| Message shape | Who shows the banner |
|---------------|----------------------|
| FCM with `notification` title/body (Firebase Console style) | **System** via FCM foreground presentation |
| **Data-only** (`data` keys, no `notification` block) | **`flutter_local_notifications`** only |

Implement in the new project (copy the pattern from a shipped app or paste equivalent):

**`NotificationManager`**

- Shared constant for iOS local shows:

```dart
static const DarwinNotificationDetails iosForegroundDetails =
    DarwinNotificationDetails(
  presentAlert: true,
  presentBanner: true,
  presentList: true,
  presentBadge: true,
  presentSound: true,
);
```

- `setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true)`.
- `showLocal` uses `iOS: iosForegroundDetails` (not empty `DarwinNotificationDetails()`).

**`NotificationController.showFromRemoteMessage`**

- Before `showLocal`, if **iOS + app resumed + `message.notification != null`** → **return** (defer to FCM system banner). Log e.g. `deferToFcmForegroundBanner`.
- Otherwise show local (Android always; iOS for data-only and background handler path).

**Do not**

- `alert: false` on FCM **and** expect Console `notification` messages to banner in foreground — they will not.
- `alert: true` **and** always call `showLocal` for the same message — duplicate banners on iOS.

**Production preference:** backend sends **data-only** FCM (`title_ar` / `title_en` / `body_*` / `action_type` in `data`) so one code path controls copy and locale. Console test messages with a `notification` block still work via the defer rule above.

`requestToken` / `Helpers.getFcmToken()`:

```dart
static Future<String> getFcmToken() async {
  const key = 'cached_fcm_token';
  final cached = await SecureStorage.read(key);
  if (cached != null && cached.isNotEmpty) return cached;
  final fresh = await FirebaseMessaging.instance.getToken();
  if (fresh != null && fresh.isNotEmpty) {
    await SecureStorage.write(key, fresh);
  }
  return fresh ?? '';
}
```

Payload parsing stays on `NotificationPayload.fromMap`. Prefer **data** keys (`title_ar` / `title_en` / `body_*` / `action_type`). If the message has a `notification` block, use it as fallback title/body.

Do **not** clear `cached_fcm_token` on logout.

### Android

`AndroidManifest.xml` already has `POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`. Keep them.

**Do not** declare `USE_FULL_SCREEN_INTENT`. If the duplicate still has it from base, delete that `<uses-permission>` line (see [scaffold.md](scaffold.md) §2.3).

Inside `<application>` add:

```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="high_importance_channel" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
```

Create a **white silhouette** `android/app/src/main/res/drawable/ic_notification.xml` (not the full-color launcher).  
Create `android/app/src/main/res/values/colors.xml` with `notification_color` = brand hex.

`google-services` plugin is already in `android/app/build.gradle.kts` and `settings.gradle.kts`.

### iOS

`ios/Runner/Info.plist` — add:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

Create `ios/Runner/Runner.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>aps-environment</key>
  <string>development</string>
</dict>
</plist>
```

Wire `CODE_SIGN_ENTITLEMENTS = Runner/Runner.entitlements;` for Debug/Release/Profile in `project.pbxproj`. Add the entitlements file to the Runner group.

`AppDelegate.swift` — keep `FlutterImplicitEngineDelegate`. After super:

```swift
UNUserNotificationCenter.current().delegate = self
application.registerForRemoteNotifications()
```

Import `UserNotifications`.

Remind the user (checklist): APNs key in Firebase Console + Push Notifications capability in Xcode. The skill cannot finish APNs from disk alone.

---

## 4.2 bot_toast — replace SnackBar alerts

Add `bot_toast` to pubspec.

`lib/src/app.dart` — `MaterialApp`:

```dart
navigatorObservers: [BotToastNavigatorObserver()],
builder: (context, child) => BotToastInit()(context, child),
```

Do not drop `locale` / `localizationsDelegates` / `navigatorKey`.

Rewrite `lib/src/core/widgets/custom_messages.dart`:

```dart
class MessageUtils {
  static void showSuccess(String message) => _toast(message, AppColors.success);
  static void showError(String message) => _toast(message, AppColors.error);
  static void showWarning(String message) => _toast(message, AppColors.warning);
  static void showInfo(String message) => _toast(message, AppColors.info);

  /// Backward-compatible alias used by leftover call sites.
  static void showSnackBar({
    BuildContext? context,
    required BaseStatus baseStatus,
    required String message,
  }) {
    if (baseStatus == BaseStatus.error) {
      showError(message);
    } else {
      showSuccess(message);
    }
  }
}
```

Implement `_toast` with `BotToast.showCustomText` / `showCustomNotification` — branded colors, `fontFamily: ConstantManager.fontFamily`, RTL-safe padding (`start`/`end`), ~2s duration, no `ScaffoldMessenger`.

**`image_widgets/image_view.dart` (full-screen preview):**

- Use **`MessageUtils.showError`** for video load failures (no `ScaffoldMessenger`).
- **`InteractiveViewer`:** default `minScale` must be **`> 0`** (use `1.0`); clamp invalid values before building the viewer.
- **Do not** put `CloseButton` in a `Stack` over a full-screen `InteractiveViewer` — gestures are stolen and close appears dead.
- Use **`Scaffold` + `AppBar`** with **`ArrowWidget(onTap: () => Go.back())`**; media (zoom/pan) lives in **`body`** only.
- Titles/errors via **`LocaleKeys`** (`media_preview_image`, `media_preview_video`, `media_image_unavailable`, …) in base `lang.json`.

`showLoading` may wrap `BotToast.showLoading` if a global loader is needed; do not fight `CustomLoading` — pick one and use it consistently (prefer existing `CustomLoading` for full-screen).

---

## 4.3 SessionManager

New file: `lib/src/core/shared/helpers/session_manager.dart`

```dart
enum SessionEndReason { logout, deleteAccount, unauthenticated, blocked }

final class SessionManager {
  SessionManager._();
  static final instance = SessionManager._();
  bool _busy = false;

  Future<void> endSession(SessionEndReason reason) async { ... }
}
```

`endSession` (single-flight via `_busy`):

1. `UserCubit.instance.logout()` (clears `TokenStorage` + `auth_user_payload`).
2. Cancel in-flight Dio calls (`RequestCancellationManager` if present).
3. Clear offline queue box if the manager exposes `clear`.
4. `Go.offAllNamed(NamedRoutes.login)` — if login is not registered yet, `Go.offAll` to the login placeholder you will add in phase 5/6. Do **not** stay on a guarded tab.
5. `BotToast` (not a bottom sheet):

| Reason | Message key |
|--------|-------------|
| `blocked` | `LocaleKeys.blocked` (or new `account_blocked`) |
| `unauthenticated` | session-expired key |
| `deleteAccount` | new `account_deleted` |
| `logout` | optional silent / `logged_out` |

Do **not** show `UnAuthenticatedBottomSheet`. Leave the widget file or delete it; no new call sites.

### Wire auth failure

`lib/src/core/network/dio_client.dart` currently:

```dart
AuthInterceptor(_dio),
```

Change to:

```dart
AuthInterceptor(
  _dio,
  onAuthFailure: () => SessionManager.instance.endSession(
    SessionEndReason.unauthenticated,
  ),
),
```

`AuthInterceptor` already treats HTTP 401 **and** PHP `key == unauthenticated` as an auth challenge. It may attempt **one** silent refresh when a non-empty `refresh_token` exists. In **all** other auth-challenge cases it must call `onAuthFailure` → `SessionManager.endSession(unauthenticated)` — do **not** pass the response through to the cubit while the user still looks logged in:

- No refresh token (typical Sanctum-only login: access token only).
- Request already retried once (`retried` extra) but body is still `unauthenticated`.
- Refresh endpoint failed or returned no new access token.

Skip `endSession` only when `skipAuth` is set (public endpoints such as login/register).

After refresh fails **or** when refresh is skipped for the reasons above, `onAuthFailure` clears tokens and routes to login immediately.

PHP `blocked` is **not** an auth-refresh case. Handle it without a second interceptor if possible:

- In `ResponseParser` (or a tiny helper called from the parser / a dedicated interceptor **after** auth): when envelope key is `PhpResponseKeys.blocked`, fire `SessionManager.endSession(SessionEndReason.blocked)` once, then still return `Left(BlockedFailure(...))`.
- Guard with the same `_busy` flag so a burst of 401s cannot open two toasts or double-route.

Logout / delete-account **feature** code (when those screens exist) must call `SessionManager.endSession` — not only `UserCubit.logout()`. If the API has `auth/logout` or delete-account, call it first (best-effort; ignore failure) then `endSession`.

Notification payload `type`/`action_type` for block → `endSession(blocked)` as well.

---

## 4.4 Dropdown

Files:

- `lib/src/core/widgets/fields/drop_downs/app_drop_down/dropdown_layout.dart`
- `app_dropdown.dart`

In `DropdownLayout`:

```dart
static const double sheetMinHeightFactor = 1 / 3;
static const double sheetMaxHeightFactor = 0.75;
```

`_calculateSheetHeight`: min clamp = `screen * sheetMinHeightFactor` (not the old `minBottomSheetHeight: 200`). Max stays `maxHeight ?? screen * 0.75`. Account for keyboard (`viewInsets.bottom`).

Paginated sheet height (currently always `screen * 0.75`) must also be `>= screen / 3`.

**Confirm-only selection** (already intended — verify all three paths):

- Item tap updates a local `ValueNotifier` only.
- `Navigator.pop(sheetCtx, selected)` runs **only** from `DropdownConfirmButton`.
- Header close / drag-dismiss / barrier pop return `null` → parent does **not** call `onChanged`.
- Multi-select same rule (confirm even if count is 0 only if that is existing UX; do not commit on tile tap).

---

## 4.5 image_cropper (Android + iOS permissions)

Dart helper `ImageHelper._cropImage` already uses `image_cropper`. Do not replace it. Toolbar colors should use `AppColors.brand` (update from `primary` if brand is the accent).

### Android

Inside `<application>` in `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name="com.yalantis.ucrop.UCropActivity"
    android:screenOrientation="portrait"
    android:theme="@style/Theme.AppCompat.Light.NoActionBar"/>
```

If the theme is missing at compile time, add `androidx.appcompat:appcompat` in `android/app/build.gradle.kts` `dependencies {}`.

Camera (if `image_picker` camera is used):

```xml
<uses-permission android:name="android.permission.CAMERA"/>
```

### iOS `Info.plist` (Arabic strings; English allowed as extra)

```xml
<key>NSCameraUsageDescription</key>
<string>نحتاج إلى الكاميرا لالتقاط الصور داخل التطبيق</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>نحتاج إلى معرض الصور لاختيار الصور داخل التطبيق</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>نحتاج إلى حفظ الصور في المعرض</string>
```

---

## 4.6 Payment WebView (always add the widget; use when Figma/API has payment)

Add `webview_flutter`.

Create:

- `lib/src/core/widgets/webview/payment_result.dart`
- `lib/src/core/widgets/webview/payment_webview_screen.dart`

```dart
enum PaymentStatus { success, failure, cancelled }

final class PaymentResult {
  const PaymentResult(this.status, {this.uri});
  final PaymentStatus status;
  final Uri? uri;
}
```

`PaymentWebViewScreen` constructor: `paymentUrl`, optional `successHosts` / `failureHosts` / `cancelHosts` (or path prefixes from Postman / backend docs).

`NavigationDelegate.onNavigationRequest` / `onUrlChange`:

- match success → `Go.back(PaymentResult(PaymentStatus.success, uri: uri))`
- match failure → `failure`
- match cancel → `cancelled`
- `http`/`https` otherwise → navigate inside the view

Show a linear progress bar while `onProgress < 100`. On `onWebResourceError`, `MessageUtils.showError` + allow retry.

Do not embed card numbers. Do not add a payment SDK unless the user asks.

Callers: `final result = await Go.to(PaymentWebViewScreen(...));`

---

## 4.7 Static HTML pages

`lib/src/core/widgets/custom_html_widget.dart`:

- Keep existing style map; set body `direction` from `Directionality.of(context)` (RTL default).
- Handle link taps via the `flutter_html` 3.x API (`onLinkTap` or `OnTapExtension` — use whatever the locked version exports).

| URL | Action |
|-----|--------|
| `http:` / `https:` | `launchUrl(..., mode: LaunchMode.externalApplication)` |
| `tel:` / `mailto:` | `launchUrl` |
| `#anchor` | ignore or scroll if trivial |
| unknown | no-op |

Create `lib/src/core/widgets/static_page_screen.dart` (`DefaultScaffold` + `CustomHtmlWidget` in a `SingleChildScrollView`). Title + HTML string (from API or assets). Privacy / terms / about all use this one screen.

---

## 4.8 Unified back button

Single source: `lib/src/core/widgets/scaffolds/arrow_widget.dart` used by `DefaultScaffold`.

- Mirror with `Directionality` / `context.isRight` so the chevron points toward the start edge in both `ar` and `en`.
- Default `onTap`: `Go.back()`.
- Inner screens use `DefaultScaffold` (see `scaffold-statusbar.mdc`).
- Auth screens that Figma draws **without** this chrome may use a plain `Scaffold` + `SafeArea`, but the glyph must still be `ArrowWidget` (or the same asset) unless that **specific** screen’s Figma uses a different icon. Do not invent a second back widget.

---

## 4.9 Language + direction

- `EasyLocalization`: `fallbackLocale: Locale('ar')`, `saveLocale: true`, `supportedLocales` from `Languages.supportLocales`.
- Also persist `SecureStorage.write('app_locale', code)` whenever the user changes language, so FCM background mapping of `title_ar`/`title_en` can read it without `BuildContext`.
- Language switch: `context.setLocale` + write `app_locale` + `EasyLocalization.of(context)?.setLocale`. Rebuild from root; do not `runApp` again.
- Never `TextAlign.left` / `Positioned(left:)`. Use `start`/`end`.
- `CustomHtmlWidget` and dropdown tiles honor `Directionality`.

### Phone numbers with `+` (mandatory in RTL)

Arabic RTL must **not** mirror international phone strings. Any **display** text that includes a leading `+` or digits in phone order (`+966…`, `05…`, OTP subtitle with masked phone) must use **`TextDirection.ltr`** on that `Text` (or on a small wrapper widget), while the rest of the screen stays RTL.

```dart
Text(
  phone,
  style: const TextStyle().setMainTextColor.s14.medium,
  textDirection: TextDirection.ltr,
)
```

Apply on: profile phone row, contact/lab cards, auth OTP header (“code sent to +966…”), change-mobile OTP, support `tel:` labels, and any Figma frame that shows a full number. **Do not** wrap the whole screen in LTR — only the phone substring widget.

Phone **input** fields: keep `textInputType: TextInputType.phone` + Saudi formatters; optional `textDirection: TextDirection.ltr` on the field when the hint starts with `+` or `05`.

---

## 4.10 `device_id` = FCM token

When mapping Postman (or writing login/register/update-device bodies):

- JSON key `device_id` (any casing the collection uses) → `await Helpers.getFcmToken()`.
- Do **not** send a UUID, Android ID, or `Platform` string in that field.
- If the collection has a separate `device_type`, that one may be `android`/`ios` (`ConstantManager.platform`).

Document this in the new project's `api-pipeline` / `api-design` rule (one sentence is enough).

---

## End of phase 4

1. Add translation keys used above to `lang.json`.
2. `./scripts/remove_demo.sh` — delete `products`. Then grep leftover `products` imports and fix `route_generator` / DI.
3. `dart run build_runner build --delete-conflicting-outputs`
4. `dart run generate/strings/main.dart` (stop watcher after first success)
5. `flutter analyze`
6. Apply §8 below so feature agents do not re-add awesome_notifications.

---

## 8 — Patch `.cursor` (and `.claude/skills` if present) in the NEW project

Canonical Cursor copies: `.cursor/rules/*.mdc`. If `.claude/skills/<name>/SKILL.md` exists, mirror the same text so they cannot drift.

### Rewrite `notifications.mdc`

- Description: FCM via `firebase_messaging` + display via `flutter_local_notifications`.
- **Forbidden:** `awesome_notifications`, `awesome_notifications_fcm`.
- Allowed: `firebase_messaging`, `flutter_local_notifications`.
- Point to `NotificationManager` / `NotificationController` / `Helpers.getFcmToken()`.
- Bootstrap: `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)` then `onBackgroundMessage` then `NotificationManager.initialize`.
- Document **iOS foreground banner** rules from §4.1 (FCM presentation + defer local when `notification` payload; `iosForegroundDetails`; data-only → local only).

### Patch `flutter-base-coding-standards.mdc` / `rtl-arabic` skill (phone LTR)

Add one rule under RTL / text: displayed phone numbers containing `+` (or E.164 / Saudi mobile display) → `Text(..., textDirection: TextDirection.ltr)`. Screen layout stays RTL; only the phone `Text` is LTR.

### Patch `pubspec-manager.mdc`

Installed list must match reality after 4.1–4.6: `firebase_messaging`, `flutter_local_notifications`, `bot_toast`, `webview_flutter`. Remove awesome_* and stale packages that are not in pubspec (`hydrated_bloc`, `shared_preferences`, `pinput`, `carousel_slider`, `easy_logger`, …).

### Patch `design-tokens.mdc` / coding-standards snackbar mentions

User-facing alerts → `MessageUtils` / `bot_toast`, not `SnackBar` / `ScaffoldMessenger`.

### Add new rules (alwaysApply false, tight globs)

**`session-guard.mdc`** (`lib/src/core/network/**`, `lib/src/core/shared/cubits/user_cubit/**`, auth feature): logout, delete-account, 401, PHP `unauthenticated`/`blocked` → `SessionManager.endSession` only. Toast via bot_toast. Never leave a stale token.

**`payment-webview.mdc`** (`**/payment*.dart`, webview folder): open gateway URLs in `PaymentWebViewScreen`; pop `PaymentResult`; no card SDK.

**`static-html-pages.mdc`**: privacy/terms/about → `StaticPageScreen` + `CustomHtmlWidget`; links clickable.

**`chat-socket.mdc`**: do not implement socket until the user attaches a `.md` spec. When they do: images, videos, clickable links. Reuse `CustomHtmlWidget` / `UniversalMediaWidget` / `cached_network_image` / `video_player`.

**`device-id-fcm.mdc`** (optional short): Postman `device_id` = FCM token.
