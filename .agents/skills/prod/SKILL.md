---
name: prod
description: >-
  Universal Flutter production release workflow for ANY Flutter project (new or existing).
  Bump version, clean locks, iOS pod install, Xcode analyze/archive, permissions audit,
  then Android appbundle on explicit separate request. Resolves a unified Android
  keystore (sibling projects or ~/Downloads) and wires signingConfigs.release.
  Use when the user says "prod",
  "استخدم prod", "release", "رفع production", or prepares any Flutter app for store upload.
---

# Skill: prod — Flutter Production Release (أي مشروع)

## النطاق (Scope)

- **عالمي:** يعمل على **أي** مشروع Flutter — جديد، قديم، مشروع تاني، workspace مختلف.
- **مش مربوط** بمشروع معين، ولا بقواعد coding خاصة بريبو معين.
- **نقطة البداية:** جذر الـ workspace اللي فيه `pubspec.yaml` (مجلد المشروع الحالي في Cursor).
- **لو مش Flutter project** (مفيش `pubspec.yaml`) → أوقف وبلّغ المستخدم.

```bash
# تحقق سريع من جذر المشروع
test -f pubspec.yaml && echo "Flutter project OK" || echo "NOT a Flutter project"
```

---

## Overview

سير عمل رفع إنتاج على مرحلتين **منفصلتين**:

| المرحلة | متى تبدأ | الهدف |
|---------|----------|--------|
| **A — iOS** | عند طلب `prod` / `استخدم prod` | تجهيز + Archive + Upload يدوي |
| **B — Android** | طلب **منفصل صريح** من المستخدم فقط | `flutter build appbundle` بعد ما iOS يخلص |

> **قاعدة ذهبية:** لا تبدأ مرحلة Android تلقائياً أثناء Archive iOS. انتظر المستخدم يقول صراحة (مثلاً: "اعمل appbundle" / "ابدأ أندرويد" / "prod android").

---

## اكتشاف هيكل المشروع (أي مشروع)

قبل التنفيذ، اكتشف تلقائياً:

| المسار | لو موجود | لو مش موجود |
|--------|----------|-------------|
| `pubspec.yaml` | مطلوب — جذر المشروع | **أوقف** — مش Flutter |
| `ios/` | نفّذ خطوات iOS (Phase A) | **تخطّى iOS** — أبلغ المستخدم (Android-only أو لسه ما اتعملش `flutter create` platforms) |
| `android/` | نفّذ Phase B لما يُطلب | **تخطّى Android** — iOS-only |
| `ios/Podfile.lock` | احذفه في A1 | طبيعي في مشروع جديد |
| `pubspec.lock` | احذفه في A1 | طبيعي قبل أول `pub get` |

**اسم Xcode scheme (مش دايماً `Runner`):**
```bash
xcodebuild -workspace ios/*.xcworkspace -list 2>/dev/null | grep -A5 'Schemes:'
```
استخدم أول scheme تطبيقي (غالباً `Runner`) — لو مش واضح، اسأل المستخدم.

**ملف Gradle Android (أي مشروع):**
```bash
ls android/app/build.gradle.kts android/app/build.gradle 2>/dev/null
```
ادعم الاتنين — `.kts` أو `.gradle`.

---

## Phase A — iOS Release

> **لو مفيش `ios/`:** اعرض "المشروع Android-only" واقترح Phase B مباشرة **بعد موافقة المستخدم**.

### A0 — Pre-flight

```bash
pwd
test -f pubspec.yaml || exit 1
git status --short 2>/dev/null || true
grep '^version:' pubspec.yaml
flutter --version
```

- [ ] اعرض: مسار المشروع، الإصدار الحالي، حالة git
- [ ] تغييرات غير مُلتزَم بها → **اسأل** قبل المتابعة

### A1 — حذف ملفات القفل

```bash
rm -f pubspec.lock
rm -f ios/Podfile.lock
```

> **تحذير:** حذف `pubspec.lock` يعيد حل dependencies من الصفر.

### A2 — رفع الإصدار في `pubspec.yaml`

**الصيغة:** `MAJOR.MINOR.PATCH+BUILD`

**الافتراضي:** `1.0.0+1` → `1.0.1+2` (PATCH +1, BUILD +1)

| طلب المستخدم | التحويل |
|--------------|---------|
| minor | `1.0.0+1` → `1.1.0+2` |
| major | `1.0.0+1` → `2.0.0+2` |
| build فقط | `1.0.0+1` → `1.0.0+2` |
| إصدار محدد | حرفياً كما قال |

عدّل `version:` في `pubspec.yaml` فقط.

### A3 — Clean + Dependencies + Pods

```bash
flutter clean && flutter pub get && cd ios && pod install --repo-update && cd ..
```

> المسار `ios` lowercase — مش `iOS`.

### A4 — Flutter Analyze

```bash
flutter analyze
```

- لا تكمل Archive مع errors حرجة.

### A5 — فحص Permissions

اقرأ من المشروع الحالي (مش assumptions):
- `ios/Runner/Info.plist`
- `android/app/src/main/AndroidManifest.xml`
- `pubspec.yaml` dependencies

جدول الربط: [reference.md](reference.md)

### A6 — فحص Signing (iOS)

