<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { Button } from "@/components/ui/button"
import { useStreamerStore } from '~/state/streamer';

const streamerStore = useStreamerStore()
const videofeedRef = ref<HTMLVideoElement|null>(null);
const { send, data, ws } = useWebSocket('ws://localhost:3000/ws/signaling', {
  autoReconnect: true,
  //heartbeat: true,
  onMessage: async (ws, ev) => {
    const message = JSON.parse(ev.data)
    if (message.event === 'room-created') {
      const roomId = message.roomId
      streamerStore.setCode(roomId)
    }
    if (message.event === 'viewer-joined') {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      streamerStore.addPeerConnection(message.data.viewerId, peerConnection)

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      send(JSON.stringify({
        event: 'offer',
        targetId: message.data.viewerId,
        sdp: offer,
      }))
    }
    if (message.event === 'ice-candidate') {
      ws.send(JSON.stringify({
        event: 'ice-candidate',
        targetId: message.data.senderId,
        candidate: message.data.candidate,
      }))
    }
    if (message.event === 'answer') {
      const pc = streamerStore.peerConnections[message.data.viewerId];
      if (!pc) {
        console.error('peerconnection not found for peerid: ', message.data.viewerId);
        return;
      };
      const remoteDesc = new RTCSessionDescription(message.data.sdp);
      await pc.setRemoteDescription(remoteDesc);
    }
  },
});

async function startScreenShare() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });

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