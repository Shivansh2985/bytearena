// import express from 'express';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import { createAdapter } from '@socket.io/redis-adapter';
// import { createClient } from 'redis';
// import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// import { RedisPubSubEvent } from '@bytearena/shared-types';

// dotenv.config();

// const app = express();
// const httpServer = createServer(app);

// // ─── Redis Setup ────────────────────────────────────────────
// const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// const pubClient = createClient({ url: REDIS_URL });
// const subClient = pubClient.duplicate();

// Promise.all([pubClient.connect(), subClient.connect()])
//   .then(() => console.log('Redis connected for Socket.IO adapter'))
//   .catch((err) => {
//     console.warn('Redis connection failed:', err.message);
//   });

// // ─── Socket.IO Server ──────────────────────────────────────
// const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4028';
// const io = new Server(httpServer, {
//   cors: {
//     origin: [FRONTEND_URL, 'http://localhost:3000'],
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
//   adapter: createAdapter(pubClient, subClient),
// });

// const JWT_SECRET = process.env.JWT_SECRET || 'your_secure_jwt_secret_change_this_in_production';

// // ─── Auth Middleware ────────────────────────────────────────
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     return next(new Error('Authentication error: No token provided'));
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as any;
//     socket.data.userId = decoded.id || decoded.sub;
//     socket.data.role = decoded.role || 'USER';
//     socket.data.email = decoded.email;
//     next();
//   } catch (err) {
//     return next(new Error('Authentication error: Invalid token'));
//   }
// });

// // ─── Redis PubSub for Admin Monitor Signals ─────────────────
// const eventSub = pubClient.duplicate();
// eventSub.connect().then(() => {
//   eventSub.pSubscribe('contest:*:events', (message, channel) => {
//     try {
//       const event: RedisPubSubEvent = JSON.parse(message);
//       if (event.type === 'STREAM_REQUEST') {
//         io.to(`user:${event.userId}`).emit('stream-request', { token: event.liveKitToken });
//       } else if (event.type === 'STREAM_STOP') {
//         io.to(`user:${event.userId}`).emit('stream-stop');
//       }
//     } catch (e) {
//       console.error('Failed to parse redis event', e);
//     }
//   });
// }).catch((err) => {
//   console.warn('Redis event subscriber failed to connect:', err.message);
// });

// // ─── Connection Handler ─────────────────────────────────────
// io.on('connection', (socket) => {
//   const userId = socket.data.userId;
//   const role = socket.data.role;

//   // Join user-specific room for targeted events
//   socket.join(`user:${userId}`);
//   console.log(`User ${userId} (${role}) connected. Socket: ${socket.id}`);

//   // Admin joins admin room
//   if (role === 'ADMIN') {
//     socket.join('admin-room');
//     console.log(`Admin ${userId} joined admin-room`);
//   }

//   // Join a contest room
//   socket.on('join-contest', (contestId: string) => {
//     socket.join(`contest:${contestId}`);
//     console.log(`User ${userId} joined contest:${contestId}`);

//     // Notify admins
//     io.to('admin-room').emit('contestant:joined', {
//       userId,
//       contestId,
//       timestamp: Date.now(),
//     });
//   });

//   // Leave a contest room
//   socket.on('leave-contest', (contestId: string) => {
//     socket.leave(`contest:${contestId}`);
//     console.log(`User ${userId} left contest:${contestId}`);

//     io.to('admin-room').emit('contestant:left', {
//       userId,
//       contestId,
//       timestamp: Date.now(),
//     });
//   });

//   // Proctoring event from contestant
//   socket.on('proctor:event', (data: { contestId: string; eventType: string; description: string; severity?: string }) => {
//     io.to('admin-room').emit('proctor:alert', {
//       userId,
//       contestId: data.contestId,
//       eventType: data.eventType,
//       description: data.description,
//       severity: data.severity || 'WARNING',
//       timestamp: Date.now(),
//     });
//   });

//   // Heartbeat tracking for presence
//   socket.on('heartbeat', async () => {
//     try {
//       await pubClient.setEx(`presence:${userId}`, 30, JSON.stringify({
//         online: true,
//         lastSeen: Date.now(),
//         socketId: socket.id,
//       }));
//     } catch (err) {
//       // Redis may be unavailable, log silently
//     }
//   });

//   // Admin requests a specific user's stream
//   socket.on('admin:request-stream', async (data: { contestId: string; targetUserId: string }) => {
//     if (role !== 'ADMIN') return;

