import Redis from "ioredis";

// thanks nitropack smh
type Peer = Parameters<NonNullable<Parameters<typeof defineWebSocketHandler>[0]['message']>>[0];

const client = new Redis(process.env.REDIS_URL!);
const activePeers = new Map<string, Peer>();

async function getRoom(roomId: string) {
  const data = await client.get(`room:${roomId}`);
  return data ? JSON.parse(data) : null;
}

async function saveRoom(roomId: string, data: { broadcaster: string, viewers: string[] }) {
  await client.set(`room:${roomId}`, JSON.stringify(data));
}

async function deleteRoom(roomId: string) {
  await client.del(`room:${roomId}`);
}

async function getAllRoomIds() {
  return await client.keys('room:*');
}

export default defineWebSocketHandler({
  async open(peer) {
    activePeers.set(peer.id, peer);
    await client.hset('peers', peer.id, Date.now().toString());
    console.log('[ws] peer connected', peer.id);
  },

  async message(peer, message) {
    await client.hset('peers', peer.id, Date.now().toString());
    
    // TODO: proper typing
    const msg = message.json() as any;
    console.log("[ws] message", peer.id, msg);

    if (msg.event === 'ping') {
      peer.send(JSON.stringify({ event: 'pong' }));
      return;
    }
    if (msg.event === 'create-room') {
      const roomId = generateRoomId();
      await saveRoom(roomId, { broadcaster: peer.id, viewers: [] });
      peer.send(JSON.stringify({ event: 'room-created', roomId }));
    }
    if (msg.event === 'join-room') {
      const room = await getRoom(msg.roomId);
      if (room) {
        room.viewers.push(peer.id);
        await saveRoom(msg.roomId, room);
        peer.send(JSON.stringify({ event: 'joined', roomId: msg.roomId }));
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
    await client.hdel('peers', peer.id);
    
    const roomKeys = await getAllRoomIds();
    for (const key of roomKeys) {
      const roomId = key.replace('room:', '');
      const room = await getRoom(roomId);
      
      if (!room) continue;

      if (room.broadcaster === peer.id) {
        // broadcaster disconnected, close room
        room.viewers.forEach((viewerId: string) => {
          const viewer = activePeers.get(viewerId);
          if (viewer) {
            viewer.send(JSON.stringify({ event: 'room-closed' }));
          }
        });
        await deleteRoom(roomId);
      } else {
        const viewerIndex = room.viewers.indexOf(peer.id);
        if (viewerIndex !== -1) {
          room.viewers.splice(viewerIndex, 1);
          await saveRoom(roomId, room);
          const broadcasterPeer = activePeers.get(room.broadcaster);
          if (broadcasterPeer) {
            broadcasterPeer.send(JSON.stringify({ event: 'viewer-left', viewerId: peer.id }));
          }
        }
      }
    }
  },
});

function generateRoomId(): string {
  return Math.random().toString().slice(2, 8);
}
