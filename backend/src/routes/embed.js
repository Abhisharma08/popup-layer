const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');

function serializePopup(popup) {
  const parseSafe = (val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  };

  const splitHiddenFields = (config) => {
    if (!config || !Array.isArray(config.fields)) return config;

    const isHiddenField = (field) => (
      String(field?.type || '').toLowerCase() === 'hidden' || field?.hidden === true || field?.isHidden === true
    );
    const hiddenFields = config.fields
      .filter(isHiddenField)
      .map(field => ({
        ...field,
        type: 'hidden',
        required: false,
        placeholder: '',
        options: undefined,
        hidden: true,
      }));
    const visibleFields = config.fields.filter(field => !isHiddenField(field));

    return {
      ...config,
      fields: visibleFields,
      hiddenFields,
    };
  };

  const config = splitHiddenFields(parseSafe(popup.config));
  const configB = popup.configB ? splitHiddenFields(parseSafe(popup.configB)) : null;

  return {
    ...popup,
    config,
    triggers: parseSafe(popup.triggers),
    configB,
    triggersB: popup.triggersB ? parseSafe(popup.triggersB) : null,
  };
}

router.get('/popup/:popupId', asyncHandler(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const popup = await prisma.popup.findUnique({
    where: { id: req.params.popupId },
    select: {
      id: true,
      type: true,
      config: true,
      triggers: true,
      status: true,
      abTestEnabled: true,
      configB: true,
      triggersB: true,
    },
  });

  if (!popup) return res.status(404).json({ error: 'Popup not found' });
  if (popup.status !== 'ACTIVE') return res.json({ popups: [] });

  const parsed = serializePopup(popup);
  delete parsed.status;
  res.json({ popups: [parsed] });
}));

router.get('/:siteId', asyncHandler(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const workspace = await prisma.workspace.findUnique({
    where: { siteId: req.params.siteId },
  });
  if (!workspace) return res.status(404).json({ error: 'Site not found' });

  const popups = await prisma.popup.findMany({
    where: { workspaceId: workspace.id, status: 'ACTIVE' },
    select: {
      id: true,
      type: true,
      config: true,
      triggers: true,
      abTestEnabled: true,
      configB: true,
      triggersB: true,
    },
  });

  res.json({ popups: popups.map(serializePopup) });
}));

module.exports = router;
