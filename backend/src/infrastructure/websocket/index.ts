import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import { getSession } from '../../modules/auth/auth.service';
import { isConversationParticipant } from '../../modules/messages/conversation-access';

const PRESENCE_TTL = 120; // secondes (heartbeat 30s, 2min de latence max)

let io: Server | null = null;
let presenceClient: Redis | null = null;

const presenceKey = (userId: string) => `presence:${userId}`;
const roomOf = (conversationId: string) => `conversation:${conversationId}`;

export function getIO(): Server | null {
  return io;
}

export function presenceKeyFor(userId: string): string {
  return presenceKey(userId);
}

export function conversationRoom(conversationId: string): string {
  return roomOf(conversationId);
}

/**
 * Initialise socket.io avec l'adaptateur Redis (multi-instance).
 * Authentifie chaque socket via le token de session (cookie ou Bearer).
 */
export function initSocketServer(httpServer: HttpServer, redisClient: Redis): Server {
  const pubClient = redisClient.duplicate();
  const subClient = pubClient.duplicate();
  presenceClient = pubClient;

  io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
    adapter: createAdapter(pubClient, subClient),
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ?? socket.handshake.headers.authorization?.replace(/^Bearer /, '');
      if (!token) return next(new Error('UNAUTHORIZED'));
      const session = await getSession(String(token));
      if (!session) return next(new Error('UNAUTHORIZED'));
      if (session.user.bannedAt) return next(new Error('ACCOUNT_BANNED'));
      socket.data.userId = session.user.id;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', async (socket) => {
    const userId: string = socket.data.userId;
    // Conversations dont l'appartenance du socket a déjà été prouvée en base
    const allowedConversations = new Set<string>();

    const ensureParticipant = async (conversationId: string): Promise<boolean> => {
      if (allowedConversations.has(conversationId)) return true;
      if (!(await isConversationParticipant(conversationId, userId))) return false;
      allowedConversations.add(conversationId);
      return true;
    };

    // Room personnelle : permet d'envoyer des events ciblés (notifications, love, messages)
    socket.join(`user:${userId}`);

    await markOnline(userId);
    io?.emit('presence:online', { userId });

    // Heartbeat : rafraîchit la présence toutes les 30s
    const heartbeat = setInterval(() => {
      void markOnline(userId);
    }, 30_000);

    socket.on('join:conversation', async (rawConversationId: string) => {
      const conversationId = String(rawConversationId);
      if (!conversationId || !(await ensureParticipant(conversationId))) return;
      socket.join(roomOf(conversationId));
    });

    socket.on('leave:conversation', (rawConversationId: string) => {
      const conversationId = String(rawConversationId);
      allowedConversations.delete(conversationId);
      socket.leave(roomOf(conversationId));
    });

    socket.on('typing:start', async (rawConversationId: string) => {
      const conversationId = String(rawConversationId);
      if (!(await ensureParticipant(conversationId))) return;
      socket.to(roomOf(conversationId)).emit('typing:start', { conversationId, userId });
    });

    socket.on('typing:stop', async (rawConversationId: string) => {
      const conversationId = String(rawConversationId);
      if (!(await ensureParticipant(conversationId))) return;
      socket.to(roomOf(conversationId)).emit('typing:stop', { conversationId, userId });
    });

    socket.on('message:read', async (rawConversationId: string, messageId: string) => {
      const conversationId = String(rawConversationId);
      if (!(await ensureParticipant(conversationId))) return;
      socket
        .to(roomOf(conversationId))
        .emit('message:read', { conversationId, messageId: String(messageId), userId });
    });

    socket.on('disconnect', async () => {
      clearInterval(heartbeat);
      await markOffline(userId);
      io?.emit('presence:offline', { userId });
    });
  });

  logger.info('socket.io prêt (adaptateur Redis)');
  return io;
}

/** Marque un utilisateur online (Redis SET TTL 2min). */
async function markOnline(userId: string): Promise<void> {
  await presenceClient?.set(presenceKey(userId), 'online', 'EX', PRESENCE_TTL);
}

/** Marque offline + met à jour last_seen. */
async function markOffline(userId: string): Promise<void> {
  await presenceClient?.del(presenceKey(userId));
}

/** Émet un événement à un utilisateur précis (tous ses sockets). */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

/** Vérifie si un utilisateur est en ligne. */
export async function isOnline(userId: string): Promise<boolean> {
  const value = await presenceClient?.get(presenceKey(userId));
  return value === 'online';
}
