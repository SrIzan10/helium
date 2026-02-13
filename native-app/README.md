# Helium Native (Expo + React Native)

Simple React Native viewer app that:

- Authenticates with Clerk (`@clerk/clerk-expo`)
- Connects to Helium signaling at `/ws/signaling`
- Joins a 6-digit room and answers WebRTC offers
- Renders incoming stream with `RTCView`

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

## Signaling protocol wired

Implemented in `native-app/src/hooks/useHeliumViewer.ts`:

- send `join-room`
- receive `offer`
- create peer connection with provided `iceServers`
- set remote description and send `answer`
- exchange `ice-candidate`
- handle `room-closed`
- heartbeat with `ping` every 15s
