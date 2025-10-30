export const useWebSocketUrl = () => {
  // Detect environment based on hostname
  // In production (helium.srizan.dev), use wss://
  // In development (localhost), use ws://
  if (import.meta.client) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/signaling`
  }
  
  // Server-side: This shouldn't be used since WebSocket connections are client-only
  // But we provide a sensible default for SSR hydration
  const config = useRuntimeConfig()
  const isDev = process.dev
  
  if (isDev) {
    return 'ws://localhost:3000/ws/signaling'
  }
  
  return 'wss://helium.srizan.dev/ws/signaling'
}
