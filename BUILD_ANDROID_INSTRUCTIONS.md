# Cyberyard Player - Android Build & Kiosk Mode Instructions

This guide will help you build a native Android app that runs in **kiosk mode** (locked to this app only) and **auto-starts on device boot** - perfect for digital signage.

## Prerequisites

1. **Node.js and npm** installed
2. **Android Studio** installed ([Download here](https://developer.android.com/studio))
3. **Java Development Kit (JDK) 17** or higher
4. Git installed

## Part 1: Building the Android App

## Step 1: Export and Clone the Project

1. Click the **"Export to Github"** button in Lovable to push your code to GitHub
2. Clone the repository to your local machine:
   ```bash
   git clone <your-github-repo-url>
   cd <your-repo-name>
   ```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Build the Web App

```bash
npm run build
```

This creates the `dist` folder with your production-ready web app.

## Step 4: Add Android Platform

```bash
npx cap add android
```

This creates the `android` folder with a native Android Studio project.

## Step 5: Sync Capacitor

```bash
npx cap sync android
```

This copies your web app files and Capacitor plugins to the Android project.

## Step 6: Update Android Permissions

The permissions should already be configured, but verify in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

## Step 7: Configure Fullscreen & Portrait Mode

Edit `android/app/src/main/res/values/styles.xml` to ensure fullscreen mode:

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:statusBarColor">@android:color/black</item>
    </style>
</resources>
```

Portrait lock is already configured via the Capacitor plugin in code.

## Step 8: Open in Android Studio

```bash
npx cap open android
```

This opens the Android project in Android Studio.

## Step 9: Build APK

### Option A: Debug APK (for testing)

In Android Studio:
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete
3. Click **"locate"** in the notification to find the APK
4. The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Command Line

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option C: Release APK (for production)

For a signed release APK:
1. Generate a keystore (one-time setup):
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file('path/to/my-release-key.keystore')
               storePassword 'your-store-password'
               keyAlias 'my-key-alias'
               keyPassword 'your-key-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               ...
           }
       }
   }
   ```

3. Build release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

The release APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Step 10: Install APK on Android Phone

### Method 1: USB Cable (Recommended)

1. Enable **Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable **"USB Debugging"**

2. Connect phone to computer via USB

3. Install the APK:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

   If `adb` is not found, it's located in Android Studio's platform-tools:
   - Mac/Linux: `~/Library/Android/sdk/platform-tools/adb`
   - Windows: `C:\Users\<YourUser>\AppData\Local\Android\Sdk\platform-tools\adb.exe`

### Method 2: Share APK File

1. Copy the APK file to your phone (via email, cloud storage, or USB)
2. On your phone, open the APK file
3. Allow installation from unknown sources when prompted
4. Tap **"Install"**

### Method 3: Direct Install from Android Studio

With your phone connected via USB:
1. In Android Studio, click the **"Run"** button (green triangle)
2. Select your connected device
3. The app will install and launch automatically

## Step 11: Test the App

1. Launch **"Cyberyard Player"** from your phone's app drawer
2. The app should:
   - Start in fullscreen portrait mode
   - Show the device pairing screen
   - Allow QR scanning (tap "Scan QR Code")
   - Allow manual code entry

3. Pair a device using a code from your admin dashboard:
   - Go to `/devices` on web
   - Create a new device
   - Copy the device code (e.g., ABC123)
   - Enter it in the mobile app

4. Test video playback:
   - Videos should play fullscreen in portrait mode
   - Triple-tap the top-right corner to access admin mode
   - Enter the PIN (default: 1234)
   - Test the AI video creator with camera

## Troubleshooting

### Camera Permission Denied
- Go to phone Settings → Apps → Cyberyard Player → Permissions
- Enable Camera permission manually

### App Crashes on Launch
- Check Android Studio Logcat for error messages
- Verify all dependencies installed: `npm install`
- Rebuild: `npm run build && npx cap sync android`

### QR Scanner Not Working
- Ensure camera permission is granted
- Check that you're scanning a valid QR code from the admin dashboard

### Videos Not Playing
- Ensure the device is paired correctly
- Check that videos are assigned to the device's playlist
- Verify internet connection

### Back Button Exits App
- This is intentional to prevent accidental exits during kiosk mode
- To exit, hold back button and confirm

## Production Deployment Notes

For production deployment:
1. Build a signed release APK (see Option C above)
2. Configure proper app icons in `android/app/src/main/res/mipmap-*` folders
3. Update version code in `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           versionCode 1
           versionName "1.0"
       }
   }
   ```
4. Remove the development server URL from `capacitor.config.ts`:
   - The current config already has this removed
   - The app uses the bundled web files from `dist/`

## Updating the App

When you make changes to the code:

1. Pull latest changes from GitHub:
   ```bash
   git pull
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Rebuild and sync:
   ```bash
   npm run build
   npx cap sync android
   ```

4. Rebuild the APK following Step 9

## Support

For issues:
- Check the console in Android Studio's Logcat
- Verify edge functions are working on web version first
- Test pairing and video playback on web before testing on mobile
