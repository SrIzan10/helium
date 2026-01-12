import type { getPresetAuthorData } from "~/lib/utils/presetsDb";
// below types are ai generated
interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}
interface Preset {
  id: string;
  name: string;
  createdBy: string;
  iceServers: string | IceServer[]; // Database returns string, we transform to IceServer[]
  shareable: boolean;
  createdAt: string;
}
export interface PresetUser {
  id: string;
  presetId: string;
  userId: string;
  isDefault: boolean;
  addedAt: string;
  preset: Preset;
}

export interface ApiResponse {
  success: boolean;
  data: PresetUser[];
  author: Awaited<ReturnType<typeof getPresetAuthorData>>;
}
