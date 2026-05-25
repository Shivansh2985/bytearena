# ByteArena Local Testing Guide

This guide will walk you through setting up the entire ByteArena full-stack system locally and provide checkpoints to verify that all integrations (Database, Redis, Socket.IO, LiveKit, Judge0, Cloudinary) are working correctly end-to-end.

---

## 1. Prerequisites & Environment Variables

Ensure you have the following services ready. You should have three `.env` files across your monorepo.

### `apps/api-server/.env`
```env
PORT=3001
DATABASE_URL="postgresql://<neon-db-url>"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"

# Code Execution
JUDGE0_API_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="your-rapidapi-key"

# LiveKit
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
LIVEKIT_URL="wss://your-project.livekit.cloud"

# Cloudinary (Snapshots)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
```

### `apps/realtime-server/.env`
```env
PORT=8080
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="your-super-secret-jwt-key"

# Redis
UPSTASH_REDIS_REST_URL="https://certain-hound-135526.upstash.io"
UPSTASH_REDIS_REST_TOKEN="gQAAAAAAAhFmAAIgcDI3NjU1NTc1NzViYzQ0Zjk4YWFmOWJjOGE1NGFkZTA3Nw"
```

### `apps/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:8080"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-jwt-key"
```

---

## 2. Running the Stack Locally

Open three terminal tabs in your `bytearena` root folder.

**Terminal 1 (Database & API Server)**
```bash
# Apply schema changes and generate Prisma client
cd packages/database
npx prisma db push
npx prisma generate

# Start Express server
cd ../../apps/api-server
npm install
npm run dev
# Should output: Server running on port 3001
```

**Terminal 2 (Realtime Server)**
```bash
cd apps/realtime-server
npm install
npm run dev
# Should output: Socket.IO server running on port 8080
```

**Terminal 3 (Next.js Frontend)**
```bash
cd apps/frontend
npm install
npm run dev
# Should output: Ready in XXXms
```

---

## 3. End-to-End Testing Checkpoints

Follow these checkpoints in order to verify the entire system.

### Checkpoint 1: Authentication & Navigation
- [ ] Go to `http://localhost:3000` and sign in (or register).
- [ ] Ensure you are redirected to the User Dashboard (`/user-dashboard`).
- [ ] Ensure you can navigate to the Contests list (`/contests`) and the Global Submissions list.
- [ ] If you are an Admin (change your role in the DB to `ADMIN`), ensure you can access `/admin`.

### Checkpoint 2: Contest Lifecycle & Live Editing
- [ ] **Create**: Go to `/admin/contests/create` and create a "Live" contest with 2 questions.
- [ ] **View**: Go to `/contests` as a user. Ensure the contest appears in the "Live" filter stack.
- [ ] **Edit**: As an admin, go to `/admin/contests`, click the **Edit** icon for the contest, change the title, and hit Save.
- [ ] **Verify**: Ensure the title updates immediately on the user dashboard without needing to restart the servers.

### Checkpoint 3: Code Execution (Judge0)
- [ ] As a user, enter the Live Contest workspace (`/live-contest-workspace`).
- [ ] Write a simple solution in C++ or Python for Question 1.
- [ ] **Run Custom Input**: Enter a custom input, click "Run". Verify it returns the exact output from Judge0.
- [ ] **Submit**: Click "Submit". Verify that it checks against hidden test cases.
- [ ] **Verify**: As an admin, go to `/admin/submissions`. Use the dropdown filter to find your newly submitted code.

### Checkpoint 4: Real-time Proctoring & WebRTC (LiveKit)
- [ ] **User Side**: Ensure your browser asks for Camera/Microphone permissions in the contest workspace. Keep the workspace open.
- [ ] **Admin Side**: Open a separate browser profile (or incognito window) and log in as Admin. Navigate to `/admin/proctoring`.
- [ ] **Hierarchy**: Ensure the contest shows up in the first column. Click the contest.
- [ ] **Participants**: Ensure the user shows up in the second column. Click the user.
- [ ] **Stream**: Within 2-3 seconds, the video AND audio stream should automatically start playing in the third column. (If it doesn't, check your LiveKit API keys).
- [ ] **Snapshots**: Wait 60 seconds. A snapshot thumbnail should appear under "Live Snapshots". Click it to verify the enlarge modal works.

### Checkpoint 5: Anti-Cheat Logic
- [ ] Switch back to the User's browser tab.
- [ ] Open a new tab (e.g., Google) and switch back to the workspace. You should receive a warning toast ("Warning 1/2").
- [ ] Do it a second time ("Warning 2/2").
- [ ] Do it a third time. The frontend should instantly terminate your session, submit your current score, and redirect you out of the contest.

---
If all 5 checkpoints pass successfully, your ByteArena architecture is fully wired and production-ready!