//     // Publish to Redis so the target user's socket receives the stream request
//     try {
//       await pubClient.publish(`contest:${data.contestId}:events`, JSON.stringify({
//         type: 'STREAM_REQUEST',
//         contestId: data.contestId,
//         userId: data.targetUserId,
//         adminId: userId,
//         liveKitToken: `lk_token_${data.targetUserId}_${data.contestId}`, // Replace with real LiveKit token generation
//       }));
//     } catch (err) {
//       console.error('Failed to publish stream request:', err);
//     }
//   });

//   // Admin stops a specific user's stream
//   socket.on('admin:stop-stream', async (data: { contestId: string; targetUserId: string }) => {
//     if (role !== 'ADMIN') return;

//     try {
//       await pubClient.publish(`contest:${data.contestId}:events`, JSON.stringify({
//         type: 'STREAM_STOP',
//         contestId: data.contestId,
//         userId: data.targetUserId,
//         adminId: userId,
//       }));
//     } catch (err) {
//       console.error('Failed to publish stream stop:', err);
//     }
//   });

//   // Disconnect handler
//   socket.on('disconnect', async () => {
//     console.log(`User ${userId} disconnected.`);
//     try {
//       await pubClient.del(`presence:${userId}`);
//     } catch (err) {
//       // Redis may be unavailable
//     }

//     io.to('admin-room').emit('contestant:disconnected', {
//       userId,
//       timestamp: Date.now(),
//     });
//   });
// });

// // ─── Health Check ───────────────────────────────────────────
// app.get('/health', (_req, res) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString(), connections: io.engine.clientsCount });
// });

// // ─── Start Server ───────────────────────────────────────────
// const PORT = Number(process.env.PORT) || 8080;

// httpServer.listen(PORT, "0.0.0.0", () => {
//   console.log(`🔌 ByteArena Realtime Server running on port ${PORT}`);
// });


import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { RedisPubSubEvent } from '@bytearena/shared-types';
import { RoomServiceClient } from 'livekit-server-sdk';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const httpServer = createServer(app);

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4028';
const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your_secure_jwt_secret_change_this_in_production';

const LIVEKIT_API_URL = process.env.LIVEKIT_API_URL || 'https://your-livekit-server.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

const roomService = new RoomServiceClient(LIVEKIT_API_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
const eventSub = pubClient.duplicate();

const connectRedis = async () => {
  try {
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
      eventSub.connect(),
    ]);
    console.log('✅ Redis connected for Socket.IO adapter');
  } catch (err: any) {
    console.warn('⚠️ Redis connection failed:', err?.message || err);
  }
};

void connectRedis();

const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.adapter(createAdapter(pubClient, subClient));

type Role = 'ADMIN' | 'USER';

interface SocketData {
  userId: string;
  role: Role;
  email?: string;
  activeContestId?: string;
}

interface AuthTokenPayload extends JwtPayload {
  id?: string;
  sub?: string;
  role?: string;
  email?: string;
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

    const userId = String(decoded.id || decoded.sub || '');
    if (!userId) {
      return next(new Error('Authentication error: Invalid token payload'));
    }

    socket.data.userId = userId;
    socket.data.role = decoded.role === 'ADMIN' ? 'ADMIN' : 'USER';
    socket.data.email = decoded.email;

    return next();
  } catch {
    return next(new Error('Authentication error: Invalid token'));
  }
});

eventSub
  .pSubscribe('contest:*:events', (message) => {
    try {
      const event = JSON.parse(message) as RedisPubSubEvent;

      // STREAM_REQUEST and STREAM_STOP have been deprecated in favor of SFU Continuous Publish
    } catch (err) {
      console.error('Failed to parse redis event', err);
    }
  })
  .catch((err) => {
    console.warn('⚠️ Redis event subscriber failed:', err.message);
  });

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    redis: pubClient.isOpen,
  });
});

// Periodic heartbeat sweeper for stale connections (every 30 seconds)
setInterval(async () => {
  try {
    const keys = await pubClient.keys('presence:*');
    const now = Date.now();
    for (const key of keys) {
      const dataStr = await pubClient.get(key);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (now - data.lastSeen > 60000) {
           const userId = key.split(':')[1];
           console.log(`Sweeping stale user ${userId}`);
           await pubClient.del(key);
           io.in(`user:${userId}`).disconnectSockets();
        }
      }
    }
  } catch (err) {
    console.warn('Heartbeat sweep failed', err);
  }
}, 30000);

