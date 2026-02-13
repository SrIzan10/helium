# Helium Mobile Wrapper (Android)

This is a TypeScript mobile wrapper built with React + Capacitor for opening
the Helium web app on Android.

## Why this approach

- Capacitor keeps the project in TypeScript.
- The app opens Helium in a Chrome Custom Tab, which is currently the most
  reliable way to get Android WebRTC features (including screen audio when the
  device supports it).

## Setup

```bash
pnpm -C mobile-wrapper install
pnpm -C mobile-wrapper build
pnpm -C mobile-wrapper cap:android:add
pnpm -C mobile-wrapper cap:sync
pnpm -C mobile-wrapper cap:android:open
```

Then build/run from Android Studio.

## Notes on screen sharing with audio

- Android support for screen-capture audio depends on OS version, Chrome
  version, OEM restrictions, and user permissions.
- If audio is unavailable, update Android + Chrome and confirm audio capture is
  enabled in the system screen-share dialog.
- A pure in-app WebView wrapper is less reliable for audio capture than Chrome
  Custom Tabs on Android.
