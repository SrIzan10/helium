import { defineStore } from "pinia";

export const useStreamerStore = defineStore("streamer", {
  state: () => ({
    code: "",
    peerConnections: {} as Record<string, RTCPeerConnection>,
    iceServers: [] as RTCIceServer[],
  }),
  actions: {
    setCode(code: string) {
      this.code = code;
    },
    addPeerConnection(id: string, pc: RTCPeerConnection) {
      this.peerConnections[id] = pc;
    },
    removePeerConnection(id: string) {
      delete this.peerConnections[id];
    },
    clearPeerConnections() {
      this.peerConnections = {};
    },
    setIceServers(iceServers: RTCIceServer[]) {
      this.iceServers = iceServers;
    },
  },
});

