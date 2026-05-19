import { fetchPopups, fetchPopupById, setApiBase, inferApiBaseFromScript } from './loader';
import { evaluateTriggers } from './triggers';
import { renderPopup } from './renderer';

function findEmbedScript() {
  const fromCurrent = document.currentScript;
  if (fromCurrent?.src && /poplayer\.iife\.js/i.test(fromCurrent.src)) return fromCurrent;

  const all = document.querySelectorAll('script[data-popup-id], script[data-site-id]');
  for (const s of all) {
    if (s.src && /poplayer\.iife\.js/i.test(s.src)) return s;
  }

  const byBundle = document.querySelector('script[src*="poplayer.iife.js"]');
  if (byBundle) return byBundle;

  return (
    fromCurrent ||
    document.querySelector('script[data-popup-id]') ||
    document.querySelector('script[data-site-id]')
  );
}

function getParam(script, names) {
  if (!script?.src) return null;

  try {
    const url = new URL(script.src);
    for (const name of names) {
      const value = url.searchParams.get(name);
      if (value) return value;
    }
  } catch {}

  return null;
}

function getGlobalConfig() {
  return (
    window.PopLayerConfig ||
    window.popLayerConfig ||
    window.poplayerConfig ||
    {}
  );
}

function getEmbedConfig(script) {
  const globalConfig = getGlobalConfig();

  return {
    popupId:
      script?.getAttribute('data-popup-id') ||
      getParam(script, ['popupId', 'popup_id', 'pl_popup_id']) ||
      globalConfig.popupId ||
      globalConfig.popup_id,
    siteId:
      script?.getAttribute('data-site-id') ||
      script?.getAttribute('data-workspace-id') ||
      getParam(script, ['siteId', 'site_id', 'workspaceId', 'workspace_id', 'pl_site_id']) ||
      globalConfig.siteId ||
      globalConfig.site_id ||
      globalConfig.workspaceId ||
      globalConfig.workspace_id,
    apiUrl:
      script?.getAttribute('data-api-url') ||
      getParam(script, ['apiUrl', 'api_url', 'pl_api_url']) ||
      globalConfig.apiUrl ||
      globalConfig.api_url,
  };
}

(async function () {
  const script = findEmbedScript();

  const { popupId, siteId, apiUrl } = getEmbedConfig(script);

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
