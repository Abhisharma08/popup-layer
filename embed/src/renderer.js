import { submitLead, trackEvent, apiBase } from './loader';
import { getStyles } from './styles';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeFieldName(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
}

export function renderPopup(popup) {
  const { id, config } = popup;

  if (document.getElementById(`poplayer-overlay-${id}`)) return;

  const styleEl = document.createElement('style');
  styleEl.textContent = getStyles(id, config);
  document.head.appendChild(styleEl);

  const overlay = document.createElement('div');
  overlay.id = `poplayer-overlay-${id}`;
  overlay.className = 'poplayer-overlay';
  overlay.innerHTML = buildHTML(id, config, popup.type);
  document.body.appendChild(overlay);

  trackEvent(id, 'VIEW', popup.variant);

  overlay.querySelector('.poplayer-close')?.addEventListener('click', () => {
    overlay.remove();
    trackEvent(id, 'CLOSE', popup.variant);
  });


  overlay.querySelector('.poplayer-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const leadData = {
      popupId: id,
      email: formData.get('email') || '',
      name: formData.get('name') || null,
      phone: formData.get('phone') || null,
      sourceUrl: window.location.href,
      variant: popup.variant,
    };

    const customFields = {};
    for (const [key, value] of formData.entries()) {
      if (!['email', 'name', 'phone'].includes(key)) {
        customFields[key] = value;
      }
    }
    if (Object.keys(customFields).length > 0) {
      leadData.customFields = customFields;
    }

    await submitLead(leadData);

    overlay.querySelector('.poplayer-box').innerHTML =
      `<div class="poplayer-success">${escapeHtml(config.successMessage || 'Thank you!')}</div>`;
    setTimeout(() => overlay.remove(), 2500);
  });
}

function buildHTML(id, config, type) {
  const fields = config.fields || [];

  const fieldHTML = fields.map(field => {
    const reqAttr = field.required ? 'required' : '';
    const placeholder = escapeHtml(field.placeholder || field.label || '');
    const name = safeFieldName(field.id || field.label || '');
    const typeAttr = ['text', 'email', 'tel', 'number', 'url'].includes(field.type) ? field.type : 'text';

    if (field.type === 'textarea') {
      return `<textarea class="poplayer-input" name="${name}" placeholder="${placeholder}" rows="2" ${reqAttr}></textarea>`;
    }
    return `<input class="poplayer-input" type="${typeAttr}" name="${name}" placeholder="${placeholder}" ${reqAttr} />`;
  }).join('');

  const couponHTML = config.showCouponCode && config.couponCode
    ? `<div class="poplayer-coupon">${escapeHtml(config.couponCode)}</div>`
    : '';

  const formHTML = type !== 'ANNOUNCEMENT'
    ? `<form class="poplayer-form">${fieldHTML}<button type="submit" class="poplayer-btn">${escapeHtml(config.ctaText || 'Submit')}</button></form>`
    : `<button class="poplayer-btn poplayer-close">${escapeHtml(config.ctaText || 'Got it')}</button>`;

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Prefix relative paths with the API domain
    const base = apiBase.replace(/\/api$/, '').replace(/\/$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isSideBySide = config.layout === 'side-by-side' && config.imageUrl;
  
  const imageHTML = config.imageUrl 
    ? `<div class="poplayer-image"><img src="${getFullImageUrl(config.imageUrl)}" alt="Popup" /></div>`
    : '';

  const textContent = `
    <div class="poplayer-content">
      ${config.closeButton !== false ? '<button class="poplayer-close">&times;</button>' : ''}
      <h2 class="poplayer-headline">${escapeHtml(config.headline || '')}</h2>
      <p class="poplayer-subtext">${escapeHtml(config.subtext || '')}</p>
      ${couponHTML}
      ${formHTML}
    </div>
  `;

  return `
    <div class="poplayer-box ${isSideBySide ? 'side-by-side' : ''}" id="poplayer-box-${id}">
      ${isSideBySide && config.imageSide === 'left' ? imageHTML : ''}
      ${textContent}
      ${isSideBySide && config.imageSide === 'right' ? imageHTML : ''}
    </div>
  `;
}
