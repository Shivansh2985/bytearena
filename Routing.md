# API Routing & WebSockets Guide

ByteArena utilizes a strictly decoupled networking architecture. All REST operations go through the `api-server`, while all volatile real-time state and WebRTC signaling pass through the `realtime-server`.

---

## 🌐 REST API (`apps/api-server`)

The Express server handles all business logic, database mutations, and asynchronous jobs. It runs globally on `http://localhost:3001`.

### Authentication
* **Frontend**: NextAuth handles OAuth and credential login. It signs an encrypted JWT session token.
* **Backend Authorization**: The API server enforces the `requireAuth` middleware, securely verifying the `Authorization: Bearer <token>` header against the `JWT_SECRET`.

### Core Endpoints

#### `POST /api/judge`
* **Purpose**: Submits code for algorithmic execution via Judge0.
* **Flow**: Because code execution can take seconds, this endpoint pushes a job to the **BullMQ JudgeQueue** and immediately returns a `202 Accepted` with a `jobId`.
* **Payload**: `{ code, language, problemId, action }`

#### `GET /api/judge/job/:jobId`
* **Purpose**: Polled every second by the frontend to fetch the asynchronous code execution result.

#### `GET /api/proctoring/token`
* **Purpose**: Generates secure access tokens for LiveKit.
* **Query**: `?room=contest-<id>`
* **Flow**: Validates the user's contest enrollment and issues an SFU grant token signed by `LIVEKIT_API_SECRET`.

#### Administrative Routes (`/api/admin/*`, `/api/contests/*`, `/api/questions/*`)
* Handles CRUD operations for users, questions, and contest lifecycle management.
* Strictly protected by Role-Based Access Control (RBAC) ensuring only `ADMIN` roles can mutate data.

**New Admin Endpoints:**
* `PUT /api/contests/:id`: Live updates to contest parameters (status, duration, tags).
* `PUT /api/questions/:id`: Live updates to question parameters during active contests.
* `GET /api/submissions`: Global feed of all code submissions across the platform.

---

## ⚡ Real-Time WebSockets (`apps/realtime-server`)

The Socket.IO server runs on `http://localhost:8080` and uses the `@socket.io/redis-adapter` to scale horizontally.

### Event Dictionary

#### Connection & Rooms
* **`join-contest`** (Client → Server): Adds a user to `contest:<id>` room.
* **`leave-contest`** (Client → Server): Removes a user from a room.
* **`heartbeat`** (Client → Server): Emitted every 30 seconds. Server writes presence TTL to Redis.

#### LiveKit Streaming Coordination
ByteArena uses *On-Demand Streaming*. Contestants do not stream video until an admin actively opens their feed.

1. **`admin:request-stream`** (Admin → Server):
   * Admin targets a specific `userId`.
   * Realtime server publishes a `STREAM_REQUEST` event to Redis Pub/Sub.
2. **`stream-request`** (Server → Contestant):
   * The targeted contestant receives this socket event.
   * The contestant's frontend automatically connects to LiveKit and publishes camera tracks.
3. **`admin:stop-stream`** (Admin → Server):
   * Admin closes the feed. Server signals the contestant via `stream-stop` to disable the camera.

#### Proctoring Alerts
* **`proctor:event`** (Contestant → Server): The contestant's browser detects a violation (e.g., tab switch, full-screen exit) and warns the server.
* **`proctor:alert`** (Server → Admin): Forwards the violation to the admin dashboard in real-time.
