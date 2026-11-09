# build_test — Reference

## Version Bump (نفس قاعدة prod)

| Current | Default (patch) | minor | major | build only |
|---------|-----------------|-------|-------|------------|
| `1.0.0+1` | `1.0.1+2` | `1.1.0+2` | `2.0.0+2` | `1.0.0+2` |

يحدث **قبل** `flutter build apk` — Android يقرأ `versionCode` / `versionName` من `pubspec.yaml` تلقائياً.

---

## متطلبات Firebase Console (مرة واحدة لكل مشروع)

1. [Firebase Console](https://console.firebase.google.com) → المشروع → **App Distribution**
2. تفعيل App Distribution للتطبيق Android
3. إنشاء مجموعة testers باسم **`testers`**:
   - App Distribution → **Testers & Groups** → **Add group** → اسم `testers`
   - أضف إيميلات الـ testers للمجموعة
4. ملف `android/app/google-services.json` موجود (من Firebase)
5. (اختياري) `firebase.json` من `flutterfire configure`

---

## أوامر التثبيت

```bash
# Firebase CLI
npm install -g firebase-tools
firebase login

# تحقق
firebase projects:list
```

---

## مسارات APK

| Build | Path |
|-------|------|
| Debug (افتراضي `flutter build apk`) | `build/app/outputs/flutter-apk/app-debug.apk` |
| Release | `build/app/outputs/flutter-apk/app-release.apk` |
| Split per ABI | `build/app/outputs/flutter-apk/app-<abi>-release.apk` |

لو `--split-per-abi`، ارفع الـ APK المناسب (غالباً `arm64-v8a` للأجهزة الحديثة).

---

## مثال كامل (يدوي)

```bash
flutter clean && flutter pub get && flutter build apk

firebase appdistribution:distribute \
  build/app/outputs/flutter-apk/app-debug.apk \
  --app "1:705113238964:android:YOUR_APP_ID" \
  --project "your-project-id" \
  --groups "testers" \
  --release-notes "Test build $(date +%Y-%m-%d)"
```

---

## Troubleshooting

### `Error: App Distribution is not enabled`
فعّل App Distribution من Firebase Console للمشروع.

### `Group testers not found`
أنشئ المجموعة في Console بنفس الاسم حرفياً: `testers`

### `403 / Permission denied`
```bash
firebase login --reauth
```
تأكد إن حسابك له صلاحية App Distribution على المشروع.

### `google-services.json` missing
```bash
flutterfire configure
# أو حمّل الملف من Firebase Console → Project settings → Android app
```

### Multiple apps in google-services.json
طابق `package_name` مع `applicationId` في `android/app/build.gradle.kts`.

### Flavors / build variants
```bash
flutter build apk --flavor staging -t lib/main_staging.dart
# APK path يتغير حسب flavor — ابحث في build/app/outputs/
find build/app/outputs -name '*.apk' -type f
```

### APK too large
استخدم `--split-per-abi` أو `--release` مع shrink/obfuscate في Gradle.

---

## الفرق بين build_test و prod

| | build_test | prod (Android phase) |
|---|------------|----------------------|
| الهدف | testers داخليين | Play Store |
| المخرج | APK | AAB |
| Firebase | App Distribution | لا |
| Version bump | نعم (`1.0.0+1` → `1.0.1+2`) | نعم |
| clean locks | لا | نعم (prod iOS phase) |