```bash
grep -E 'DEVELOPMENT_TEAM|PRODUCT_BUNDLE_IDENTIFIER|CODE_SIGN' ios/Runner.xcodeproj/project.pbxproj 2>/dev/null | head -20
```

- مشروع جديد: غالباً محتاج ضبط Team في Xcode أول مرة.

### A7 — Xcode Analyze

```bash
# عدّل SCHEME لو مش Runner
SCHEME=Runner
xcodebuild \
  -workspace ios/Runner.xcworkspace \
  -scheme "$SCHEME" \
  -destination 'generic/platform=iOS' \
  analyze
```

### A8 — Xcode + Archive

```bash
open ios/Runner.xcworkspace
```

**يدوياً:** Any iOS Device → Product → Archive → Organizer → Upload

**CLI (اختياري):**
```bash
xcodebuild -workspace ios/Runner.xcworkspace -scheme "$SCHEME" \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/Runner.xcarchive archive
```

### A9 — تقرير Phase A

اعرض الإصدار الجديد، نتائج analyze، permissions، وحالة Archive.

**Android:** لما تخلص iOS، قول "اعمل appbundle" أو "prod android".

---

## Phase B — Android (طلب منفصل فقط)

> **لو مفيش `android/`:** أوقف وأبلغ.

### B0 — Pre-flight + Release signing (إلزامي)

```bash
grep '^version:' pubspec.yaml
ls android/key.properties android/app/key.jks 2>/dev/null
grep -A20 'signingConfigs\|signingConfig\|release' android/app/build.gradle.kts android/app/build.gradle 2>/dev/null | head -40
```

**قبل أي `appbundle` / `apk --release`:** الـ `buildTypes.release` لازم يستخدم `signingConfigs.release` من `android/key.properties` + `android/app/key.jks` — **ممنوع** توقيع الـ release بـ debug keys.

الـ keystore **موحّد** عبر كل المشاريع. لا تُنشئ keystore جديد.

#### Resolve keystore (انسخ للمشروع الحالي قبل البناء)

المسارات المطلوبة داخل المشروع:

| ملف | المسار |
|-----|--------|
| properties | `android/key.properties` |
| keystore | `android/app/key.jks` |

لو **الاتنين موجودين** في المشروع الحالي → استخدمهم. لو ناقص واحد أو الاتنين، انسخ الزوج من أول مصدر يلاقي الاتنين مع بعض، بالترتيب:

1. **المشروع الحالي** — `android/key.properties` + `android/app/key.jks`
2. **أي مشروع Flutter تاني** (الـ keys موحّدة):
   ```bash
   # أول مشروع شقيق فيه الملفين
   find "$HOME/Desktop/projects" -path '*/android/key.properties' -o -path '*/android/app/key.jks' 2>/dev/null
   ```
   خد الزوج من نفس المشروع (`android/key.properties` + `android/app/key.jks` لنفس الـ app).
3. **Downloads (المصدر الاحتياطي الثابت):**
   - `$HOME/Downloads/key.properties`
   - `$HOME/Downloads/key.jks`
4. **مجلد المفاتيح الموحّد (لو موجود):**
   - `$HOME/Desktop/keys/key.properties`
   - `$HOME/Desktop/keys/key.jks`

انسخ للمشروع الحالي (لا تشِر لملف برّه المشروع — Gradle `file("key.jks")` نسبي لـ `android/app`):

```bash
cp "$SRC_PROPS" android/key.properties
cp "$SRC_JKS" android/app/key.jks
```

تأكد إن `android/.gitignore` فيه `key.properties` و `**/*.jks` / `**/*.keystore`.

لو كل المصادر فاضية: **أوقف** واطلب الملفين — لا تبني AAB بتوقيع debug، ولا تعمل `keytool -genkey`.

#### اربط Gradle على `signingConfigs.release`

لو الـ Gradle لسه على `signingConfigs.debug` (أو مفيش `signingConfigs { create("release") }`):
- اقرأ `key.properties` من `rootProject.file("key.properties")` (`android/key.properties`)
- `storeFile = file("key.jks")` → `android/app/key.jks`
- `buildTypes.release.signingConfig = signingConfigs.getByName("release")`

قالب Kotlin DSL: [reference.md](reference.md) — قسم Release signing.

### B1 — Build

```bash
flutter clean && flutter pub get && flutter build appbundle --release
```

**المخرج:** `build/app/outputs/bundle/release/app-release.aab`

---

## ما لا تفعله

- ❌ لا تفترض اسم مشروع أو bundle id معين
- ❌ لا تبدأ Android بدون طلب صريح
- ❌ لا تبني appbundle / apk --release بتوقيع `signingConfigs.debug`
- ❌ لا تُنشئ keystore جديد — انسخ الموحّد من مشروع تاني أو من `~/Downloads`
- ❌ لا `git commit` إلا بطلب
- ❌ لا `cd iOS` — استخدم `ios`
- ❌ لا تتخطى `flutter analyze`

---

## Trigger Phrases

| العبارة | المرحلة |
|---------|---------|
| prod / استخدم prod / release | Phase A (أو B لو مفيش ios) |
| اعمل appbundle / prod android | Phase B |
| prod كامل | A ثم **اسأل** قبل B |

---

## Additional Resources

- [reference.md](reference.md) — permissions، xcodebuild، troubleshooting
