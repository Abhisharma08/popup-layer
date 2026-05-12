const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(auth);

// GET /api/workspaces
router.get('/', async (req, res) => {
  const workspaces = await prisma.workspace.findMany({
    where: { userId: req.user.userId }
  });
  res.json(workspaces);
});

// POST /api/workspaces
router.post('/', async (req, res) => {
  const { name, domain } = req.body;
  const workspace = await prisma.workspace.create({
    data: { name, domain, userId: req.user.userId }
  });
  res.json(workspace);
});

router.get('/:id/members', auth, async (req, res) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.params.id }
  });
  res.json(members);
});

router.post('/:id/members', auth, async (req, res) => {
  const { email, role } = req.body;
  // In a real app, we'd lookup the user by email, or create an invite.
  // For MVP, we'll just mock the userId.
  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId: req.params.id,
      userId: email, // mocking userId as email
      role: role || 'MEMBER'
    }
  });
  res.json(member);
});

module.exports = router;
