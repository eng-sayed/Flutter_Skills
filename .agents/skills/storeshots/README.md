# storeshots

فولدر سكيل كامل لتوليد سكرينات App Store + Google Play و Feature Graphic وأيقونة 512 والوصف والـ keywords.

ابعت **المجلد كله**. `SKILL.md` لوحده مش كفاية — السكرينات بتطلع من `tool/` (HTML) عبر `scripts/generate.py`.

## تثبيت

من ريبو `Flutter_Skills` (فرع `icraft`):

```bash
./install.sh
```

ده بيربط الفولدر على Cursor و Claude Code و Codex، وبعدين يشغّل `setup.sh` (`pillow` + Chromium).

في Cursor: `/storeshots` أو «سكرينات الاستور».

المتطلبات: Python 3، شبكة لأول `playwright install chromium`.

## المحتويات

| المسار | الدور |
|--------|--------|
| `SKILL.md` | تعليمات الـ AI |
| `tool/` | أداة HTML اللي بتركّب الموبايل والعناوين |
| `tool/assets/logo.png` | أيقونة StoreShots داخل الأداة |
| `assets/icon.png` | نفس الأيقونة (هوية السكيل) |
| `assets/fonts/ThmanyahSans-Black.woff2` | خط عربي للعناوين |
| `scripts/generate.py` | تصدير السكرينات والكفر |
| `scripts/prepare_logo.py` | تركيب لوجو التطبيق على لون السبلاش |
| `scripts/export_play_icon.py` | أيقونة Play 512×512 |

لوجو **التطبيق** مش جوّه السكيل — بيتاخد من مشروع التطبيق (أيقونة 1024 أو SVG).
