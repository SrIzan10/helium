<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { Button } from "@/components/ui/button"
import { useStreamerStore } from '~/state/streamer';

const streamerStore = useStreamerStore()
const videofeedRef = ref<HTMLVideoElement|null>(null);
const localStream = ref<MediaStream|null>(null);

const { send } = useWebSocket('ws://localhost:3000/ws/signaling', {
  autoReconnect: true,
  onMessage: async (ws, ev) => {
    const message = JSON.parse(ev.data)
    
    if (message.event === 'room-created') {
      streamerStore.setCode(message.roomId)
    }
    
    if (message.event === 'viewer-joined') {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
    <Button @click="startScreenShare">
        screenshare
    </Button>
    <p>Your stream code: {{ streamerStore.code }}</p>
    <video ref="videofeedRef" autoplay playsinline muted></video>
</template>
