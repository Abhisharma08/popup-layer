const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');
const { getAccessiblePopup } = require('../lib/authz');
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

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
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

  const popupId = cleanString(req.body.popupId, 120);
  const email = validateEmail(req.body.email);
  const name = optionalString(req.body.name, 200);
  const phone = optionalString(req.body.phone, 50);
  const sourceUrl = validateOptionalUrl(req.body.sourceUrl, 'Source URL');
  const variant = validateVariant(req.body.variant);
  const customFields = req.body.customFields && typeof req.body.customFields === 'object'
    ? req.body.customFields
    : null;

  if (!popupId) return res.status(400).json({ error: 'Popup ID is required' });

  const popup = await prisma.popup.findUnique({ where: { id: popupId } });
  if (!popup || popup.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'Popup not found' });
  }

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
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      fetch(popup.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, sourceUrl, popupId, variant, leadId: lead.id, customFields }),
        signal: controller.signal,
      })
        .catch(error => console.error('Webhook error:', error.message))
        .finally(() => clearTimeout(timeout));
    } catch {}
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

router.get('/export', auth, asyncHandler(async (req, res) => {
  const popup = await getAccessiblePopup(req.user.userId, req.query.popupId);
  const leads = await prisma.lead.findMany({
    where: { popupId: popup.id },
    orderBy: { createdAt: 'desc' },
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
  res.send(buildLeadCsv(leads));
}));

module.exports = router;
