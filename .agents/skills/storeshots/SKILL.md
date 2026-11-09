---
name: storeshots
description: >-
  Generate a complete store listing pack for any app: App Store + Google Play
  screenshots, Play Feature Graphic 1024x500, Play hi-res icon 512x512, Apple
  headers, and Arabic/English listing copy (name, subtitle, description,
  keywords). Use when the user says storeshots, سكرينات الاستور, صور المتجر,
  feature graphic, كفر التطبيق, وصف المتجر, keywords, كي وردس, كي ووردس,
  store listing, or wants App Store Connect / Google Play listing assets.
---

# Skill: storeshots — Store listing pack (أي مشروع)

الفولدر ده **كامل ومستقل**. ابعت المجلد كله كما هو. متبعتش `SKILL.md` لوحده.

```
storeshots/
  SKILL.md
  README.md
  reference.md
  requirements.txt
  setup.sh
  assets/icon.png
  assets/fonts/ThmanyahSans-Black.woff2
  scripts/generate.py
  scripts/prepare_logo.py
  scripts/export_play_icon.py
  tool/                 ← HTML أداة السكرينات (إلزامي)
    index.html
    app.js
    styles.css
    assets/logo.png
```

`SKILL_DIR` = المجلد اللي فيه الملف ده. كل الأوامر تحت تشتغل منه. **ممنوع** مسار يوزر ثابت (`/Users/...`).

تثبيت: من جذر ريبو `Flutter_Skills` شغّل `./install.sh` — بيربط السكيل على Cursor و Claude Code و Codex. بعدها `setup.sh` داخل الفولدر ده يثبت `pillow` + `playwright` و Chromium.

---

## النطاق

- أي تطبيق (Flutter أو غيره)، أي workspace.
- المخرجات: سكرينات آبل + جوجل + Feature Graphic + أيقونة Play 512 + وصف + keywords.
- الأداة: `SKILL_DIR/tool/` (HTML + JS). السكربت بيفتحها بـ Playwright.
- التصدير: `$HOME/Downloads` باسم `{app}-…`.

لا تستخدم Craft Team ولا المقاسات القديمة `1320×2868` / `1284×2778` / `1290×2796`.

---

## المقاسات

| الاستخدام | المقاس | ملاحظة |
|-----------|--------|--------|
| App Store | `1206×2622` | Dynamic Island — ارفع هذا أولاً |
| App Store | `1179×2556` | بديل Dynamic Island |
| Google Play screenshots | `1080×1920` | عمودي |
| مربع | `1080×1080` | اختياري (`--square`) |
| Apple header | `5244×2950` / `3840×1646` | كفر آبل |
| **Feature graphic** | **`1024×500`** | Google Play — إلزامي، JPEG ≤ 15 MB |
| Play hi-res icon | **`512×512`** | PNG RGB بدون alpha |

سكرينات App Store: PNG **RGB من غير alpha**.

---

## Workflow

الافتراضي لطلب "سكرينات كاملة": **كل المقاسات + Apple headers + Feature Graphic + أيقونة 512 + الوصف والkeywords**.

### 0 — المدخلات (متولّدش من غير لقطات)

1. **لقطات** 3–6 شاشات PNG/JPG (من الشات أو `assets/simulator_screenshot_*`).
2. **ألوان الهوية** — من السبلاش / `AppColors`. لو مش موجودة: اسأل أو استخرج من الأيقونة.
3. **عنوان عربي قصير لكل شاشة** (تسويقي، مش اسم الشاشة الخام).
4. **لوجو التطبيق** — أيقونة 1024 أو SVG على لون السبلاش. `assets/icon.png` شعار StoreShots نفسه، مش لوجو التطبيق.
5. **اسم التطبيق** للملفات (`mevoya`, `mevoya-captain`).

ترتيب تسويقي معتاد: رئيسية → أهم فلو → تفاصيل → محفظة/حساب.

لو ناقص لقطات: **قف واطلب**. متولّدش بسكرينات وهمية.

### 1 — اللوجو (حرج — اقرأ قبل التصدير)

غلاف Feature Graphic / Apple header بيرسم اللوجو على الخلفية الغامقة. **لوجو أبيض أو SVG مترaster على أبيض = مربع أبيض فاضي.**

| حالة اللوجو | اعمل إيه |
|-------------|----------|
| أيقونة 1024 جاهزة (ذهبي/أسود خلفية مليانة) | استخدمها كما هي كـ `--logo` |
| SVG/PNG فيه أجزاء بيضاء على شفاف/أبيض | ركّبه على لون السبلاش بمربع 1024 ثم مرّره `--logo` |
| لوجو كابتن/داكن أصلًا | استخدم أيقونة 1024 كما هي |

