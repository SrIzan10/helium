import { defineStore} from 'pinia';

export const useViewerStore = defineStore('viewer', {
  state: () => ({
    code: '',
    peerConnection: null as RTCPeerConnection | null,
    connectionStatus: 'waiting for a code',
  }),
  actions: {
    setCode(code: string) {
      this.code = code;
    },
    setPeerConnection(pc: RTCPeerConnection) {
      this.peerConnection = pc;
    },
    setConnectionStatus(status: string) {
      if (process.env.NODE_ENV === 'development') {
        console.log('pinia connection status debug:', status);
      }
      this.connectionStatus = status;
    }
  },
});