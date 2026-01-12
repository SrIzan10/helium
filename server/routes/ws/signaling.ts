import { db } from '~/lib/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '~/lib/db/schema';

// thanks nitropack smh
type Peer = Parameters<NonNullable<Parameters<typeof defineWebSocketHandler>[0]['message']>>[0];

async function addPeer(peerId: string) {
  await db.insert(schema.peers).values({ id: peerId }).onConflictDoUpdate({
    target: schema.peers.id,
    set: { lastSeen: new Date() },
  });
}

async function removePeer(peerId: string) {
  await db.delete(schema.peers).where(eq(schema.peers.id, peerId));
}

async function updatePeerLastSeen(peerId: string) {
  await db
    .update(schema.peers)
    .set({ lastSeen: new Date() })
    .where(eq(schema.peers.id, peerId));
}

async function createRoom(roomId: string, broadcasterId: string) {
  await db.insert(schema.rooms).values({
    id: roomId,
    broadcaster: broadcasterId,
  });
}

async function getRoom(roomId: string) {
  const room = await db.query.rooms.findFirst({
    where: eq(schema.rooms.id, roomId),
    with: {
      viewers: {
        columns: { viewerId: true },
      },
    },
  });

  if (!room) return null;

  return {
    id: room.id,
    broadcaster: room.broadcaster,
    // typescript is a classic
    viewers: ((room.viewers ?? []) as { viewerId: string }[]).map(v => v.viewerId),
  };
}

async function deleteRoom(roomId: string) {
  await db.delete(schema.rooms).where(eq(schema.rooms.id, roomId));
}

async function addViewerToRoom(roomId: string, viewerId: string) {
  await db.insert(schema.roomViewers).values({
    roomId,
    viewerId,
  });
}

async function removeViewerFromRoom(roomId: string, viewerId: string) {
  await db
    .delete(schema.roomViewers)
    .where(
      and(
        eq(schema.roomViewers.roomId, roomId),
        eq(schema.roomViewers.viewerId, viewerId)
      )
    );
}

async function getAllRoomIds() {
  const rooms = await db.query.rooms.findMany({
    columns: { id: true },
  });
  return rooms.map(r => r.id);
}

const activePeers = new Map<string, Peer>();

export default defineWebSocketHandler({
  async open(peer) {
    activePeers.set(peer.id, peer);
    await addPeer(peer.id);
    console.log('[ws] peer connected', peer.id);
  },

  async message(peer, message) {
    await updatePeerLastSeen(peer.id);
    
    // TODO: proper typing
    const msg = message.json() as any;
    console.log("[ws] message", peer.id, msg);

    if (msg.event === 'ping') {
      peer.send(JSON.stringify({ event: 'pong' }));
      return;
    }
    if (msg.event === 'create-room') {
      const roomId = generateRoomId();
      await createRoom(roomId, peer.id);
      peer.send(JSON.stringify({ event: 'room-created', roomId }));
    }
    if (msg.event === 'join-room') {
      const room = await getRoom(msg.roomId);
      if (room) {
        await addViewerToRoom(msg.roomId, peer.id);
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
          iceServers: msg.iceServers,
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
    await removePeer(peer.id);
    
    const roomIds = await getAllRoomIds();
    for (const roomId of roomIds) {
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
          await removeViewerFromRoom(roomId, peer.id);
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
