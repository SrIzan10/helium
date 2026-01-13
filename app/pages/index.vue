<template>
  <div
    class="flex flex-col md:flex-row items-center justify-center gap-6 mt-10 px-4 min-h-[80vh]"
  >
    <div
      v-if="!isConnected"
      class="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div class="text-center space-y-2">
        <h1 class="text-4xl font-bold tracking-tight">helium</h1>
        <p class="text-muted-foreground text-lg">
          effortless screensharing powered by webrtc
        </p>
      </div>

      <app-code-input />

      <NuxtLink to="/stream">
        <Button variant="link" class="text-muted-foreground hover:text-primary">
          host instead?
        </Button>
      </NuxtLink>
    </div>

    <div
      class="video transition-all duration-500 ease-in-out"
      :class="[
        isConnected
          ? 'fixed inset-0 z-50 w-full h-full bg-black'
          : 'relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden border shadow-sm bg-muted/50',
      ]"
    >
      <!-- Status Overlay -->
      <div
        v-if="!isConnected"
        class="absolute inset-0 flex items-center justify-center z-10 p-4 text-center"
      >
        <div v-if="viewerStore.isDisconnected" class="space-y-4">
          <p class="text-sm font-medium text-muted-foreground">stream ended</p>
          <Button @click="handleReset" variant="outline">
            Enter another code
          </Button>
        </div>
        <div
          v-else-if="viewerStore.connectionStatus !== 'waiting for a code'"
          class="space-y-4"
        >
          <div
            class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"
          />
          <p class="text-sm font-medium text-muted-foreground">
            {{ viewerStore.connectionStatus }}
          </p>
        </div>
        <p v-else class="text-muted-foreground/50 text-sm">
          enter code to join stream
        </p>
      </div>

      <!-- Video Feed -->
      <video
        ref="videofeedRef"
        autoplay
        playsinline
        :controls="false"
        class="w-full h-full object-contain bg-black cursor-pointer"
        @loadeddata="isConnected = true"
        @click="showControls"
        @touchstart="showControls"
      />

      <!-- Connected Controls Overlay -->
      <div
        v-if="isConnected"
        class="absolute top-0 left-0 right-0 p-4 flex justify-between items-start transition-opacity bg-gradient-to-b from-black/50 to-transparent"
        :class="[controlsVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100']"
        @click="resetControlsTimeout"
        @touchstart="showControls"
      >
        <Button
          variant="destructive"
          size="lg"
          class="gap-2 shadow-lg"
          @click="cleanupViewing"
        >
          <LogOut class="w-5 h-5" />
          Disconnect
        </Button>

        <Button
          variant="secondary"
          size="lg"
          class="gap-2 shadow-lg"
          @click="toggleFullscreen"
        >
          <Maximize class="w-5 h-5" />
          Fullscreen
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";
import { useViewerStore } from "~/state/viewer";
import { Button } from "@/components/ui/button";
import { useWebSocketUrl } from "~/composables/useWebSocketUrl";
import { LogOut, Maximize } from "lucide-vue-next";

const isConnected = ref(false);
const controlsVisible = ref(false);
let controlsHideTimeout: ReturnType<typeof setTimeout> | null = null;
const viewerStore = useViewerStore();
const { code: codeRef } = storeToRefs(viewerStore);
const wsUrl = useWebSocketUrl();
const videofeedRef = ref<HTMLVideoElement | null>(null);

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
          // Don't set isConnected = false immediately here to avoid flickering if it's a temp glitch,
          // but usually disconnected means it's over.
          if (peerConnection.connectionState !== "connected") {
            isConnected.value = false;
          }
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
  // Clear controls hide timeout
  if (controlsHideTimeout) {
    clearTimeout(controlsHideTimeout);
  }
  controlsVisible.value = false;

  // Close peer connection
  if (viewerStore.peerConnection) {
    viewerStore.peerConnection.close();
    viewerStore.setPeerConnection(null);
  }

  // Clear video element
  if (videofeedRef.value) {
    videofeedRef.value.srcObject = null;
  }

  // Clear code
  viewerStore.code = "";

  // Reset connection status
  viewerStore.setConnectionStatus("disconnected");
  isConnected.value = false;

  // Exit fullscreen if active
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function toggleFullscreen() {
  if (!videofeedRef.value) return;

  if (!document.fullscreenElement) {
    videofeedRef.value.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

function handleReset() {
  viewerStore.resetDisconnected();
  viewerStore.setConnectionStatus("waiting for a code");
}

function showControls() {
  controlsVisible.value = true;
  resetControlsTimeout();
}

function resetControlsTimeout() {
  if (controlsHideTimeout) {
    clearTimeout(controlsHideTimeout);
  }
  
  controlsHideTimeout = setTimeout(() => {
    controlsVisible.value = false;
  }, 3000);
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

