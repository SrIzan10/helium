interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface Preset {
  id: string;
  name: string;
  createdBy: string;
  iceServers: string | IceServer[]; // Database returns string, we transform to IceServer[]
  shareable: boolean;
  createdAt: string;
}

export interface PresetAuthor {
  id: string;
  fullName: string | null;
  profileImageUrl: string | null;
  username: string | null;
}

export interface PresetShareResponse {
  success: boolean;
  data: Preset;
  author: PresetAuthor;
}
