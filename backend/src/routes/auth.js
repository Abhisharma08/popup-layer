const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, workspaceName } = req.body;
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaceId: workspace.id,
      siteId: workspace.siteId
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaceId: workspace.id,
      siteId: workspace.siteId
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
