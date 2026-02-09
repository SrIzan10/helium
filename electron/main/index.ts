import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  session,
  systemPreferences,
  type IpcMainInvokeEvent,
  type DesktopCapturerSource,
} from 'electron';
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

console.log('[Helium] Platform:', process.platform);
console.log('[Helium] Wayland:', isWayland);
console.log('[Helium] XDG_SESSION_TYPE:', process.env.XDG_SESSION_TYPE);

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
  });

  setupDisplayMediaHandler();

  if (isDev) {
    mainWindow.loadURL(NUXT_DEV_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const prodUrl = process.env.HELIUM_URL || 'http://localhost:3000';
    mainWindow.loadURL(prodUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
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
    supportsLoopbackAudio: isWindows || isMac,
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
