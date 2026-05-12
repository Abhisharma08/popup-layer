const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');
const { validateEmail, requireString, optionalString } = require('../lib/validators');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/signup
router.post('/signup', asyncHandler(async (req, res) => {
    const email = validateEmail(req.body.email);
    const password = requireString(req.body.password, 'Password', 128);
    const workspaceName = optionalString(req.body.workspaceName, 120);
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: workspaceName || email.split('@')[0] }
    });

    // Auto-create a workspace for new users
    const workspace = await prisma.workspace.create({
      data: {
        userId: user.id,
        name: workspaceName || `${email.split('@')[0]}'s Workspace`
      }
    });

    // Make the owner an ADMIN member
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, role: 'ADMIN' }
    });

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaceId: workspace.id,
      siteId: workspace.siteId
    });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
    const email = validateEmail(req.body.email);
    const password = requireString(req.body.password, 'Password', 128);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    // Find user's workspace (first one they own)
    let workspace = await prisma.workspace.findFirst({ where: { userId: user.id } });

    // If no workspace exists, create one (backward compat for old accounts)
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          userId: user.id,
          name: `${user.email.split('@')[0]}'s Workspace`
        }
      });
      await prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: 'ADMIN' }
      });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaceId: workspace.id,
      siteId: workspace.siteId
    });
}));

module.exports = router;
