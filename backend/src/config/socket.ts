import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './env.js';
import { logger } from './logger.js';

let io: Server;

/**
 * Initialise Socket.IO server attached to the Express HTTP server.
 * Room strategy:
 *   - hospital:{hospitalId}  — hospital-specific events
 *   - donor:{donorId}        — donor-specific events
 *   - request:{requestId}    — request-level events
 */
export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const { role, entityId } = socket.handshake.auth as {
      role?: string;
      entityId?: string;
    };

    if (role && entityId) {
      const room = `${role}:${entityId}`;
      void socket.join(room);
      logger.debug({ room, socketId: socket.id }, 'Socket joined room');
    }

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  logger.info('✅ Socket.IO initialised');
  return io;
}

/**
 * Emit an event to a specific hospital's room.
 */
export function emitToHospital(hospitalId: string, event: string, payload: unknown): void {
  io?.to(`hospital:${hospitalId}`).emit(event, payload);
}

/**
 * Emit an event to a specific donor's room.
 */
export function emitToDonor(donorId: string, event: string, payload: unknown): void {
  io?.to(`donor:${donorId}`).emit(event, payload);
}

/**
 * Emit an event to a specific request's room.
 */
export function emitToRequest(requestId: string, event: string, payload: unknown): void {
  io?.to(`request:${requestId}`).emit(event, payload);
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialised. Call initSocketIO() first.');
  }
  return io;
}
