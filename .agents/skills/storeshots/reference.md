# storeshots — Reference

## حدود الحقول (تحقق بالطول قبل التسليم)

```python
print(len("النص"))
```

| المتجر | الحقل | الحد |
|--------|--------|------|
| App Store | Name | 30 |
| App Store | Subtitle | 30 |
| App Store | Keywords | 100 (فواصل، بدون مسافة بعد `,`) |
| App Store | Promotional text | 170 |
| App Store | Description | 4000 |
| App Store | What's New | 4000 |
| Google Play | Title | 50 |
| Google Play | Short description | 80 |
| Google Play | Full description | 4000 |
| Google Play | Feature graphic | 1024×500, JPEG/PNG, ≤ 15 MB |
| Google Play | Hi-res icon | 512×512 PNG RGB |

Keywords مثال (عدّل حسب التطبيق):

```
رحلة,توصيل,تاكسي,مشاوير,تسوق,محفظة,سائق,الرياض,السعودية,طلب رحلة,جدولة,كابتن,تنبيهات,دفع
ride,taxi,cab,delivery,shopping,wallet,driver,riyadh,saudi,book ride,schedule,stops,pay
```

---

## قالب listing (`{name}-store-listing.txt`)

```
{APP} — Store listing copy
===========================

App Store Connect (iOS)
-----------------------
Name AR:
Name EN:
Subtitle AR:          (≤30)
Subtitle EN:          (≤30)
Keywords AR:          (≤100, comma, no spaces)
Keywords EN:
Promotional text AR:  (≤170)
Promotional text EN:
Description AR:
Description EN:
What's New AR:
What's New EN:

Google Play Console (Android)
-----------------------------
Title AR:             (≤50)
Title EN:
Short description AR: (≤80)
Short description EN:
Full description AR:
Full description EN:

Graphic assets
--------------
AppStore_1206x2622/     ← ارفع أولاً
AppStore_1179x2556/
Play_1080x1920/
play-feature-graphic-1024x500.jpg
{name}-play-icon-512.png
apple-header-5244x2950.png
apple-header-3840x1646.png
```

وصف عربي — هيكل مقترح:

1. جملة تعريف (التطبيق + البلد/الفئة).
2. فقرة ماذا يفعل المستخدم.
3. قائمة مميزات بـ `•`.
4. جملة إغلاق / slogan.

---

## أين اللوجو والأيقونة في Flutter

```
# iOS 1024 (أفضل مصدر لـ Play 512 ولـ --logo لو الخلفية مليانة)
ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png
ios/Runner/Assets.xcassets/AppIcon.appiconset/AppIcon~ios-marketing.png

# Android (غالباً 192 — ليس لرفع Play)
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# SVG السبلاش
assets/svg/**/*logo*.svg
```

ألوان الهوية: `lib/src/config/res/color_manager.dart` أو لون خلفية الـ Splash.

---

## تحقق بعد التصدير

```python
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
import io

z = Path.home() / "Downloads" / "APP-store-screenshots.zip"
with ZipFile(z) as zf:
    for name in sorted(zf.namelist()):
        im = Image.open(io.BytesIO(zf.read(name)))
        print(f"{name:55} {im.mode:5} {im.size}")
```

Checklist:

- [ ] `1206×2622` و `1179×2556` و `1080×1920` موجودة
- [ ] PNG = `RGB` (مش RGBA)
- [ ] Feature Graphic = `(1024, 500)` و < 15 MB
- [ ] اللوجو باين في Feature Graphic و Apple headers (مش مربع أبيض)
- [ ] Play icon = `(512, 512)` RGB
- [ ] Keywords AR/EN كل واحد ≤ 100
- [ ] Short description ≤ 80
- [ ] نصوص آبل اتعملت paste في الشات

---

## Troubleshooting

| مشكلة | الحل |
|--------|------|
| لوجو أبيض مش باين | `prepare_logo.py --bg` بلون السبلاش، أو استخدم أيقونة 1024 الملونة |
| Feature Graphic قديم في المجلد المفكوك | انسخ الملف الجديد فوق `play-feature-graphic-1024x500.jpg` وأعد الـ ZIP |
| `html.matches` / فشل build مش من السكيل | خارج النطاق — سكيل التطبيق |
| مفيش لقطات | قف واطلب 3–6 سكرينات |
| Playwright missing | `bash "$SKILL_DIR/setup.sh"` |
| StoreShots tool not found | انسخ الفولدر كامل (`tool/` + `scripts/` + `assets/`) مش `SKILL.md` لوحده |
| خط عربي باهت | الخط المضمّن: `assets/fonts/ThmanyahSans-Black.woff2` — `generate.py` بيحمّله لوحده |
