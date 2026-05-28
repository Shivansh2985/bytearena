# ByteArena Redis Architecture

The ByteArena platform utilizes Redis heavily for queues, WebSockets, Pub/Sub, and caching. To ensure absolute production stability, we explicitly separate **Queue Management** from **General Telemetry & Realtime Traffic**.

## Environment Variables
The application relies on two dedicated Redis URIs defined in the `.env` file:

```env
# General Redis Database (DB 0)
REDIS_URL="redis://default:xxxxxxxx@your-host:6379/0"

# Dedicated BullMQ Database (DB 1)
WORKER_REDIS_URL="redis://default:xxxxxxxx@your-host:6379/1"
```

> [!IMPORTANT]
> Do NOT use the same connection or DB index for `REDIS_URL` and `WORKER_REDIS_URL`. If the same connection is used, BullMQ's queue operations will block event loop threads and drop incoming Socket.IO events.

## 1. `WORKER_REDIS_URL` (Dedicated Queue Worker)
**Primary Responsibility**: Managing heavy computational workloads and background execution.
**Components Using This:**
- `apps/api-server/src/queues/submissionQueue.ts`
- `apps/judge-worker` (Docker environment)
- Any worker pulling jobs from BullMQ.

BullMQ relies on the `BZPOPMIN` Redis command to wait for queue events. This command blocks the Redis connection indefinitely until a new job arrives. By isolating this to `WORKER_REDIS_URL`, we prevent the blocking operations from interfering with standard REST or WebSocket API traffic.

## 2. `REDIS_URL` (General Traffic & Pub/Sub)
**Primary Responsibility**: Pub/Sub routing, Socket.IO adapter scaling, rate-limiting, and short-lived UI caching.
**Components Using This:**
- `apps/realtime-server` (Both Publisher and Subscriber)
- `apps/api-server/src/services/notifications.ts` (Notifications & User Kicks)
- Rate Limiters (`apps/api-server/src/middleware/rateLimiter.ts`)

### Pub/Sub Channels
- **`contest:leaderboard:*`**: Real-time score recalculation broadcasts.
- **`user:notifications`**: Broadcasts `Notification` pushes directly to the target `userId` room.
- **`proctor:alerts`**: Broadcasts tab switches and camera disconnects to the Admin dashboard.
- **`user:kick`**: Sends immediate signals to frontend clients to force-logout or eject users from contests.

## Scaling
If platform load significantly increases, we can map `WORKER_REDIS_URL` to an entirely separate physical cluster. Because the architecture enforces separation of concerns at the environment variable level, this migration requires no code changes.
