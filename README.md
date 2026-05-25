# ByteArena 🏆

ByteArena is a highly scalable, production-grade coding contest and proctoring platform. It empowers administrators to host live programming competitions with real-time algorithmic code execution, while seamlessly monitoring hundreds of contestants simultaneously using advanced WebRTC SFU proctoring.

---

## 🚀 Key Features

* **Live Coding Contests**: Create timed contests with multiple programming challenges.
* **Algorithmic Judge**: Real-time code execution and validation against hidden test cases (powered by Judge0).
* **Massive Scale Proctoring**: LiveKit SFU (Selective Forwarding Unit) enables admins to view hundreds of live camera feeds without crashing the browser or consuming excessive bandwidth.
* **Background Processing**: BullMQ queues handle heavy workloads like code execution and snapshot uploads asynchronously.
* **Real-time Presence & Sync**: Instant websocket syncing for active users, cursor movements, and live contest events.
* **Secure Architecture**: Redis-backed global rate limiting, rigorous NextAuth JWT validation, and strictly decoupled microservices.

---

## 🛠️ Technology Stack

### Frontend
* **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
* **Styling**: Tailwind CSS & Radix UI (shadcn/ui components)
* **Authentication**: NextAuth.js (Auth.js) using JWT (jose)
* **Proctoring**: `@livekit/components-react`
* **Code Editor**: Monaco Editor

### Backend Services
* **REST API Server**: Express.js (Single Source of Truth)
* **Realtime Server**: Socket.IO with Redis Adapter
* **Job Queues**: BullMQ & ioredis (for asynchronous code execution)
* **Database ORM**: Prisma
* **Code Execution**: Judge0 API via RapidAPI

### Cloud & Infrastructure
* **Database**: Neon (Serverless PostgreSQL)
* **Caching & Message Broker**: Redis (Upstash)
* **WebRTC Engine**: LiveKit Cloud
* **Media Storage**: Cloudinary
* **Containerization**: Docker & Docker Compose

---

## 📁 Monorepo Structure

```text
bytearena/
├── apps/
│   ├── frontend/          # Next.js 15 UI, SSR, and NextAuth session management
│   ├── api-server/        # Express REST API, BullMQ workers, Rate Limiting
│   └── realtime-server/   # Socket.IO WebSocket server, Redis Pub/Sub
├── packages/
│   ├── database/          # Shared Prisma client and Prisma schema
│   └── shared-types/      # Shared TypeScript interfaces
├── docker-compose.yml     # Local orchestration
└── package.json           # Root npm workspace
```

---

## 💻 Local Development Setup

### 1. Prerequisites
* Node.js 18+
* Docker Desktop (optional, but highly recommended)

### 2. Environment Variables
Copy `.env.example` to `.env` in the root (and across individual apps if necessary). Ensure you configure your Neon Database URL, Redis URL, LiveKit secrets, and Judge0 API keys.

### 3. Database Initialization
```bash
npm run db:generate --workspace=packages/database
npm run db:push --workspace=packages/database
```

### 4. Running the Stack (Docker)
The easiest way to boot the entire stack:
```bash
docker compose up -d --build
```
* **Frontend**: http://localhost:4028
* **API Server**: http://localhost:3001
* **Realtime Server**: http://localhost:8080

### 5. Running the Stack (Manual)
```bash
npm install
npm run dev --workspace=apps/api-server
npm run dev --workspace=apps/realtime-server
npm run dev --workspace=apps/frontend
```
