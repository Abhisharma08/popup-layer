import { fetchPopups, fetchPopupById, setApiBase } from './loader';
import { evaluateTriggers } from './triggers';
import { renderPopup } from './renderer';

(async function () {
  const script = document.currentScript ||
    document.querySelector('script[data-popup-id]') ||
    document.querySelector('script[data-site-id]');

  const popupId = script?.getAttribute('data-popup-id');
  const siteId = script?.getAttribute('data-site-id');
  const apiUrl = script?.getAttribute('data-api-url');

  if (!popupId && !siteId) return;
  setApiBase(apiUrl);

  // Fetch popup(s) — either a single popup or all workspace popups
  let result;
  if (popupId) {
    result = await fetchPopupById(popupId);
  } else {
    result = await fetchPopups(siteId);
  }

  const { popups } = result;
  if (!popups || popups.length === 0) return;

  for (let popup of popups) {
    let variant = "A";
    
    if (popup.abTestEnabled && popup.configB && popup.triggersB) {
      const storageKey = `poplayer_variant_${popup.id}`;
      let storedVariant = sessionStorage.getItem(storageKey);
      
      if (!storedVariant) {
        storedVariant = Math.random() < 0.5 ? "A" : "B";
        sessionStorage.setItem(storageKey, storedVariant);
      }
      variant = storedVariant;
      
      if (variant === "B") {
        popup.config = popup.configB;
        popup.triggers = popup.triggersB;
      }
    }
    
    popup.variant = variant;
    evaluateTriggers(popup, () => renderPopup(popup));
  }
})();
