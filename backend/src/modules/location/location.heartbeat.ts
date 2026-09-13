import { and, eq, gte, lte } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { emitToUser } from '../../infrastructure/websocket';

const RADIUS_KM = 50;

function box(lat: number, lon: number) {
  const dLat = RADIUS_KM / 111;
  const dLon = RADIUS_KM / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLon: lon - dLon, maxLon: lon + dLon };
}

export async function updateLocationHeartbeat(userId: string, latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('INVALID_COORDINATES');
  }

  await db.update(schema.users).set({ latitude, longitude, locationSharingEnabled: true, locationUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(schema.users.id, userId));

  const { minLat, maxLat, minLon, maxLon } = box(latitude, longitude);
  const recipients = await db.select({ id: schema.users.id }).from(schema.users).where(and(
    eq(schema.users.profileCompleted, true),
    eq(schema.users.locationSharingEnabled, true),
    gte(schema.users.latitude, minLat), lte(schema.users.latitude, maxLat),
    gte(schema.users.longitude, minLon), lte(schema.users.longitude, maxLon),
  )).limit(300);

  for (const recipient of recipients) {
    if (recipient.id !== userId) emitToUser(recipient.id, 'location:nearby:update', { userId, action: 'refresh' });
  }

  return { success: true, updatedAt: new Date().toISOString() };
}
