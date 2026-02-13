import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";

import { getSignalingUrl } from "../lib/signaling";
import type { MessageKey } from "../i18n/messages";
import type {
  IncomingSignalingMessage,
  NativeIceServer,
  NativeIceCandidateInit,
  NativeSessionDescriptionInit,
} from "../types/signaling";

interface PeerConnectionHandlers {
  onicecandidate:
    | ((event: { candidate: RTCIceCandidate | null }) => void)
    | null;
  onconnectionstatechange: (() => void) | null;
}

interface UseHeliumStreamerResult {
  statusKey: MessageKey;
  statusParams?: Record<string, string | number>;
  roomCode: string;
  streamUrl: string | null;
  viewerCount: number;
  isSharing: boolean;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
}

async function applyLowLatencyEncoding(
  sender: ReturnType<RTCPeerConnection["addTrack"]>,
): Promise<void> {
  const parameters = sender.getParameters();

  if (!parameters.encodings || parameters.encodings.length === 0) {
    return;
  }

  parameters.degradationPreference = "maintain-framerate";

  const [firstEncoding] = parameters.encodings;
  firstEncoding.maxBitrate = 1_200_000;
  firstEncoding.maxFramerate = 24;
  firstEncoding.scaleResolutionDownBy = 2;

  await sender.setParameters(parameters);
}

function serializeIceCandidate(candidate: RTCIceCandidate): NativeIceCandidateInit {
  const raw = candidate as unknown as {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    toJSON?: () => NativeIceCandidateInit;
  };

  if (typeof raw.toJSON === "function") {
    return raw.toJSON();
  }

  return {
    candidate: raw.candidate ?? "",
    sdpMid: raw.sdpMid ?? null,
    sdpMLineIndex: raw.sdpMLineIndex ?? null,
  };
}

