import { defineStore} from 'pinia';

export const useViewerStore = defineStore('viewer', {
  state: () => ({
    code: '',
    peerConnection: null as RTCPeerConnection | null,
  }),
  actions: {
    setCode(code: string) {
      this.code = code;
    },
    setPeerConnection(pc: RTCPeerConnection) {
      this.peerConnection = pc;
    },
  },
});