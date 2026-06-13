<template>
  <div
    class="min-h-[80vh] flex flex-col items-center justify-start gap-8 mt-10 px-4 pb-16"
  >
    <div class="text-center space-y-2">
      <h1 class="text-4xl font-bold tracking-tight">{{ $t("stream") }}</h1>
    </div>

    <div
      class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start"
    >
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <Monitor class="size-4 text-primary" />
              {{ $t("screenshare") }}
            </CardTitle>
            <CardDescription>
              {{ $t("streamControlDescription") }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Button
              v-if="!localStream"
              @click="startScreenShare"
              size="lg"
              class="w-full gap-2"
            >
              <Monitor class="size-4" />
              {{ $t("screenshare") }}
            </Button>

            <Button
              v-if="localStream"
              @click="changeScreenShareSource"
              variant="outline"
              size="lg"
              class="w-full gap-2"
            >
              <RefreshCw class="size-4" />
              {{ $t("changeSource") }}
            </Button>

            <Button
              v-if="localStream"
              @click="stopStreaming"
              variant="destructive"
              size="lg"
              class="w-full gap-2"
            >
              <Square class="size-4" />
              {{ $t("stopStream") }}
            </Button>

            <Separator />

            <div class="space-y-2">
              <Label
                class="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
              >
                {{ $t("selectAPreset") }}
              </Label>
              <PresetSelect v-model="selectedPresetId" />
            </div>
          </CardContent>
        </Card>

        <Card v-if="streamerStore.code" class="border-primary/30">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base flex items-center gap-2">
                <Share2 class="size-4 text-primary" />
                {{ $t("shareCode") }}
              </CardTitle>
              <Badge class="text-xs bg-green-500/15 text-green-600 dark:text-green-400 border-0">
                ● {{ $t("live") }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <p
              class="font-mono text-5xl font-bold tracking-[0.3em] text-primary text-center py-2"
            >
              {{ streamerStore.code }}
            </p>
            <Button
              variant="outline"
              size="sm"
              class="w-full gap-2"
              @click="copyCode"
            >
              <Copy class="size-3" />
              {{ $t("copyCode") }}
            </Button>
          </CardContent>
        </Card>

        <Card v-if="isElectron && supportsAudioScreenShare">
          <CardHeader>
            <CardTitle class="text-base flex items-center gap-2">
              <Radio class="size-4 text-primary" />
              {{ $t("includeAudio") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center gap-2">
              <Switch id="include-audio" v-model="includeAudio" />
              <Label for="include-audio" class="text-sm font-normal">
                {{ $t("includeAudio") }}
              </Label>
            </div>

            <div
              v-if="platformInfo?.isLinux && platformInfo?.supportsVenmic && includeAudio"
              class="space-y-3 pt-2 border-t border-border"
            >
              <Select v-model="selectedAudioSource">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="$t('audioSource')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {{ $t("allSystemAudio") }}
                  </SelectItem>
                  <SelectItem
                    v-for="source in audioSources"
                    :key="source['node.name']"
                    :value="
                      source['application.name']! || source['node.name']!
                    "
                  >
                    {{ source['application.name'] || source['node.name'] }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                @click="refreshAudioSources"
                class="gap-2 w-full"
              >
                <RefreshCw class="size-3" />
                {{ $t("refreshSources") }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div
          class="relative rounded-xl overflow-hidden border shadow-sm"
          :class="[
            localStream
              ? 'aspect-video bg-black'
              : 'aspect-video bg-muted/50 flex items-center justify-center',
          ]"
        >
          <video
            ref="videofeedRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-contain"
            :class="{ hidden: !localStream }"
          />

          <div
            v-if="!localStream"
            class="flex flex-col items-center gap-3 text-muted-foreground"
          >
            <div
              class="size-16 rounded-full bg-muted flex items-center justify-center"
            >
              <Monitor class="size-8 opacity-40" />
            </div>
            <div class="text-center space-y-1">
              <p class="text-sm font-medium">{{ $t("previewWaiting") }}</p>
              <p class="text-xs opacity-60">{{ $t("previewWaitingDescription") }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from "@vueuse/core";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Monitor,
  Radio,
  RefreshCw,
  Share2,
  Square,
} from "lucide-vue-next";
import { useStreamerStore } from "~/state/streamer";
import { useWebSocketUrl } from "~/composables/useWebSocketUrl";
import { useElectron } from "~/composables/useElectron";
import PresetSelect from "~/components/app/PresetSelect.vue";

const streamerStore = useStreamerStore();
const { t, locale } = useI18n();
const videofeedRef = ref<HTMLVideoElement | null>(null);
const localStream = ref<MediaStream | null>(null);
const isCleaningUp = ref(false);
const wsUrl = useWebSocketUrl();

const includeAudio = ref(true);
const selectedAudioSource = ref("all");
const selectedPresetId = ref("");

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
  setStreamingActive,
} = useElectron();

onMounted(async () => {
  await getPlatformInfo();

  if (platformInfo.value?.isLinux && platformInfo.value?.supportsVenmic) {
    await refreshAudioSources();
  }
});

watch(localStream, async (stream) => {
  await nextTick();

  if (videofeedRef.value) {
    videofeedRef.value.srcObject = stream;
  }
});

watch([localStream, locale], async ([stream]) => {
  if (!isElectron.value) return;

  await setStreamingActive(
    !!stream,
    stream
      ? {
          title: t("activeStreamCloseTitle"),
          message: t("activeStreamCloseMessage"),
          confirmLabel: t("stopStreamAndClose"),
          cancelLabel: t("keepStreaming"),
        }
      : undefined,
  );
});

async function refreshAudioSources() {
  await getVenmicSources();
}

async function copyCode() {
  await navigator.clipboard.writeText(streamerStore.code);
  toast.success(t("codeCopied"));
}

function notifyRoomClosed() {
  if (!streamerStore.code) return;

  send(
    JSON.stringify({
      event: "close-room",
      roomId: streamerStore.code,
    }),
  );
}

async function stopStreaming() {
  if (isCleaningUp.value) return;

  notifyRoomClosed();
  await cleanupStreaming();
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
  if (!selectedPresetId.value) {
    toast.error(t("selectPresetBeforeStreaming"));
    return;
  }

  try {
    const isLinuxWithVenmic =
      isElectron.value &&
      platformInfo.value?.isLinux &&
      platformInfo.value?.supportsVenmic;

    if (isLinuxWithVenmic && includeAudio.value) {
      if (selectedAudioSource.value === "all") {
        await linkAllAudio();
      } else {
        await linkAppAudio(selectedAudioSource.value);
      }
    }

    const shouldRequestAudio =
      isElectron.value && includeAudio.value && supportsAudioScreenShare.value;

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: shouldRequestAudio
        ? {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        : false,
    });

    localStream.value = stream;

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log("Screen sharing stopped by user");
        stopStreaming();
      };
    });

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    console.log(
      `[Helium] Stream started - Video: ${videoTracks.length}, Audio: ${audioTracks.length}`,
    );

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
    const isLinuxWithVenmic =
      isElectron.value &&
      platformInfo.value?.isLinux &&
      platformInfo.value?.supportsVenmic;

    if (isLinuxWithVenmic && includeAudio.value) {
      if (selectedAudioSource.value === "all") {
        await linkAllAudio();
      } else {
        await linkAppAudio(selectedAudioSource.value);
      }
    }

    const shouldRequestAudio =
      isElectron.value && includeAudio.value && supportsAudioScreenShare.value;

    const newStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: shouldRequestAudio,
    });

    if (!localStream.value) return;

    const newVideoTrack = newStream.getVideoTracks()[0];
    const newAudioTrack = newStream.getAudioTracks()[0];

    newVideoTrack!.onended = () => {
      console.log("Screen sharing stopped by user");
      stopStreaming();
    };

    Object.values(streamerStore.peerConnections).forEach((pc) => {
      const senders = pc.getSenders();

      const videoSender = senders.find(
        (sender) => sender.track?.kind === "video",
      );
      if (videoSender) {
        videoSender.replaceTrack(newVideoTrack!);
      }

      if (newAudioTrack) {
        const audioSender = senders.find(
          (sender) => sender.track?.kind === "audio",
        );
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
  } catch (error) {
    console.error("Failed to change screen share source:", error);
    await handleScreenShareError(error);
  }
}

async function handleScreenShareError(error: unknown): Promise<void> {
  const isPermissionDeniedError =
    error instanceof DOMException && error.name === "NotAllowedError";

  if (
    !isPermissionDeniedError ||
    !isElectron.value ||
    !platformInfo.value?.isMac
  ) {
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
  if (isCleaningUp.value) return;

  isCleaningUp.value = true;

  try {
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
  } finally {
    isCleaningUp.value = false;
  }
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
