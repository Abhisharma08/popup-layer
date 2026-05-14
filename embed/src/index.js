import { fetchPopups, fetchPopupById, setApiBase, inferApiBaseFromScript } from './loader';
import { evaluateTriggers } from './triggers';
import { renderPopup } from './renderer';

function findEmbedScript() {
  const byBundle = document.querySelector('script[src*="poplayer.iife.js"]');
  if (byBundle) return byBundle;

  const fromCurrent = document.currentScript;
  if (fromCurrent?.src && /poplayer\.iife\.js/i.test(fromCurrent.src)) return fromCurrent;

  const all = document.querySelectorAll('script[data-popup-id], script[data-site-id]');
  for (const s of all) {
    if (s.src && /poplayer\.iife\.js/i.test(s.src)) return s;
  }

  return (
    fromCurrent ||
    document.querySelector('script[data-popup-id]') ||
    document.querySelector('script[data-site-id]')
  );
}

(async function () {
  const script = findEmbedScript();

  const popupId = script?.getAttribute('data-popup-id');
  const siteId = script?.getAttribute('data-site-id');
  const apiUrl = script?.getAttribute('data-api-url');

  if (!popupId && !siteId) return;
  const inferred = inferApiBaseFromScript(script);
  setApiBase(apiUrl || inferred);

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
