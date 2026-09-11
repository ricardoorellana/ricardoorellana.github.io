(() => {
  'use strict';
  const root = document.documentElement;
  root.dataset.theme = 'matrix';
  root.dataset.motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'paused' : 'running';
})();
