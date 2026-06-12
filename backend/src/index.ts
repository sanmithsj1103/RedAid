import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { apiLimiter } from './middleware/rate-limiter.js';
import { globalErrorHandler } from './middleware/error-handler.js';

import authRoutes from './routes/auth.routes.js';
import donorRoutes from './routes/donor.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { initSocketIO } from './config/socket.js';

// ────────────────────────────────────────────────────────
// Env loading (deferred — only validate when actually running)
// ────────────────────────────────────────────────────────
const PORT = process.env['PORT'] ?? 3001;
const ALLOWED_ORIGINS = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173').split(',');
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

// ────────────────────────────────────────────────────────
// Express App
// ────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// General rate limiting
app.use(apiLimiter);

// ────────────────────────────────────────────────────────
// Health Check
// ────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'redaid-api',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ────────────────────────────────────────────────────────
// API Routes (v1)
// ────────────────────────────────────────────────────────
app.use('/v1/auth', authRoutes);
app.use('/v1/donor', donorRoutes);
app.use('/v1/hospital', hospitalRoutes);
app.use('/v1/admin', adminRoutes);

// ────────────────────────────────────────────────────────
// 404 Handler
// ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// ────────────────────────────────────────────────────────
// Global Error Handler
// ────────────────────────────────────────────────────────
app.use(globalErrorHandler);

// ────────────────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────────────────
if (NODE_ENV !== 'test') {
  // Initialise Socket.IO
  initSocketIO(httpServer);

  // Import and start BullMQ worker
  import('./workers/notification.worker.js')
    .then(() => {
      console.log('✅ BullMQ notification worker started');
    })
    .catch((err) => {
      console.error('❌ Failed to start BullMQ worker:', err);
    });

  // Import and start fraud detection cron
  import('./services/fraud/fraud.service.js')
    .then(({ initFraudCron }) => {
      initFraudCron();
    })
    .catch((err) => {
      console.error('❌ Failed to start fraud detection cron:', err);
    });

  httpServer.listen(PORT, () => {
    console.log(`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │   🩸 RedAid API Server                      │
  │                                             │
  │   Port:        ${String(PORT).padEnd(28)}│
  │   Environment: ${String(NODE_ENV).padEnd(28)}│
  │   Health:      http://localhost:${PORT}/health   │
  │                                             │
  └─────────────────────────────────────────────┘
    `);
  });
}

export { app, httpServer };