```bash
# لا تستخدم qlmanage على SVG — بيطلع خلفية بيضاء
python3 "$SKILL_DIR/scripts/prepare_logo.py" \
  --svg assets/svg/app_svg/logo.svg \
  --bg "#E4B16E" \
  --out /tmp/{name}-logo.png
```

بعد التصدير: **افتح Feature Graphic بعينك**. لو اللوجو مش باين → أصلحه وأعد تصدير الكفر فقط.

### 2 — توليد السكرينات

الخط العربي داخل `assets/fonts/` — `generate.py` بيحمّله تلقائيًا. متعدّيش `--font` إلا لو فيه خط تاني.

```bash
python3 "$SKILL_DIR/scripts/generate.py" \
  --shots shot1.png shot2.png shot3.png \
  --titles "عنوان 1" "عنوان 2" "عنوان 3" \
  --c1 "#21201F" --c2 "#8F724F" \
  --logo /tmp/{name}-logo.png \
  --name {name} \
  --out "$HOME/Downloads" \
  --apple-headers \
  --square
```

`--c1` / `--c2`: تدرّج الهوية. للعناوين البيضاء استخدم خلفية غامقة (`c1` غامق).

السكربت يصدّر:

- `{name}-store-screenshots.zip`
- `{name}-play-feature-graphic-1024x500.jpg`
- Apple headers جوّه الـ ZIP لو `--apple-headers`

تحقق: الأبعاد بالظبط، Feature Graphic ≤ 15 MB، PNG = RGB.

انسخ كمان ملف واضح الاسم:

```bash
cp "$HOME/Downloads/{name}-play-feature-graphic-1024x500.jpg" \
   "$HOME/Downloads/{name}-user-play-feature-graphic-1024x500.jpg"
```

### 3 — أيقونة Google Play 512×512

المصدر: iOS marketing 1024 إن وُجد، وإلا أكبر `ic_launcher`.

```
ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png
ios/Runner/Assets.xcassets/AppIcon.appiconset/AppIcon~ios-marketing.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png   # غالباً 192 — لا ترفعها للـ Play
```

```bash
python3 "$SKILL_DIR/scripts/export_play_icon.py" \
  --src ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png \
  --bg "#E4B16E" \
  --out "$HOME/Downloads/{name}-play-icon-512.png"
```

Play Console → Store listing → Hi-res icon ← الملف 512.

### 4 — الوصف والkeywords

اكتب **عربي + إنجليزي**. الحدود في [reference.md](reference.md).

**App Store:** Name 30 · Subtitle 30 · Keywords **100** (فواصل بدون مسافات) · Promo 170 · Description 4000

**Google Play:** Title 50 · Short **80** · Full 4000

عدّ الكلمات بـ `python3 -c "print(len('''...'''))"` قبل التسليم.

**إلزامي في الشات (آبل):** الصق Name / Subtitle / Keywords / Promo / Description / What's New في الرد — متكتفيش بملف.

احفظ نسخة كاملة في `$HOME/Downloads/{name}-store-listing.txt`

Keywords: لا تكرر اسم التطبيق لو هو في الـ Name. عربي وإنجليزي سطرين منفصلين.

### 5 — تقرير التسليم

```markdown
## storeshots — تم

- التطبيق: `{name}`
- ZIP: `~/Downloads/{name}-store-screenshots.zip`
- Feature graphic: `~/Downloads/{name}-play-feature-graphic-1024x500.jpg`
- Play icon: `~/Downloads/{name}-play-icon-512.png`
- Listing: `~/Downloads/{name}-store-listing.txt`
```

وفي نفس الرد: **نصوص آبل كاملة**.

---

## تطبيق تاني في نفس الجلسة (user + captain)

كرّر الـ workflow لكل تطبيق بلقطات ولوجو وأسماء ملفات خاصة (`{name}-user-…` / `{name}-captain-…`).

---

## Trigger Phrases

| العبارة | الإجراء |
|---------|---------|
| storeshots / سكرينات الاستور / صور المتجر | Workflow كامل |
| feature graphic / كفر التطبيق | Feature Graphic + headers + تحقق اللوجو |
| وصف المتجر / keywords / كي وردس | قسم 4 — الصق في الشات |
| أيقونة جوجل بلاي / play icon 512 | قسم 3 |

---

## ما لا تفعله

- متصدّرش المقاسات القديمة `1320×2868` / `1284×2778` / `1290×2796`
- متستخدمش Craft Team
- متسلّمش Feature Graphic غير `1024×500`
- متخلّيش PNG App Store بقناة alpha
- متستخدمش `qlmanage` لتحويل SVG لوجو
- متسلّمش كفر واللوجو مش باين
- متكتفيش بملف listing من غير ما تلصق نصوص آبل في الشات
- متبعتش السكيل من غير مجلد `tool/`

## Additional Resources

- [README.md](README.md) — تثبيت ومشاركة الفولدر
- [reference.md](reference.md) — حدود الحقول، قالب الوصف، أوامر التحقق
