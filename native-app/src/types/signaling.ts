export interface NativeSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp: string;
}

export interface SignalingOfferEvent {
  event: "offer";
  sdp: NativeSessionDescriptionInit;
  senderId: string;
  iceServers?: RTCIceServer[];
}

export interface SignalingIceCandidateEvent {
  event: "ice-candidate";
  from: string;
  candidate: RTCIceCandidateInit;
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
  | { event: "pong" };
