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
    setIceServers(iceServers: RTCIceServer[]) {
      this.iceServers = iceServers;
    },
  },
});

