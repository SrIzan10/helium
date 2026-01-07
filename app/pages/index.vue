<template>
  <div class="flex flex-col items-center justify-center gap-6 mt-10 px-4">
    <h1>helium</h1>
    <p>effortless screensharing powered by webrtc</p>
    <app-code-input />

    <div class="video relative w-full max-w-1/2 aspect-video">
      <div
        v-if="!isConnected"
        class="absolute inset-0 bg-black flex items-center justify-center z-10 text-white"
      >
        {{ viewerStore.connectionStatus }}
      </div>
      <video
        ref="videofeedRef"
        autoplay
        playsinline
        controls
        class="bg-black w-full h-full"
        @loadeddata="isConnected = true"
      />
    </div>

    <NuxtLink to="/stream"><Button>host instead?</Button></NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";
import { useViewerStore } from "~/state/viewer";
import { Button } from "@/components/ui/button";
import { useWebSocketUrl } from "~/composables/useWebSocketUrl";

const isConnected = ref(false);
const viewerStore = useViewerStore();
const { code: codeRef } = storeToRefs(viewerStore);
const wsUrl = useWebSocketUrl();
const { send } = useWebSocket(wsUrl, {
  autoReconnect: true,
  heartbeat: {
    message: JSON.stringify({ event: "ping" }),
    interval: 15000,
  },
  onMessage: async (ws, ev) => {
    const message = JSON.parse(ev.data);
    if (message.event === "offer") {
      viewerStore.setConnectionStatus("creating rtc peer connections...");
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: "turn:5.161.207.54:3478",
            username: "username",
            credential: "password",
          },
          {
            urls: "turn:5.161.49.183:3478",
            username: "username",
            credential: "password",
          },
          {
            urls: "turn:135.181.147.65:3478",
            username: "username",
            credential: "password",
          },
          {
            urls: "turn:5.78.83.26:3478",
            username: "username",
            credential: "password",
          },
          {
            urls: "turn:5.223.48.157:3478",
            username: "username",
            credential: "password",
          },
        ],
        iceTransportPolicy: "relay",
      });
      viewerStore.setPeerConnection(peerConnection);

      peerConnection.ontrack = (event) => {
        viewerStore.setConnectionStatus("got some tracks!");
        if (event.streams && event.streams[0] && videofeedRef.value) {
          videofeedRef.value.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          viewerStore.setConnectionStatus(
            `got an ice candidate (type: ${event.candidate.type})`,
          );
          send(
            JSON.stringify({
              event: "ice-candidate",
              targetId: message.senderId,
              candidate: event.candidate,
            }),
          );
        }
      };

      peerConnection.onconnectionstatechange = () => {
        viewerStore.setConnectionStatus(
          `connection state: ${peerConnection.connectionState}`,
        );

        if (peerConnection.connectionState === "connected") {
          viewerStore.setConnectionStatus("connected!");
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        viewerStore.setConnectionStatus(
          `ice connection state: ${peerConnection.iceConnectionState}`,
        );
      };

      peerConnection.onicegatheringstatechange = () => {
        viewerStore.setConnectionStatus(
          `ice gathering state: ${peerConnection.iceGatheringState}`,
        );
      };

      viewerStore.setConnectionStatus("sending an sdp description");
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.sdp),
      );

      viewerStore.setConnectionStatus("sending an answer");
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      send(
        JSON.stringify({
          event: "answer",
          targetId: message.senderId,
          sdp: answer,
        }),
      );
    }

    if (message.event === "ice-candidate") {
      if (
        viewerStore.peerConnection &&
        viewerStore.peerConnection.remoteDescription
      ) {
        viewerStore.setConnectionStatus(
          `got an ice candidate from remote peer (type: ${message.candidate.type})`,
        );
        await viewerStore.peerConnection.addIceCandidate(
          new RTCIceCandidate(message.candidate),
        );
      }
    }
  },
});

const videofeedRef = ref<HTMLVideoElement | null>(null);

const startWebRTCConnection = async () => {
  send(
    JSON.stringify({
      event: "join-room",
      roomId: viewerStore.code,
    }),
  );
};

watch(codeRef, (newCode) => {
  // sort of a safeguard bc only 6 digit codes end up getting passed
  if (newCode.length === 6) {
    startWebRTCConnection();
  }
});
</script>

