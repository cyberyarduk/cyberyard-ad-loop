# App Store submission checklist — Cyberyard

Everything Apple (and Google Play) asks for, and where it lives.

## Required URLs

| App Store Connect field | URL |
| --- | --- |
| Privacy Policy URL | https://www.cyberyard.co.uk/privacy-policy |
| Support URL | https://www.cyberyard.co.uk/support |
| Marketing URL | https://www.cyberyard.co.uk |
| EULA / Terms of Use | https://www.cyberyard.co.uk/terms-of-service |
| Account deletion URL (required for apps with accounts) | https://www.cyberyard.co.uk/delete-account |

## App Privacy ("Nutrition label") answers

Data collected and **linked to the user**:
- Contact info: name, email address, phone number, business address
- User content: photos/videos uploaded, AI-generated videos
- Identifiers: user ID, device ID
- Usage data: product interaction (playlist refreshes, uploads, admin access events)
- Diagnostics: crash/error logs, battery level

Purposes: **App Functionality** and **Analytics** only.
- Not used for tracking (no third-party ad tracking / ATT prompt not required).
- Not used for third-party advertising.
- Data is **not** sold.

## Review notes for Apple (paste into App Review Information)

> Cyberyard is a B2B in-store advertising platform. Accounts are created by our team for
> business customers — there is no public sign-up, which is why the app has no registration
> screen. Please use the demo credentials below to review the app.
>
> Demo account: <email> / <password>
>
> The app has two modes: the business portal (dashboard, videos, playlists, devices) and the
> Media Player, which turns the device into a looping in-store advertising screen. To leave the
> Media Player, tap the logo four times on the pairing screen or use the bottom navigation bar.
>
> Account deletion: Settings → Support → Delete account, or
> https://www.cyberyard.co.uk/delete-account

**Provide a working demo account** — Guideline 2.1 rejections are almost always caused by a
missing demo login for an invite-only app.

## Guideline points to be aware of

- **4.2 Minimum functionality** — the app is a full management dashboard plus player, fine.
- **5.1.1(v) Account deletion** — satisfied by the in-app link to `/delete-account`.
- **2.1 Demo account** — mandatory, see above.
- **3.1.1 In-app purchase** — subscriptions are B2B services sold outside the app (business
  contracts + Direct Debit), which is permitted; the app must not link to a purchase flow for
  digital content consumed in-app. No pricing/upgrade buttons should be added to the iOS build.
- **1.4.1 Emergency services** — the 999 assistance button must clearly warn the user before
  dialling (4-tap confirmation is in place).
- **Camera / Photos usage strings** — confirm `NSCameraUsageDescription`,
  `NSPhotoLibraryUsageDescription` and `NSPhotoLibraryAddUsageDescription` are present in
  `ios/App/App/Info.plist` with plain-English reasons, e.g.
  "Cyberyard uses your camera to scan device pairing QR codes."

## Assets

- App icon: 1024×1024 PNG, no transparency, no rounded corners (`src/assets/cyberyard-app-icon-1024.png`).
- Screenshots: 6.7" iPhone (1290×2796) and, if the app supports iPad, 12.9" iPad (2048×2732).
- App name, subtitle (30 chars), promotional text, description, keywords, category
  (Business), age rating (4+).

## Build steps

```bash
git pull
npm install
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode: set Team + bundle identifier, bump the version/build number, choose
"Any iOS Device (arm64)", then Product → Archive → Distribute App → App Store Connect.

## Google Play equivalents

- Privacy Policy URL: same as above.
- Data safety form: mirror the App Privacy answers above.
- Account deletion URL: https://www.cyberyard.co.uk/delete-account (Play requires both an
  in-app path and a web URL).
- Target API level must meet the current Play requirement; `minSdkVersion` is 26.
