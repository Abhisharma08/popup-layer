const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
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

  const allowedDashboardOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
  ].map(origin => origin && origin.trim()).filter(Boolean);

  const isPublicCrossOriginRoute = (req) => (
    req.path.startsWith('/api/embed') ||
    req.path === '/api/leads' ||
    req.path === '/api/analytics/event' ||
    req.path.startsWith('/embed/')
  );

  app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(cors((req, callback) => {
    const origin = req.header('Origin');
    if (isPublicCrossOriginRoute(req)) {
      return callback(null, { origin: true, credentials: false });
    }

    if (!origin) return callback(null, { origin: false });

    const isAllowedDashboard = allowedDashboardOrigins.includes(origin);
    const allowDevFallback = process.env.NODE_ENV !== 'production' && allowedDashboardOrigins.length === 0;
    callback(null, {
      origin: isAllowedDashboard || allowDevFallback,
      credentials: isAllowedDashboard || allowDevFallback,
    });
  }));

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
  app.use('/images', express.static(path.join(__dirname, '../public/images')));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
