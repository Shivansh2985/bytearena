# 🚀 ByteArena Interview Preparation Guide

Welcome to your ultimate guide for explaining **ByteArena** in a software engineering interview! This document is structured to help you articulate the "what," "why," and "how" of the platform with confidence.

---

## 🏗️ 1. Project Overview & Elevator Pitch

**What is ByteArena?**
ByteArena is a full-stack, scalable competitive programming and code execution platform. It features live coding contests, an interactive practice workspace, real-time code evaluation, a dynamic analytics dashboard, and automated proctoring (camera detection). 

**The Tech Stack (The "Why")**
- **Frontend:** Next.js (React) + TailwindCSS
  - *Why?* Next.js provides App Router for nested layouts, fast server-side rendering (SSR) for SEO and initial load speed, and seamless API routes. Tailwind allows for rapid, atomic UI development with a premium dark-mode glassmorphism aesthetic.
- **Backend:** Node.js + Express
  - *Why?* Node.js is excellent for highly concurrent, I/O-heavy operations (like handling hundreds of simultaneous code submissions). 
- **Database:** PostgreSQL (via Prisma ORM)
  - *Why?* Postgres gives us ACID compliance for strict user balances, ratings, and contest rankings. Prisma provides type-safe queries, making the codebase highly robust and reducing runtime errors.
- **Message Broker & Caching:** Redis & BullMQ
  - *Why?* Code execution is a heavy task that can take several seconds. Using Redis with BullMQ allows us to offload the execution to a background **Worker Service** queue. It prevents the main API server from blocking or crashing under heavy load.
- **Code Execution Environment:** Piston API (or Dockerized Sandbox)
  - *Why?* Running untrusted user code directly on the host is a massive security risk. We run it in isolated, resource-constrained sandboxes.

---

## 🗺️ 2. High-Level Architecture & Workflow

### User Flow: Submitting Code
1. **Frontend (`PracticeWorkspaceShell.tsx`)**: User types C++ code and hits "Submit".
2. **API Gateway (`apps/api-server/src/routes/judge.ts`)**: The Express server receives the request. Instead of executing it immediately, it creates a "Job" and pushes it to a **Redis Queue** (via BullMQ). It responds to the frontend immediately with a `jobId`.
3. **Frontend Polling**: The frontend begins polling `/api/judge/job/:jobId` every second.
4. **Worker Service (`apps/api-server/src/worker.ts`)**: A background Node.js process picks up the job from the Redis queue.
5. **Code Execution**: The worker securely compiles and executes the code against hidden test cases. 
6. **Database Update**: The worker updates the `Submission` table in Postgres with the status (`ACCEPTED`, `WRONG_ANSWER`, etc.), runtime, and memory.
7. **Frontend Updates**: The frontend poll detects the completed status, stops polling, and updates the UI (triggering confetti if ACCEPTED).

### 📊 Database Schema Highlights (`schema.prisma`)
- **User**: Stores authentication, Elo rating, and role (ADMIN/USER).
- **Contest**: Tracks live coding competitions (startTime, endTime, status).
- **Question**: Contains problem statements, difficulty, and time limits.
- **TestCase**: Belongs to a Question. Contains `input`, `expectedOutput`, and `isHidden` flag.
- **Submission**: Links a User, Question, and Contest. Tracks the code they submitted, the language, and the verdict (`ACCEPTED`, `TLE`, etc.).
- **ProctoringLog**: Stores instances where users switch tabs or blur the window during a live contest.

---

## 🧠 3. Interview Q&A (Counter-Questions)

### Q1: "How did you handle the security of running untrusted user code?"
**Your Answer:** 
> "Running user code is extremely dangerous due to potential malicious scripts or infinite loops. I handled this by strictly isolating the execution environment. We send the code and test cases to a sandboxed execution engine (like Piston). The engine runs the code inside an isolated Docker container with zero network access, restricted file-system privileges, and strict limits on CPU time (e.g., 2 seconds) and memory (e.g., 256MB). If a process exceeds these limits, the sandbox kills it and returns a Time Limit Exceeded (TLE) or Memory Limit Exceeded (MLE) status."

### Q2: "What happens if 1,000 users submit code at the exact same second during a contest?"
**Your Answer:** 
> "If we executed code synchronously on the main API server, it would immediately freeze and crash. To solve this, I implemented an asynchronous Message Queue architecture using **Redis and BullMQ**. 
> When 1,000 requests hit the server, the API simply validates them, pushes 1,000 jobs into the Redis queue, and immediately returns a `jobId` to the users. A pool of dedicated Background Workers (`worker.ts`) pulls jobs from the queue at a controlled concurrency rate. The frontend gracefully polls the status until the worker finishes. This ensures the main web server remains 100% responsive no matter the load."

### Q3: "How do you calculate the dynamic Analytics metrics?"
**Your Answer:**
> "Initially, we had hardcoded mock data for the admin dashboard. I refactored the `/api/admin?action=stats` route to dynamically query PostgreSQL using Prisma. To calculate the **Acceptance Rate**, I query `prisma.submission.count()` for the total, and then add a `where: { status: 'ACCEPTED' }` filter for the accepted total, calculating the percentage. For **Average Execution Time**, I utilized Prisma's aggregation features `prisma.submission.aggregate({ _avg: { runtime: true } })`. This ensures the Admin Dashboard always reflects real-time platform health."

### Q4: "How does the Live Proctoring work?"
**Your Answer:**
> "To prevent cheating during contests, I built a custom proctoring hook in React. It listens to the browser's `visibilitychange` and `blur` events. If a user switches to another tab to search for an answer, the frontend catches it, logs a warning locally, and immediately sends a POST request to `/api/proctoring` which stores a `ProctoringLog` in the database. Admins can view these logs in real-time on the Analytics dashboard."

### Q5: "How are notifications handled in real-time?"
**Your Answer:**
> "I built a flexible notification system using PostgreSQL for persistence and Redis Pub/Sub for real-time delivery. When an admin creates a new contest, the backend calls `redisClient.publish('notifications', payload)`. The frontend fetches historical notifications via the `/api/notifications` route to populate the `/notifications` page and unread badges."

---

## 📂 4. Key Files to Remember

If the interviewer asks where a specific piece of logic lives, reference these:

- **`apps/api-server/src/worker.ts`**: The heart of the background queue system. This is where BullMQ is initialized and where code execution jobs are processed.
- **`apps/api-server/src/routes/judge.ts`**: The API Gateway that receives code submissions and pushes them to the queue.
- **`apps/api-server/src/routes/admin.ts`**: Contains the complex queries for the analytics dashboard and the logic for publishing contest results.
- **`apps/frontend/src/app/practice-workspace/components/PracticeWorkspaceShell.tsx`**: The massive React component handling the code editor layout, resizable panels, timer logic, and submission polling.
- **`apps/frontend/src/app/notifications/page.tsx`**: The frontend UI for the global notification system.

---

## 🌟 5. Pro-Tips for the Interview
- **Emphasize Asynchronous Processing**: Interviewers love queues. Highlighting why you chose BullMQ/Redis over synchronous execution is the biggest architectural flex of this project.
- **Talk about Edge Cases**: Mention how you fixed the "Results Unavailable" bug by relaxing the strict status check and allowing admins to forcefully publish results when a contest expires. It shows you know how to debug and improve strict state machines.
- **Be proud of the UI**: Mention the premium feel of the platform (Confetti, Resizable Panels, Next.js layouts). User experience is just as important as backend scalability!