export function useHeliumStreamer(
  iceServers: NativeIceServer[],
): UseHeliumStreamerResult {
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  const [statusKey, setStatusKey] = useState<MessageKey>("statusIdle");
  const [statusParams, setStatusParams] = useState<
    Record<string, string | number> | undefined
  >(undefined);
  const [roomCode, setRoomCode] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const sendMessage = useCallback((payload: object): void => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(JSON.stringify(payload));
  }, []);

  const closeAllPeers = useCallback((): void => {
    Object.values(peersRef.current).forEach((peer) => {
      peer.close();
    });
    peersRef.current = {};
    setViewerCount(0);
  }, []);

  const stopSharing = useCallback((): void => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    closeAllPeers();

    const ws = wsRef.current;
    if (ws) {
      ws.close();
      wsRef.current = null;
    }

    const localStream = streamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    setRoomCode("");
    setStreamUrl(null);
    setIsSharing(false);
    setStatusKey("statusStopped");
    setStatusParams(undefined);
  }, [closeAllPeers]);

  const handleViewerJoined = useCallback(
    async (viewerId: string): Promise<void> => {
      const localStream = streamRef.current;
      if (!localStream) {
        return;
      }

      const peer = new RTCPeerConnection({
        iceServers,
      });
      const peerWithHandlers = peer as RTCPeerConnection & PeerConnectionHandlers;
      peersRef.current[viewerId] = peer;
      setViewerCount(Object.keys(peersRef.current).length);

      localStream.getTracks().forEach((track) => {
        const sender = peer.addTrack(track, localStream);

        if (track.kind === "video") {
          void applyLowLatencyEncoding(sender);
        }
      });

      peerWithHandlers.onicecandidate = (event): void => {
        if (!event.candidate) {
          return;
        }

        const candidate = serializeIceCandidate(event.candidate);
        if (!candidate.candidate) {
          return;
        }

        sendMessage({
          event: "ice-candidate",
          targetId: viewerId,
          candidate,
        });
      };

      peerWithHandlers.onconnectionstatechange = (): void => {
        setStatusKey("statusPeerState");
        setStatusParams({ state: peer.connectionState });
      };

      const offer = (await peer.createOffer()) as NativeSessionDescriptionInit;
      await peer.setLocalDescription(offer);

      sendMessage({
        event: "offer",
        targetId: viewerId,
        sdp: offer,
        iceServers,
      });
    },
    [iceServers, sendMessage],
  );

  const handleIncomingMessage = useCallback(
    async (event: MessageEvent<string>): Promise<void> => {
      const message = JSON.parse(event.data) as IncomingSignalingMessage;

      if (message.event === "room-created") {
        setRoomCode(message.roomId);
        setStatusKey("statusRoomCreated");
        setStatusParams({ roomId: message.roomId });
        return;
      }

      if (message.event === "viewer-joined") {
        setStatusKey("statusViewerJoined");
        setStatusParams(undefined);
        await handleViewerJoined(message.viewerId);
        return;
      }

      if (message.event === "answer") {
        const peer = peersRef.current[message.from];
        if (!peer) {
          return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
        return;
      }

      if (message.event === "ice-candidate") {
        const peer = peersRef.current[message.from];
        if (!peer || !peer.remoteDescription) {
          return;
        }

        await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
        return;
      }

      if (message.event === "viewer-left") {
        const peer = peersRef.current[message.viewerId];
        if (peer) {
          peer.close();
          delete peersRef.current[message.viewerId];
          setViewerCount(Object.keys(peersRef.current).length);
        }
        return;
      }

      if (message.event === "error") {
        setStatusKey("statusError");
        setStatusParams({ message: message.message });
      }
    },
    [handleViewerJoined],
  );

  const startSharing = useCallback(async (): Promise<void> => {
    stopSharing();

    if (!iceServers.length) {
      setStatusKey("statusNoPreset");
      setStatusParams(undefined);
      return;
    }

    setStatusKey("statusRequestingCapture");
    setStatusParams(undefined);
    const stream = await (mediaDevices as unknown as {
      getDisplayMedia: (constraints?: {
        video?: boolean;
        audio?: boolean;
      }) => Promise<MediaStream>;
    }).getDisplayMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;
    setStreamUrl(stream.toURL());
    setIsSharing(true);

    const videoTrackCount = stream.getVideoTracks().length;
    const audioTrackCount = stream.getAudioTracks().length;

    if (!videoTrackCount) {
      setStatusKey("statusNoVideoTrack");
      setStatusParams(undefined);
      stopSharing();
      return;
    }

    setStatusKey("statusCapturing");
    setStatusParams({ video: videoTrackCount, audio: audioTrackCount });

    stream.getTracks().forEach((track) => {
      const streamTrack = track as unknown as MediaStreamTrack & {
        onended: (() => void) | null;
      };
      streamTrack.onended = () => {
        stopSharing();
      };
    });

    setStatusKey("statusConnectingSignaling");
    setStatusParams(undefined);

    const ws = new WebSocket(getSignalingUrl());
    wsRef.current = ws;

    ws.onopen = (): void => {
      setStatusKey("statusCreatingRoom");
      setStatusParams(undefined);
      sendMessage({ event: "create-room" });

      heartbeatRef.current = setInterval(() => {
        sendMessage({ event: "ping" });
      }, 15000);
    };

    ws.onmessage = (message): void => {
      void handleIncomingMessage(message);
    };

    ws.onerror = (): void => {
      setStatusKey("statusWebsocketError");
      setStatusParams(undefined);
    };

    ws.onclose = (): void => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (isSharing) {
        setStatusKey("statusWebsocketClosed");
        setStatusParams(undefined);
      }
    };
  }, [handleIncomingMessage, iceServers, isSharing, sendMessage, stopSharing]);

  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, [stopSharing]);

  return {
    statusKey,
    statusParams,
    roomCode,
    streamUrl,
    viewerCount,
    isSharing,
    startSharing,
    stopSharing,
  };
}
