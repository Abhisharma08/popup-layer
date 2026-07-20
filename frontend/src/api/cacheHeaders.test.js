import test from 'node:test';
import assert from 'node:assert/strict';
import { applyNoCacheHeaders } from './cacheHeaders.js';

test('applyNoCacheHeaders adds no-cache headers and cache-busting query params', () => {
  const config = applyNoCacheHeaders({ method: 'get', params: { popupId: 'abc' } });

  assert.equal(config.headers['Cache-Control'], 'no-store, no-cache, must-revalidate, proxy-revalidate');
  assert.equal(config.headers.Pragma, 'no-cache');
  assert.equal(config.headers.Expires, '0');
  assert.match(String(config.params._t), /^\d+$/);
  assert.equal(config.params.popupId, 'abc');
});
