import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { RedisPubSubEvent } from '@bytearena/shared-types';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── Redis Setup ────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => console.log('Redis connected for Socket.IO adapter'))
  .catch((err) => {
    console.warn('Redis connection failed:', err.message);
  });

// ─── Socket.IO Server ──────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4028';
const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_change_this_in_production';

// ─── Auth Middleware ────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    socket.data.userId = decoded.id || decoded.sub;
    socket.data.role = decoded.role || 'USER';
    socket.data.email = decoded.email;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// ─── Redis PubSub for Admin Monitor Signals ─────────────────
const eventSub = pubClient.duplicate();
eventSub.connect().then(() => {
  eventSub.pSubscribe('contest:*:events', (message, channel) => {
    try {
      const event: RedisPubSubEvent = JSON.parse(message);
      if (event.type === 'STREAM_REQUEST') {
        io.to(`user:${event.userId}`).emit('stream-request', { token: event.liveKitToken });
      } else if (event.type === 'STREAM_STOP') {
        io.to(`user:${event.userId}`).emit('stream-stop');
      }
    } catch (e) {
      console.error('Failed to parse redis event', e);
    }
  });
}).catch((err) => {
  console.warn('Redis event subscriber failed to connect:', err.message);
});

// ─── Connection Handler ─────────────────────────────────────
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const role = socket.data.role;

  // Join user-specific room for targeted events
  socket.join(`user:${userId}`);
  console.log(`User ${userId} (${role}) connected. Socket: ${socket.id}`);

  // Admin joins admin room
  if (role === 'ADMIN') {
    socket.join('admin-room');
    console.log(`Admin ${userId} joined admin-room`);
  }

  // Join a contest room
  socket.on('join-contest', (contestId: string) => {
    socket.join(`contest:${contestId}`);
    console.log(`User ${userId} joined contest:${contestId}`);

    // Notify admins
    io.to('admin-room').emit('contestant:joined', {
      userId,
      contestId,
      timestamp: Date.now(),
    });
  });

  // Leave a contest room
  socket.on('leave-contest', (contestId: string) => {
    socket.leave(`contest:${contestId}`);
    console.log(`User ${userId} left contest:${contestId}`);

    io.to('admin-room').emit('contestant:left', {
      userId,
      contestId,
      timestamp: Date.now(),
    });
  });

  // Proctoring event from contestant
  socket.on('proctor:event', (data: { contestId: string; eventType: string; description: string; severity?: string }) => {
    io.to('admin-room').emit('proctor:alert', {
      userId,
      contestId: data.contestId,
      eventType: data.eventType,
      description: data.description,
      severity: data.severity || 'WARNING',
      timestamp: Date.now(),
    });
  });

  // Heartbeat tracking for presence
  socket.on('heartbeat', async () => {
    try {
      await pubClient.setEx(`presence:${userId}`, 30, JSON.stringify({
        online: true,
        lastSeen: Date.now(),
        socketId: socket.id,
      }));
    } catch (err) {
      // Redis may be unavailable, log silently
    }
  });

  // Admin requests a specific user's stream
  socket.on('admin:request-stream', async (data: { contestId: string; targetUserId: string }) => {
    if (role !== 'ADMIN') return;

    // Publish to Redis so the target user's socket receives the stream request
    try {
      await pubClient.publish(`contest:${data.contestId}:events`, JSON.stringify({
        type: 'STREAM_REQUEST',
        contestId: data.contestId,
        userId: data.targetUserId,
        adminId: userId,
        liveKitToken: `lk_token_${data.targetUserId}_${data.contestId}`, // Replace with real LiveKit token generation
      }));
    } catch (err) {
      console.error('Failed to publish stream request:', err);
    }
  });

  // Admin stops a specific user's stream
  socket.on('admin:stop-stream', async (data: { contestId: string; targetUserId: string }) => {
    if (role !== 'ADMIN') return;

    try {
      await pubClient.publish(`contest:${data.contestId}:events`, JSON.stringify({
        type: 'STREAM_STOP',
        contestId: data.contestId,
        userId: data.targetUserId,
        adminId: userId,
      }));
    } catch (err) {
      console.error('Failed to publish stream stop:', err);
    }
  });

  // Disconnect handler
  socket.on('disconnect', async () => {
    console.log(`User ${userId} disconnected.`);
    try {
      await pubClient.del(`presence:${userId}`);
    } catch (err) {
      // Redis may be unavailable
    }

    io.to('admin-room').emit('contestant:disconnected', {
      userId,
      timestamp: Date.now(),
    });
  });
});

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), connections: io.engine.clientsCount });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`\n🔌 ByteArena Realtime Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
