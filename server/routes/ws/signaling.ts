// thanks nitropack smh
type Peer = Parameters<NonNullable<Parameters<typeof defineWebSocketHandler>[0]['message']>>[0];

const rooms: Record<string, { broadcaster: Peer, viewers: Peer[] }> = {};

export default defineWebSocketHandler({
  message(peer, message) {
    // TODO: proper typing
    //if (message.text() === 'ping') return;
    const msg = message.json() as any;
    console.log("[ws] message", peer.id, msg);

    if (msg.event === 'create-room') {
      const roomId = generateRoomId();
      rooms[roomId] = { broadcaster: peer, viewers: [] };
      peer.send(JSON.stringify({ event: 'room-created', roomId }));
    }
    if (msg.event === 'join-room') {
      const room = rooms[msg.roomId];
      if (room) {
        room.viewers.push(peer);
        room.broadcaster.send(JSON.stringify({ event: 'viewer-joined', viewerId: peer.id }));
      } else {
        peer.send(JSON.stringify({ event: 'error', message: 'Room not found' }));
      }
    }
    if (msg.event === 'offer') {
      const viewerSocket = findSocketById(msg.targetId);
      if (viewerSocket) {
        viewerSocket.send(JSON.stringify({
          event: 'offer',
          sdp: msg.sdp,
          senderId: peer.id,
        }));
      }
    }
    if (msg.event === 'answer') {
      const broadcasterSocket = findSocketById(msg.targetId)
      if (broadcasterSocket) {
        broadcasterSocket.send({
          event: 'answer',
          sdp: msg.sdp,
          from: peer.id,
        })
      }
    }
    if (msg.event === 'ice-candidate') {
      const targetSocket = findSocketById(msg.targetId);
      if (targetSocket) {
        targetSocket.send(JSON.stringify({
          event: 'ice-candidate',
          candidate: msg.candidate,
          from: peer.id,
        }));
      }
    }
  },

  close(peer, event) {
    console.log("[ws] close", peer.id, event);
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.broadcaster.id === peer.id) {
        // broadcaster disconnected, close room
        room.viewers.forEach(viewer => {
          viewer.send(JSON.stringify({ event: 'room-closed' }));
        });
        delete rooms[roomId];
      } else {
        const viewerIndex = room.viewers.findIndex(v => v.id === peer.id);
        if (viewerIndex !== -1) {
          room.viewers.splice(viewerIndex, 1);
          room.broadcaster.send(JSON.stringify({ event: 'viewer-left', viewerId: peer.id }));
        }
      }
    }
  },
});

function generateRoomId(): string {
  return Math.random().toString().slice(2, 8);
}

function findSocketById(id: string): Peer | null {
  for (const room of Object.values(rooms)) {
    if (room.broadcaster.id === id) return room.broadcaster;
    const viewer = room.viewers.find(v => v.id === id);
    if (viewer) return viewer;
  }
  return null;
}
