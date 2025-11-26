# Cyberyard Player - Complete Production Setup Guide

This is your **complete step-by-step guide** to building a production-ready native Android app with splash screen and kiosk mode.

## 📋 What You'll Need

- A computer (Windows, Mac, or Linux)
- Android Studio (we'll install it)
- Your Cyberyard logo image file
- About 1-2 hours for first-time setup

---

## Step 1: Install Required Software

### 1.1 Install Android Studio

1. Download Android Studio: https://developer.android.com/studio
2. Run the installer
3. During setup, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional, for testing)
4. Complete the setup wizard

### 1.2 Verify Java (JDK)

Android Studio includes JDK, but verify it's installed:
- Open Android Studio
- Go to File → Project Structure
- Check "JDK Location" - it should show a path

---

## Step 2: Export Your Project to GitHub

1. **In Lovable**, click the **GitHub button** (top right)
2. Click **"Connect to GitHub"** and authorize the app
3. Click **"Create Repository"**
4. Name it: `cyberyard-player`
5. Choose Private or Public
6. Click **Create**

✅ Your code is now on GitHub!

---

## Step 3: Clone Project to Your Computer

### 3.1 Install Git (if not already installed)

- **Windows**: Download from https://git-scm.com/download/win
- **Mac**: Open Terminal and type `git --version` (will auto-install)
- **Linux**: `sudo apt-get install git`

### 3.2 Clone the Repository

1. Open Terminal (Mac/Linux) or Command Prompt (Windows)
2. Navigate to where you want the project:
   ```bash
   cd Desktop
   ```
3. Clone your repository (replace with your GitHub URL):
   ```bash
   git clone https://github.com/YOUR_USERNAME/cyberyard-player.git
   ```
4. Enter the project folder:
   ```bash
   cd cyberyard-player
   ```

---

## Step 4: Install Project Dependencies

In the same terminal/command prompt:

```bash
npm install
```

This downloads all required packages. Takes 2-5 minutes depending on internet speed.

---

## Step 5: Add Android Platform

```bash
npx cap add android
```

This creates the `android` folder with your native Android project.

---

## Step 6: Build the Web App

```bash
npm run build
```

This creates the `dist` folder with your compiled web app.

---

## Step 7: Add Your Splash Screen Logo

### 7.1 Prepare Your Logo

Your logo should be:
- **Recommended size**: 2732 x 2732 pixels (square)
- **Format**: PNG with transparent background (or solid background)
- **File name**: `splash.png`

You can use your existing Cyberyard logo.

### 7.2 Generate Splash Screens for All Sizes

**Option A: Use Online Tool (Easiest)**

1. Go to: https://www.appicon.co/
2. Upload your logo
3. Select "Android" and "Splash Screens"
4. Download the generated files

**Option B: Manual Creation**

Create these sizes:
- `drawable-land-mdpi/splash.png` - 800 x 480
- `drawable-land-hdpi/splash.png` - 1280 x 720
- `drawable-land-xhdpi/splash.png` - 1920 x 1080
- `drawable-land-xxhdpi/splash.png` - 2560 x 1440
- `drawable-land-xxxhdpi/splash.png` - 3840 x 2160
- `drawable-port-mdpi/splash.png` - 480 x 800
- `drawable-port-hdpi/splash.png` - 720 x 1280
- `drawable-port-xhdpi/splash.png` - 1080 x 1920
- `drawable-port-xxhdpi/splash.png` - 1440 x 2560
- `drawable-port-xxxhdpi/splash.png` - 2160 x 3840

### 7.3 Add to Android Project

**You'll do this after running `npx cap sync` in the next step.**

Once you have the `android` folder:

1. Navigate to: `android/app/src/main/res/`
2. Create folders if they don't exist:
   - `drawable-land-mdpi`
   - `drawable-land-hdpi`
   - `drawable-land-xhdpi`
   - `drawable-land-xxhdpi`
   - `drawable-land-xxxhdpi`
   - `drawable-port-mdpi`
   - `drawable-port-hdpi`
   - `drawable-port-xhdpi`
   - `drawable-port-xxhdpi`
   - `drawable-port-xxxhdpi`
3. Place the corresponding `splash.png` files in each folder

**Note**: For portrait-only app like yours, you mainly need the `drawable-port-*` folders.

---

## Step 8: Sync Capacitor

```bash
npx cap sync android
```

This copies your web app and splash screens to the Android project.

---

## Step 9: Open in Android Studio

```bash
npx cap open android
```

Android Studio will launch and open your project.

**First time?** It may take a few minutes to index and download dependencies.

---

## Step 10: Configure Splash Screen Behavior

