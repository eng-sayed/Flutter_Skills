---
name: clone
description: >-
  Clone a Flutter app from GitLab group icraftsa/flutter/sayed-ashraf into
  ~/Desktop/projects and install the unified Android keystore (sibling project,
  ~/Downloads, or ~/Desktop/keys). Use when the user says "clone", "كلون",
  "استخدم clone", "جيب المشروع من جيت لاب", or gives a project name to fetch
  from GitLab (user or provider).
---

# Skill: clone — GitLab + keystore

كلون مشروع Flutter من مجموعة GitLab، ثم تركيب الـ keystore الموحّد. مش سكافولد، ومش build.

`SKILL_DIR` = المجلد اللي فيه الملف ده (`.agents/skills/clone`).

مجموعة GitLab:

`https://git.aait.cloud/icraftsa/flutter/sayed-ashraf/<slug>.git`

الوجهة: `$HOME/Desktop/projects/<slug>/`

GitLab REST API بيرجع 401 من غير PAT. الاعتماد على `git ls-remote` (الـ Keychain شغال مع git).

## المدخل

اسم المشروع كفاية. الدور:

| كلام المستخدم | role |
|---------------|------|
| يوزر / user / عميل | `user` |
| بروفايدر / provider / كابتن | `provider` |
| من غير تحديد | `auto` |

لو `auto` ولقينا user وprovider: **اسأل** أي واحد، ومتنسخّش الاتنين إلا لو طلب الاتنين.

أكتر من اسم في نفس الرسالة: كرّر الخطوات لكل اسم.

## 1 — حدّد الـ slug

```bash
python3 "$SKILL_DIR/scripts/resolve_repo.py" "<name>" user
```

الـ role التالت: `user` أو `provider` أو `auto`.

| exit | المعنى |
|------|--------|
| 0 | سطر واحد = الـ slug |
| 2 | سطرين `user` و `provider` — اسأل |
| 1 | مش لاقي |

لو exit 1:

1. دوّر في Slack على اسم المشروع ولينك `git.aait.cloud/icraftsa/flutter/sayed-ashraf/`.
2. أكّد اللينك بـ `git ls-remote --heads`.
3. أضف صف في [aliases.tsv](aliases.tsv) بعد التأكيد فقط: `query<TAB>user_slug<TAB>provider_slug` (`-` لو مفيش provider).
4. لسه مش لاقي: أوقف واطلب الـ slug أو اللينك. متخترعش ريبو.

## 2 — كلون

لو `$HOME/Desktop/projects/<slug>` موجود وفيه `origin` لنفس الريبو: متعملش كلون تاني، كمّل على الـ keystore.

لو الفولدر موجود ومش نفس الريبو: أوقف.

```bash
git clone "https://git.aait.cloud/icraftsa/flutter/sayed-ashraf/<slug>.git" \
  "$HOME/Desktop/projects/<slug>"
```

متعملش `git init`. متcomitش. متدفعش.

## 3 — Keystore موحّد

المسارات جوه المشروع:

| ملف | المسار |
|-----|--------|
| properties | `android/key.properties` |
| keystore | `android/app/key.jks` |

لو الاتنين موجودين، سيبهم. لو ناقص واحد، انسخ **الزوج** من أول مصدر فيه الاتنين:

1. أي مشروع تحت `$HOME/Desktop/projects/*/android/` (`key.properties` + `app/key.jks`)
2. `$HOME/Downloads/key.properties` + `$HOME/Downloads/key.jks`
3. `$HOME/Desktop/keys/key.properties` + `$HOME/Desktop/keys/key.jks`

```bash
cp "$SRC_PROPS" android/key.properties
cp "$SRC_JKS" android/app/key.jks
```

ممنوع `keytool -genkey`. ممنوع طباعة `storePassword` / `keyPassword`.

`android/.gitignore` لازم يحتوي:

```
key.properties
**/*.keystore
**/*.jks
```

لو سطر ناقص، ضيفه. بعد النسخ:

```bash
git check-ignore -v android/key.properties android/app/key.jks
```

لو مصدر فاضٍ: أوقف واطلب الملفين. متبنيش release على debug.

## 4 — ربط Gradle

اقرأ `android/app/build.gradle.kts` أو `build.gradle`.

لو `buildTypes.release` أصلاً على `signingConfigs.release`: سيبه.

لو على `signingConfigs.debug` أو من غير release config، اربطه. قالب Kotlin: [gradle.md](gradle.md). Groovy: نفس الحقول (`storeFile = file("key.jks")` نسبي لـ `android/app`).

## 5 — التقرير

اعرض لكل مشروع: المسار، الـ remote، الفرع، مصدر الـ keystore (اسم الفولدر بس)، وإن الـ release signing متركّب. من غير كلمات سر.

## ما لا تفعله

- متستنسخش الـ provider لما الطلب user
- متكتبش الـ keystore في git
- متعملش keystore جديد
- متطبعش باسوردات `key.properties`
- متبدأش build أو تعديل فيتشرز إلا بطلب تاني
