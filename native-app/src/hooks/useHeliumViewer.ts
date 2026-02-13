import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";

import { getSignalingUrl } from "../lib/signaling";
import type {
  IncomingSignalingMessage,
  SignalingOfferEvent,
} from "../types/signaling";

interface UseHeliumViewerResult {
  status: string;
  streamUrl: string | null;
  connect: (roomId: string) => void;
  disconnect: () => void;
  isConnected: boolean;
}

interface PeerConnectionHandlers {
  ontrack: ((event: { streams?: MediaStream[] }) => void) | null;
  onicecandidate:
    | ((event: { candidate: RTCIceCandidate | null }) => void)
    | null;
  onconnectionstatechange: (() => void) | null;
}

export function useHeliumViewer(): UseHeliumViewerResult {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const targetPeerIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<string>("idle");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const sendMessage = useCallback((payload: object): void => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(JSON.stringify(payload));
  }, []);

  const cleanupPeerConnection = useCallback((): void => {
    const pc = pcRef.current;
    if (pc) {
      pc.close();
      pcRef.current = null;
    }
    targetPeerIdRef.current = null;
    setIsConnected(false);
  }, []);

  const disconnect = useCallback((): void => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    cleanupPeerConnection();
    setStreamUrl(null);

    const ws = wsRef.current;
    if (ws) {
      ws.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
  }, [cleanupPeerConnection]);

  const handleOffer = useCallback(
    async (message: SignalingOfferEvent): Promise<void> => {
      setStatus("received offer");

      cleanupPeerConnection();
      targetPeerIdRef.current = message.senderId;

      const pc = new RTCPeerConnection({
        iceServers: message.iceServers ?? [],
      });
      const pcWithHandlers = pc as RTCPeerConnection & PeerConnectionHandlers;
      pcRef.current = pc;

      pcWithHandlers.ontrack = (event): void => {
        const stream = event.streams?.[0] as MediaStream | undefined;
        if (!stream) {
          return;
        }

        setStreamUrl(stream.toURL());
      };

      pcWithHandlers.onicecandidate = (event): void => {
        if (!event.candidate || !targetPeerIdRef.current) {
          return;
        }

        sendMessage({
          event: "ice-candidate",
          targetId: targetPeerIdRef.current,
          candidate: event.candidate,
        });
      };

      pcWithHandlers.onconnectionstatechange = (): void => {
        setStatus(`peer: ${pc.connectionState}`);
        if (pc.connectionState === "connected") {
          setIsConnected(true);
        }
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          setIsConnected(false);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendMessage({
        event: "answer",
        targetId: message.senderId,
        sdp: answer,
      });

      setStatus("sent answer");
    },
    [cleanupPeerConnection, sendMessage],
  );

  const handleIncomingMessage = useCallback(
    async (event: MessageEvent<string>): Promise<void> => {
      const message = JSON.parse(event.data) as IncomingSignalingMessage;

      if (message.event === "joined") {
        setStatus(`joined room ${message.roomId}`);
        return;
      }

      if (message.event === "offer") {
        await handleOffer(message);
        return;
      }

      if (message.event === "ice-candidate") {
        const pc = pcRef.current;
        if (!pc || !pc.remoteDescription) {
          return;
        }

        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        return;
      }

      if (message.event === "room-closed") {
        disconnect();
        setStatus("room closed by host");
        return;
      }

      if (message.event === "error") {
        setStatus(`error: ${message.message}`);
      }
    },
    [disconnect, handleOffer],
  );

  const connect = useCallback(
    (roomId: string): void => {
      disconnect();

      setStatus("connecting websocket");
      const ws = new WebSocket(getSignalingUrl());
      wsRef.current = ws;

      ws.onopen = (): void => {
        setStatus("websocket connected");
        sendMessage({ event: "join-room", roomId });

        heartbeatRef.current = setInterval(() => {
          sendMessage({ event: "ping" });
        }, 15000);
      };

      ws.onmessage = (event): void => {
        void handleIncomingMessage(event);
      };

      ws.onerror = (): void => {
        setStatus("websocket error");
      };

      ws.onclose = (): void => {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        setStatus("websocket closed");
        setIsConnected(false);
      };
    },
    [disconnect, handleIncomingMessage, sendMessage],
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    streamUrl,
    connect,
    disconnect,
    isConnected,
  };
}
