import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from './auth.token';

let socket: Socket | null = null;

function socketUrl(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) return explicit.replace(/\/api\/?$/, '');
  return window.location.origin;
}

export function connectLocationRealtime(onRefresh: () => void): () => void {
  const token = getAuthToken();
  if (!token) return () => undefined;

  socket?.disconnect();
  socket = io(socketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  socket.on('location:nearby:update', onRefresh);
  return () => {
    socket?.off('location:nearby:update', onRefresh);
    socket?.disconnect();
    socket = null;
  };
}
