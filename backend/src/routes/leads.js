const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { asyncHandler, badRequest } = require('../lib/http');
const { getAccessiblePopup, requirePopupAdmin } = require('../lib/authz');
const { assertAllowedPublicOrigin } = require('../lib/domains');
const { isHoneypotFilled, sanitizeCustomFields, csvSafeValue } = require('../lib/security');
const { deliverWebhook } = require('../lib/webhooks');
const {
  cleanString,
  optionalString,
  validateEmail,
  validateOptionalUrl,
  validateVariant,
  parsePagination,
} = require('../lib/validators');

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const MAX_EXPORT_ROWS = 10000;

function csvEscape(value) {
  return `"${csvSafeValue(value).replace(/"/g, '""')}"`;
}

function buildLeadCsv(leads) {
  const customKeys = new Set();
  leads.forEach(lead => {
    if (!lead.customData) return;
    try {
      Object.keys(JSON.parse(lead.customData)).forEach(key => customKeys.add(key));
    } catch {}
  });

  const customKeysArray = Array.from(customKeys);
  const rows = [
    ['Email', 'Name', 'Phone', 'Source URL', 'Variant', 'Date', ...customKeysArray],
    ...leads.map(lead => {
      let custom = {};
      if (lead.customData) {
        try {
          custom = JSON.parse(lead.customData);
        } catch {}
      }
      return [
        lead.email,
        lead.name || '',
        lead.phone || '',
        lead.sourceUrl || '',
        lead.variant,
        lead.createdAt.toISOString(),
        ...customKeysArray.map(key => custom[key] || ''),
      ];
    }),
  ];

  return rows.map(row => row.map(csvEscape).join(',')).join('\n');
}

router.post('/', leadLimiter, asyncHandler(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (isHoneypotFilled(req.body)) {
    return res.json({ success: true });
  }

  const popupId = cleanString(req.body.popupId, 120);
  const email = validateEmail(req.body.email);
  const name = optionalString(req.body.name, 200);
  const phone = optionalString(req.body.phone, 50);
  const sourceUrl = validateOptionalUrl(req.body.sourceUrl, 'Source URL');
  const variant = validateVariant(req.body.variant);
  const customFields = sanitizeCustomFields(req.body.customFields);

  if (!popupId) return res.status(400).json({ error: 'Popup ID is required' });

  const popup = await prisma.popup.findUnique({
    where: { id: popupId },
    include: {
      workspace: {
        include: { domains: true },
      },
    },
  });
  if (!popup || popup.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Popup not found' });
  }
  await assertAllowedPublicOrigin(req, popup);

  const customDataStr = customFields ? JSON.stringify(customFields) : null;

  const lead = await prisma.lead.upsert({
    where: { popupId_email: { popupId, email } },
    update: { sourceUrl, variant, customData: customDataStr, name, phone },
    create: { popupId, email, name, phone, sourceUrl, variant, customData: customDataStr },
  });

  await prisma.analyticsEvent.create({
    data: { popupId, event: 'SUBMIT', variant },
  });

  if (popup.webhookUrl) {
    deliverWebhook({ prisma, popup, lead, customFields }).catch(() => {});
  }

  res.json({ success: true, leadId: lead.id });
}));

router.get('/', auth, asyncHandler(async (req, res) => {
  const popup = await getAccessiblePopup(req.user.userId, req.query.popupId);
  const { limit, offset } = parsePagination(req.query);

  const leads = await prisma.lead.findMany({
    where: { popupId: popup.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
  res.json(leads);
}));

router.get('/webhook-deliveries', auth, asyncHandler(async (req, res) => {
  const popup = await getAccessiblePopup(req.user.userId, req.query.popupId);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { popupId: popup.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      statusCode: true,
      lastError: true,
      url: true,
      createdAt: true,
      updatedAt: true,
      leadId: true,
      attempts: true,
      lead: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  res.json(deliveries);
}));

router.post('/webhook-deliveries/:id/retry', auth, asyncHandler(async (req, res) => {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: req.params.id },
    include: {
      popup: true,
      lead: true,
    },
  });

  if (!delivery) throw badRequest('Webhook delivery not found');
  await requirePopupAdmin(req.user.userId, delivery.popupId);

  if (!delivery.popup?.webhookUrl || !delivery.lead) {
    throw badRequest('Webhook delivery is missing popup or lead data');
  }

  let customFields = null;
  if (delivery.lead.customData) {
    try {
      customFields = JSON.parse(delivery.lead.customData);
    } catch {
      customFields = null;
    }
  }

  try {
    await deliverWebhook({
      prisma,
      popup: delivery.popup,
      lead: delivery.lead,
      customFields,
      deliveryId: delivery.id,
    });
  } catch {}

  const refreshedDelivery = await prisma.webhookDelivery.findUnique({
    where: { id: delivery.id },
    select: {
      id: true,
      status: true,
      statusCode: true,
      lastError: true,
      url: true,
      createdAt: true,
      updatedAt: true,
      leadId: true,
      attempts: true,
    },
  });

  res.json(refreshedDelivery);
}));

router.get('/export', auth, asyncHandler(async (req, res) => {
  const popup = await getAccessiblePopup(req.user.userId, req.query.popupId);
  const requestedLimit = parseInt(req.query.limit, 10) || MAX_EXPORT_ROWS;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_EXPORT_ROWS);
  const leads = await prisma.lead.findMany({
    where: { popupId: popup.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
  res.setHeader('X-Export-Limit', String(limit));
  res.send(buildLeadCsv(leads));
}));

module.exports = router;
