// thanks nitropack smh
type Peer = Parameters<NonNullable<Parameters<typeof defineWebSocketHandler>[0]['message']>>[0];

// Store peer instances in memory (these can't be serialized to storage)
const activePeers = new Map<string, Peer>();

async function getRooms() {
  return await useStorage('rooms').getItem<Record<string, { broadcaster: string, viewers: string[] }>>('data') || {};
}

async function saveRooms(rooms: Record<string, { broadcaster: string, viewers: string[] }>) {
  await useStorage('rooms').setItem('data', rooms);
}

export default defineWebSocketHandler({
  async open(peer) {
    activePeers.set(peer.id, peer);
  },

  async message(peer, message) {
    // TODO: proper typing
    const msg = message.json() as any;
    console.log("[ws] message", peer.id, msg);
    const rooms = await getRooms();

    if (msg.event === 'create-room') {
      const roomId = generateRoomId();
      rooms[roomId] = { broadcaster: peer.id, viewers: [] };
      await saveRooms(rooms);
      peer.send(JSON.stringify({ event: 'room-created', roomId }));
    }
    if (msg.event === 'join-room') {
      const room = rooms[msg.roomId];
      if (room) {
        room.viewers.push(peer.id);
        await saveRooms(rooms);
        const broadcasterPeer = activePeers.get(room.broadcaster);
        if (broadcasterPeer) {
          broadcasterPeer.send(JSON.stringify({ event: 'viewer-joined', viewerId: peer.id }));
        }
      } else {
        peer.send(JSON.stringify({ event: 'error', message: 'Room not found' }));
      }
    }
    if (msg.event === 'offer') {
      const viewerSocket = activePeers.get(msg.targetId);
      if (viewerSocket) {
        viewerSocket.send(JSON.stringify({
          event: 'offer',
          sdp: msg.sdp,
          senderId: peer.id,
        }));
      }
    }
    if (msg.event === 'answer') {
      const broadcasterSocket = activePeers.get(msg.targetId);
      if (broadcasterSocket) {
        broadcasterSocket.send(JSON.stringify({
          event: 'answer',
          sdp: msg.sdp,
          from: peer.id,
        }));
      }
    }
    if (msg.event === 'ice-candidate') {
      const targetSocket = activePeers.get(msg.targetId);
      if (targetSocket) {
        targetSocket.send(JSON.stringify({
          event: 'ice-candidate',
          candidate: msg.candidate,
          from: peer.id,
        }));
      }
    }
  },

  async close(peer, event) {
    console.log("[ws] close", peer.id, event);
    activePeers.delete(peer.id);
    const rooms = await getRooms();
    
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.broadcaster === peer.id) {
        // broadcaster disconnected, close room
        room.viewers.forEach(viewerId => {
          const viewer = activePeers.get(viewerId);
          if (viewer) {
            viewer.send(JSON.stringify({ event: 'room-closed' }));
          }
        });
        delete rooms[roomId];
      } else {
        const viewerIndex = room.viewers.indexOf(peer.id);
        if (viewerIndex !== -1) {
          room.viewers.splice(viewerIndex, 1);
          const broadcasterPeer = activePeers.get(room.broadcaster);
          if (broadcasterPeer) {
            broadcasterPeer.send(JSON.stringify({ event: 'viewer-left', viewerId: peer.id }));
          }
        }
      }
    }
    await saveRooms(rooms);
  },
});

function generateRoomId(): string {
  return Math.random().toString().slice(2, 8);
}