### 10.1 Edit MainActivity.java

In Android Studio, navigate to:
`android/app/src/main/java/app/cyberyard/player/MainActivity.java`

Replace the entire file with:

```java
package app.cyberyard.player;

import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.capacitor.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Hide status bar for fullscreen
        hideSystemUI();
        
        // Auto-hide splash screen after 2 seconds
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                SplashScreen.hide();
            }
        }, 2000); // 2000ms = 2 seconds
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }
}
```

---

## Step 11: Build Production APK

### 11.1 Generate Signing Key (One-Time Setup)

Open Terminal in Android Studio (bottom tab) and run:

```bash
keytool -genkey -v -keystore cyberyard-release-key.keystore -alias cyberyard -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked for:
- **Password**: Create a strong password (SAVE THIS!)
- **Name**: Your name or company name
- **Organization**: Cyberyard
- **City, State, Country**: Your location

**IMPORTANT**: Save this keystore file and password somewhere safe! You'll need it to update your app.

Move the keystore file:
```bash
mv cyberyard-release-key.keystore android/app/
```

### 11.2 Configure Signing in build.gradle

In Android Studio, open: `android/app/build.gradle`

Find the `android {` section and add:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            storeFile file('cyberyard-release-key.keystore')
            storePassword 'YOUR_PASSWORD_HERE'
            keyAlias 'cyberyard'
            keyPassword 'YOUR_PASSWORD_HERE'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Replace `'YOUR_PASSWORD_HERE'` with your actual password.

### 11.3 Build Release APK

In Android Studio:

1. Click **Build → Clean Project**
2. Click **Build → Generate Signed Bundle / APK**
3. Select **APK**
4. Click **Next**
5. It should auto-fill your keystore info
6. Click **Next**
7. Select **release**
8. Click **Finish**

Or via command line:
```bash
cd android
./gradlew assembleRelease
```

**Your APK is at**: `android/app/build/outputs/apk/release/app-release.apk`

---

## Step 12: Test on Your Android Device

### 12.1 Enable Developer Mode

On your Android phone:
1. Go to **Settings → About Phone**
2. Tap **"Build Number"** 7 times
3. You'll see "You are now a developer!"
4. Go back to **Settings → Developer Options**
5. Enable **"USB Debugging"**

### 12.2 Connect Phone and Install

1. Connect phone to computer via USB
2. On phone, tap **"Allow USB debugging"** when prompted

**Option A: Install via Android Studio**
1. In Android Studio, click the **Play** button (green triangle)
2. Select your device
3. App will install and launch

**Option B: Install via Command Line**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 12.3 Test the App

1. Launch **"Cyberyard Player"** from your phone
2. You should see:
   - ✅ **Cyberyard logo splash screen** (2 seconds)
   - ✅ Fullscreen portrait mode
   - ✅ Device pairing screen

---

## Step 13: Configure for Kiosk Mode

For production kiosk deployment, you have two options:

### Option A: Third-Party Kiosk App (Recommended for Multiple Devices)

**Fully Kiosk Browser** - $15/device one-time
1. Install from Play Store
2. Configure to launch Cyberyard Player on boot
3. Enable kiosk lockdown

See `KIOSK_MODE_SETUP.md` for full details.

### Option B: Native Device Owner Mode (Free, More Complex)

Requires factory reset - see `KIOSK_MODE_SETUP.md` for full instructions.

---

## Step 14: Configure Auto-Start on Boot

### 14.1 Add Boot Permissions

In Android Studio, open: `android/app/src/main/AndroidManifest.xml`

Add these permissions **before** `<application>`:

```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 14.2 Create Boot Receiver

Create new file: `android/app/src/main/java/app/cyberyard/player/BootReceiver.java`

```java
package app.cyberyard.player;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Intent i = new Intent(context, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(i);
        }
    }
}
```

### 14.3 Register Boot Receiver

In `AndroidManifest.xml`, add inside `<application>`:

```xml
<receiver 
    android:name=".BootReceiver"
    android:enabled="true"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</receiver>
```

### 14.4 Disable Battery Optimization

On the device:
1. Settings → Apps → Cyberyard Player
2. Battery → Battery Optimization
3. Select **"Don't optimize"**

### 14.5 Test Auto-Start

1. Rebuild and reinstall the app
2. Restart your Android device
3. App should auto-launch to splash screen → player

---

## Step 15: Prepare for Production Deployment

### 15.1 Update App Version

In `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1  // Increment for each release
        versionName "1.0.0"
    }
}
```

### 15.2 Create App Icons

Your app needs proper icons:
1. Go to: https://icon.kitchen/
2. Upload your Cyberyard logo
3. Download Android icon set
4. Replace files in: `android/app/src/main/res/mipmap-*` folders

### 15.3 Remove Development Server (IMPORTANT!)

For production, you want the app to use bundled files, not load from web.

Edit `capacitor.config.ts` and **comment out** the server section:

```typescript
const config: CapacitorConfig = {
  appId: 'app.cyberyard.player',
  appName: 'Cyberyard Player',
  webDir: 'dist',
  // server: {
  //   url: 'https://7ab66e3b-b88a-49c6-a3bc-db9036b58b8e.lovableproject.com',
  //   cleartext: true
  // },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  // ... rest of config
};
```

**Then rebuild**:
```bash
npm run build
npx cap sync android
# Rebuild APK in Android Studio
```

---

## Step 16: Mass Deploy to Multiple Devices

### For 10+ Devices

1. **Build one master APK** following the steps above
2. **Copy APK** to each device via:
   - USB transfer
   - Cloud storage link
   - Email
   - Network file share

3. **On each device**:
   - Enable "Install from Unknown Sources"
   - Open APK file
   - Tap "Install"
   - Configure auto-start settings
   - Pair with your admin dashboard

### For 50+ Devices (Enterprise)

Consider MDM (Mobile Device Management):
- **AirDroid Business** - Remote deployment & management
- **Samsung Knox** - For Samsung devices
- **Google Workspace** - For Android Enterprise

---

## Troubleshooting Common Issues

### Splash screen doesn't show
- ✓ Verify splash.png files are in correct drawable folders
- ✓ Check `capacitor.config.ts` has SplashScreen config
- ✓ Run `npx cap sync android` after adding splash images
- ✓ Rebuild the APK

### App crashes on launch
- ✓ Check Android Studio Logcat for errors
- ✓ Verify all dependencies installed: `npm install`
- ✓ Clean and rebuild: Build → Clean Project → Rebuild

### Camera not working
- ✓ Check CAMERA permission in AndroidManifest.xml
- ✓ Grant camera permission in device Settings → Apps

### App doesn't start on boot
- ✓ Check BOOT_COMPLETED permission
- ✓ Verify BootReceiver registered in manifest
- ✓ Disable battery optimization
- ✓ Some manufacturers require additional permissions (Xiaomi, Oppo)

### Videos won't play
- ✓ Test on web version first
- ✓ Check internet connection on device
- ✓ Verify device is paired correctly
- ✓ Check videos assigned to device's playlist

---

## Updating Your App

When you make changes in Lovable:

1. Changes automatically sync to GitHub (thanks to Lovable's GitHub integration!)
2. On your computer:
   ```bash
   cd cyberyard-player
   git pull
   npm install  # In case dependencies changed
   npm run build
   npx cap sync android
   ```
3. Open in Android Studio: `npx cap open android`
4. Rebuild APK (Step 11)
5. Reinstall on devices

---

## Production Deployment Checklist

Before deploying to real kiosks:

- [ ] Splash screen displays Cyberyard logo
- [ ] App runs in fullscreen portrait mode
- [ ] Videos play automatically in loop
- [ ] App auto-starts on device boot
- [ ] Screen stays on (doesn't sleep)
- [ ] Admin mode accessible via 4-tap gesture
- [ ] Camera works for AI video creation
- [ ] QR code pairing works
- [ ] Device properly paired with admin dashboard
- [ ] Kiosk mode prevents exiting app
- [ ] Battery optimization disabled
- [ ] Tested full power cycle (off → on → app launches)
- [ ] Production APK built (not debug)
- [ ] App icons properly set
- [ ] Server URL removed from config (uses bundled files)

---

## Support & Resources

- **This Project's Files**:
  - `BUILD_ANDROID_INSTRUCTIONS.md` - Basic build guide
  - `KIOSK_MODE_SETUP.md` - Kiosk mode details
  - This file - Complete production setup

- **External Resources**:
  - [Capacitor Documentation](https://capacitorjs.com/docs)
  - [Android Developer Guide](https://developer.android.com/guide)
  - [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)

---

## Quick Reference Commands

```bash
# Initial setup
git clone [your-repo]
cd cyberyard-player
npm install
npx cap add android
npm run build
npx cap sync android
npx cap open android

# After making changes
git pull
npm install
npm run build
npx cap sync android
# Then rebuild in Android Studio

# Build release APK
cd android
./gradlew assembleRelease

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

**You're ready to build your production Cyberyard Player app! 🚀**

Follow the steps in order, and you'll have a professional kiosk app with splash screen and auto-start capability.
