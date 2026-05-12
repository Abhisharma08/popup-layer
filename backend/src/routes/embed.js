const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/embed/:siteId — called by the embed script
router.get('/:siteId', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow any domain

  const workspace = await prisma.workspace.findUnique({
    where: { siteId: req.params.siteId }
  });
  if (!workspace) return res.status(404).json({ error: 'Site not found' });

  const popups = await prisma.popup.findMany({
    where: { workspaceId: workspace.id, status: 'ACTIVE' },
    select: { id: true, type: true, config: true, triggers: true, abTestEnabled: true, configB: true, triggersB: true }
  });

  const parsedPopups = popups.map(p => ({
    ...p,
    config: JSON.parse(p.config),
    triggers: JSON.parse(p.triggers),
    configB: p.configB ? JSON.parse(p.configB) : null,
    triggersB: p.triggersB ? JSON.parse(p.triggersB) : null
  }));

  res.json({ popups: parsedPopups });
});

// GET /api/embed/popup/:popupId — single popup embed (per-popup code)
router.get('/popup/:popupId', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const popup = await prisma.popup.findUnique({
    where: { id: req.params.popupId },
    select: { id: true, type: true, config: true, triggers: true, status: true, abTestEnabled: true, configB: true, triggersB: true }
  });

  if (!popup) return res.status(404).json({ error: 'Popup not found' });
  if (popup.status !== 'ACTIVE') return res.json({ popups: [] });

  const parsed = {
    ...popup,
    config: JSON.parse(popup.config),
    triggers: JSON.parse(popup.triggers),
    configB: popup.configB ? JSON.parse(popup.configB) : null,
    triggersB: popup.triggersB ? JSON.parse(popup.triggersB) : null
  };
  delete parsed.status;

  res.json({ popups: [parsed] });
});

module.exports = router;
