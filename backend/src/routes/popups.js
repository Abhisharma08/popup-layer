const router = require('express').Router();
const auth = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');
const { getAccessibleWorkspace, getAccessiblePopup } = require('../lib/authz');
const {
  requireString,
  validateJsonObject,
  validateOptionalUrl,
  validatePopupType,
  validateStatus,
} = require('../lib/validators');

router.use(auth);

function serializePopup(popup) {
  return {
    ...popup,
    config: JSON.parse(popup.config),
    triggers: JSON.parse(popup.triggers),
    configB: popup.configB ? JSON.parse(popup.configB) : null,
    triggersB: popup.triggersB ? JSON.parse(popup.triggersB) : null,
  };
}

function popupDataFromBody(body, isCreate = false) {
  const data = {
    name: requireString(body.name, 'Popup name', 120),
    config: JSON.stringify(validateJsonObject(body.config, 'Config')),
    triggers: JSON.stringify(validateJsonObject(body.triggers, 'Triggers')),
    webhookUrl: validateOptionalUrl(body.webhookUrl, 'Webhook URL'),
    abTestEnabled: Boolean(body.abTestEnabled),
    configB: body.configB ? JSON.stringify(validateJsonObject(body.configB, 'Variant B config')) : null,
    triggersB: body.triggersB ? JSON.stringify(validateJsonObject(body.triggersB, 'Variant B triggers')) : null,
  };

  if (isCreate) {
    data.type = validatePopupType(body.type);
    data.workspaceId = requireString(body.workspaceId, 'Workspace ID', 120);
  } else if (body.status) {
    data.status = validateStatus(body.status);
  }

  return data;
}

router.get('/', asyncHandler(async (req, res) => {
  const workspace = await getAccessibleWorkspace(req.user.userId, req.query.workspaceId);
  const popups = await prisma.popup.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(popups.map(serializePopup));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const popup = await getAccessiblePopup(req.user.userId, req.params.id);
  res.json(serializePopup(popup));
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = popupDataFromBody(req.body, true);
  await getAccessibleWorkspace(req.user.userId, data.workspaceId);

  const popup = await prisma.popup.create({ data });
  res.status(201).json(serializePopup(popup));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  await getAccessiblePopup(req.user.userId, req.params.id);
  const data = popupDataFromBody(req.body);

  const popup = await prisma.popup.update({
    where: { id: req.params.id },
    data,
  });
  res.json(serializePopup(popup));
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  await getAccessiblePopup(req.user.userId, req.params.id);
  const status = validateStatus(req.body.status);

  const popup = await prisma.popup.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(popup);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await getAccessiblePopup(req.user.userId, req.params.id);

  const popup = await prisma.popup.update({
    where: { id: req.params.id },
    data: { status: 'ARCHIVED' },
  });
  res.json({ success: true, popup });
}));

module.exports = router;
