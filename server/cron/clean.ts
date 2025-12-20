import { defineCronHandler } from '#nuxt/cron'
import { db } from '../../app/lib/db';
import { lt, eq } from 'drizzle-orm';
import * as schema from '../../app/lib/db/schema';

const IS_DEV = process.env.NODE_ENV === 'development';

export default defineCronHandler(() => '*/5 * * * * *', async () => {
  const thirtySecondsAgo = new Date(Date.now() - 30000);

  // Find inactive peers (not seen in last 30 seconds)
  const inactivePeers = await db.query.peers.findMany({
    where: lt(schema.peers.lastSeen, thirtySecondsAgo),
    columns: { id: true },
  });

  if (inactivePeers.length === 0) {
    return;
  }

  const inactivePeerIds = inactivePeers.map((p: { id: string }) => p.id);
  IS_DEV && console.log('[cron] cleaning up inactive peers:', inactivePeerIds);

  // Delete inactive peers (cascade will automatically delete their rooms and viewer entries)
  for (const peerId of inactivePeerIds) {
    await db.delete(schema.peers).where(eq(schema.peers.id, peerId));
    IS_DEV && console.log(`[cron] deleted peer ${peerId}`);
  }
})