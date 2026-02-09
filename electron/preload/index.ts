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
};

contextBridge.exposeInMainWorld('heliumElectron', heliumElectronAPI);

export type HeliumElectronAPI = typeof heliumElectronAPI;
