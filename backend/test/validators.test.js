const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateEmail,
  validateOptionalUrl,
  validateStatus,
  validatePopupType,
  validateAnalyticsEvent,
  validateVariant,
  parsePagination,
} = require('../src/lib/validators');

test('validateEmail normalizes and rejects invalid emails', () => {
  assert.equal(validateEmail(' USER@Example.COM '), 'user@example.com');
  assert.throws(() => validateEmail('not-an-email'), /Valid email/);
});

test('validateOptionalUrl only accepts http and https URLs', () => {
  assert.equal(validateOptionalUrl('', 'Webhook URL'), null);
  assert.equal(validateOptionalUrl('https://example.com/hook', 'Webhook URL'), 'https://example.com/hook');
  assert.throws(() => validateOptionalUrl('javascript:alert(1)', 'Webhook URL'), /valid http\(s\) URL/);
});

test('enum validators reject unsupported values', () => {
  assert.equal(validateStatus('ACTIVE'), 'ACTIVE');
  assert.equal(validatePopupType('EMAIL_CAPTURE'), 'EMAIL_CAPTURE');
  assert.equal(validateAnalyticsEvent('VIEW'), 'VIEW');
  assert.equal(validateVariant('B'), 'B');

  assert.throws(() => validateStatus('DELETED'), /Invalid status/);
  assert.throws(() => validatePopupType('MODAL'), /Invalid popup type/);
  assert.throws(() => validateAnalyticsEvent('CLICK'), /Invalid analytics event/);
  assert.throws(() => validateVariant('C'), /Variant must be A or B/);
});

test('parsePagination clamps unsafe pagination input', () => {
  assert.deepEqual(parsePagination({ limit: '9999', offset: '-50' }), { limit: 500, offset: 0 });
  assert.deepEqual(parsePagination({ limit: '25', offset: '10' }), { limit: 25, offset: 10 });
});
