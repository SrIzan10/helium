/**
 * Helium Electron Preload Script
 * 
 * Exposes safe APIs to the Nuxt renderer for:
 * - Platform detection
 * - Desktop capture with audio
 * - Venmic control (Linux)
 */

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

export interface DesktopSource {
  id: string;
  name: string;
  thumbnail: string;
  appIcon: string | null;
  display_id?: string;
}

export interface PlatformInfo {
  platform: string;
  isLinux: boolean;
  isMac: boolean;
  isWindows: boolean;
  isElectron: boolean;
  supportsLoopbackAudio: boolean;
  supportsVenmic: boolean;
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
  | 'checking'
  | 'available'
  | 'not-available'
  | 'download-progress'
  | 'downloaded'
  | 'error';

export interface UpdateStatusPayload {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}

const heliumElectronAPI = {
  isElectron: true as const,
  getPlatform: (): Promise<PlatformInfo> => ipcRenderer.invoke('helium:get-platform'),
  getSources: (): Promise<DesktopSource[]> => ipcRenderer.invoke('helium:get-sources'),
  onSourcesAvailable: (callback: (sources: DesktopSource[]) => void): void => {
    ipcRenderer.on('desktop-capturer-sources', (_event: IpcRendererEvent, sources: DesktopSource[]) => {
      callback(sources);
    });
  },
  selectSource: (sourceId: string | null): void => {
    ipcRenderer.send('desktop-capturer-selected', sourceId);
  },
  removeSourcesListener: (): void => {
    ipcRenderer.removeAllListeners('desktop-capturer-sources');
  },

  venmicAvailable: (): Promise<boolean> => ipcRenderer.invoke('helium:venmic-available'),
  venmicList: (): Promise<Record<string, string>[]> => ipcRenderer.invoke('helium:venmic-list'),
  venmicLink: (options: VenmicLinkOptions): Promise<boolean> => ipcRenderer.invoke('helium:venmic-link', options),
  venmicUnlink: (): Promise<boolean> => ipcRenderer.invoke('helium:venmic-unlink'),

  checkScreenPermission: (): Promise<string> => ipcRenderer.invoke('helium:check-screen-permission'),
  openScreenPermissionSettings: (): Promise<boolean> =>
    ipcRenderer.invoke('helium:open-screen-permission-settings'),
  setStreamingActive: (
    active: boolean,
    promptOptions?: StreamingClosePromptOptions,
  ): Promise<boolean> => ipcRenderer.invoke('helium:set-streaming-active', active, promptOptions),
  checkForUpdates: (): Promise<boolean> => ipcRenderer.invoke('helium:check-for-updates'),
  installUpdate: (): Promise<boolean> => ipcRenderer.invoke('helium:install-update'),
  onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, payload: UpdateStatusPayload): void => {
      callback(payload);
    };

    ipcRenderer.on('helium:update-status', listener);
    return () => ipcRenderer.removeListener('helium:update-status', listener);
  },
};

contextBridge.exposeInMainWorld('heliumElectron', heliumElectronAPI);

export type HeliumElectronAPI = typeof heliumElectronAPI;
