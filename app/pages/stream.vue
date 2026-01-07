<template>
  <div class="flex flex-col items-center justify-center gap-6 mt-10 px-4">
    <div class="flex space-x-4 items-center">
      <Button @click="startScreenShare"> screenshare </Button>
      <PresetSelect />
    </div>
    <p v-if="streamerStore.code" class="font-mono">{{ streamerStore.code }}</p>
    <video ref="videofeedRef" autoplay playsinline muted></video>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";
import { Button } from "@/components/ui/button";
import { useStreamerStore } from "~/state/streamer";
import { useWebSocketUrl } from "~/composables/useWebSocketUrl";
import PresetSelect from "~/components/app/PresetSelect.vue";

const streamerStore = useStreamerStore();
const videofeedRef = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const wsUrl = useWebSocketUrl();

const { send } = useWebSocket(wsUrl, {
  autoReconnect: true,
  heartbeat: {
    message: JSON.stringify({ event: "ping" }),
    interval: 15000,
  },
  onMessage: async (ws, ev) => {
    const message = JSON.parse(ev.data);

    if (message.event === "room-created") {
      streamerStore.setCode(message.roomId);
    }

    if (message.event === "viewer-joined") {
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
      streamerStore.addPeerConnection(message.viewerId, peerConnection);

      if (localStream.value) {
        localStream.value.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream.value!);
        });
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          send(
            JSON.stringify({
              event: "ice-candidate",
              targetId: message.viewerId,
              candidate: event.candidate,
            }),
          );
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      send(
        JSON.stringify({
          event: "offer",
          targetId: message.viewerId,
          sdp: offer,
        }),
      );
    }

    if (message.event === "ice-candidate") {
      const pc = streamerStore.peerConnections[message.from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    }

    if (message.event === "answer") {
      const pc = streamerStore.peerConnections[message.from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
      }
    }
  },
});

async function startScreenShare() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });

  localStream.value = stream;

  if (videofeedRef.value) {
    videofeedRef.value.srcObject = stream;
  }

  send(
    JSON.stringify({
      event: "create-room",
    }),
  );
}
</script>
