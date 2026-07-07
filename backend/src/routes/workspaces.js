const router = require('express').Router();
const auth = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');
const { getAccessibleWorkspace, requireWorkspaceAdmin } = require('../lib/authz');
const { requireString, optionalString, validateEmail } = require('../lib/validators');
const { normalizeHostname } = require('../lib/domains');

router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { userId: req.user.userId },
        { members: { some: { userId: req.user.userId } } },
      ],
    },
  });
  res.json(workspaces);
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'Workspace name', 120);
  const domain = optionalString(req.body.domain, 255);
  const workspace = await prisma.workspace.create({
    data: {
      name,
      domain,
      userId: req.user.userId,
      members: {
        create: { userId: req.user.userId, role: 'ADMIN' },
      },
    },
  });
  res.status(201).json(workspace);
}));

router.get('/:id/members', asyncHandler(async (req, res) => {
  await requireWorkspaceAdmin(req.user.userId, req.params.id);
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.params.id },
    include: {
      user: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(members);
}));

router.post('/:id/members', asyncHandler(async (req, res) => {
  await requireWorkspaceAdmin(req.user.userId, req.params.id);
  const email = validateEmail(req.body.email);
  const role = req.body.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User must sign up before they can be added' });
  }

  const member = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: user.id } },
    update: { role },
    create: {
      workspaceId: req.params.id,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
  });
  res.status(201).json(member);
}));

router.get('/:id/domains', asyncHandler(async (req, res) => {
  await requireWorkspaceAdmin(req.user.userId, req.params.id);
  const domains = await prisma.workspaceDomain.findMany({
    where: { workspaceId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(domains);
}));

router.post('/:id/domains', asyncHandler(async (req, res) => {
  await requireWorkspaceAdmin(req.user.userId, req.params.id);
  const domain = normalizeHostname(requireString(req.body.domain, 'Domain', 255));
  if (!domain) return res.status(400).json({ error: 'Valid domain is required' });

  const workspaceDomain = await prisma.workspaceDomain.upsert({
    where: { workspaceId_domain: { workspaceId: req.params.id, domain } },
    update: { verified: true },
    create: {
      workspaceId: req.params.id,
      domain,
      verified: true,
    },
  });
  res.status(201).json(workspaceDomain);
}));

router.delete('/:id/domains/:domainId', asyncHandler(async (req, res) => {
  await requireWorkspaceAdmin(req.user.userId, req.params.id);
  await prisma.workspaceDomain.deleteMany({
    where: {
      id: req.params.domainId,
      workspaceId: req.params.id,
    },
  });
  res.json({ success: true });
}));

module.exports = router;
