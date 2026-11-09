---
name: build_test
description: >-
  Universal Android-only Flutter test build — bump pubspec.yaml version, flutter clean,
  pub get, build APK, then upload to Firebase App Distribution testers group "testers".
  Use when the user says "build_test", "استخدم build_test", "ارفع تيست", "firebase testers",
  or wants a test APK distributed to Firebase App Distribution on any Flutter project.
---

# Skill: build_test — Android APK + Firebase Testers

## النطاق (Scope)

- **عالمي:** أي مشروع Flutter فيه `android/` — جديد أو قديم، أي workspace.
- **Android فقط** — لا iOS، لا حذف locks. **يرفع الإصدار** في `pubspec.yaml` قبل البناء.
- **نقطة البداية:** جذر المشروع (`pubspec.yaml`).
- **مجموعة Firebase الافتراضية:** `testers` (قابلة للتغيير لو المستخدم حدد اسم تاني).

```bash
test -f pubspec.yaml && test -d android && echo "OK" || echo "NOT ready"
```

---

## Workflow (بالترتيب)

### 0 — Pre-flight

```bash
pwd
grep '^version:' pubspec.yaml
flutter --version
firebase --version
firebase login:list 2>/dev/null | head -5
```

- [ ] `pubspec.yaml` موجود
- [ ] `android/` موجود — لو لأ: `flutter create . --platforms=android` أو أوقف
- [ ] **Firebase CLI** مثبت (`firebase --version`) — لو لأ: `npm install -g firebase-tools` ثم `firebase login`
- [ ] المستخدم مسجّل دخول Firebase (`firebase login`)
- [ ] اعرض الإصدار **الحالي** قبل التعديل

### 1 — رفع الإصدار في `pubspec.yaml`

**الصيغة:** `MAJOR.MINOR.PATCH+BUILD`

**الافتراضي (patch release):**

```
1.0.0+1  →  1.0.1+2
```

**القاعدة:**
- `PATCH` += 1
- `BUILD` (بعد `+`) += 1
- **لا تغيّر** `MAJOR` أو `MINOR` إلا لو المستخدم طلب صراحة

| طلب المستخدم | التحويل |
|--------------|---------|
| minor release | `1.0.0+1` → `1.1.0+2` (PATCH = 0) |
| major release | `1.0.0+1` → `2.0.0+2` (MINOR و PATCH = 0) |
| build فقط | `1.0.0+1` → `1.0.0+2` (الاسم ثابت) |
| إصدار محدد | استخدم اللي المستخدم قاله حرفياً |

- [ ] عدّل سطر `version:` في `pubspec.yaml` فقط
- [ ] اعرض للمستخدم: القديم → الجديد قبل ما تكمل

### 2 — Build APK

```bash
flutter clean && flutter pub get && flutter build apk
```

> استخدم الأمر **حرفياً** كما هو — بدون `--release` إلا لو المستخدم طلب.

**مسار الـ APK بعد البناء:**

| الأمر | الملف |
|-------|-------|
| `flutter build apk` (افتراضي) | `build/app/outputs/flutter-apk/app-debug.apk` |
| `flutter build apk --release` | `build/app/outputs/flutter-apk/app-release.apk` |

- [ ] البناء نجح (exit code 0)
- [ ] تأكد إن الملف موجود قبل الرفع

### 3 — اكتشاف Firebase App ID (أي مشروع)

جرّب بالترتيب:

**أ) `firebase.json` (FlutterFire):**
```bash
python3 -c "
import json, sys
with open('firebase.json') as f:
    d = json.load(f)
print(d['flutter']['platforms']['android']['default']['appId'])
" 2>/dev/null
```

