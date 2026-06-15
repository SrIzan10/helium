import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  dialog,
  session,
  shell,
  systemPreferences,
  type IpcMainInvokeEvent,
  type DesktopCapturerSource,
} from 'electron';
import { autoUpdater, type AppUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import path from 'path';
import { VenmicManager, type VenmicLinkOptions } from './venmic';

const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isWayland = isLinux && (
  process.env.XDG_SESSION_TYPE === 'wayland' ||
  process.env.WAYLAND_DISPLAY !== undefined
);

const enableFeatures: Set<string> = new Set();
const disableFeatures: Set<string> = new Set();

if (isLinux) {
  enableFeatures.add('PulseaudioLoopbackForScreenShare');
  disableFeatures.add('WebRtcAllowInputVolumeAdjustment');
  
  if (isWayland) {
    enableFeatures.add('WebRTCPipeWireCapturer');
    disableFeatures.add('UseMultiPlaneFormatForSoftwareVideo');
    console.log('[Helium] Wayland detected, enabling PipeWire capturer');
  }
}

if (enableFeatures.size > 0) {
  app.commandLine.appendSwitch('enable-features', Array.from(enableFeatures).join(','));
}
if (disableFeatures.size > 0) {
  app.commandLine.appendSwitch('disable-features', Array.from(disableFeatures).join(','));
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const NUXT_DEV_URL = process.env.NUXT_DEV_URL || 'http://localhost:3000';

let mainWindow: BrowserWindow | null = null;
let venmicManager: VenmicManager | null = null;
let isStreamingActive = false;
let autoUpdaterConfigured = false;
let streamingClosePrompt = {
  title: 'Active stream',
  message: 'A stream is still active. Closing Helium will stop it for all viewers.',
  confirmLabel: 'Stop stream and close',
  cancelLabel: 'Keep streaming',
};

console.log('[Helium] Platform:', process.platform);
console.log('[Helium] Wayland:', isWayland);
console.log('[Helium] XDG_SESSION_TYPE:', process.env.XDG_SESSION_TYPE);

type UpdateStatus =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'download-progress'
  | 'downloaded'
  | 'error';

interface UpdateStatusPayload {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}

function getAutoUpdater(): AppUpdater {
  return autoUpdater;
}

function sendUpdateStatus(payload: UpdateStatusPayload): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('helium:update-status', payload);
    }
  }
}

function toUpdateStatus(status: UpdateStatus, info?: UpdateInfo): UpdateStatusPayload {
  return {
    status,
    version: info?.version,
  };
}

function setupAutoUpdater(): void {
  if (isDev || !app.isPackaged || autoUpdaterConfigured) return;

  autoUpdaterConfigured = true;
  const autoUpdater = getAutoUpdater();

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ status: 'checking' });
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    sendUpdateStatus(toUpdateStatus('available', info));
  });

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    sendUpdateStatus(toUpdateStatus('not-available', info));
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    sendUpdateStatus({
      status: 'download-progress',
      percent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    sendUpdateStatus(toUpdateStatus('downloaded', info));
  });

  autoUpdater.on('error', (error: Error) => {
    console.error('[Helium] Auto updater error:', error);
    sendUpdateStatus({ status: 'error', message: error.message });
  });

  void autoUpdater.checkForUpdatesAndNotify().catch((error: unknown) => {
    console.error('[Helium] Failed to check for updates:', error);
  });
}

if (isLinux) {
  try {
    venmicManager = new VenmicManager();
  } catch (error) {
    console.warn('[Helium] Venmic not available:', error);
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Helium',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
  });

  setupDisplayMediaHandler();

  if (isDev) {
    mainWindow.loadURL(NUXT_DEV_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const prodUrl = 'https://helium.srizan.dev';
    mainWindow.loadURL(prodUrl);
  }

  mainWindow.on('close', (event) => {
    if (!isStreamingActive || !mainWindow) return;

    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      title: streamingClosePrompt.title,
      message: streamingClosePrompt.message,
      buttons: [streamingClosePrompt.cancelLabel, streamingClosePrompt.confirmLabel],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });

    if (choice === 0) {
      event.preventDefault();
      return;
    }

    isStreamingActive = false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    setupAutoUpdater();
  });
}

