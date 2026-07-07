const test = require('node:test');
const assert = require('node:assert/strict');

const { deliverWebhook } = require('../src/lib/webhooks');

function createPrismaMock() {
  const created = [];
  const updated = [];

  return {
    created,
    updated,
    webhookDelivery: {
      create: async ({ data }) => {
        const row = { id: 'delivery-1', attempts: 1, ...data };
        created.push(row);
        return row;
      },
      update: async ({ where, data }) => {
        const row = { id: where.id, ...data };
        updated.push(row);
        return row;
      },
    },
  };
}

test('deliverWebhook creates a delivery and marks success', async () => {
  const prisma = createPrismaMock();

  await deliverWebhook({
    prisma,
    popup: { id: 'popup-1', webhookUrl: 'https://example.com/hook' },
    lead: {
      id: 'lead-1',
      email: 'user@example.com',
      name: 'User',
      phone: null,
      sourceUrl: 'https://site.test',
      variant: 'A',
    },
    customFields: { campaign: 'summer' },
    fetchImpl: async () => ({ ok: true, status: 200 }),
  });

  assert.equal(prisma.created.length, 1);
  assert.deepEqual(prisma.updated.at(-1), {
    id: 'delivery-1',
    status: 'SUCCESS',
    statusCode: 200,
    lastError: null,
  });
});

test('deliverWebhook updates an existing delivery and marks failure', async () => {
  const prisma = createPrismaMock();

  await assert.rejects(
    () => deliverWebhook({
      prisma,
      popup: { id: 'popup-1', webhookUrl: 'https://example.com/hook' },
      lead: {
        id: 'lead-1',
        email: 'user@example.com',
        name: 'User',
        phone: null,
        sourceUrl: 'https://site.test',
        variant: 'B',
      },
      customFields: null,
      deliveryId: 'delivery-9',
      fetchImpl: async () => {
        throw new Error('timed out');
      },
    }),
    /timed out/
  );

  assert.deepEqual(prisma.updated[0], {
    id: 'delivery-9',
    status: 'PENDING',
    statusCode: null,
    lastError: null,
    attempts: { increment: 1 },
  });
  assert.equal(prisma.updated.at(-1).status, 'FAILED');
});
