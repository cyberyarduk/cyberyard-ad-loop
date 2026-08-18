#!/usr/bin/env node
/**
 * Patches the native iOS project after `npx cap sync ios`.
 *
 * 1. Adds the camera / photo library / microphone usage strings.
 *    Without these iOS instantly kills the app when the camera opens.
 * 2. Sets the home-screen display name to "Cyberyard".
 * 3. Removes the default Capacitor splash image from LaunchScreen.storyboard
 *    so the app opens on a plain black screen instead of the placeholder logo.
 *
 * Run from the project root:  node scripts/ios-fix.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const plistPath = resolve(root, 'ios/App/App/Info.plist');
const storyboardPath = resolve(root, 'ios/App/App/Base.lproj/LaunchScreen.storyboard');

if (!existsSync(plistPath)) {
  console.error('No ios/App/App/Info.plist found. Run "npx cap add ios" / "npx cap sync ios" first.');
  process.exit(1);
}

const strings = {
  CFBundleDisplayName: 'Cyberyard',
  NSCameraUsageDescription:
    'Cyberyard uses the camera so you can take photos of your products and turn them into adverts.',
  NSPhotoLibraryUsageDescription:
    'Cyberyard needs access to your photos so you can use existing images in your adverts.',
  NSPhotoLibraryAddUsageDescription:
    'Cyberyard saves adverts and images you create to your photo library.',
  NSMicrophoneUsageDescription:
    'Cyberyard may record audio when capturing video content for your adverts.',
};

let plist = readFileSync(plistPath, 'utf8');
let changed = false;

for (const [key, value] of Object.entries(strings)) {
  const keyTag = `<key>${key}</key>`;
  if (plist.includes(keyTag)) {
    const re = new RegExp(`(<key>${key}</key>\\s*<string>)[\\s\\S]*?(</string>)`);
    const next = plist.replace(re, `$1${value}$2`);
    if (next !== plist) {
      plist = next;
      changed = true;
    }
  } else {
    plist = plist.replace(
      /<dict>/,
      `<dict>\n\t${keyTag}\n\t<string>${value}</string>`
    );
    changed = true;
  }
}

if (changed) {
  writeFileSync(plistPath, plist);
  console.log('Info.plist updated (usage strings + display name).');
} else {
  console.log('Info.plist already up to date.');
}

if (existsSync(storyboardPath)) {
  let sb = readFileSync(storyboardPath, 'utf8');
  // Drop the placeholder <imageView .../> that shows the default Capacitor logo.
  const cleaned = sb.replace(/<imageView[\s\S]*?<\/imageView>/g, '').replace(/<imageView[^>]*\/>/g, '');
  if (cleaned !== sb) {
    writeFileSync(storyboardPath, cleaned);
    console.log('LaunchScreen.storyboard cleaned (placeholder splash image removed).');
  } else {
    console.log('LaunchScreen.storyboard already clean.');
  }
}

console.log('Done. Rebuild in Xcode (Product > Clean Build Folder, then Run).');
