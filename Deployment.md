# ByteArena Deployment Guide

This guide provides step-by-step instructions for deploying the entire ByteArena stack across free-tier cloud providers (Neon, Upstash, Vercel, and Render/Railway).

---

## 🏗️ 1. Prepare Your Environment Variables
Before deploying, you need to collect all your secrets and URLs. Create a notepad and gather the following:

- **PostgreSQL Database**: Get the connection URL from your Neon dashboard (`postgresql://...`).
- **Redis**: You already have your Upstash Redis URL: `rediss://default:gQAAAAAAAhFmAAIgcDI3NjU1NTc1NzViYzQ0Zjk4YWFmOWJjOGE1NGFkZTA3Nw@certain-hound-135526.upstash.io:6379`.
- **LiveKit Cloud**: Get your URL (`wss://...`), API Key, and API Secret from the LiveKit dashboard.
- **Judge0**: Get your API Key from RapidAPI.
- **Cloudinary**: Get your Cloud Name, API Key, and API Secret.
- **JWT Secret**: Generate a secure random string (e.g., run `openssl rand -base64 32`). **This MUST be identical across the frontend and both backend servers.**

---

## ☁️ 2. Deploy the Database (Neon)
If you haven't already:
1. Create a project on [Neon.tech](https://neon.tech).
2. Copy the Connection String.
3. From your local machine, run the Prisma migrations to create the tables in Neon:
   ```bash
   export DATABASE_URL="your-neon-url"
   cd packages/database
   npx prisma generate
   npx prisma migrate deploy
   ```

---

## ☁️ 3. Deploy the Realtime Server (Render / Railway)
The Realtime Server handles all Socket.IO connections.

1. Connect your GitHub repository to Render/Railway.
2. Select the `apps/realtime-server` directory.
3. **Build Command**: `npm install && npm run build --workspace=apps/realtime-server`
4. **Start Command**: `npm run start --workspace=apps/realtime-server`
5. **Environment Variables**:
   - `PORT`: `8080` (or let the platform assign one)
   - `REDIS_URL`: Your Upstash URL.
   - `JWT_SECRET`: Your secure random string.
6. Deploy and **copy the public URL** (e.g., `https://bytearena-realtime.up.railway.app`).

---

## ☁️ 4. Deploy the API Server (Render / Railway)
The API Server handles business logic, auth validation, and BullMQ workers.

1. Connect your GitHub repository to Render/Railway.
2. Select the `apps/api-server` directory.
3. **Build Command**: `npm install && npm run build --workspace=apps/api-server`
4. **Start Command**: `npm run start --workspace=apps/api-server`
5. **Environment Variables**:
   - `PORT`: `3001` (or let platform assign)
   - `DATABASE_URL`: Your Neon Postgres URL.
   - `REDIS_URL`: Your Upstash URL.
   - `JWT_SECRET`: Your secure random string.
   - `JUDGE0_API_KEY`: Your Judge0 RapidAPI Key.
   - `LIVEKIT_API_KEY`: Your LiveKit Key.
   - `LIVEKIT_API_SECRET`: Your LiveKit Secret.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
6. Deploy and **copy the public URL** (e.g., `https://bytearena-api.up.railway.app`).

---

## ☁️ 5. Deploy the Frontend (Vercel)
The Frontend is a Next.js 15 application. Vercel provides the easiest deployment path.

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set the **Root Directory** to `apps/frontend`.
3. The framework preset should automatically detect **Next.js**.
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed API Server (from step 4).
   - `NEXT_PUBLIC_SOCKET_URL`: The URL of your deployed Realtime Server (from step 3).
   - `NEXT_PUBLIC_LIVEKIT_URL`: Your LiveKit Cloud WSS URL.
   - `NEXTAUTH_URL`: Your Vercel production domain (e.g., `https://bytearena.vercel.app`).
   - `NEXTAUTH_SECRET`: The exact same secure random string used for `JWT_SECRET` in the backend.
5. Click **Deploy**.

---

## ✅ 6. Final Verification
Once all three are deployed:
1. Go to your Vercel URL.
2. Attempt to log in or register. This verifies the Frontend → NextAuth → Database connection.
3. Open a Contest Workspace. The console should log "Socket connected". This verifies the Frontend → Realtime Server connection.
4. Run a piece of code. This tests the Frontend → API Server → BullMQ → Redis → Judge0 flow!

*Note regarding Upstash Eviction Warning: Upstash defaults to an eviction policy that BullMQ warns about in the logs. This is completely fine for our scale and will not cause your queues to fail.*
