const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');
const { getAccessibleWorkspace } = require('../lib/authz');
const { cleanString, validateAnalyticsEvent, validateVariant } = require('../lib/validators');

const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', auth, asyncHandler(async (req, res) => {
  const workspace = await getAccessibleWorkspace(req.user.userId, req.query.workspaceId);
  const popups = await prisma.popup.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true },
  });

  const stats = await Promise.all(popups.map(async (popup) => {
    const [views, submits] = await Promise.all([
      prisma.analyticsEvent.count({ where: { popupId: popup.id, event: 'VIEW' } }),
      prisma.analyticsEvent.count({ where: { popupId: popup.id, event: 'SUBMIT' } }),
    ]);
    return {
      popupId: popup.id,
      name: popup.name,
      views,
      submits,
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : '0.0',
    };
  }));

  res.json(stats);
}));

router.post('/event', eventLimiter, asyncHandler(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const popupId = cleanString(req.body.popupId, 120);
  const event = validateAnalyticsEvent(req.body.event);
  const variant = validateVariant(req.body.variant);

  if (!popupId) return res.status(400).json({ error: 'Popup ID is required' });

  const popup = await prisma.popup.findUnique({
    where: { id: popupId },
    select: { id: true, status: true },
  });
  if (!popup || popup.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Popup not found' });
  }

  await prisma.analyticsEvent.create({ data: { popupId, event, variant } });
  res.json({ ok: true });
}));

module.exports = router;
