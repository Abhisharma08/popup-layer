const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPopupStats } = require('../src/lib/analyticsStats');

test('buildPopupStats combines grouped event counts without per-popup queries', () => {
  const stats = buildPopupStats(
    [
      { id: 'popup-1', name: 'Newsletter' },
      { id: 'popup-2', name: 'Coupon' },
    ],
    [
      { popupId: 'popup-1', event: 'VIEW', _count: { _all: 20 } },
      { popupId: 'popup-1', event: 'SUBMIT', _count: { _all: 5 } },
      { popupId: 'popup-1', event: 'CLOSE', _count: { _all: 3 } },
      { popupId: 'popup-2', event: 'VIEW', _count: { _all: 0 } },
    ]
  );

  assert.deepEqual(stats, [
    {
      popupId: 'popup-1',
      name: 'Newsletter',
      views: 20,
      submits: 5,
      closes: 3,
      conversionRate: '25.0',
    },
    {
      popupId: 'popup-2',
      name: 'Coupon',
      views: 0,
      submits: 0,
      closes: 0,
      conversionRate: '0.0',
    },
  ]);
});
