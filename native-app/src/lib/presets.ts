import { getHeliumBaseUrl } from "./signaling";
import type {
  NativeIceServer,
  PresetResponse,
  PresetsResponse,
  PresetUser,
} from "../types/presets";

interface ApiErrorResponse {
  statusCode?: number;
  message?: string;
}

async function fetchWithAuth<T>(
  path: string,
  token: string,
): Promise<T> {
  const response = await fetch(`${getHeliumBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    const message = body.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function getPresets(token: string): Promise<PresetUser[]> {
  const payload = await fetchWithAuth<PresetsResponse>("/api/presets", token);
  return payload.data ?? [];
}

export async function getPresetIceServers(
  token: string,
  presetId: string,
): Promise<NativeIceServer[]> {
  const payload = await fetchWithAuth<PresetResponse>(
    `/api/presets/${presetId}`,
    token,
  );
  const rawServers = payload.data?.iceServers;

  if (typeof rawServers === "string") {
    return JSON.parse(rawServers) as NativeIceServer[];
  }

  return rawServers ?? [];
}
