# Cyberyard Player - Kiosk Mode & Auto-Start Setup

This guide explains how to configure your Android device to run Cyberyard Player in **kiosk mode** (locked to the app) with **auto-start on boot**.

## What is Kiosk Mode?

Kiosk mode locks an Android device to a single app, preventing users from:
- Accessing other apps
- Changing settings
- Exiting the app
- Using home/back/recent apps buttons

Perfect for digital signage where devices should only display video content.

---

## Quick Setup Options

### Option A: Third-Party Kiosk Software (Easiest) ⭐ RECOMMENDED

The easiest way to set up kiosk mode is using dedicated kiosk software:

**1. Fully Kiosk Browser** (Most Popular)
- Install from Play Store: https://play.google.com/store/apps/details?id=de.ozerov.fully
- Free version includes basic kiosk mode
- Pro version ($15 one-time) adds advanced features
- Setup:
  1. Install Fully Kiosk Browser
  2. Set URL to: `https://7ab66e3b-b88a-49c6-a3bc-db9036b58b8e.lovableproject.com/player/[YOUR_DEVICE_ID]`
  3. Enable "Kiosk Mode" in settings
  4. Set "Launch on Boot"

**2. SureLock** (Enterprise Option)
- Professional MDM solution
- 14-day free trial
- https://www.42gears.com/surelock/

**3. AirDroid Business** (Remote Management)
- Manage multiple devices remotely
- Cloud-based control panel
- https://www.airdroid.com/business/

### Option B: Native Android Kiosk Mode (Advanced)

For custom app with full control, follow the steps below to modify your native app.

---

## Part 1: Configure App for Kiosk Mode

### Step 1: Add Permissions to AndroidManifest.xml

Navigate to: `android/app/src/main/AndroidManifest.xml`

Add these permissions **before** the `<application>` tag:

```xml
<!-- Kiosk mode permissions -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.DISABLE_KEYGUARD" />
<uses-permission android:name="android.permission.REORDER_TASKS" />
```

### Step 2: Create Boot Receiver

Add this **inside** the `<application>` tag in AndroidManifest.xml:

```xml
<!-- Auto-start on boot -->
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

### Step 3: Create BootReceiver Class

Create new file: `android/app/src/main/java/app/cyberyard/player/BootReceiver.java`

```java
package app.cyberyard.player;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Boot completed - launching app");
            
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            context.startActivity(launchIntent);
        }
    }
}
```

### Step 4: Modify MainActivity for Kiosk Mode

Edit: `android/app/src/main/java/app/cyberyard/player/MainActivity.java`

Replace the entire file with:

```java
package app.cyberyard.player;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Keep screen on always
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Disable lock screen
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
        
        // Hide system UI for true fullscreen kiosk
        hideSystemUI();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUI();
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

    // Block hardware buttons for kiosk mode
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Block home button
        if (event.getKeyCode() == KeyEvent.KEYCODE_HOME) {
            return true;
        }
        // Block recent apps button
        if (event.getKeyCode() == KeyEvent.KEYCODE_APP_SWITCH) {
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    // Prevent back button from exiting app
    @Override
    public void onBackPressed() {
        // Do nothing - disable back button in kiosk mode
        // Or show admin PIN prompt to exit
    }
}
```

---

## Part 2: Set Device as Kiosk

### Method 1: Device Owner Mode (Full Control)

**⚠️ IMPORTANT: Device must be factory reset and have NO Google account added**

1. Factory reset your Android device
2. DO NOT add any Google accounts during setup
3. Enable USB debugging:
   - Go through initial setup
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go to Settings → Developer Options
   - Enable USB Debugging

4. Connect device to computer via USB

5. Run this command:
   ```bash
   adb shell dpm set-device-owner app.cyberyard.player/.DeviceAdminReceiver
   ```

6. If successful, your app is now the device owner and has full kiosk control

### Method 2: Screen Pinning (Simpler, Less Secure)

Good for temporary kiosk mode without factory reset:

1. Go to Settings → Security (or Lock Screen)
2. Find "Screen Pinning" or "Pin Windows"
3. Enable it
4. Open Cyberyard Player app
5. Tap Overview/Recent Apps button
6. Tap the pin icon on the app
7. Confirm pinning

**To unpin:** Hold Back + Overview buttons together

### Method 3: MDM Solutions (Enterprise)

For managing multiple devices:

**AirDroid Business**
- Sign up at https://www.airdroid.com/business/
- Enroll devices via QR code
- Set Cyberyard Player as kiosk app remotely

**Samsung Knox**
- For Samsung devices only
- Enterprise-grade security
- https://www.samsungknox.com/

---

## Part 3: Auto-Start Configuration

### On Boot Settings

1. **Disable Battery Optimization** (Important!)
   - Settings → Apps → Cyberyard Player
   - Battery → Battery Optimization
   - Select "Don't optimize"

2. **Enable Auto-Start** (on supported devices)
   - Settings → Apps → Cyberyard Player
   - Advanced → Auto-start
   - Enable it

3. **Test Boot**
   - Restart device
   - App should launch automatically to fullscreen video player

---

## Troubleshooting

### App doesn't start on boot
- ✓ Check BOOT_COMPLETED permission granted
- ✓ Disable battery optimization
- ✓ Enable auto-start in app settings
- ✓ Check BootReceiver is registered in AndroidManifest.xml
- ✓ Some Chinese Android brands (Xiaomi, Oppo) require additional auto-start permissions

### Kiosk mode not working
- ✓ Use Method 1 (Device Owner) for full kiosk control
- ✓ Ensure device is factory reset before setting device owner
- ✓ Check that NO Google accounts are added
- ✓ Try third-party kiosk apps as alternative

### System buttons still work
- ✓ Verify hideSystemUI() is called in MainActivity
- ✓ Check dispatchKeyEvent() overrides hardware buttons
- ✓ May require Device Owner mode for full control

### Screen turns off
- ✓ Check FLAG_KEEP_SCREEN_ON is set
- ✓ Disable sleep timer in device settings
- ✓ Set "Stay awake" in Developer Options

### User can still access settings
- ✓ Requires Device Owner mode (Method 1)
- ✓ Or use third-party kiosk software
- ✓ Screen pinning alone doesn't block notification shade

---

## Production Deployment Checklist

For commercial kiosk deployments:

- [ ] Factory reset all devices before setup
- [ ] Set up device owner mode OR install kiosk software
- [ ] Install Cyberyard Player APK
- [ ] Configure auto-start and disable battery optimization
- [ ] Test full boot cycle (power off → on → app auto-launches)
- [ ] Disable all notifications
- [ ] Set brightness to appropriate level
- [ ] Disable automatic updates
- [ ] Mount device securely (consider physical security)
- [ ] Test for 24+ hours to ensure stability

---

## Alternative: Use Fully Kiosk Browser (Fastest Setup)

If you want the **fastest and easiest** kiosk setup:

1. **Don't build native app** - just use the web version
2. Install Fully Kiosk Browser from Play Store
3. Configure it to load your player URL
4. Enable kiosk mode in Fully settings
5. Done! No coding required.

**Trade-offs:**
- ✓ Easier to set up
- ✓ No build process needed
- ✗ Less control over app behavior
- ✗ Requires Fully Kiosk Browser app

---

## Support Resources

- [Android Kiosk Mode Guide](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode)
- [Fully Kiosk Documentation](https://www.fully-kiosk.com/)
- [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
