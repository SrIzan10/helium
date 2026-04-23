export interface Preset {
  id: string;
  name: string;
  createdBy: string;
  iceServers: string | NativeIceServer[];
  shareable: boolean;
  createdAt: string;
}

export interface NativeIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface PresetUser {
  id: string;
  presetId: string;
  userId: string;
  isDefault: boolean;
  addedAt: string;
  preset: Preset;
}

export interface PresetsResponse {
  success: boolean;
  data: PresetUser[];
}

export interface PresetResponse {
  success: boolean;
  data: Preset;
}
