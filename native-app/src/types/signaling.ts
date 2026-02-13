export interface NativeSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp: string;
}

export interface NativeIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface NativeIceCandidateInit {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface SignalingOfferEvent {
  event: "offer";
  sdp: NativeSessionDescriptionInit;
  senderId: string;
  iceServers?: NativeIceServer[];
}

export interface SignalingIceCandidateEvent {
  event: "ice-candidate";
  from: string;
  candidate: NativeIceCandidateInit;
}

export interface SignalingViewerJoinedEvent {
  event: "viewer-joined";
  viewerId: string;
}

export interface SignalingAnswerEvent {
  event: "answer";
  from: string;
  sdp: NativeSessionDescriptionInit;
}

export interface SignalingViewerLeftEvent {
  event: "viewer-left";
  viewerId: string;
}

export interface SignalingRoomCreatedEvent {
  event: "room-created";
  roomId: string;
}

export interface SignalingJoinedEvent {
  event: "joined";
  roomId: string;
}

export interface SignalingErrorEvent {
  event: "error";
  message: string;
}

export interface SignalingRoomClosedEvent {
  event: "room-closed";
}

export type IncomingSignalingMessage =
  | SignalingOfferEvent
  | SignalingIceCandidateEvent
  | SignalingJoinedEvent
  | SignalingErrorEvent
  | SignalingRoomClosedEvent
  | SignalingViewerJoinedEvent
  | SignalingViewerLeftEvent
  | SignalingRoomCreatedEvent
  | SignalingAnswerEvent
  | { event: "pong" };
