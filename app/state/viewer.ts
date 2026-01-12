import { defineStore} from 'pinia';

export const useViewerStore = defineStore('viewer', {
  state: () => ({
    code: '',
    peerConnection: null as RTCPeerConnection | null,
    connectionStatus: 'waiting for a code',
    isDisconnected: false,
  }),
  actions: {
    setCode(code: string) {
      this.code = code;
    },
    setPeerConnection(pc: RTCPeerConnection | null) {
      this.peerConnection = pc;
    },
    setConnectionStatus(status: string) {
      if (process.env.NODE_ENV === 'development') {
        console.log('pinia connection status debug:', status);
      }
      this.connectionStatus = status;
      if (status === 'disconnected') {
        this.isDisconnected = true;
      }
    },
    resetDisconnected() {
      this.isDisconnected = false;
    }
  },
});