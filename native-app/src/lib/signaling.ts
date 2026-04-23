const DEFAULT_BASE_URL = "https://helium.srizan.dev";

export function getHeliumBaseUrl(): string {
  return process.env.EXPO_PUBLIC_HELIUM_BASE_URL ?? DEFAULT_BASE_URL;
}

export function getSignalingUrl(baseUrl: string = getHeliumBaseUrl()): string {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/signaling";
  url.search = "";
  url.hash = "";
  return url.toString();
}
