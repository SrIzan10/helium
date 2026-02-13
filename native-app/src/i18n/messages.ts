export type Locale = "en" | "es";

export type MessageKey =
  | "missingClerkKey"
  | "appTitle"
  | "signInSubtitle"
  | "email"
  | "password"
  | "signIn"
  | "signingIn"
  | "signedIn"
  | "signInFailed"
  | "needsExtraStep"
  | "loadingPresets"
  | "couldNotReadToken"
  | "noPresetsFound"
  | "loadedIceServers"
  | "failedToLoadPresets"
  | "failedToParsePreset"
  | "streamerTitle"
  | "streamerSubtitle"
  | "preset"
  | "session"
  | "status"
  | "viewers"
  | "defaultLabel"
  | "startShare"
  | "stop"
  | "signOut"
  | "previewActive"
  | "previewIdle"
  | "statusIdle"
  | "statusStopped"
  | "statusNoPreset"
  | "statusRequestingCapture"
  | "statusNoVideoTrack"
  | "statusCapturing"
  | "statusConnectingSignaling"
  | "statusCreatingRoom"
  | "statusRoomCreated"
  | "statusViewerJoined"
  | "statusPeerState"
  | "statusWebsocketError"
  | "statusWebsocketClosed"
  | "statusError";

type MessageMap = Record<MessageKey, string>;

export const messages: Record<Locale, MessageMap> = {
  en: {
    missingClerkKey: "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    appTitle: "Helium Native",
    signInSubtitle: "Sign in with Clerk",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    signedIn: "Signed in",
    signInFailed: "Sign-in failed",
    needsExtraStep: "Needs extra step: {status}",
    loadingPresets: "Loading presets",
    couldNotReadToken: "Could not read auth token",
    noPresetsFound: "No presets found",
    loadedIceServers: "Loaded {count} ICE server entries",
    failedToLoadPresets: "Failed to load presets: {message}",
    failedToParsePreset: "Failed to parse ICE servers from preset",
    streamerTitle: "Helium Streamer",
    streamerSubtitle: "Share your Android screen to Helium viewers",
    preset: "Preset",
    session: "Session",
    status: "Status",
    viewers: "Viewers",
    defaultLabel: "default",
    startShare: "Start screen share",
    stop: "Stop",
    signOut: "Sign out",
    previewActive: "Screen capture active. Preview disabled to reduce latency.",
    previewIdle: "Start sharing to broadcast this phone screen",
    statusIdle: "Idle",
    statusStopped: "Stopped",
    statusNoPreset: "No preset selected",
    statusRequestingCapture: "Requesting screen capture",
    statusNoVideoTrack: "Screen capture started without video track",
    statusCapturing: "Capturing {video} video / {audio} audio tracks",
    statusConnectingSignaling: "Connecting signaling",
    statusCreatingRoom: "Creating room",
    statusRoomCreated: "Room code: {roomId}",
    statusViewerJoined: "Viewer joined",
    statusPeerState: "Peer state: {state}",
    statusWebsocketError: "WebSocket error",
    statusWebsocketClosed: "WebSocket closed",
    statusError: "Error: {message}",
  },
  es: {
    missingClerkKey: "Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
    appTitle: "Helium (Android)",
    signInSubtitle: "Inicia sesión con Clerk",
    email: "Correo",
    password: "Contraseña",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    signedIn: "Sesión iniciada",
    signInFailed: "Error al iniciar sesión",
    needsExtraStep: "Falta un paso adicional: {status}",
    loadingPresets: "Cargando ajustes predefinidos",
    couldNotReadToken: "No se pudo leer el token",
    noPresetsFound: "No se encontraron ajustes predefinidos",
    loadedIceServers: "Se cargaron {count} entradas ICE",
    failedToLoadPresets: "Error al cargar ajustes predefinidos: {message}",
    failedToParsePreset: "Error al parsear ICE del preset",
    streamerTitle: "Helium Emisor",
    streamerSubtitle: "Comparte la pantalla de Android con Helium",
    preset: "Preset",
    session: "Sesión",
    status: "Estado",
    viewers: "Espectadores",
    defaultLabel: "predeterminado",
    startShare: "Iniciar pantalla",
    stop: "Detener",
    signOut: "Cerrar sesión",
    previewActive: "Captura activa. Vista previa desactivada para menor latencia.",
    previewIdle: "Inicia la captura para transmitir esta pantalla",
    statusIdle: "En espera",
    statusStopped: "Detenido",
    statusNoPreset: "No hay ajuste predefinido seleccionado",
    statusRequestingCapture: "Solicitando captura de pantalla",
    statusNoVideoTrack: "La captura inicio sin pista de video",
    statusCapturing: "Capturando {video} video / {audio} audio",
    statusConnectingSignaling: "Conectando señalización",
    statusCreatingRoom: "Creando sala",
    statusRoomCreated: "Código de sala: {roomId}",
    statusViewerJoined: "Se unió un espectador",
    statusPeerState: "Estado del peer: {state}",
    statusWebsocketError: "Error de WebSocket",
    statusWebsocketClosed: "WebSocket cerrado",
    statusError: "Error: {message}",
  },
};
