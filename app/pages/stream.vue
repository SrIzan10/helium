<template>
  <div class="flex flex-col items-center justify-center gap-6 mt-10 px-4">
    <div class="flex flex-wrap gap-4 items-center justify-center">
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

    <div v-if="isElectron && supportsAudioScreenShare" class="flex flex-col items-center gap-2">
      <div class="flex items-center gap-2">
        <Switch id="include-audio" v-model:checked="includeAudio" />
        <Label for="include-audio" class="text-sm">{{ $t("includeAudio") }}</Label>
      </div>
      
      <div v-if="platformInfo?.isLinux && platformInfo?.supportsVenmic && includeAudio" class="flex flex-col items-center gap-2">
        <Select v-model="selectedAudioSource">
          <SelectTrigger class="w-[200px]">
            <SelectValue :placeholder="$t('audioSource')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ $t("allSystemAudio") }}</SelectItem>
            <SelectItem 
              v-for="source in audioSources" 
              :key="source['node.name']" 
              :value="source['application.name']! || source['node.name']!"
            >
              {{ source['application.name'] || source['node.name'] }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" @click="refreshAudioSources">
          {{ $t("refreshSources") }}
        </Button>
      </div>
    </div>

    <div v-if="isElectron" class="text-xs text-muted-foreground">
      <span v-if="platformInfo?.isWindows">Windows</span>
      <span v-else-if="platformInfo?.isMac">macOS</span>
      <span v-else-if="platformInfo?.isLinux">Linux</span>
      <span v-if="supportsAudioScreenShare" class="ml-2">• {{ $t("audioSupported") }}</span>
    </div>

    <p v-if="streamerStore.code" class="font-mono text-lg">{{ streamerStore.code }}</p>
    <video ref="videofeedRef" autoplay playsinline muted class="max-w-full rounded-lg"></video>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStreamerStore } from "~/state/streamer";
import { useWebSocketUrl } from "~/composables/useWebSocketUrl";
import { useElectron } from "~/composables/useElectron";
import PresetSelect from "~/components/app/PresetSelect.vue";

const streamerStore = useStreamerStore();
const { t } = useI18n();
const videofeedRef = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const wsUrl = useWebSocketUrl();

const includeAudio = ref(true);
const selectedAudioSource = ref("all");

const {
  isElectron,
  platformInfo,
  audioSources,
  supportsAudioScreenShare,
  getPlatformInfo,
  getVenmicSources,
  linkAllAudio,
  linkAppAudio,
  unlinkVenmicAudio,
  getScreenPermissionStatus,
  openScreenPermissionSettings,
} = useElectron();

onMounted(async () => {
  await getPlatformInfo();
  if (platformInfo.value?.isLinux && platformInfo.value?.supportsVenmic) {
    await refreshAudioSources();
  }
});

async function refreshAudioSources() {
  await getVenmicSources();
}

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
    const isLinuxWithVenmic = isElectron.value && platformInfo.value?.isLinux && platformInfo.value?.supportsVenmic;
    
    if (isLinuxWithVenmic && includeAudio.value) {
      if (selectedAudioSource.value === "all") {
        await linkAllAudio();
      } else {
        await linkAppAudio(selectedAudioSource.value);
      }
    }

    const shouldRequestAudio = isElectron.value && includeAudio.value && supportsAudioScreenShare.value;

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: shouldRequestAudio ? {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      } : false,
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

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    console.log(`[Helium] Stream started - Video: ${videoTracks.length}, Audio: ${audioTracks.length}`);

    send(
      JSON.stringify({
        event: "create-room",
      }),
    );
  } catch (error) {
    console.error("Failed to start screen share:", error);
    await handleScreenShareError(error);
    cleanupStreaming();
  }
}

async function changeScreenShareSource() {
  try {
    const isLinuxWithVenmic = isElectron.value && platformInfo.value?.isLinux && platformInfo.value?.supportsVenmic;
    
    if (isLinuxWithVenmic && includeAudio.value) {
      if (selectedAudioSource.value === "all") {
        await linkAllAudio();
      } else {
        await linkAppAudio(selectedAudioSource.value);
      }
    }

    const shouldRequestAudio = isElectron.value && includeAudio.value && supportsAudioScreenShare.value;

    const newStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: shouldRequestAudio,
    });

    if (!localStream.value) return;

    const newVideoTrack = newStream.getVideoTracks()[0];
    const newAudioTrack = newStream.getAudioTracks()[0];

    newVideoTrack!.onended = () => {
      console.log("Screen sharing stopped by user");
      cleanupStreaming();
    };

    Object.values(streamerStore.peerConnections).forEach((pc) => {
      const senders = pc.getSenders();
      
      const videoSender = senders.find((sender) => sender.track?.kind === "video");
      if (videoSender) {
        videoSender.replaceTrack(newVideoTrack!);
      }
      
      if (newAudioTrack) {
        const audioSender = senders.find((sender) => sender.track?.kind === "audio");
        if (audioSender) {
          audioSender.replaceTrack(newAudioTrack);
        } else {
          pc.addTrack(newAudioTrack, newStream);
        }
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
    await handleScreenShareError(error);
  }
}

async function handleScreenShareError(error: unknown): Promise<void> {
  const isPermissionDeniedError =
    error instanceof DOMException && error.name === "NotAllowedError";

  if (!isPermissionDeniedError || !isElectron.value || !platformInfo.value?.isMac) {
    toast.error(t("failedToStartScreenShare"));
    return;
  }

  const permissionStatus = await getScreenPermissionStatus();

  if (permissionStatus === "granted") {
    toast.error(t("failedToStartScreenShare"));
    return;
  }

  const openedSettings = await openScreenPermissionSettings();

  if (openedSettings) {
    toast.error(t("screenRecordingPermissionRequired"));
    return;
  }

  toast.error(t("screenRecordingPermissionRequiredNoShortcut"));
}

async function cleanupStreaming() {
  if (localStream.value) {
    localStream.value.getTracks().forEach((track) => {
      track.stop();
    });
    localStream.value = null;
  }

  if (isElectron.value && platformInfo.value?.isLinux) {
    await unlinkVenmicAudio();
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
