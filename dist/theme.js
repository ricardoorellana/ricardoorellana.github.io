(() => {
  'use strict';
  // Use the visitor's local clock; no location permission or stored preference.
  const root = document.documentElement;
  let timer;
  function updateTheme() {
    clearTimeout(timer);
    const now = new Date();
    const hour = now.getHours();
    const theme = hour >= 6 && hour < 18 ? 'day' : 'night';
    if (root.dataset.timeTheme !== theme) {
      root.dataset.timeTheme = theme;
      window.dispatchEvent(new Event('time-theme-change'));
    }
    // Recheck at the next minute, including when the clock or timezone changes.
    timer = setTimeout(updateTheme, 60000 - now.getSeconds() * 1000 - now.getMilliseconds());
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else updateTheme();
  });
  window.addEventListener('pageshow', updateTheme);
  updateTheme();
})();
