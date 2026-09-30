import { io } from 'socket.io-client';

let socket = null;

/**
 * Get active socket instance or initialize connection
 */
export const getSocket = () => {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.hostname.includes('vercel.app')
        ? 'https://sanghini-ride-1.onrender.com'
        : window.location.origin);
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('sanghini_token') || localStorage.getItem('token')
        : null;

    socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected to server with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚡ Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Socket disconnected:', reason);
    });
  }

  return socket;
};

/**
 * Disconnect socket cleanly
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join active ride tracking room
 * @param {string} rideId
 */
export const joinRideRoom = (rideId) => {
  const s = getSocket();
  if (s && rideId) {
    s.emit('ride:join', { rideId });
  }
};

/**
 * Leave ride room
 * @param {string} rideId
 */
export const leaveRideRoom = (rideId) => {
  const s = getSocket();
  if (s && rideId) {
    s.emit('ride:leave', { rideId });
  }
};

/**
 * Driver emits live GPS location
 * @param {{ coordinates: [number, number], heading?: number, speed?: number, rideId?: string }} payload
 */
export const emitDriverLocation = (payload) => {
  const s = getSocket();
  if (s && payload.coordinates) {
    s.emit('driver:location_update', payload);
  }
};

/**
 * Driver updates online/offline status via socket
 * @param {boolean} isOnline
 */
export const emitDriverDuty = (isOnline) => {
  const s = getSocket();
  if (s) {
    s.emit('driver:duty_change', { isOnline });
  }
};

export default {
  getSocket,
  disconnectSocket,
  joinRideRoom,
  leaveRideRoom,
  emitDriverLocation,
  emitDriverDuty,
};
