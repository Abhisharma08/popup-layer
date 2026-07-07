function normalizeHostname(value) {
  if (!value) return null;
  try {
    const input = String(value).trim();
    const url = input.includes('://') ? new URL(input) : new URL(`https://${input}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function originHostname(req) {
  return (
    normalizeHostname(req.body?.sourceUrl) ||
    normalizeHostname(req.get('origin')) ||
    normalizeHostname(req.get('referer'))
  );
}

function domainMatches(hostname, allowedDomain) {
  const host = normalizeHostname(hostname);
  const allowed = normalizeHostname(allowedDomain);
  if (!host || !allowed) return false;
  return host === allowed || host.endsWith(`.${allowed}`);
}

function workspaceAllowedDomains(workspace) {
  const domains = new Set();
  if (workspace?.domain) domains.add(workspace.domain);
  if (Array.isArray(workspace?.domains)) {
    workspace.domains.forEach(domain => {
      if (domain?.domain && domain.verified !== false) domains.add(domain.domain);
    });
  }
  return Array.from(domains);
}

async function assertAllowedPublicOrigin(req, popup) {
  const allowedDomains = workspaceAllowedDomains(popup?.workspace);
  if (allowedDomains.length === 0) return;

  const host = originHostname(req);
  if (allowedDomains.some(domain => domainMatches(host, domain))) return;

  const error = new Error('This popup is not allowed on this domain');
  error.status = 403;
  throw error;
}

module.exports = {
  normalizeHostname,
  originHostname,
  domainMatches,
  workspaceAllowedDomains,
  assertAllowedPublicOrigin,
};
