export function evaluateTriggers(popup, callback) {
  const { triggers } = popup;

  // Check frequency (once per session, etc.)
  const storageKey = `poplayer_shown_${popup.id}`;
  if (triggers.frequency === 'once_per_session' && sessionStorage.getItem(storageKey)) return;
  if (triggers.frequency === 'once_per_day') {
    const lastShown = localStorage.getItem(storageKey);
    if (lastShown && Date.now() - lastShown < 86400000) return;
  }

  // URL match check
  if (triggers.urlMatch) {
    const pattern = new RegExp(triggers.urlMatch);
    if (!pattern.test(window.location.href)) return;
  }

  // Device check
  const isMobile = window.innerWidth < 768;
  if (triggers.device === 'mobile' && !isMobile) return;
  if (triggers.device === 'desktop' && isMobile) return;

  // Trigger type
  if (triggers.type === 'time_delay') {
    setTimeout(() => {
      markShown(storageKey, triggers.frequency);
      callback();
    }, (triggers.delaySeconds || 5) * 1000);
  }

  else if (triggers.type === 'scroll_percent') {
    const onScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= (triggers.scrollPercent || 50)) {
        window.removeEventListener('scroll', onScroll);
        markShown(storageKey, triggers.frequency);
        callback();
      }
    };
    window.addEventListener('scroll', onScroll);
  }

  else if (triggers.type === 'exit_intent') {
    const onMouseLeave = (e) => {
      if (e.clientY <= 5) {
        document.removeEventListener('mouseleave', onMouseLeave);
        markShown(storageKey, triggers.frequency);
        callback();
      }
    };
    document.addEventListener('mouseleave', onMouseLeave);
  } else {
    // immediate or default
    markShown(storageKey, triggers.frequency);
    callback();
  }
}

function markShown(key, frequency) {
  if (frequency === 'once_per_session') sessionStorage.setItem(key, '1');
  if (frequency === 'once_per_day') localStorage.setItem(key, Date.now());
}
