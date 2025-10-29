<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { useViewerStore } from '~/state/viewer';
import { Button } from "@/components/ui/button"
import { toast } from 'vue-sonner';

const viewerStore = useViewerStore()
const { code: codeRef } = storeToRefs(viewerStore)
const { send, data } = useWebSocket('ws://localhost:3000/ws/signaling', {
  autoReconnect: true,
  //heartbeat: true,
  onMessage: async (ws, ev) => {
    const message = JSON.parse(ev.data)
    if (message.event === 'joined') {
      toast.success('stweam joined successfullay')
    }
    if (message.event === 'offer') {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      await peerConnection.setRemoteDescription(message.sdp);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      send(JSON.stringify({
        event: 'answer',
        targetId: message.data.streamerId,
        sdp: answer,
      }))

      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0] && videofeedRef.value) {
          videofeedRef.value.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          send(JSON.stringify({
            event: 'ice-candidate',
            targetId: message.data.streamerId,
            candidate: event.candidate,
          }))
        }
      };
    }
  },
});

const videofeedRef = ref<HTMLVideoElement|null>(null);
const startWebRTCConnection = async () => {
  send(JSON.stringify({
    event: 'join-room',
    data: {
      roomId: viewerStore.code,
    }
  }))
}

watch(codeRef, (newCode) => {
  // sort of a safeguard bc only 6 digit codes end up getting passed
  if (newCode.length === 6) {
    startWebRTCConnection();
  }
})
</script>

<template>
  <h1>helium</h1>
  <p>effortless screensharing powered by webrtc</p>
  <p>code is {{ viewerStore.code }}</p>
  <app-code-input />

   <video ref="videofeedRef" autoplay playsinline muted></video>

  <NuxtLink to="/stream"><Button>host instead?</Button></NuxtLink>
</template>
 