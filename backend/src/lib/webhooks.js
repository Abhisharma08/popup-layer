async function deliverWebhook({ prisma, popup, lead, customFields, deliveryId, fetchImpl = fetch }) {
  if (!popup?.webhookUrl || !lead?.id) return null;

  const delivery = deliveryId
    ? await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PENDING',
        statusCode: null,
        lastError: null,
        attempts: { increment: 1 },
      },
    })
    : await prisma.webhookDelivery.create({
      data: {
        popupId: popup.id,
        leadId: lead.id,
        url: popup.webhookUrl,
        status: 'PENDING',
      },
    });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const webhookRes = await fetchImpl(popup.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        sourceUrl: lead.sourceUrl,
        popupId: popup.id,
        variant: lead.variant,
        leadId: lead.id,
        customFields,
      }),
      signal: controller.signal,
    });

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: webhookRes.ok ? 'SUCCESS' : 'FAILED',
        statusCode: webhookRes.status,
        lastError: webhookRes.ok ? null : `Webhook returned HTTP ${webhookRes.status}`,
      },
    });

    return webhookRes;
  } catch (error) {
    console.error('Webhook error:', error.message);
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'FAILED',
        lastError: String(error.message || error).slice(0, 1000),
      },
    }).catch(() => {});
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  deliverWebhook,
};
