# Helium Native (Expo + React Native)

Simple React Native streamer app that:

- Authenticates with Clerk (`@clerk/clerk-expo`)
- Fetches your Helium presets from `/api/presets`
- Loads selected preset ICE servers from `/api/presets/:id`
- Captures Android screen with `getDisplayMedia()`
- Hosts a room on `/ws/signaling` and streams to connected viewers
- Uses matching light/dark palette semantics from the Helium web app

## Auth implementation notes (from Clerk docs via Context7)

This app follows Clerk Expo guidance:

- Wrap app with `ClerkProvider`
- Use secure `tokenCache` from `@clerk/clerk-expo/token-cache`
- Configure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Use `useSignIn()` and `setActive()` for email/password sign-in
- Use `useAuth()` for sign-out and auth state gating

## Environment variables

Create `native-app/.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_HELIUM_BASE_URL=https://helium.srizan.dev
```

## Install

```bash
pnpm -C native-app install
```

## Run on Android

`react-native-webrtc` requires native modules, so use a development build:

```bash
pnpm -C native-app prebuild
pnpm -C native-app android
```

## Host signaling protocol wired

Implemented in `native-app/src/hooks/useHeliumStreamer.ts`:

- send `create-room`
- receive `viewer-joined`
- create peer connection with selected preset `iceServers`
- send `offer` for each viewer
- receive `answer`
- exchange `ice-candidate`
- handle `viewer-left`
- heartbeat with `ping` every 15s
