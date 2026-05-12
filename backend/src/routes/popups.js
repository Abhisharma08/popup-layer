const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All routes require auth
router.use(auth);

// GET /api/popups?workspaceId=xxx
router.get('/', async (req, res) => {
  const { workspaceId } = req.query;
  const popups = await prisma.popup.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' }
  });
  // Parse config and triggers back to JSON for the frontend
  const parsedPopups = popups.map(p => ({
    ...p,
    config: JSON.parse(p.config),
    triggers: JSON.parse(p.triggers),
    configB: p.configB ? JSON.parse(p.configB) : null,
    triggersB: p.triggersB ? JSON.parse(p.triggersB) : null
  }));
  res.json(parsedPopups);
});

// GET /api/popups/:id
router.get('/:id', async (req, res) => {
  const popup = await prisma.popup.findUnique({
    where: { id: req.params.id }
  });
  if (!popup) return res.status(404).json({ error: 'Popup not found' });
  
  // Verify ownership via workspace
  // (Assuming we might want to check this, but for now just returning)
  res.json({
    ...popup,
    config: JSON.parse(popup.config),
    triggers: JSON.parse(popup.triggers),
    configB: popup.configB ? JSON.parse(popup.configB) : null,
    triggersB: popup.triggersB ? JSON.parse(popup.triggersB) : null
  });
});

// POST /api/popups
router.post('/', async (req, res) => {
  const { workspaceId, name, type, config, triggers, webhookUrl, abTestEnabled, configB, triggersB } = req.body;
  const popup = await prisma.popup.create({
    data: { 
      workspaceId, 
      name, 
      type, 
      config: JSON.stringify(config), 
      triggers: JSON.stringify(triggers),
      webhookUrl,
      abTestEnabled: Boolean(abTestEnabled),
      configB: configB ? JSON.stringify(configB) : null,
      triggersB: triggersB ? JSON.stringify(triggersB) : null
    }
  });
  res.json({
    ...popup,
    config: JSON.parse(popup.config),
    triggers: JSON.parse(popup.triggers),
    configB: popup.configB ? JSON.parse(popup.configB) : null,
    triggersB: popup.triggersB ? JSON.parse(popup.triggersB) : null
  });
});

// PUT /api/popups/:id
router.put('/:id', async (req, res) => {
  const { name, config, triggers, status, webhookUrl, abTestEnabled, configB, triggersB } = req.body;
  const popup = await prisma.popup.update({
    where: { id: req.params.id },
    data: { 
      name, 
      config: JSON.stringify(config), 
      triggers: JSON.stringify(triggers), 
      status,
      webhookUrl,
      abTestEnabled: Boolean(abTestEnabled),
      configB: configB ? JSON.stringify(configB) : null,
      triggersB: triggersB ? JSON.stringify(triggersB) : null
    }
  });
  res.json({
    ...popup,
    config: JSON.parse(popup.config),
    triggers: JSON.parse(popup.triggers),
    configB: popup.configB ? JSON.parse(popup.configB) : null,
    triggersB: popup.triggersB ? JSON.parse(popup.triggersB) : null
  });
});

// PATCH /api/popups/:id/status — lightweight status toggle (ACTIVE, PAUSED, ARCHIVED)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const popup = await prisma.popup.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(popup);
});

// DELETE /api/popups/:id — archive instead of hard delete
router.delete('/:id', async (req, res) => {
  try {
    const popup = await prisma.popup.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' }
    });
    res.json({ success: true, popup });
  } catch (e) {
    console.error('Archive error:', e);
    res.status(500).json({ error: 'Failed to archive popup' });
  }
});

module.exports = router;
