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

      // WebRTC Signaling: Offer
      socket.on('webrtc-offer', (data: { offer: any, toSocketId: string, fromUserId: string }) => {
        socket.to(data.toSocketId).emit('webrtc-offer', {
          offer: data.offer,
          fromSocketId: socket.id,
          fromUserId: data.fromUserId,
        });
      });

      // WebRTC Signaling: Answer
      socket.on('webrtc-answer', (data: { answer: any, toSocketId: string }) => {
        socket.to(data.toSocketId).emit('webrtc-answer', {
          answer: data.answer,
          fromSocketId: socket.id,
        });
      });

      // WebRTC Signaling: ICE Candidate
      socket.on('webrtc-ice-candidate', (data: { candidate: any, toSocketId: string }) => {
        socket.to(data.toSocketId).emit('webrtc-ice-candidate', {
          candidate: data.candidate,
          fromSocketId: socket.id,
        });
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
