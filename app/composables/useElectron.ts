export interface PlatformInfo {
  platform: string;
  isLinux: boolean;
  isMac: boolean;
  isWindows: boolean;
  isElectron: boolean;
  supportsLoopbackAudio: boolean;
  supportsVenmic: boolean;
}

export interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
  appIcon: string | null;
  display_id?: string;
}

export interface VenmicLinkOptions {
  include?: Record<string, string>[];
  exclude?: Record<string, string>[];
  ignore_devices?: boolean;
  only_speakers?: boolean;
  only_default_speakers?: boolean;
}

export interface StreamingClosePromptOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

export type UpdateStatus =
  | "checking"
  | "available"
  | "not-available"
  | "download-progress"
  | "downloaded"
  | "error";

export interface UpdateStatusPayload {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}

interface HeliumElectronAPI {
  isElectron: boolean;
  getPlatform: () => Promise<PlatformInfo>;
  getSources: () => Promise<DesktopSource[]>;
  onSourcesAvailable: (callback: (sources: DesktopSource[]) => void) => void;
  selectSource: (sourceId: string | null) => void;
  removeSourcesListener: () => void;
  venmicAvailable: () => Promise<boolean>;
  venmicList: () => Promise<Record<string, string>[]>;
  venmicLink: (options: VenmicLinkOptions) => Promise<boolean>;
  venmicUnlink: () => Promise<boolean>;
  checkScreenPermission: () => Promise<string>;
  openScreenPermissionSettings: () => Promise<boolean>;
  setStreamingActive: (
    active: boolean,
    promptOptions?: StreamingClosePromptOptions,
  ) => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
  installUpdate: () => Promise<boolean>;
  onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => () => void;
}

declare global {
  interface Window {
    heliumElectron?: HeliumElectronAPI;
  }
}

