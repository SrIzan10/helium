<template>
  <div class="flex flex-col items-center justify-center gap-6 mt-10 px-4">
    <div class="flex space-x-4 items-center">
      <Button v-if="!localStream" @click="startScreenShare">
        {{ $t("screenshare") }}
      </Button>
      <Button
        v-if="localStream"
        @click="changeScreenShareSource"
        variant="outline"
      >
        {{ $t("changeSource") }}
      </Button>
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

const { send, close: closeWebSocket } = useWebSocket(wsUrl, {
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
        iceServers: streamerStore.iceServers,
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

      peerConnection.onconnectionstatechange = () => {
        console.log(
          `connection state with ${message.viewerId}: ${peerConnection.connectionState}`,
        );
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      send(
        JSON.stringify({
          event: "offer",
          targetId: message.viewerId,
          sdp: offer,
          iceServers: streamerStore.iceServers,
        }),
      );
    }

    if (message.event === "ice-candidate") {
      const pc = streamerStore.peerConnections[message.from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    }

    if (message.event === "answer") {
      const pc = streamerStore.peerConnections[message.from];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    }

    if (message.event === "viewer-left") {
      const pc = streamerStore.peerConnections[message.viewerId];
      if (pc) {
        pc.close();
        streamerStore.removePeerConnection(message.viewerId);
      }
    }
  },
});

async function startScreenShare() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    localStream.value = stream;

    if (videofeedRef.value) {
      videofeedRef.value.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log("Screen sharing stopped by user");
        cleanupStreaming();
      };
    });

    send(
      JSON.stringify({
        event: "create-room",
      }),
    );
  } catch (error) {
    console.error("Failed to start screen share:", error);
    cleanupStreaming();
  }
}

async function changeScreenShareSource() {
  try {
    const newStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    if (!localStream.value) return;

    const newVideoTrack = newStream.getVideoTracks()[0];

    newVideoTrack.onended = () => {
      console.log("Screen sharing stopped by user");
      cleanupStreaming();
    };

    Object.values(streamerStore.peerConnections).forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find(
        (sender) => sender.track?.kind === "video",
      );
      if (videoSender) {
        videoSender.replaceTrack(newVideoTrack);
      }
    });

    localStream.value.getTracks().forEach((track) => {
      track.stop();
    });

    localStream.value = newStream;

    if (videofeedRef.value) {
      videofeedRef.value.srcObject = newStream;
    }
  } catch (error) {
    console.error("Failed to change screen share source:", error);
  }
}

function cleanupStreaming() {
  if (localStream.value) {
    localStream.value.getTracks().forEach((track) => {
      track.stop();
    });
    localStream.value = null;
  }

  Object.values(streamerStore.peerConnections).forEach((pc) => {
    pc.close();
  });

  streamerStore.clearPeerConnections();

  if (videofeedRef.value) {
    videofeedRef.value.srcObject = null;
  }

  streamerStore.setCode("");
}

onBeforeUnmount(() => {
  cleanupStreaming();
  closeWebSocket();
});

onMounted(() => {
  const handleBeforeUnload = () => {
    cleanupStreaming();
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });
});
</script>
