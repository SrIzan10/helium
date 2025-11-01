export const useWebSocketUrl = () => {
  if (import.meta.client) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/signaling`
  }
  
  return ''
}
