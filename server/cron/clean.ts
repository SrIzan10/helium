import { defineCronHandler } from '#nuxt/cron'
import Redis from 'ioredis';

const IS_DEV = process.env.NODE_ENV === 'development';

export default defineCronHandler(() => '*/5 * * * * *', async () => {
  const client = new Redis(process.env.REDIS_URL!);

  const activePeers = await client.hgetall('peers');
  const now = Date.now();
  const inactivePeerIds: string[] = [];

  // ident inactive peers
  for (const [peerId, timestamp] of Object.entries(activePeers)) {
    if (now - parseInt(timestamp) > 30000) {
      inactivePeerIds.push(peerId);
    }
  }

  if (inactivePeerIds.length === 0) {
    await client.quit();
    return;
  }

  IS_DEV && console.log('[cron] cleaning up inactive peers:', inactivePeerIds);

  // delete rooms where broadcaster inactive
  const roomKeys = await client.keys('room:*');
  for (const key of roomKeys) {
    const roomData = await client.get(key);
    if (!roomData) continue;
    
    const room = JSON.parse(roomData);
    if (inactivePeerIds.includes(room.broadcaster)) {
      await client.del(key);
      IS_DEV && console.log(`[cron] deleted room ${key}`);
    }
  }

  // remove inactive peers
  await client.hdel('peers', ...inactivePeerIds);
  await client.quit();
})