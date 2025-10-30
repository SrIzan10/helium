export const useWebSocketUrl = () => {
  // Detect environment based on hostname
  // In production (helium.srizan.dev), use wss://
  // In development (localhost), use ws://
  if (import.meta.client) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/signaling`
  }
  
  // Server-side: default to localhost for development
  return 'ws://localhost:3000/ws/signaling'
}
