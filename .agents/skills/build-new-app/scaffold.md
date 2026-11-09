# scaffold.md — Phases 0–3

Base repo: `$HOME/Desktop/projects/flutter_clean_arch_base`  
**Branch: `network-with-php-keys`** (never `main`)  
New project: `$HOME/Desktop/projects/<project_name>/`  
Two apps: same steps for each folder — see [dual-apps.md](dual-apps.md).

Never modify the base repo.

---

## 0 — Pre-flight

```bash
flutter --version
test -d $HOME/Desktop/projects/flutter_clean_arch_base/.git && echo BASE_OK
cd $HOME/Desktop/projects/flutter_clean_arch_base
git status --porcelain
git branch --show-current
```

- [ ] Flutter SDK available
- [ ] Base repo exists
- [ ] Working tree is **empty**. If `git status --porcelain` prints anything → **stop** and tell the user. Do not stash, discard, or checkout.
- [ ] Target folder `$HOME/Desktop/projects/<project_name>` does **not** already exist. If it does → stop. Dual: **both** folders must not exist; bundle IDs must differ.

Normalize names before copying:

| From user | Produce |
|-----------|---------|
| Project name | folder + Dart package: lowercase, digits, underscores only (e.g. `my_shop`) |
| Bundle ID | reverse-DNS, no uppercase (e.g. `com.company.myshop`) |
| Android namespace | same as Bundle ID |
| Kotlin package path | Bundle ID with `.` → `/` under `android/app/src/main/kotlin/` |

---

## 1 — Pull + duplicate

```bash
cd $HOME/Desktop/projects/flutter_clean_arch_base
git fetch origin network-with-php-keys
git checkout network-with-php-keys
git pull origin network-with-php-keys

rsync -a \
  --exclude='.git' \
  --exclude='build' \
  --exclude='.dart_tool' \
  --exclude='.flutter-plugins-dependencies' \
  --exclude='ios/Pods' \
  --exclude='ios/.symlinks' \
  --exclude='ios/Flutter/Flutter.podspec' \
  --exclude='android/.gradle' \
  --exclude='android/local.properties' \
  --exclude='.DS_Store' \
  --exclude='coverage' \
  --exclude='reports' \
  ./ "$HOME/Desktop/projects/<project_name>/"
```

- [ ] New folder has `pubspec.yaml`, `lib/`, `.cursor/`, `.claude/`
- [ ] New folder has **no** `.git`
- [ ] Base repo is untouched

Then `move_agent_to_root` to the new project path (single-app only). Dual: stay at `$HOME/Desktop/projects` and rsync a **second** copy with the second name. Remaining commands use that app’s absolute path.

If the user agreed to drop desktop/web (default yes):

```bash
rm -rf macos linux windows web
```

Keep `android/` and `ios/`.

---

## 2 — Full rename

Work in the **new** project. Dart package in this section is `<pkg>` (snake_case). Bundle ID is `<bundle>`.

### 2.1 Dart package

In `pubspec.yaml`:

- `name: <pkg>`
- `description:` short app description
- `version: 1.0.0+1`

Replace every import/export:

```bash
rg -l 'package:clean_arch_base' --glob '!build/**' --glob '!.dart_tool/**'
```

Change `package:clean_arch_base/` → `package:<pkg>/` in all hits (including `test/`, `generate/`, `lib/hive_registrar.g.dart` if present).

### 2.2 Constants

Edit `lib/src/config/res/constants_manager.dart`:

```dart
static const String bundleId = '<bundle>';
static const String appName = '<display name>'; // Arabic name if that is the primary brand
static const String baseUrl = '<api base url>/'; // trailing slash
static const String fontFamily = '<FontFamily>'; // from user fonts, not Beiruti if replaced
```

Also set `lib/src/core/network/api_endpoints.dart` `defaultValue` to the same API base with a trailing slash (include `/api/` when that is the collection prefix). Keep `--dart-define=API_BASE_URL` as the override.

### 2.3 Android

`android/app/build.gradle.kts`:

- `namespace = "<bundle>"`
- `applicationId = "<bundle>"`

`android/app/src/main/AndroidManifest.xml`:

- `android:label` → display name
- **Remove** `android.permission.USE_FULL_SCREEN_INTENT` if present (copied from base). Play Console treats it as a sensitive permission; FCM/local notifications do not need full-screen intents for this stack.

Move `MainActivity.kt`:

```
from: android/app/src/main/kotlin/com/example/clean_arch_base/MainActivity.kt
to:   android/app/src/main/kotlin/<bundle/with/slashes>/MainActivity.kt
```

File contents:

```kotlin
package <bundle>

import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity()
```

Delete the empty `com/example/clean_arch_base/` tree.

Search leftovers:

```bash
rg -n 'com\.example\.clean_arch_base|clean_arch_base|cleanArchBase' android ios --glob '!**/Pods/**'
```

### 2.6 Android release signing (every project)

Canonical sources — **do not edit** these files, **do not** put their contents in chat or in skill markdown:

| Source | Destination in the new project |
|--------|-------------------------------|
| `$HOME/Downloads/key.properties` | `android/key.properties` |
| `$HOME/Downloads/key.jks` | `android/app/key.jks` |

If **either** source is missing → **stop**. Tell the user the Downloads files are gone; do not generate a keystore.

```bash
test -f $HOME/Downloads/key.properties && test -f $HOME/Downloads/key.jks || exit 1
cp $HOME/Downloads/key.properties android/key.properties
cp $HOME/Downloads/key.jks android/app/key.jks
```

