# prod — Reference (أي مشروع Flutter)

## Version Bump Examples

| Current | Default (patch) | minor | major | build only |
|---------|-----------------|-------|-------|------------|
| `1.0.0+1` | `1.0.1+2` | `1.1.0+2` | `2.0.0+2` | `1.0.0+2` |
| `1.0.9+5` | `1.0.10+6` | `1.1.0+6` | `2.0.0+6` | `1.0.9+6` |

---

## Permissions ↔ pubspec Dependencies

| Package / Feature | iOS Info.plist | Android permission |
|-------------------|----------------|-------------------|
| `image_picker` (camera) | `NSCameraUsageDescription` | `CAMERA` |
| `image_picker` (gallery) | `NSPhotoLibraryUsageDescription` | `READ_MEDIA_IMAGES` |
| `google_maps_flutter` | `NSLocationWhenInUseUsageDescription` | `ACCESS_FINE_LOCATION` |
| FCM / notifications | `UIBackgroundModes` → `remote-notification` | `POST_NOTIFICATIONS` |
| `mobile_scanner` | `NSCameraUsageDescription` | `CAMERA` |
| Microphone | `NSMicrophoneUsageDescription` | `RECORD_AUDIO` |

**اكتشف الـ packages من `pubspec.yaml` الحالي** — مش من قائمة ثابتة.

---

## مشروع جديد (`flutter create`)

- `ios/` و `android/` موجودين افتراضياً
- Signing iOS: لازم Team في Xcode قبل Archive
- Android release: انسخ الـ keystore الموحّد (`key.properties` + `key.jks`) ثم اربط `signingConfigs.release` — لا تستخدم debug keys
- `Podfile.lock` ممكن يتولد أول مرة بعد `pod install`

---

## Xcode workspace paths

أغلب مشاريع Flutter:
- `ios/Runner.xcworkspace` + scheme `Runner`

لو مختلف:
```bash
ls ios/*.xcworkspace
xcodebuild -workspace ios/Runner.xcworkspace -list
```

---

## Troubleshooting

### pod install fails
```bash
cd ios && pod deintegrate && pod install --repo-update && cd ..
```

### No ios folder
```bash
flutter create . --platforms=ios
```

### No android folder
```bash
flutter create . --platforms=android
```

### Android release signing (keystore موحّد)

**ممنوع** بناء appbundle/release على `signingConfigs.debug`.
**ممنوع** إنشاء keystore جديد (`keytool -genkey`) — المفتاح واحد لكل المشاريع.

المسارات داخل المشروع:

| ملف | أين |
|-----|-----|
| `key.properties` | `android/key.properties` |
| `key.jks` | `android/app/key.jks` |

لو ناقصين في المشروع الحالي، انسخ الزوج من أول مصدر فيه الاتنين:

1. أي مشروع تحت `$HOME/Desktop/projects/*/android/` (`key.properties` + `app/key.jks`)
2. `$HOME/Downloads/key.properties` + `$HOME/Downloads/key.jks`
3. `$HOME/Desktop/keys/key.properties` + `$HOME/Desktop/keys/key.jks`

```bash
cp "$SRC_PROPS" android/key.properties
cp "$SRC_JKS" android/app/key.jks
```

`key.properties` المتوقع:

```
storePassword=...
keyPassword=...
keyAlias=key
storeFile=key.jks
```

لا تطبع كلمات السر في التقرير للمستخدم.

#### قالب `android/app/build.gradle.kts`

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = keystoreProperties["storeFile"]?.let { file(it) }
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }
    buildTypes {
        release {
            signingConfig = if (keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                error("Missing android/key.properties — copy unified keystore before release")
            }
        }
    }
}
```

للـ Groovy `build.gradle`: نفس المنطق عبر `keystorePropertiesFile` + `signingConfigs.release`.

`.gitignore` تحت `android/`:

```
key.properties
**/*.keystore
**/*.jks
```

---

## Output Artifacts

| Platform | Path |
|----------|------|
| iOS Archive | Organizer أو `build/Runner.xcarchive` |
| Android AAB | `build/app/outputs/bundle/release/app-release.aab` |
