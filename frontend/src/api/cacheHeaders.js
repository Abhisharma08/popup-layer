const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export function applyNoCacheHeaders(config = {}) {
  const method = (config.method || 'get').toLowerCase();
  const nextConfig = {
    ...config,
    headers: {
      ...(config.headers || {}),
      ...NO_CACHE_HEADERS,
    },
  };

  if (method === 'get') {
    nextConfig.params = {
      ...(config.params || {}),
      _t: Date.now(),
    };
  }

  return nextConfig;
}
