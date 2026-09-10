(() => {
  'use strict';
  // Use the visitor's local clock; no location permission or stored preference.
  const root = document.documentElement;
  const requestedTheme = new URLSearchParams(window.location.search).get('theme');
  const previewTheme = ['day', 'night'].includes(requestedTheme) ? requestedTheme : null;
  let timer;
  function updateTheme() {
    clearTimeout(timer);
    const now = new Date();
    const hour = now.getHours();
    const theme = previewTheme || (hour >= 6 && hour < 18 ? 'day' : 'night');
    if (root.dataset.timeTheme !== theme) {
      root.dataset.timeTheme = theme;
      window.dispatchEvent(new Event('time-theme-change'));
    }
    // A preview stays selected; regular visits keep following the local clock.
    if (!previewTheme) {
      timer = setTimeout(updateTheme, 60000 - now.getSeconds() * 1000 - now.getMilliseconds());
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else updateTheme();
  });
  window.addEventListener('pageshow', updateTheme);
  updateTheme();
})();
