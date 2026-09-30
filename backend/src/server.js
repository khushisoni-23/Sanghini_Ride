import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import connectDatabase from './config/database.js';
import apiRoutes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './socket.js';
import { seedSafeHavens } from './services/safetyFeatures.service.js';

const app = express();
const httpServer = http.createServer(app);

// ─── Initialize Socket.IO ───────────────────────────────────────────
initSocket(httpServer);

// ─── Security Headers ──────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body & Cookie Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Rate Limiting ─────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── API Routes ────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────
app.use(notFound);

// ─── Centralized Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────
const startServer = async () => {
  // Connect to MongoDB (gracefully handles missing URI)
  await connectDatabase();

  // Seed Udaipur Safe Haven Network data on first run
  await seedSafeHavens();

  httpServer.listen(env.PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║        🦋  Sanghini Ride API             ║');
    console.log('  ║        Her Journey, Her Way              ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`  ➜  Server:      http://localhost:${env.PORT}`);
    console.log(`  ➜  Health:      http://localhost:${env.PORT}/api/health`);
    console.log(`  ➜  Frontend:    http://localhost:5173`);
    console.log(`  ➜  Environment: ${env.NODE_ENV}`);
    console.log(`  ➜  Real-time:   Socket.IO Enabled`);
    console.log('');
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

export { app, httpServer };
export default app;

