const express = require('express');
const cors = require('cors');
const path = require('path');

const prisma = require('./lib/prisma');
const { errorHandler } = require('./lib/http');
const requestLogger = require('./middleware/requestLogger');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const popupRoutes = require('./routes/popups');
const leadRoutes = require('./routes/leads');
const analyticsRoutes = require('./routes/analytics');
const embedRoutes = require('./routes/embed');

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  app.use('/embed', express.static(path.join(__dirname, '../../embed/dist')));

  app.get('/health', async (req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/embed', embedRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/popups', popupRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
