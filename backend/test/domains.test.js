const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeHostname,
  domainMatches,
  workspaceAllowedDomains,
  assertAllowedPublicOrigin,
} = require('../src/lib/domains');

test('normalizeHostname accepts URLs and bare domains', () => {
  assert.equal(normalizeHostname('https://www.Example.com/path'), 'example.com');
  assert.equal(normalizeHostname('sub.example.com'), 'sub.example.com');
  assert.equal(normalizeHostname('not a url'), null);
});

test('domainMatches allows exact and subdomain matches only', () => {
  assert.equal(domainMatches('https://example.com/page', 'example.com'), true);
  assert.equal(domainMatches('https://shop.example.com/page', 'example.com'), true);
  assert.equal(domainMatches('https://badexample.com/page', 'example.com'), false);
});

test('workspaceAllowedDomains combines legacy workspace domain and verified domains', () => {
  assert.deepEqual(
    workspaceAllowedDomains({
      domain: 'example.com',
      domains: [
        { domain: 'shop.example.com', verified: true },
        { domain: 'pending.example.net', verified: false },
      ],
    }).sort(),
    ['example.com', 'shop.example.com']
  );
});

test('assertAllowedPublicOrigin allows unconfigured workspaces and rejects unknown domains', async () => {
  await assertAllowedPublicOrigin(
    { body: { sourceUrl: 'https://unknown.test' }, get: () => null },
    { workspace: {} }
  );

  await assertAllowedPublicOrigin(
    { body: { sourceUrl: 'https://shop.example.com/cart' }, get: () => null },
    { workspace: { domain: 'example.com' } }
  );

  await assert.rejects(
    () => assertAllowedPublicOrigin(
      { body: { sourceUrl: 'https://attacker.test' }, get: () => null },
      { workspace: { domain: 'example.com' } }
    ),
    error => error.status === 403
  );
});
