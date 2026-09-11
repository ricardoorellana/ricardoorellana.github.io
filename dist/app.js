/* A dependency-free Matrix portfolio. No commands leave the browser. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, frame = 0, lastFrame = 0, time = 0, boostedUntil = 0;
  let toastTimer, clockTimer;
  const motion = $('#motion');
  const boost = $('#matrix-mode');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789<>/{}';
  const scenes = [];
  let portraitVisible = true;

  function notify(message) {
    const toast = $('#toast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
  }

  // Both canvases share one capped loop. The hidden tab and pause control stop it.
  function createScene(canvas, portrait) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx, portrait, width: 0, height: 0, columns: [], mask: null };
  }
  for (const [selector, portrait] of [['#matrix-background', false], ['#matrix-portrait', true]]) {
    const scene = createScene($(selector), portrait);
    if (scene) scenes.push(scene);
  }
  function resizeScenes() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    for (const scene of scenes) {
      const { canvas, ctx, portrait } = scene;
      scene.width = canvas.clientWidth;
      scene.height = canvas.clientHeight;
      if (!scene.width || !scene.height) continue;
      canvas.width = Math.round(scene.width * dpr);
      canvas.height = Math.round(scene.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.cell = portrait ? 10 : 24;
      const rows = Math.ceil(scene.height / scene.cell);
      scene.columns = Array.from({ length: Math.ceil(scene.width / scene.cell) }, (_, i) => ({
        y: Math.random() * (rows + 24), speed: .015 + Math.random() * .025,
        length: 8 + Math.random() * 20, seed: i * 31 + Math.floor(Math.random() * 999)
      }));
      if (portrait) {
        const mask = document.createElement('canvas');
        mask.width = Math.ceil(scene.width); mask.height = Math.ceil(scene.height);
        const m = mask.getContext('2d', { willReadFrequently: true });
        m.fillStyle = '#fff';
        m.textAlign = 'center'; m.textBaseline = 'middle';
        m.font = `900 ${Math.min(scene.width * .57, scene.height * .84)}px Arial`;
        m.fillText('RO', scene.width / 2, scene.height * .47);
        scene.mask = m.getImageData(0, 0, mask.width, mask.height);
        $('.code-portrait').classList.add('canvas-ready');
      }
      drawScene(scene, 0);
    }
  }
  function drawScene(scene, dt) {
    const { ctx, width, height, cell, columns, portrait, mask } = scene;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${portrait ? 9 : 13}px monospace`;
    ctx.textAlign = 'center';
    const rows = Math.ceil(height / cell);
    const boosted = boostedUntil > time;
    columns.forEach((column, x) => {
      column.y = (column.y + dt * column.speed * (boosted ? 3 : 1)) % (rows + column.length);
      for (let y = 0; y < rows; y++) {
        const distance = (column.y - y + rows + column.length) % (rows + column.length);
        const tail = distance < column.length ? 1 - distance / column.length : 0;
        const px = x * cell + cell / 2, py = y * cell + cell / 2;
        const inside = portrait && mask && mask.data[(Math.min(Math.floor(py), mask.height - 1) * mask.width + Math.min(Math.floor(px), mask.width - 1)) * 4 + 3] > 100;
        if (!inside && tail < .08 && !portrait) continue;
        const noise = Math.sin(x * 17 + y * 11 + time * .0013) * .12;
        const alpha = inside ? .45 + tail * .48 + noise : tail * (portrait ? .27 : .55);
        if (alpha < .025) continue;
        const lead = tail > .96;
        ctx.fillStyle = lead || (inside && tail > .7) ? `rgba(187,255,208,${Math.min(alpha, 1)})` : `rgba(87,237,131,${Math.min(alpha, 1)})`;
        const index = Math.abs((column.seed + y * 13 + Math.floor(time / (inside ? 280 : 160))) % glyphs.length);
        ctx.fillText(glyphs[index], px, py + cell * .4);
      }
    });
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (now - lastFrame < 1000 / 24) return;
    const dt = lastFrame ? Math.min(now - lastFrame, 80) : 0;
    lastFrame = now;
    time += dt;
    for (const scene of scenes) if (!scene.portrait || portraitVisible) drawScene(scene, dt);
    if (boostedUntil && time >= boostedUntil) {
      boostedUntil = 0;
      document.body.classList.remove('matrix-active');
      boost.textContent = 'Enter the Matrix ↗';
    }
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0; lastFrame = 0;
    root.dataset.motion = paused ? 'paused' : 'running';
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    $('.motion-label').textContent = paused ? 'Motion off' : 'Motion on';
    $('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    boost.disabled = paused;
    if (paused) {
      boostedUntil = 0; document.body.classList.remove('matrix-active');
      boost.textContent = 'Enter the Matrix ↗';
    }
    if (!paused && !document.hidden && scenes.length) frame = requestAnimationFrame(tick);
  }
  motion.hidden = false;
  boost.hidden = false;
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', e => { paused = e.matches; syncMotion(); });
  function enterMatrix() {
    if (paused) { notify('Animations are paused. Use the motion control to play.'); return; }
    boostedUntil = time + 5000;
    document.body.classList.add('matrix-active');
    boost.textContent = 'You’re in. ↗';
    notify('There is no spoon. Just a little JavaScript.');
  }
  boost.addEventListener('click', enterMatrix);
  new ResizeObserver(resizeScenes).observe($('.matrix-panel'));
  window.addEventListener('resize', resizeScenes, { passive: true });
  new IntersectionObserver(entries => { portraitVisible = entries[0].isIntersecting; }).observe($('.matrix-panel'));
  resizeScenes();
  syncMotion();

  // Navigation stays usable without JavaScript; mobile enhancement is optional.
  const menu = $('#menu-toggle'), nav = $('#main-nav');
  menu.hidden = false;
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    if (e.key !== 'j' && e.key !== 'k') return;
    const target = e.target;
    if (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]')) return;
    if (nav.classList.contains('is-open')) return;
    e.preventDefault();
    window.scrollBy({ top: e.key === 'j' ? 100 : -100, behavior: paused || e.repeat ? 'instant' : 'smooth' });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
  matchMedia('(max-width: 680px)').addEventListener('change', closeMenu);
  let scrollQueued = false;
  const sections = $$('main section[id]');
  function updateScroll() {
    scrollQueued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    $('.scroll-progress i').style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    let active = 'home';
    for (const section of sections) if (section.getBoundingClientRect().top <= 160) active = section.id;
    $$('#main-nav a').forEach(a => {
      if (a.hash === '#' + active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  if (!paused) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveal.unobserve(entry.target); }
    }), { threshold: .07 });
    $$('[data-reveal]').forEach(el => { el.classList.add('reveal-ready'); reveal.observe(el); });
  }

  // Project filters never affect the printable résumé.
  $('.project-filters').hidden = false;
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    $$('.project').forEach(project => {
      project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter;
      if (!project.hidden) { count++; project.classList.add('in-view'); }
    });
    $('#project-status').textContent = `Showing ${count} ${count === 1 ? 'project' : 'projects'}.`;
    updateScroll();
  }));
  $$('[data-print]').forEach(button => { button.hidden = false; button.addEventListener('click', () => window.print()); });

  // A small, real terminal: a strict command map, text-only output, no eval.
  const output = $('#terminal-output'), input = $('#terminal-input');
  const history = []; let historyIndex = 0;
  $('#terminal-form').hidden = false;
  function line(text, prompt = false) {
    const el = document.createElement('div'); el.className = 'terminal-line';
    el.textContent = (prompt ? '❯ ' : '') + text;
    if (prompt) el.classList.add('accent');
    output.append(el);
    while (output.children.length > 60) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }
  function go(id) {
    const section = $('#' + id);
    section.scrollIntoView({ behavior: paused ? 'instant' : 'smooth' });
    const title = section.querySelector('h2');
    title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true });
    title.addEventListener('blur', () => title.removeAttribute('tabindex'), { once: true });
  }
  const commands = {
    help: () => line('about · work · experience · skills · contact · resume · matrix · pause · play · clear'),
    whoami: () => line('Ricardo Orellana. Senior Software Engineer at Change.org. Guadalajara, Mexico.'),
    about: () => { line('A person, not just a stack.'); go('about'); },
    work: () => { line('Opening selected work.'); go('projects'); },
    experience: () => { line('Six teams. Building since 2015.'); go('experience'); },
    skills: () => { line('Interfaces, systems, and the habits behind them.'); go('toolkit'); },
    contact: () => { line('Let’s start a conversation.'); go('contact'); },
    resume: () => { line('Opening the print-friendly résumé. Choose Save as PDF to download.'); window.print(); },
    matrix: enterMatrix,
    rabbit: () => {
      line('Follow the white rabbit. You found the back door.');
      line('Underneath the Matrix: HTML, CSS, JavaScript, and a curious human.');
      enterMatrix();
    },
    pause: () => { paused = true; syncMotion(); line('Animations paused.'); },
    play: () => { paused = false; syncMotion(); line('Animations playing.'); },
    clear: () => output.replaceChildren()
  };
  $('#terminal-form').addEventListener('submit', e => {
    e.preventDefault();
    const command = input.value.trim().toLowerCase();
    if (!command) return;
    history.push(command); if (history.length > 50) history.shift(); historyIndex = history.length;
    line(command, true); input.value = '';
    if (Object.hasOwn(commands, command)) commands[command]();
    else line(`“${command}” isn’t a command. Try help.`);
  });
  input.addEventListener('keydown', e => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (e.key === 'ArrowUp' ? -1 : 1)));
    input.value = history[historyIndex] || '';
  });
  const clock = new Intl.DateTimeFormat('en', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false });
  function updateClock() {
    clearTimeout(clockTimer);
    $('#local-time').textContent = clock.format(new Date()) + ' CST';
    $('#year').textContent = new Date().getFullYear();
    if (!document.hidden) clockTimer = setTimeout(updateClock, 60000);
  }
  document.addEventListener('visibilitychange', () => { syncMotion(); updateClock(); });
  updateClock();
  root.dataset.enhanced = 'true';

  // A one-time greeting waiting in the console, without probing for DevTools.
  console.info(
    '%c ro_ %c\nWAKE UP, DEVELOPER.\n%c' +
    '\nYou looked under the hood. I like that.\n' +
    'This whole world is HTML, CSS, and a little JavaScript.\n\n' +
    '%cFollow the white rabbit.\n%c' +
    'Type rabbit in the terminal on the page.\n\n' +
    'Built by Ricardo Orellana. Say hello:\n' +
    'https://github.com/ricardoorellana\n' +
    'https://www.linkedin.com/in/rorellanam/',
    'background:#050907;color:#74fba1;font:bold 48px monospace;padding:8px 16px;',
    'color:#74fba1;font:bold 18px monospace;line-height:1.8;',
    'color:#a0b1a5;font:12px monospace;line-height:1.8;',
    'color:#74fba1;font:bold 13px monospace;line-height:1.8;',
    'color:#a0b1a5;font:12px monospace;line-height:1.8;'
  );
})();
