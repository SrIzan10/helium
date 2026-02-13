import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";

import { getSignalingUrl } from "../lib/signaling";
import type {
  IncomingSignalingMessage,
  NativeIceServer,
  NativeSessionDescriptionInit,
} from "../types/signaling";

interface PeerConnectionHandlers {
  onicecandidate:
    | ((event: { candidate: RTCIceCandidate | null }) => void)
    | null;
  onconnectionstatechange: (() => void) | null;
}

interface UseHeliumStreamerResult {
  status: string;
  roomCode: string;
  streamUrl: string | null;
  viewerCount: number;
  isSharing: boolean;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
}

export function useHeliumStreamer(
  iceServers: NativeIceServer[],
): UseHeliumStreamerResult {
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});

  const [status, setStatus] = useState<string>("idle");
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
    setStatus("stopped");
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
        peer.addTrack(track, localStream);
      });

      peerWithHandlers.onicecandidate = (event): void => {
        if (!event.candidate) {
          return;
        }

        sendMessage({
          event: "ice-candidate",
          targetId: viewerId,
          candidate: event.candidate,
        });
      };

      peerWithHandlers.onconnectionstatechange = (): void => {
        setStatus(`viewer ${viewerId}: ${peer.connectionState}`);
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
        setStatus(`room code: ${message.roomId}`);
        return;
      }

      if (message.event === "viewer-joined") {
        setStatus(`viewer joined: ${message.viewerId}`);
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
        setStatus(`error: ${message.message}`);
      }
    },
    [handleViewerJoined],
  );

  const startSharing = useCallback(async (): Promise<void> => {
    stopSharing();

    if (!iceServers.length) {
      setStatus("no preset selected");
      return;
    }

    setStatus("requesting screen capture");
    const stream = await mediaDevices.getDisplayMedia();
    streamRef.current = stream;
    setStreamUrl(stream.toURL());
    setIsSharing(true);

    stream.getTracks().forEach((track) => {
      const streamTrack = track as unknown as MediaStreamTrack & {
        onended: (() => void) | null;
      };
      streamTrack.onended = () => {
        stopSharing();
      };
    });

    setStatus("connecting signaling");

    const ws = new WebSocket(getSignalingUrl());
    wsRef.current = ws;

    ws.onopen = (): void => {
      setStatus("creating room");
      sendMessage({ event: "create-room" });

      heartbeatRef.current = setInterval(() => {
        sendMessage({ event: "ping" });
      }, 15000);
    };

    ws.onmessage = (message): void => {
      void handleIncomingMessage(message);
    };

    ws.onerror = (): void => {
      setStatus("websocket error");
    };

    ws.onclose = (): void => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (isSharing) {
        setStatus("websocket closed");
      }
    };
  }, [handleIncomingMessage, iceServers, isSharing, sendMessage, stopSharing]);

  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, [stopSharing]);

  return {
    status,
    roomCode,
    streamUrl,
    viewerCount,
    isSharing,
    startSharing,
    stopSharing,
  };
}