`storeFile` in the copied `key.properties` must stay `key.jks` (relative to `android/app/`). If a copy ever has an absolute Downloads path, rewrite **only** `storeFile=` to `key.jks`. Dual: run the same copy into **both** apps from Downloads (do not invent a second keystore).

`android/.gitignore` already ignores `key.properties` and `*.jks` — keep that.

Wire **Kotlin DSL** `android/app/build.gradle.kts` (do not leave the base’s debug-for-release TODO). Add imports + load **above** `android {`, then `signingConfigs` + release `signingConfig`:

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // namespace / compileSdk / defaultConfig unchanged from §2.3

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties.getProperty("keyAlias")
            keyPassword = keystoreProperties.getProperty("keyPassword")
            storeFile = file(keystoreProperties.getProperty("storeFile"))
            storePassword = keystoreProperties.getProperty("storePassword")
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

- [ ] `android/key.properties` and `android/app/key.jks` exist
- [ ] `release { signingConfig }` is **`getByName("release")`**, not `"debug"`
- [ ] `rg 'signingConfigs.getByName("debug")' android/app/build.gradle.kts` has **no** hits

### 2.4 iOS

`ios/Runner/Info.plist`:

- `CFBundleDisplayName` → display name
- `CFBundleName` → short name (≤15 chars if possible)

`ios/Runner.xcodeproj/project.pbxproj` — replace **every** `PRODUCT_BUNDLE_IDENTIFIER` (Runner Debug/Release/Profile **and** RunnerTests). Typical old values: `com.example.cleanArchBase` and `com.example.cleanArchBase.RunnerTests`. New tests ID: `<bundle>.RunnerTests`.

Do **not** hand-edit `Podfile.lock`. After rename, later `pod install` is enough.

### 2.5 Sanity

```bash
rg -n 'clean_arch_base|cleanArchBase|com\.example\.clean_arch_base' \
  --glob '!build/**' --glob '!.dart_tool/**' --glob '!**/Pods/**'
```

Expected leftovers: none, or only comments in copied docs you will rewrite in phase 9.

---

## 3 — Fonts, colors, icons, i18n seed

### 3.1 Fonts

1. Copy user font files into `assets/fonts/`.
2. Delete `Beiruti-*.ttf` if the family is replaced.
3. Replace the `fonts:` block in `pubspec.yaml`. Map weights exactly as provided:

```yaml
fonts:
  - family: <FontFamily>
    fonts:
      - asset: assets/fonts/<file>.ttf
        weight: 400
      # 200, 300, 500, 600, 700, 800, 900 as supplied
```

4. `ConstantManager.fontFamily` must match `family:`.
5. `lib/src/config/themes/app_theme.dart` already uses `ConstantManager.fontFamily` — do not hardcode a family there.

### 3.2 Colors

Edit **only** `lib/src/config/res/color_manager.dart`.

Keep the **field names**. Replace hex values from the user palette:

| Token | Typical Figma name |
|-------|-------------------|
| `brand`, `brandLight`, `brandDark`, `brandSurface` | primary / brand |
| `main`, `primary`, `hintText`, `textDisabled`, `textOnDark`, `textBrand` | text |
| `scaffoldBackground`, `card`, `fill`, `surfaceBrand` | surfaces |
| `border`, `borderStrong` | strokes |
| `success`, `error`, `warning`, `info` + `*Surface` | status |

**Keep legacy aliases** (`secondary`, `third`, `forth`, `buttonColor`, `buttonText`, `activeBorder`, `loginPrimary`, `grey1`, `grey2`) pointing at the new tokens so existing widgets compile.

Mirror the same mapping in `AppColorsWithDarkMode`. If the user gave light-only colors, derive a reasonable dark set (do not leave Jawaher gold in place).

Do **not** add one-off named colors (`orangeButton`, `homeHeader`). Reuse tokens.

### 3.3 Icons / images

- App-specific → `assets/svg/app_svg/`
- Shared chrome already in `assets/svg/base_svg/` — reuse when the glyph matches
- Missing Figma icons: `download_figma_images` (Framelink / official Figma MCP) into `assets/svg/app_svg/`
- Dual: apply this section on **App A only**, then copy fonts + `app_svg` + `color_manager.dart` to App B ([dual-apps.md](dual-apps.md) §3). Do not re-download the shared icon set.
- Prefer SVG. PNG only when the node is a raster export

`pubspec.yaml` already lists:

```yaml
- assets/svg/
- assets/svg/base_svg/
- assets/svg/app_svg/
- assets/fonts/
- assets/lottie/
- assets/translations/
```

Then:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Use `AppAssets.svg.appSvg.<name>` in code — never raw `assets/svg/...` strings in widgets.

### 3.4 Translations seed

Master file: `assets/translations/lang.json`  
Format: `"snake_key #$ English": "Arabic"`

- **Keep** all `failure_*`, `blocked`, session-expired, `confirm`, `cancel`, camera/gallery, empty/error strings used by core widgets.
- **Remove** products-demo-only keys.
- Add app name keys if needed.

Do **not** generate strings yet if phase 4 will add more keys — run the generator once at the end of phase 4:

```bash
# The generator watches lang.json and does not exit. Stop it after the first success line.
dart run generate/strings/main.dart > /tmp/strings_gen.log 2>&1 &
pid=$!
for i in $(seq 1 20); do
  grep -q "Generated successfully" /tmp/strings_gen.log && break
  sleep 1
done
kill "$pid" 2>/dev/null || true
```

### 3.5 Verify scaffold

```bash
flutter pub get
flutter analyze
```

Fix package-name / font / color errors before phase 4.
