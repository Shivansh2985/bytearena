import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('New Socket.io server...');
    // adapt Next's net Server to http Server
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*', // Adjust in production
        methods: ['GET', 'POST'],
      },
    });
    
    // Global Submission Panel memory (in a real app, use Redis)
    const recentSubmissions: any[] = [];

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join a contest room (e.g., "contest-123")
      socket.on('join-room', (roomId: string, userId: string, role: string) => {
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
        // Notify admin/others
        socket.to(roomId).emit('user-joined', { userId, socketId: socket.id, role });
      });

      // Admin joins
      socket.on('admin-joined', () => {
        socket.join('admin-room');
        // Broadcast to everyone else that an admin joined so they can initiate WebRTC
        socket.broadcast.emit('admin-joined', { adminSocketId: socket.id });
      });

      // WebRTC Signaling: Offer
      socket.on('webrtc-offer', (data: { offer: any, toSocketId?: string, toRoom?: string, fromUserId?: string, userId?: string }) => {
        const target = data.toSocketId || data.toRoom;
        if (target) {
          socket.to(target).emit('webrtc-offer', {
            offer: data.offer,
            fromSocketId: socket.id,
            fromUserId: data.fromUserId || data.userId,
            userId: data.userId || data.fromUserId,
          });
        }
      });

      // WebRTC Signaling: Answer
      socket.on('webrtc-answer', (data: { answer: any, toSocketId?: string, toRoom?: string, userId?: string }) => {
        const target = data.toSocketId || data.toRoom;
        if (target) {
          socket.to(target).emit('webrtc-answer', {
            answer: data.answer,
            fromSocketId: socket.id,
            userId: data.userId,
          });
        }
      });

      // WebRTC Signaling: ICE Candidate
      socket.on('webrtc-ice-candidate', (data: { candidate: any, toSocketId?: string, toRoom?: string, userId?: string }) => {
        const target = data.toSocketId || data.toRoom;
        if (target) {
          socket.to(target).emit('webrtc-ice-candidate', {
            candidate: data.candidate,
            fromSocketId: socket.id,
            userId: data.userId,
          });
        }
      });

      // Global Submission Logging
      socket.on('new-submission', (data: { contestId: string, username: string, problem: string, status: string }) => {
        recentSubmissions.unshift(data);
        if (recentSubmissions.length > 50) recentSubmissions.pop(); // keep last 50
        
        io.to(data.contestId).emit('submission-update', data);
        io.emit('global-submission', data); // Broadcast globally if needed
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.io server already running');
  }

  res.end();
}