function setupDisplayMediaHandler(): void {
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: !isWayland,
      });

      if (sources.length === 0) {
        console.error('[Helium] No desktop sources available');
        callback({});
        return;
      }

      let selectedSource: DesktopCapturerSource;
      
      if (isWayland) {
        selectedSource = sources[0];
        console.log('[Helium] Wayland PipeWire source:', selectedSource.name);
      } else {
        const screenSources = sources.filter(s => s.id.startsWith('screen:'));
        selectedSource = screenSources[0] || sources[0];
        console.log('[Helium] Auto-selected source:', selectedSource.name);
      }

      const callbackOptions: {
        video: DesktopCapturerSource;
        audio?: 'loopback' | 'loopbackWithMute';
      } = {
        video: selectedSource,
      };

      if (isWindows || isMac || isLinux) {
        callbackOptions.audio = 'loopback';
        console.log('[Helium] Enabling loopback audio capture');
      }

      callback(callbackOptions);
    } catch (error) {
      console.error('[Helium] Display media handler error:', error);
      callback({});
    }
  }, { useSystemPicker: false });
}

ipcMain.handle('helium:get-platform', () => {
  return {
    platform: process.platform,
    isLinux,
    isMac,
    isWindows,
    isWayland,
    isElectron: true,
    supportsLoopbackAudio: isWindows || isMac || isLinux,
    supportsVenmic: isLinux && (venmicManager?.isAvailable() ?? false),
  };
});

ipcMain.handle('helium:get-sources', async () => {
  if (isWayland) {
    console.log('[Helium] Skipping getSources on Wayland');
    return [];
  }

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      appIcon: source.appIcon?.toDataURL() || null,
      display_id: source.display_id,
    }));
  } catch (error) {
    console.error('[Helium] Failed to get sources:', error);
    return [];
  }
});

ipcMain.handle('helium:venmic-available', () => {
  return venmicManager?.isAvailable() ?? false;
});

ipcMain.handle('helium:venmic-list', async () => {
  if (!venmicManager) return [];
  return venmicManager.listSources();
});

ipcMain.handle('helium:venmic-link', async (_event: IpcMainInvokeEvent, options: VenmicLinkOptions) => {
  if (!venmicManager) return false;
  return venmicManager.link(options);
});

ipcMain.handle('helium:venmic-unlink', async () => {
  if (!venmicManager) return false;
  return venmicManager.unlink();
});

ipcMain.handle('helium:check-screen-permission', () => {
  if (isMac) {
    return systemPreferences.getMediaAccessStatus('screen');
  }
  return 'granted';
});

ipcMain.handle('helium:open-screen-permission-settings', async () => {
  if (!isMac) {
    return false;
  }

  try {
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
    return true;
  } catch (error) {
    console.error('[Helium] Failed to open macOS screen recording settings:', error);
    return false;
  }
});

ipcMain.handle(
  'helium:set-streaming-active',
  (_event: IpcMainInvokeEvent, active: boolean, promptOptions?: typeof streamingClosePrompt) => {
    isStreamingActive = active;

    if (promptOptions) {
      streamingClosePrompt = promptOptions;
    }

    return true;
  },
);

ipcMain.handle('helium:check-for-updates', async () => {
  if (isDev || !app.isPackaged) return false;

  try {
    await getAutoUpdater().checkForUpdatesAndNotify();
    return true;
  } catch (error) {
    console.error('[Helium] Manual update check failed:', error);
    return false;
  }
});

ipcMain.handle('helium:install-update', () => {
  if (isDev || !app.isPackaged) return false;

  isStreamingActive = false;
  getAutoUpdater().quitAndInstall(false, true);
  return true;
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (venmicManager) {
    venmicManager.unlink();
  }

  if (!isMac) {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (venmicManager) {
    venmicManager.unlink();
  }
});

if (isDev) {
  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}
