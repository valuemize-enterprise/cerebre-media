require('dotenv').config();
const { validateEnv } = require('./config/validate-env');
validateEnv();

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const helmet     = require('helmet');
const { Server } = require('socket.io');
const config     = require('./config');
const logger     = require('./utils/logger');

const authRoutes       = require('./routes/auth.routes');
const uploadRoutes     = require('./routes/upload.routes');
const reportRoutes     = require('./routes/reports.routes');
const metricsRoutes    = require('./routes/metrics.routes');
const settingsRoutes   = require('./routes/settings.routes');
const adminRoutes      = require('./routes/admin.routes');
const goalsRoutes      = require('./routes/goals.routes');
const scorecardsRoutes = require('./routes/scorecards.routes');

const { ocrQueue, analysisQueue } = require('./workers/queue');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: config.frontend, credentials: true },
});

io.on('connection', (socket) => {
  socket.on('authenticate', (token) => {
    try {
      const { userId } = require('jsonwebtoken').verify(token, config.jwt.secret);
      socket.join(`user:${userId}`);
    } catch { socket.disconnect(); }
  });
});
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.frontend, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', async (_req, res) => {
  try { await require('./db/db').query('SELECT 1'); res.json({ status: 'ok', db: 'connected' }); }
  catch { res.status(503).json({ status: 'degraded', db: 'disconnected' }); }
});

app.use('/api/auth',       authRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/metrics',    metricsRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/goals',      goalsRoutes);
app.use('/api/scorecards', scorecardsRoutes);

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, _req, res, _next) => res.status(err.statusCode || 500).json({
  error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
}));

const bridge = (queue, event) => {
  queue.on('global:completed', (_, result) => {
    try {
      const d = typeof result === 'string' ? JSON.parse(result) : result;
      if (d?.userId) io.to(`user:${d.userId}`).emit(event, d);
    } catch {}
  });
};
bridge(ocrQueue, 'ocr:update');
bridge(analysisQueue, 'analysis:update');

const PORT = config.port || 4000;
server.listen(PORT, () => logger.info(`[Server] Running on port ${PORT}`));

const shutdown = async (sig) => {
  await Promise.all([ocrQueue.close(), analysisQueue.close()]);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
module.exports = { app, server };
