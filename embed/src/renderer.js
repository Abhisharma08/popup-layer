import { submitLead, trackEvent } from './loader';
import { getStyles } from './styles';

export function renderPopup(popup) {
  const { id, config } = popup;

  // Inject scoped styles
  const styleEl = document.createElement('style');
  styleEl.textContent = getStyles(id, config);
  document.head.appendChild(styleEl);

  // Build popup HTML
  const overlay = document.createElement('div');
  overlay.id = `poplayer-overlay-${id}`;
  overlay.className = 'poplayer-overlay';
  overlay.innerHTML = buildHTML(id, config, popup.type);
  document.body.appendChild(overlay);

  // Track view
  trackEvent(id, 'VIEW', popup.variant);

  // Close handlers
  overlay.querySelector('.poplayer-close')?.addEventListener('click', () => {
    overlay.remove();
    trackEvent(id, 'CLOSE', popup.variant);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      trackEvent(id, 'CLOSE', popup.variant);
    }
  });

  // Form submit
  overlay.querySelector('.poplayer-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Gather all field data dynamically
    const leadData = {
      popupId: id,
      email: formData.get('email') || '',
      name: formData.get('name') || null,
      phone: formData.get('phone') || null,
      sourceUrl: window.location.href,
      variant: popup.variant
    };

    // Collect custom fields
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

    // Show success state
    overlay.querySelector('.poplayer-box').innerHTML =
      `<div class="poplayer-success">✅ ${config.successMessage || 'Thank you!'}</div>`;
    setTimeout(() => overlay.remove(), 2500);
  });
}

function buildHTML(id, config, type) {
  const fields = config.fields || [];
  
  // Support both old string-array format and new object-array format
  const fieldHTML = fields.map(f => {
    // Legacy: field is a simple string like 'email'
    if (typeof f === 'string') {
      if (f === 'email') return `<input class="poplayer-input" type="email" name="email" placeholder="Your email" required />`;
      if (f === 'name') return `<input class="poplayer-input" type="text" name="name" placeholder="Your name" />`;
      if (f === 'phone') return `<input class="poplayer-input" type="tel" name="phone" placeholder="Phone number" />`;
      return '';
    }
    
    // New: field is an object { id, label, type, placeholder, required }
    const reqAttr = f.required ? 'required' : '';
    const placeholder = f.placeholder || f.label || '';
    const name = f.id || f.label?.toLowerCase().replace(/\s+/g, '_') || '';
    
    if (f.type === 'textarea') {
      return `<textarea class="poplayer-input" name="${name}" placeholder="${placeholder}" rows="2" ${reqAttr}></textarea>`;
    }
    if (f.type === 'select') {
      return `<select class="poplayer-input" name="${name}" ${reqAttr}><option value="">${placeholder}</option></select>`;
    }
    return `<input class="poplayer-input" type="${f.type || 'text'}" name="${name}" placeholder="${placeholder}" ${reqAttr} />`;
  }).join('');

  const couponHTML = (config.showCouponCode && config.couponCode)
    ? `<div class="poplayer-coupon">${config.couponCode}</div>` : '';

  const formHTML = type !== 'ANNOUNCEMENT'
    ? `<form class="poplayer-form">${fieldHTML}<button type="submit" class="poplayer-btn">${config.ctaText || 'Submit'}</button></form>`
    : `<button class="poplayer-btn poplayer-close">${config.ctaText || 'Got it'}</button>`;

  return `
    <div class="poplayer-box" id="poplayer-box-${id}">
      ${config.closeButton !== false ? '<button class="poplayer-close">×</button>' : ''}
      <h2 class="poplayer-headline">${config.headline || ''}</h2>
      <p class="poplayer-subtext">${config.subtext || ''}</p>
      ${couponHTML}
      ${formHTML}
    </div>
  `;
}
