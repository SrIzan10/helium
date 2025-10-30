export const useWebSocketUrl = () => {
  if (import.meta.client) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/signaling`
  }
  const config = useRuntimeConfig()
  const isDev = process.dev
  
  if (isDev) {
    return 'ws://localhost:3000/ws/signaling'
  }
  
  return 'wss://helium.srizan.dev/ws/signaling'
}
