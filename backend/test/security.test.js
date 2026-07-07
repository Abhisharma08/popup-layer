const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isBlockedWebhookHostname,
  assertSafeWebhookUrl,
  sanitizeCustomFields,
  csvSafeValue,
  isHoneypotFilled,
} = require('../src/lib/security');

test('blocks private and local webhook hosts', () => {
  assert.equal(isBlockedWebhookHostname('localhost'), true);
  assert.equal(isBlockedWebhookHostname('127.0.0.1'), true);
  assert.equal(isBlockedWebhookHostname('10.0.0.5'), true);
  assert.equal(isBlockedWebhookHostname('172.16.0.5'), true);
  assert.equal(isBlockedWebhookHostname('192.168.1.10'), true);
  assert.equal(isBlockedWebhookHostname('169.254.169.254'), true);
  assert.equal(isBlockedWebhookHostname('example.com'), false);
});

test('assertSafeWebhookUrl strips credentials and rejects blocked hosts', () => {
  assert.equal(assertSafeWebhookUrl('https://user:pass@example.com/hook'), 'https://example.com/hook');
  assert.throws(() => assertSafeWebhookUrl('http://127.0.0.1:3000/hook'), /blocked internal host/);
  assert.throws(() => assertSafeWebhookUrl('javascript:alert(1)'), /http or https/);
});

test('sanitizeCustomFields keeps flat bounded values', () => {
  const custom = sanitizeCustomFields({
    'Campaign!': '  Summer  ',
    nested: { unsafe: true },
    empty: null,
  });

  assert.deepEqual(custom, {
    Campaign: 'Summer',
    nested: '{"unsafe":true}',
    empty: '',
  });
});

test('csvSafeValue prefixes spreadsheet formulas', () => {
  assert.equal(csvSafeValue('=IMPORTXML("https://example.com")'), '\'=IMPORTXML("https://example.com")');
  assert.equal(csvSafeValue('+cmd'), "'+cmd");
  assert.equal(csvSafeValue('normal'), 'normal');
});

test('isHoneypotFilled detects common bot fields', () => {
  assert.equal(isHoneypotFilled({ website: 'https://spam.test' }), true);
  assert.equal(isHoneypotFilled({ _gotcha: '1' }), true);
  assert.equal(isHoneypotFilled({ email: 'user@example.com' }), false);
});