// Admin Telemetry Broadcaster (every 10 seconds)
setInterval(async () => {
  try {
    const clientsCount = io.engine.clientsCount;
    // Broadcast lightweight realtime stats to admin dashboard
    io.to('admin-room').emit('admin:telemetry', {
      timestamp: Date.now(),
      socketConnections: clientsCount,
      redisConnected: pubClient.isOpen,
    });
  } catch (err) {
    // Ignore telemetry errors to avoid crash
  }
}, 10000);

io.on('connection', (socket) => {
  const { userId, role } = socket.data as SocketData;

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // Duplicate socket prevention
  io.in(`user:${userId}`).fetchSockets().then(sockets => {
    for (const s of sockets) {
      if (s.id !== socket.id) {
         console.log(`Force disconnecting older socket ${s.id} for user ${userId}`);
         s.emit('force-disconnect', 'Another device connected');
         s.disconnect(true);
      }
    }
  }).catch(err => console.error(err));

  socket.join(`user:${userId}`);
  console.log(`User ${userId} (${role}) connected. Socket: ${socket.id}`);

  if (role === 'ADMIN') {
    socket.join('admin-room');
    console.log(`Admin ${userId} joined admin-room`);
  }

  socket.on('join-contest', (contestId: string) => {
    socket.join(`contest:${contestId}`);
    socket.data.activeContestId = contestId;
    console.log(`User ${userId} joined contest:${contestId}`);

    io.to('admin-room').emit('contestant:joined', {
      userId,
      contestId,
      timestamp: Date.now(),
    });
  });

  socket.on('leave-contest', (contestId: string) => {
    socket.leave(`contest:${contestId}`);
    console.log(`User ${userId} left contest:${contestId}`);

    io.to('admin-room').emit('contestant:left', {
      userId,
      contestId,
      timestamp: Date.now(),
    });
  });

  socket.on(
    'proctor:event',
    (data: {
      contestId: string;
      eventType: string;
      description: string;
      severity?: string;
    }) => {
      io.to('admin-room').emit('proctor:alert', {
        userId,
        contestId: data.contestId,
        eventType: data.eventType,
        description: data.description,
        severity: data.severity || 'WARNING',
        timestamp: Date.now(),
      });
    }
  );

  socket.on('heartbeat', async () => {
    try {
      await pubClient.setEx(
        `presence:${userId}`,
        30,
        JSON.stringify({
          online: true,
          lastSeen: Date.now(),
          socketId: socket.id,
        })
      );
    } catch {
      // ignore if Redis is temporarily unavailable
    }
  });

  socket.on(
    'admin:voice-enable',
    (data: { contestId: string; targetUserId: string }) => {
      if (role !== 'ADMIN') return;
      const roomName = `voice-${data.contestId}-${data.targetUserId}-${userId}`;
      io.to(`user:${data.targetUserId}`).emit('admin:voice-started', {
        roomName,
        adminId: userId,
      });
      console.log(`[Admin Voice] Admin ${userId} initiated voice with Contestant ${data.targetUserId} in room ${roomName}`);
    }
  );

  socket.on(
    'admin:voice-disable',
    (data: { contestId: string; targetUserId: string }) => {
      if (role !== 'ADMIN') return;
      io.to(`user:${data.targetUserId}`).emit('admin:voice-stopped', {
        adminId: userId,
      });
      console.log(`[Admin Voice] Admin ${userId} ended voice with Contestant ${data.targetUserId}`);
    }
  );

  socket.on('disconnect', async () => {
    console.log(`User ${userId} disconnected.`);

    if (socket.data.activeContestId) {
      // Remove stale participant from LiveKit Room immediately
      try {
        await roomService.removeParticipant(`contest-${socket.data.activeContestId}`, userId);
        console.log(`Removed participant ${userId} from LiveKit room contest-${socket.data.activeContestId}`);
      } catch (err: any) {
        // Ignored if participant is already gone
      }
      
      // Auto-delete room if it becomes empty (optional logic, could also rely on LiveKit emptyTimeout)
      try {
        const participants = await roomService.listParticipants(`contest-${socket.data.activeContestId}`);
        if (participants.length === 0) {
           await roomService.deleteRoom(`contest-${socket.data.activeContestId}`);
           console.log(`Auto-deleted empty LiveKit room contest-${socket.data.activeContestId}`);
        }
      } catch (err: any) {
        // Ignored
      }
    }

    try {
      await pubClient.del(`presence:${userId}`);
    } catch {
      // ignore if Redis is temporarily unavailable
    }

    io.to('admin-room').emit('contestant:disconnected', {
      userId,
      timestamp: Date.now(),
    });
  });
});

const PORT = Number(process.env.PORT) || 8080;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔌 ByteArena Realtime Server running on port ${PORT}`);
  console.log(`   Health check: /health\n`);
});