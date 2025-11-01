<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { Button } from "@/components/ui/button"
import { useStreamerStore } from '~/state/streamer';
import { useWebSocketUrl } from '~/composables/useWebSocketUrl';

const streamerStore = useStreamerStore()
const videofeedRef = ref<HTMLVideoElement|null>(null);
const localStream = ref<MediaStream|null>(null);
const wsUrl = useWebSocketUrl()

const { send } = useWebSocket(wsUrl, {
  autoReconnect: true,
  heartbeat: {
    message: JSON.stringify({ event: 'ping' }),
    interval: 15000,
  },
  onMessage: async (ws, ev) => {
    const message = JSON.parse(ev.data)
    
    if (message.event === 'room-created') {
      streamerStore.setCode(message.roomId)
    }
    
    if (message.event === 'viewer-joined') {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: [
              "turn:eu-0.turn.peerjs.com:3478",
              "turn:us-0.turn.peerjs.com:3478",
            ],
            username: "peerjs",
            credential: "peerjsp",
          },
        ],
        iceCandidatePoolSize: 10
      });
      streamerStore.addPeerConnection(message.viewerId, peerConnection)

      // Add media tracks to peer connection
      if (localStream.value) {
        localStream.value.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream.value!);
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          send(JSON.stringify({
            event: 'ice-candidate',
            targetId: message.viewerId,
            candidate: event.candidate,
          }))
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      send(JSON.stringify({
        event: 'offer',
        targetId: message.viewerId,
        sdp: offer,
      }))
    }
    
    if (message.event === 'ice-candidate') {
      const pc = streamerStore.peerConnections[message.from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    }
    
    if (message.event === 'answer') {
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

  send(JSON.stringify({
    event: 'create-room',
  }))
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-6 mt-10 px-4">
    <Button @click="startScreenShare">
      screenshare
    </Button>
    <p v-if="streamerStore.code" class="font-mono">{{ streamerStore.code }}</p>
    <video ref="videofeedRef" autoplay playsinline muted></video>
  </div>
</template>
