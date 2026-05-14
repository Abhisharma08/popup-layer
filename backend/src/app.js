const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

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

  const corsOptions = {
    origin: true, // Reflect request origin
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
  });
  const leadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { error: 'Too many lead submissions, please slow down.' }
  });

  app.use(globalLimiter);
  app.use('/api/leads', leadLimiter);

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
