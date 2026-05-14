export let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function setApiBase(value) {
  if (value && /^https?:\/\//i.test(value)) {
    apiBase = value.replace(/\/$/, '');
    console.log('PopLayer: API Base set to', apiBase);
  }
}

/** When the script is served from the same host as the API (e.g. /embed/*.js → /api), avoid localhost baked into the bundle. */
export function inferApiBaseFromScript(script) {
  if (!script?.src) return null;
  try {
    const u = new URL(script.src);
    return `${u.origin}/api`;
  } catch {
    return null;
  }
}

export async function fetchPopups(siteId) {
  try {
    const res = await fetch(`${apiBase}/embed/${siteId}`);
    return await res.json();
  } catch {
    return { popups: [] };
  }
}

export async function fetchPopupById(popupId) {
  try {
    const res = await fetch(`${apiBase}/embed/popup/${popupId}`);
    return await res.json();
  } catch {
    return { popups: [] };
  }
}

export async function submitLead(data) {
  try {
    await fetch(`${apiBase}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('PopLayer: lead submission failed', e);
  }
}

export async function trackEvent(popupId, event, variant = "A") {
  try {
    await fetch(`${apiBase}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ popupId, event, variant })
    });
  } catch {}
}