export function useElectron() {
  const isElectron = ref(false);
  const platformInfo = ref<PlatformInfo | null>(null);
  const audioSources = ref<Record<string, string>[]>([]);
  const isVenmicLinked = ref(false);

  const checkElectron = () => {
    if (import.meta.client) {
      isElectron.value = !!window.heliumElectron?.isElectron;
    }
    return isElectron.value;
  };

  const getPlatformInfo = async (): Promise<PlatformInfo | null> => {
    if (!checkElectron()) {
      return {
        platform: 'browser',
        isLinux: false,
        isMac: false,
        isWindows: false,
        isElectron: false,
        supportsLoopbackAudio: false,
        supportsVenmic: false,
      };
    }

    try {
      platformInfo.value = await window.heliumElectron!.getPlatform();
      return platformInfo.value;
    } catch (error) {
      console.error('[useElectron] Failed to get platform info:', error);
      return null;
    }
  };

  const getDesktopSources = async (): Promise<DesktopSource[]> => {
    if (!checkElectron()) return [];

    try {
      return await window.heliumElectron!.getSources();
    } catch (error) {
      console.error('[useElectron] Failed to get sources:', error);
      return [];
    }
  };

  const onSourcesAvailable = (callback: (sources: DesktopSource[]) => void) => {
    if (!checkElectron()) return;
    window.heliumElectron!.onSourcesAvailable(callback);
  };

  const selectSource = (sourceId: string | null) => {
    if (!checkElectron()) return;
    window.heliumElectron!.selectSource(sourceId);
  };

  const removeSourcesListener = () => {
    if (!checkElectron()) return;
    window.heliumElectron!.removeSourcesListener();
  };

  const isVenmicAvailable = async (): Promise<boolean> => {
    if (!checkElectron()) return false;
    try {
      return await window.heliumElectron!.venmicAvailable();
    } catch {
      return false;
    }
  };

  const getVenmicSources = async (): Promise<Record<string, string>[]> => {
    if (!checkElectron()) return [];
    try {
      const sources = await window.heliumElectron!.venmicList();
      audioSources.value = sources;
      return sources;
    } catch (error) {
      console.error('[useElectron] Failed to list venmic sources:', error);
      return [];
    }
  };

  const linkVenmicAudio = async (options: VenmicLinkOptions = {}): Promise<boolean> => {
    if (!checkElectron()) return false;
    try {
      const success = await window.heliumElectron!.venmicLink(options);
      isVenmicLinked.value = success;
      return success;
    } catch (error) {
      console.error('[useElectron] Failed to link venmic:', error);
      return false;
    }
  };

  const linkAllAudio = async (): Promise<boolean> => {
    return linkVenmicAudio({
      exclude: [],
      ignore_devices: true,
      only_speakers: true,
      only_default_speakers: false,
    });
  };

  const linkAppAudio = async (appName: string): Promise<boolean> => {
    return linkVenmicAudio({
      include: [{ 'application.name': appName }],
    });
  };

  const unlinkVenmicAudio = async (): Promise<boolean> => {
    if (!checkElectron()) return false;
    try {
      const success = await window.heliumElectron!.venmicUnlink();
      isVenmicLinked.value = !success;
      return success;
    } catch (error) {
      console.error('[useElectron] Failed to unlink venmic:', error);
      return false;
    }
  };

  const startScreenShareWithAudio = async (options: {
    video?: boolean | MediaTrackConstraints;
    audioSource?: 'all' | 'none' | string;
  } = {}): Promise<MediaStream | null> => {
    const { video = true, audioSource = 'all' } = options;
    const platform = await getPlatformInfo();

    try {
      if (platform?.isLinux && platform.supportsVenmic && audioSource !== 'none') {
        if (audioSource === 'all') {
          await linkAllAudio();
        } else {
          await linkAppAudio(audioSource);
        }
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video,
        audio: audioSource !== 'none',
      });

      return stream;
    } catch (error) {
      console.error('[useElectron] Failed to start screen share:', error);
      if (platform?.isLinux && isVenmicLinked.value) {
        await unlinkVenmicAudio();
      }
      return null;
    }
  };

  const stopScreenShare = async (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const platform = platformInfo.value;
    if (platform?.isLinux && isVenmicLinked.value) {
      await unlinkVenmicAudio();
    }
  };

  const supportsAudioScreenShare = computed(() => {
    if (!platformInfo.value) return false;
    return platformInfo.value.supportsLoopbackAudio || platformInfo.value.supportsVenmic;
  });

  const getScreenPermissionStatus = async (): Promise<string> => {
    if (!checkElectron()) return "granted";

    try {
      return await window.heliumElectron!.checkScreenPermission();
    } catch (error) {
      console.error("[useElectron] Failed to check screen permission:", error);
      return "unknown";
    }
  };

  const openScreenPermissionSettings = async (): Promise<boolean> => {
    if (!checkElectron()) return false;

    try {
      return await window.heliumElectron!.openScreenPermissionSettings();
    } catch (error) {
      console.error("[useElectron] Failed to open screen permission settings:", error);
      return false;
    }
  };

  const setStreamingActive = async (
    active: boolean,
    promptOptions?: StreamingClosePromptOptions,
  ): Promise<boolean> => {
    if (!checkElectron()) return false;

    try {
      return await window.heliumElectron!.setStreamingActive(
        active,
        promptOptions,
      );
    } catch (error) {
      console.error("[useElectron] Failed to set streaming status:", error);
      return false;
    }
  };

  const checkForUpdates = async (): Promise<boolean> => {
    if (!checkElectron()) return false;

    try {
      return await window.heliumElectron!.checkForUpdates();
    } catch (error) {
      console.error("[useElectron] Failed to check for updates:", error);
      return false;
    }
  };

  const installUpdate = async (): Promise<boolean> => {
    if (!checkElectron()) return false;

    try {
      return await window.heliumElectron!.installUpdate();
    } catch (error) {
      console.error("[useElectron] Failed to install update:", error);
      return false;
    }
  };

  const onUpdateStatus = (callback: (payload: UpdateStatusPayload) => void): (() => void) => {
    if (!checkElectron()) return () => {};
    return window.heliumElectron!.onUpdateStatus(callback);
  };

  onMounted(() => {
    checkElectron();
    if (isElectron.value) {
      getPlatformInfo();
    }
  });

  onUnmounted(() => {
    removeSourcesListener();
    if (isVenmicLinked.value) {
      unlinkVenmicAudio();
    }
  });

  return {
    isElectron: readonly(isElectron),
    platformInfo: readonly(platformInfo),
    audioSources: readonly(audioSources),
    isVenmicLinked: readonly(isVenmicLinked),
    supportsAudioScreenShare,

    checkElectron,
    getPlatformInfo,
    getDesktopSources,
    onSourcesAvailable,
    selectSource,
    removeSourcesListener,

    isVenmicAvailable,
    getVenmicSources,
    linkVenmicAudio,
    linkAllAudio,
    linkAppAudio,
    unlinkVenmicAudio,
    getScreenPermissionStatus,
    openScreenPermissionSettings,
    setStreamingActive,
    checkForUpdates,
    installUpdate,
    onUpdateStatus,

    startScreenShareWithAudio,
    stopScreenShare,
  };
}