**ب) `android/app/google-services.json`:**
```bash
# طابق package_name مع applicationId في Gradle
APP_ID=$(grep -o '"applicationId = \"[^\"]*\"' android/app/build.gradle.kts android/app/build.gradle 2>/dev/null | head -1 | sed 's/.*\"\(.*\)\"/\1/')
python3 -c "
import json
pkg = '$APP_ID' or None
with open('android/app/google-services.json') as f:
    data = json.load(f)
for c in data.get('client', []):
    info = c.get('client_info', {})
    if not pkg or info.get('android_client_info', {}).get('package_name') == pkg:
        print(info.get('mobilesdk_app_id', ''))
        break
" 2>/dev/null
```

**ج) `lib/firebase_options.dart`:**
```bash
grep -o "android: '[^']*'" lib/firebase_options.dart 2>/dev/null | head -1 | sed "s/android: '//;s/'//"
```

- [ ] لو مفيش App ID → **أوقف** واطلب من المستخدم يمرّر `--app` أو يضيف `firebase.json` / `google-services.json`

### 4 — اكتشاف Firebase Project ID

```bash
python3 -c "
import json
try:
    with open('firebase.json') as f:
        print(json.load(f)['flutter']['platforms']['android']['default']['projectId'])
except: pass
" 2>/dev/null || python3 -c "
import json
with open('android/app/google-services.json') as f:
    print(json.load(f)['project_info']['project_id'])
" 2>/dev/null
```

أو من `.firebaserc`:
```bash
grep -o '"default": "[^"]*"' .firebaserc 2>/dev/null | sed 's/.*"\(.*\)"/\1/'
```

### 5 — رفع Firebase App Distribution

**المجموعة الافتراضية:** `testers`

```bash
APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"   # عدّل لو release
FIREBASE_APP_ID="<من الخطوة 3>"
FIREBASE_PROJECT="<من الخطوة 4>"
GROUP="testers"
VERSION=$(grep '^version:' pubspec.yaml | awk '{print $2}')
NOTES="build_test ${VERSION} — $(date '+%Y-%m-%d %H:%M')"

firebase appdistribution:distribute "$APK_PATH" \
  --app "$FIREBASE_APP_ID" \
  --project "$FIREBASE_PROJECT" \
  --groups "$GROUP" \
  --release-notes "$NOTES"
```

**لو المستخدم حدد مجموعة تانية:** استبدل `GROUP` (مثلاً `--groups "qa-team"`).

**بدون project flag** (لو `.firebaserc` موجود):
```bash
firebase appdistribution:distribute "$APK_PATH" \
  --app "$FIREBASE_APP_ID" \
  --groups "testers" \
  --release-notes "$NOTES"
```

- [ ] الرفع نجح — Firebase يطبع رابط التوزيع
- [ ] لو فشل: راجع [reference.md](reference.md) → Troubleshooting

### 6 — تقرير نهاية

```markdown
## build_test — تم

- المشروع: `<pwd>`
- الإصدار: `X.Y.Z+BUILD`
- APK: `build/app/outputs/flutter-apk/app-debug.apk`
- Firebase App: `<app id>`
- المجموعة: `testers`
- الحالة: ✅ رُفع / ❌ فشل

**Testers:** يستلمون إيميل/إشعار من Firebase App Distribution
```

---

## Trigger Phrases

| العبارة | الإجراء |
|---------|---------|
| build_test / استخدم build_test | Workflow كامل |
| ارفع تيست / firebase testers | Workflow كامل |
| build apk testers | Workflow كامل |
| build_test release | `flutter build apk --release` ثم رفع |

---

## ما لا تفعله

- ❌ لا تلمس iOS أو `pubspec.lock`
- ❌ لا ترفع `version` مرتين في نفس الجلسة
- ❌ لا تستخدم `appbundle` — APK فقط
- ❌ لا تغيّر مجموعة `testers` إلا لو المستخدم طلب
- ❌ لا `git commit` إلا بطلب
- ❌ لا ترفع بدون التأكد من نجاح `flutter build apk`

---

## Additional Resources

- [reference.md](reference.md) — متطلبات Firebase Console، troubleshooting، flavors
