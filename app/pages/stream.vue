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

            <div class="space-y-3">
              <div class="space-y-1">
                <Label
                  class="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                >
                  {{ $t("streamQuality") }}
                </Label>
                <p class="text-xs text-muted-foreground">
                  {{ $t("streamQualityDescription") }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in qualityPresets"
                  :key="preset.id"
                  type="button"
                  class="rounded-lg border px-2.5 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5"
                  :class="[
                    isSelectedQuickPreset(preset)
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background',
                  ]"
                  @click="applyQuickPreset(preset)"
                >
                  <span class="flex items-center justify-between gap-2">
                    <span class="text-xs font-semibold">
                      {{ $t(preset.labelKey) }}
                    </span>
                    <Badge
                      v-if="isSelectedQuickPreset(preset)"
                      variant="secondary"
                      class="text-[9px] uppercase tracking-wide"
                    >
                      {{ $t("active") }}
                    </Badge>
                  </span>
                  <span class="mt-0.5 block text-[11px] text-muted-foreground">
                    {{ $t(preset.summaryKey) }}
                  </span>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">
                    {{ $t("quality") }}
                  </Label>
                  <Select v-model="selectedVideoQuality">
                    <SelectTrigger class="w-full h-9">
                      <SelectValue :placeholder="$t('quality')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="quality in videoQualityOptions"
                        :key="quality.id"
                        :value="quality.id"
                      >
                        {{ $t(quality.labelKey) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <Label class="text-xs text-muted-foreground">
                    {{ $t("fps") }}
                  </Label>
                  <Select v-model="selectedFrameRate">
                    <SelectTrigger class="w-full h-9">
                      <SelectValue :placeholder="$t('fps')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in frameRateOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

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

            <div class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div class="space-y-0.5">
                <Label for="high-quality-audio" class="text-sm font-medium">
                  {{ $t("highQualityAudio") }}
                </Label>
                <p class="text-xs text-muted-foreground">
                  {{ $t("highQualityAudioDescription") }}
                </p>
              </div>
              <Switch
                id="high-quality-audio"
                v-model="highQualityAudio"
                :disabled="!includeAudio"
              />
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
const highQualityAudio = ref(true);
const selectedAudioSource = ref("all");
const selectedPresetId = ref("");

const streamSettingsStorageKey = "helium-stream-settings";

type VideoQualityId = "dataSaver" | "standard" | "sharp" | "ultra";
type FrameRateValue = "24" | "30" | "60";

interface QualityPreset {
  id: string;
  labelKey: string;
  summaryKey: string;
  quality: VideoQualityId;
  frameRate: FrameRateValue;
}

interface VideoQualityOption {
  id: VideoQualityId;
  labelKey: string;
  width: number;
  height: number;
  maxBitrate: number;
  contentHint: "motion" | "detail";
}

interface FrameRateOption {
  value: FrameRateValue;
  label: string;
}

interface StoredStreamSettings {
  videoQuality?: VideoQualityId;
  frameRate?: FrameRateValue;
  includeAudio?: boolean;
  highQualityAudio?: boolean;
  audioSource?: string;
}

const qualityPresets: QualityPreset[] = [
  {
    id: "speed",
    labelKey: "preferSpeed",
    summaryKey: "preferSpeedSummary",
    quality: "dataSaver",
    frameRate: "24",
  },
  {
    id: "balanced",
    labelKey: "balanced",
    summaryKey: "balancedSummary",
    quality: "standard",
    frameRate: "30",
  },
  {
    id: "quality",
    labelKey: "preferQuality",
    summaryKey: "preferQualitySummary",
    quality: "sharp",
    frameRate: "30",
  },
  {
    id: "cinematic",
    labelKey: "highMotion",
    summaryKey: "highMotionSummary",
    quality: "standard",
    frameRate: "60",
  },
];

const videoQualityOptions: VideoQualityOption[] = [
  {
    id: "dataSaver",
    labelKey: "dataSaver",
    width: 1280,
    height: 720,
    maxBitrate: 1_200_000,
    contentHint: "detail",
  },
  {
    id: "standard",
    labelKey: "standard",
    width: 1920,
    height: 1080,
    maxBitrate: 2_800_000,
    contentHint: "detail",
  },
  {
    id: "sharp",
    labelKey: "sharp",
    width: 2560,
    height: 1440,
    maxBitrate: 5_000_000,
    contentHint: "detail",
  },
  {
    id: "ultra",
    labelKey: "ultra",
    width: 3840,
    height: 2160,
    maxBitrate: 8_000_000,
    contentHint: "detail",
  },
];

const frameRateOptions: FrameRateOption[] = [
  { value: "24", label: "24 FPS" },
  { value: "30", label: "30 FPS" },
  { value: "60", label: "60 FPS" },
];

const selectedVideoQuality = ref<VideoQualityId>("standard");
const selectedFrameRate = ref<FrameRateValue>("30");

const activeQualityPreset = computed(
  () =>
    videoQualityOptions.find(
      (quality) => quality.id === selectedVideoQuality.value,
    ) ?? videoQualityOptions[1]!,
);

const activeFrameRate = computed(() => Number(selectedFrameRate.value));

const activeContentHint = computed(() =>
  selectedFrameRate.value === "60" ? "motion" : activeQualityPreset.value.contentHint,
);

const audioMaxBitrate = computed(() =>
  highQualityAudio.value ? 128_000 : 64_000,
);

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
  restoreStreamSettings();
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

watch(
  [selectedVideoQuality, selectedFrameRate, highQualityAudio],
  async () => {
    persistStreamSettings();

    if (!localStream.value) return;

    await applyCurrentStreamSettings();
    toast.success(t("streamQualityUpdated"));
  },
);

watch([includeAudio, selectedAudioSource], () => {
  persistStreamSettings();
});

function isVideoQualityId(value: unknown): value is VideoQualityId {
  return (
    typeof value === "string" &&
    videoQualityOptions.some((quality) => quality.id === value)
  );
}

function isFrameRateValue(value: unknown): value is FrameRateValue {
  return (
    typeof value === "string" &&
    frameRateOptions.some((option) => option.value === value)
  );
}

function restoreStreamSettings(): void {
  const rawSettings = localStorage.getItem(streamSettingsStorageKey);

  if (!rawSettings) return;

  try {
    const settings = JSON.parse(rawSettings) as StoredStreamSettings;

    if (isVideoQualityId(settings.videoQuality)) {
      selectedVideoQuality.value = settings.videoQuality;
    }
    if (isFrameRateValue(settings.frameRate)) {
      selectedFrameRate.value = settings.frameRate;
    }
    if (typeof settings.includeAudio === "boolean") {
      includeAudio.value = settings.includeAudio;
    }
    if (typeof settings.highQualityAudio === "boolean") {
      highQualityAudio.value = settings.highQualityAudio;
    }
    if (typeof settings.audioSource === "string") {
      selectedAudioSource.value = settings.audioSource;
    }
  } catch (error) {
    console.warn("Failed to restore stream settings:", error);
  }
}

function persistStreamSettings(): void {
  const settings: StoredStreamSettings = {
    videoQuality: selectedVideoQuality.value,
    frameRate: selectedFrameRate.value,
    includeAudio: includeAudio.value,
    highQualityAudio: highQualityAudio.value,
    audioSource: selectedAudioSource.value,
  };

  localStorage.setItem(streamSettingsStorageKey, JSON.stringify(settings));
}

function applyQuickPreset(preset: QualityPreset): void {
  selectedVideoQuality.value = preset.quality;
  selectedFrameRate.value = preset.frameRate;
}

function isSelectedQuickPreset(preset: QualityPreset): boolean {
  return (
    selectedVideoQuality.value === preset.quality &&
    selectedFrameRate.value === preset.frameRate
  );
}

async function applyCurrentStreamSettings(): Promise<void> {
  if (!localStream.value) return;

  await applyQualityPresetToStream(localStream.value);
  await applyQualityPresetToPeerConnections();
}

async function refreshAudioSources() {
  await getVenmicSources();
}

async function copyCode() {
  await navigator.clipboard.writeText(streamerStore.code);
  toast.success(t("codeCopied"));
}

function getDisplayMediaConstraints(): DisplayMediaStreamOptions {
  const preset = activeQualityPreset.value;
  const frameRate = activeFrameRate.value;
  const shouldRequestAudio =
    isElectron.value && includeAudio.value && supportsAudioScreenShare.value;

  return {
    video: {
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: frameRate, max: frameRate },
    },
    audio: shouldRequestAudio
      ? {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      : false,
  };
}

async function applyQualityPresetToSender(
  sender: RTCRtpSender,
): Promise<void> {
  const preset = activeQualityPreset.value;
  const frameRate = activeFrameRate.value;
  const parameters = sender.getParameters();

  if (!parameters.encodings || parameters.encodings.length === 0) {
    return;
  }

  const [encoding] = parameters.encodings;
  encoding.maxBitrate = preset.maxBitrate;
  encoding.maxFramerate = frameRate;

  await sender.setParameters(parameters);
}

async function applyAudioQualityToSender(sender: RTCRtpSender): Promise<void> {
  const parameters = sender.getParameters();

  if (!parameters.encodings || parameters.encodings.length === 0) {
    return;
  }

  const [encoding] = parameters.encodings;
  encoding.maxBitrate = audioMaxBitrate.value;

  await sender.setParameters(parameters);
}

async function safelyApplySenderSettings(
  sender: RTCRtpSender,
): Promise<void> {
  try {
    if (sender.track?.kind === "video") {
      await applyQualityPresetToSender(sender);
    }
    if (sender.track?.kind === "audio") {
      await applyAudioQualityToSender(sender);
    }
  } catch (error) {
    console.warn("Failed to apply stream sender settings:", error);
  }
}

function withVideoBitrateHints(sdp: string): string {
  const lines = sdp.split("\r\n");
  const videoLineIndex = lines.findIndex((line) => line.startsWith("m=video"));

  if (videoLineIndex === -1) return sdp;

  const nextMediaLineIndex = lines.findIndex(
    (line, index) => index > videoLineIndex && line.startsWith("m="),
  );
  const videoSectionEnd =
    nextMediaLineIndex === -1 ? lines.length : nextMediaLineIndex;
  const maxBitrateKbps = Math.round(activeQualityPreset.value.maxBitrate / 1000);
  const startBitrateKbps = Math.min(
    maxBitrateKbps,
    Math.max(1_000, Math.round(maxBitrateKbps * 0.75)),
  );
  const payloadTypes = lines[videoLineIndex]!.split(" ").slice(3);
  const tunedPayloadTypes = payloadTypes.filter((payloadType) => {
    const rtmap = lines
      .slice(videoLineIndex, videoSectionEnd)
      .find((line) => line.startsWith(`a=rtmap:${payloadType} `));

    return /\b(VP8|VP9|H264|AV1)\//i.test(rtmap ?? "");
  });

  const hasBandwidthHint = lines
    .slice(videoLineIndex, videoSectionEnd)
    .some((line) => line.startsWith("b=AS:") || line.startsWith("b=TIAS:"));

  if (!hasBandwidthHint) {
    const connectionLineIndex = lines.findIndex(
      (line, index) =>
        index > videoLineIndex &&
        index < videoSectionEnd &&
        line.startsWith("c="),
    );

    if (connectionLineIndex !== -1) {
      lines.splice(connectionLineIndex + 1, 0, `b=AS:${maxBitrateKbps}`);
    }
  }

  tunedPayloadTypes.forEach((payloadType) => {
    const fmtpIndex = lines.findIndex(
      (line, index) =>
        index > videoLineIndex &&
        index < videoSectionEnd &&
        line.startsWith(`a=fmtp:${payloadType} `),
    );
    const bitrateHint = `x-google-start-bitrate=${startBitrateKbps};x-google-max-bitrate=${maxBitrateKbps}`;

    if (fmtpIndex !== -1) {
      if (!lines[fmtpIndex]!.includes("x-google-start-bitrate")) {
        lines[fmtpIndex] = `${lines[fmtpIndex]};${bitrateHint}`;
      }
      return;
    }

    const rtmapIndex = lines.findIndex(
      (line, index) =>
        index > videoLineIndex &&
        index < videoSectionEnd &&
        line.startsWith(`a=rtmap:${payloadType} `),
    );

    if (rtmapIndex !== -1) {
      lines.splice(rtmapIndex + 1, 0, `a=fmtp:${payloadType} ${bitrateHint}`);
    }
  });

  return lines.join("\r\n");
}

async function applyQualityPresetToPeerConnections(): Promise<void> {
  const senders = Object.values(streamerStore.peerConnections).flatMap((pc) =>
    pc.getSenders(),
  );

  await Promise.all(
    senders.map((sender) => safelyApplySenderSettings(sender)),
  );
}

async function applyQualityPresetToStream(stream: MediaStream): Promise<void> {
  const preset = activeQualityPreset.value;
  const frameRate = activeFrameRate.value;
  const [videoTrack] = stream.getVideoTracks();

  if (!videoTrack) return;

  videoTrack.contentHint = activeContentHint.value;

  try {
    await videoTrack.applyConstraints({
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: frameRate, max: frameRate },
    });
  } catch (error) {
    console.warn("Failed to apply capture quality constraints:", error);
  }
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
      const tunedOffer: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: offer.sdp ? withVideoBitrateHints(offer.sdp) : undefined,
      };
      await peerConnection.setLocalDescription(tunedOffer);

      void Promise.all(
        peerConnection
          .getSenders()
          .map((sender) => safelyApplySenderSettings(sender)),
      );

      send(
        JSON.stringify({
          event: "offer",
          targetId: message.viewerId,
          sdp: peerConnection.localDescription,
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

    const stream = await navigator.mediaDevices.getDisplayMedia(
      getDisplayMediaConstraints(),
    );

    await applyQualityPresetToStream(stream);

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

    const newStream = await navigator.mediaDevices.getDisplayMedia(
      getDisplayMediaConstraints(),
    );

    if (!localStream.value) return;

    const newVideoTrack = newStream.getVideoTracks()[0];
    const newAudioTrack = newStream.getAudioTracks()[0];

    await applyQualityPresetToStream(newStream);

    newVideoTrack!.onended = () => {
      console.log("Screen sharing stopped by user");
      stopStreaming();
    };

    const peerUpdates = Object.values(streamerStore.peerConnections).map(
      async (pc) => {
        const senders = pc.getSenders();

        const videoSender = senders.find(
          (sender) => sender.track?.kind === "video",
        );
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack!);
          await safelyApplySenderSettings(videoSender);
        }

        if (newAudioTrack) {
          const audioSender = senders.find(
            (sender) => sender.track?.kind === "audio",
          );
          if (audioSender) {
            await audioSender.replaceTrack(newAudioTrack);
            await safelyApplySenderSettings(audioSender);
          } else {
            const sender = pc.addTrack(newAudioTrack, newStream);
            await safelyApplySenderSettings(sender);
          }
        }
      },
    );

    await Promise.all(peerUpdates);

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
