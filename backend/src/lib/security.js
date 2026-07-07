const net = require('net');

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
]);

function isPrivateIpv4(hostname) {
  const parts = hostname.split('.').map(part => Number(part));
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isBlockedWebhookHostname(hostname) {
  const normalized = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!normalized) return true;
  if (BLOCKED_HOSTS.has(normalized) || normalized.endsWith('.localhost') || normalized.endsWith('.local')) {
    return true;
  }

  const ipVersion = net.isIP(normalized);
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  if (ipVersion === 6) {
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:') ||
      normalized === '::'
    );
  }

  return false;
}

function assertSafeWebhookUrl(value) {
  if (!value) return value;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    const error = new Error('Webhook URL must be a valid URL');
    error.status = 400;
    throw error;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const error = new Error('Webhook URL must use http or https');
    error.status = 400;
    throw error;
  }

  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    const error = new Error('Webhook URL must use https in production');
    error.status = 400;
    throw error;
  }

  if (isBlockedWebhookHostname(parsed.hostname)) {
    const error = new Error('Webhook URL points to a blocked internal host');
    error.status = 400;
    throw error;
  }

  parsed.username = '';
  parsed.password = '';
  return parsed.toString();
}

function isHoneypotFilled(body) {
  return Boolean(body?.website || body?._gotcha || body?.company_website);
}

function sanitizeCustomFields(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  const entries = Object.entries(input).slice(0, 30);
  const cleaned = {};
  let totalLength = 0;

  for (const [rawKey, rawValue] of entries) {
    const key = String(rawKey).trim().slice(0, 80).replace(/[^\w .:-]/g, '');
    if (!key) continue;

    let value;
    if (rawValue == null) {
      value = '';
    } else if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      value = String(rawValue).trim().slice(0, 1000);
    } else {
      value = JSON.stringify(rawValue).slice(0, 1000);
    }

    totalLength += key.length + value.length;
    if (totalLength > 10000) break;
    cleaned[key] = value;
  }

  return Object.keys(cleaned).length ? cleaned : null;
}

function csvSafeValue(value) {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

module.exports = {
  isBlockedWebhookHostname,
  assertSafeWebhookUrl,
  isHoneypotFilled,
  sanitizeCustomFields,
  csvSafeValue,
};
