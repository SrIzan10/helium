import { defineStore} from 'pinia';

export const useStreamerStore = defineStore('streamer', {
  state: () => ({
    code: '',
    peerConnections: {} as Record<string, RTCPeerConnection>,
  }),
  actions: {
    setCode(code: string) {
      this.code = code;
    },
    addPeerConnection(id: string, pc: RTCPeerConnection) {
      this.peerConnections[id] = pc;
    },
  },
});