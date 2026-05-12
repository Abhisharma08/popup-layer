const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const workspaceRoutes = require('./src/routes/workspaces');
const popupRoutes = require('./src/routes/popups');
const leadRoutes = require('./src/routes/leads');
const analyticsRoutes = require('./src/routes/analytics');
const embedRoutes = require('./src/routes/embed');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Serve embed script natively
app.use('/embed', express.static(path.join(__dirname, '../embed/dist')));

// Public routes (no auth)
app.use('/api/embed', embedRoutes);
app.use('/api/leads', leadRoutes);     // POST is public

// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/analytics', analyticsRoutes);

app.listen(process.env.PORT || 4000, () => {
  console.log('Server running on port ' + (process.env.PORT || 4000));
});
