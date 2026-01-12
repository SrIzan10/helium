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
const { send, close: closeWebSocket } = useWebSocket(wsUrl, {
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
        iceServers: message.iceServers,
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

        // Handle disconnection or failed connection
        if (
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed"
        ) {
          viewerStore.setConnectionStatus(
            `connection ${peerConnection.connectionState}`,
          );
          isConnected.value = false;
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
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.sdp),
        );
      } catch (error) {
        console.error("Error setting remote description:", error);
        viewerStore.setConnectionStatus("failed to connect");
        return;
      }

      viewerStore.setConnectionStatus("sending an answer");
      try {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        send(
          JSON.stringify({
            event: "answer",
            targetId: message.senderId,
            sdp: answer,
          }),
        );
      } catch (error) {
        console.error("Error creating answer:", error);
        viewerStore.setConnectionStatus("failed to send answer");
      }
    }

    if (message.event === "ice-candidate") {
      if (
        viewerStore.peerConnection &&
        viewerStore.peerConnection.remoteDescription
      ) {
        viewerStore.setConnectionStatus(
          `got an ice candidate from remote peer (type: ${message.candidate.type})`,
        );
        try {
          await viewerStore.peerConnection.addIceCandidate(
            new RTCIceCandidate(message.candidate),
          );
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    }

    if (message.event === "room-closed") {
      viewerStore.setConnectionStatus("room closed by host");
      cleanupViewing();
      isConnected.value = false;
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

function cleanupViewing() {
  // Close peer connection
  if (viewerStore.peerConnection) {
    viewerStore.peerConnection.close();
    viewerStore.setPeerConnection(null);
  }

  // Clear video element
  if (videofeedRef.value) {
    videofeedRef.value.srcObject = null;
  }

  // Reset connection status
  viewerStore.setConnectionStatus("disconnected");
  isConnected.value = false;
}

// Cleanup on component unmount
onBeforeUnmount(() => {
  cleanupViewing();
  closeWebSocket();
});

// Cleanup on window/tab close
onMounted(() => {
  const handleBeforeUnload = () => {
    cleanupViewing();
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });
});
</script>
