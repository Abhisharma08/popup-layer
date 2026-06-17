export function getStyles(id, config) {
  const { bgColor = '#fff', accentColor = '#6366f1', textColor = '#111',
          borderRadius = 12 } = config;

  return `
    #poplayer-overlay-${id} {
      all: initial;
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: normal;
    }
    #poplayer-overlay-${id} .poplayer-box {
      background: ${bgColor}; color: ${textColor};
      border-radius: ${borderRadius}px;
      width: 90%; max-width: 440px;
      position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.3);
      animation: plFadeIn 0.3s ease;
      overflow: hidden; display: flex; flex-direction: column;
    }
    #poplayer-overlay-${id} .poplayer-box.side-by-side {
      flex-direction: row; max-width: 700px;
    }
    #poplayer-overlay-${id} .poplayer-content {
      padding: 2rem; flex: 1; position: relative;
    }
    #poplayer-overlay-${id} .poplayer-image {
      flex: 1; overflow: hidden; min-height: 200px;
    }
    #poplayer-overlay-${id} * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
    }
    #poplayer-overlay-${id} .poplayer-image img {
      width: 100%; height: 100%; object-fit: cover;
      display: block; min-height: 100%;
    }
    #poplayer-overlay-${id} .poplayer-close {
      position: absolute; top: 12px; right: 16px;
      background: none; border: none; font-size: 1.5rem;
      cursor: pointer; color: #999; line-height: 1; z-index: 10;
    }
    #poplayer-overlay-${id} .poplayer-headline {
      font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem;
    }
    #poplayer-overlay-${id} .poplayer-subtext {
      font-size: 0.9rem; opacity: 0.7; margin-bottom: 1.25rem;
    }
    #poplayer-overlay-${id} .poplayer-input {
      width: 100%; padding: 0.6rem 0.85rem;
      border: 1px solid #e5e7eb; border-radius: 8px;
      margin-bottom: 0.75rem; font-size: 0.9rem; box-sizing: border-box;
    }
    #poplayer-overlay-${id} .poplayer-btn {
      width: 100%; padding: 0.75rem;
      background: ${accentColor}; color: white;
      border: none; border-radius: 8px;
      font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    #poplayer-overlay-${id} .poplayer-coupon {
      border: 2px dashed ${accentColor}; color: ${accentColor};
      text-align: center; padding: 0.75rem;
      border-radius: 8px; font-family: monospace;
      font-size: 1.25rem; font-weight: 700;
      letter-spacing: 0.15em; margin-bottom: 1rem;
    }
    #poplayer-overlay-${id} .poplayer-success {
      text-align: center; padding: 2rem; font-size: 1.1rem; font-weight: 600;
    }

    @media (max-width: 640px) {
      #poplayer-overlay-${id} .poplayer-box.side-by-side {
        flex-direction: column;
        max-width: 400px;
      }
      #poplayer-overlay-${id} .poplayer-image {
        min-height: 160px;
        max-height: 200px;
      }
      #poplayer-overlay-${id} .poplayer-headline {
        font-size: 1.25rem;
      }
      #poplayer-overlay-${id} .poplayer-content {
        padding: 1.5rem;
      }
    }

    @keyframes plFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
  `;
}
