const API_BASE = 'http://localhost:4000/api';

export async function fetchPopups(siteId) {
  try {
    const res = await fetch(`${API_BASE}/embed/${siteId}`);
    return await res.json();
  } catch {
    return { popups: [] };
  }
}

export async function fetchPopupById(popupId) {
  try {
    const res = await fetch(`${API_BASE}/embed/popup/${popupId}`);
    return await res.json();
  } catch {
    return { popups: [] };
  }
}

export async function submitLead(data) {
  try {
    await fetch(`${API_BASE}/leads`, {
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
    await fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ popupId, event, variant })
    });
  } catch {}
}
