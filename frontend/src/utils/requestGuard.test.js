import test from 'node:test';
import assert from 'node:assert/strict';
import { createLatestRequestGuard } from './requestGuard.js';

test('createLatestRequestGuard ignores stale requests', () => {
  const guard = createLatestRequestGuard();

  const firstRequest = guard.begin();
  const secondRequest = guard.begin();

  assert.equal(guard.isCurrent(firstRequest), false);
  assert.equal(guard.isCurrent(secondRequest), true);
});
