import express from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Load environment variables
dotenv.config();

const app = express();

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Increased for base64 image uploads
app.use(express.urlencoded({ extended: true }));

// ─── CORS ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:4028',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Cloudinary Configuration ───────────────────────────────
import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Redis Client (optional, for caching/pub-sub/rate-limiting) ──────────
const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect().catch((err) => {
  console.warn('Redis connection failed, running without Redis:', err.message);
});

// ─── Global Rate Limiter ────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),
});
app.use(globalLimiter);

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── BullMQ Queues & Workers ────────────────────────────────
import './queues';
import './workers/judgeWorker';

// ─── Route Imports ──────────────────────────────────────────
import adminRouter from './routes/admin';
import contestsRouter from './routes/contests';
import usersRouter from './routes/users';
import questionsRouter from './routes/questions';
import submissionsRouter from './routes/submissions';
import judgeRouter from './routes/judge';
import proctoringRouter from './routes/proctoring';
import uploadsRouter from './routes/uploads';

// ─── Route Mounting ─────────────────────────────────────────
app.use('/api/admin', adminRouter);
app.use('/api/contests', contestsRouter);
app.use('/api/users', usersRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/judge', judgeRouter);
app.use('/api/proctoring', proctoringRouter);
app.use('/api/uploads', uploadsRouter);

// ─── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 ByteArena API Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Routes mounted:`);
  console.log(`     - /api/admin`);
  console.log(`     - /api/contests`);
  console.log(`     - /api/users`);
  console.log(`     - /api/questions`);
  console.log(`     - /api/submissions`);
  console.log(`     - /api/judge`);
  console.log(`     - /api/proctoring`);
  console.log(`     - /api/uploads\n`);
});

export { redis };
