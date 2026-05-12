const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/leads — public, called by embed script
router.post('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { popupId, email, name, phone, sourceUrl, variant = "A", customFields } = req.body;
  if (!popupId || !email) return res.status(400).json({ error: 'Missing fields' });

  const customDataStr = customFields ? JSON.stringify(customFields) : null;

  // Check if popup exists and fetch webhook URL
  const popup = await prisma.popup.findUnique({ where: { id: popupId } });
  if (!popup) return res.status(404).json({ error: 'Popup not found' });

  // Use upsert to avoid duplicate leads per popup
  const lead = await prisma.lead.upsert({
    where: { popupId_email: { popupId, email } },
    update: { sourceUrl, variant, customData: customDataStr },
    create: { popupId, email, name, phone, sourceUrl, variant, customData: customDataStr }
  });

  // Track submit event
  await prisma.analyticsEvent.create({
    data: { popupId, event: 'SUBMIT', variant }
  });

  // Webhook dispatch
  if (popup.webhookUrl) {
    try {
      fetch(popup.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, sourceUrl, popupId, variant, leadId: lead.id, customFields })
      }).catch(err => console.error("Webhook error:", err)); // async catch
    } catch (e) {}
  }

  res.json({ success: true, leadId: lead.id });
});
// GET /api/leads?popupId=xxx — protected
router.get('/', auth, async (req, res) => {
  const { popupId } = req.query;
  const leads = await prisma.lead.findMany({
    where: { popupId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(leads);
});

// GET /api/leads/export?popupId=xxx
router.get('/export', auth, async (req, res) => {
  const leads = await prisma.lead.findMany({ where: { popupId: req.query.popupId } });

  // Extract all unique custom field keys
  const customKeys = new Set();
  leads.forEach(l => {
    if (l.customData) {
      try {
        const parsed = JSON.parse(l.customData);
        Object.keys(parsed).forEach(k => customKeys.add(k));
      } catch (e) {}
    }
  });
  const customKeysArray = Array.from(customKeys);

  const csv = [
    ['Email', 'Name', 'Phone', 'Source URL', 'Date', ...customKeysArray],
    ...leads.map(l => {
      let customVals = customKeysArray.map(() => '');
      if (l.customData) {
        try {
          const parsed = JSON.parse(l.customData);
          customVals = customKeysArray.map(k => parsed[k] || '');
        } catch (e) {}
      }
      return [l.email, l.name || '', l.phone || '', l.sourceUrl || '', l.createdAt.toISOString(), ...customVals];
    })
  ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
  res.send(csv);
});

module.exports = router;
