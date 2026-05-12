const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/analytics?workspaceId=xxx
router.get('/', auth, async (req, res) => {
  const popups = await prisma.popup.findMany({
    where: { workspaceId: req.query.workspaceId },
    include: { _count: { select: { leads: true, events: true } } }
  });

  const stats = await Promise.all(popups.map(async (p) => {
    const views = await prisma.analyticsEvent.count({ where: { popupId: p.id, event: 'VIEW' } });
    const submits = await prisma.analyticsEvent.count({ where: { popupId: p.id, event: 'SUBMIT' } });
    return {
      popupId: p.id,
      name: p.name,
      views,
      submits,
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : '0.0'
    };
  }));

  res.json(stats);
});

// POST /api/analytics/event — public (called by embed script)
router.post('/event', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { popupId, event, variant = "A" } = req.body;
  await prisma.analyticsEvent.create({ data: { popupId, event, variant } });
  res.json({ ok: true });
});

module.exports = router;
