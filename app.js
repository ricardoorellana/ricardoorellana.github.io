(() => {
  'use strict';
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  const globe = document.getElementById('planet-render');
  const g = globe.getContext('2d');
  const motionButton = document.getElementById('motion');
  const warpButton = document.getElementById('warp');
  const status = document.getElementById('flight-status');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = media.matches, width = 0, height = 0, stars = [], meteors = [];
  let frame = null, last = 0, warpUntil = 0, time = 0, globeWidth = 0, globeHeight = 0;
  let nextMeteor = 1500, lastTelemetry = 0, scroll = 0;
  const pointer = { x: 0, y: 0 }, smoothPointer = { x: 0, y: 0 };
  function seedStar() { return { x: (Math.random() - .5) * width * 2, y: (Math.random() - .5) * height * 2, z: Math.random() * 1400 + 1, size: .5 + Math.random() * 1.3 }; }
  function resize() {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    globeWidth = globe.clientWidth; globeHeight = globe.clientHeight;
    globe.width = globeWidth * dpr; globe.height = globeHeight * dpr;
    if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(480, Math.floor(width * height / 2200)) }, seedStar);
    draw(0);
  }
  function drawPlanet() {
    if (!g) return;
    g.clearRect(0, 0, globeWidth, globeHeight);
    const radius = Math.min(globeWidth * .3, 146);
    const cx = globeWidth / 2, cy = globeHeight * .49;
    const rotation = time * .00017 + smoothPointer.x * .45 + scroll * .0002;
    const tilt = -.3 + smoothPointer.y * .2;
    const project = (lat, lon) => {
      const x = Math.cos(lat) * Math.sin(lon + rotation);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon + rotation);
      return { x: cx + (x * Math.cos(tilt) - y * Math.sin(tilt)) * radius, y: cy + (x * Math.sin(tilt) + y * Math.cos(tilt)) * radius, z };
    };
    const glow = g.createRadialGradient(cx - radius * .4, cy - radius * .4, 0, cx, cy, radius * 1.2);
    glow.addColorStop(0, '#badc8730'); glow.addColorStop(.75, '#142e2030'); glow.addColorStop(1, '#142e2000');
    g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, radius * 1.2, 0, Math.PI * 2); g.fill();
    function line(points) {
      for (let n = 1; n < points.length; n++) {
        const a = points[n - 1], b = points[n];
        const alpha = (a.z + b.z) / 2;
        g.strokeStyle = `rgba(185,242,131,${alpha > 0 ? .15 + alpha * .48 : .035})`;
        g.lineWidth = alpha > .8 ? .85 : .6;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    }
    for (let lat = -80; lat <= 80; lat += 10) {
      const points = [];
      for (let lon = 0; lon <= 360; lon += 5) points.push(project(lat * Math.PI / 180, lon * Math.PI / 180));
      line(points);
    }
    for (let lon = 0; lon < 360; lon += 15) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 5) points.push(project(lat * Math.PI / 180, lon * Math.PI / 180));
      line(points);
    }
    const nodes = [[.5, .3],[-.4,1.8],[.1,3.3],[.8,4.4],[-.7,5.5]];
    for (const [lat, lon] of nodes) {
      const p = project(lat, lon);
      if (p.z < 0) continue;
      g.fillStyle = '#d9ffad'; g.shadowBlur = 12; g.shadowColor = '#c2f970';
      g.beginPath(); g.arc(p.x, p.y, 2.5, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
      const pulse = ((time * .00045 + lon) % 1);
      g.strokeStyle = `rgba(194,249,112,${(1 - pulse) * .6})`;
      g.beginPath(); g.arc(p.x, p.y, 4 + pulse * 15, 0, Math.PI * 2); g.stroke();
    }
    g.strokeStyle = '#c2f97060'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, radius, 0, Math.PI * 2); g.stroke();
  }
  function draw(delta) {
    if (!paused) time += delta;
    smoothPointer.x += (pointer.x - smoothPointer.x) * .04;
    smoothPointer.y += (pointer.y - smoothPointer.y) * .04;
    const warping = performance.now() < warpUntil && !paused;
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2 + (paused ? 0 : smoothPointer.x * 100);
      const cy = height / 2 + (paused ? 0 : smoothPointer.y * 70);
      for (const star of stars) {
        const previousZ = star.z;
        if (!paused) star.z -= delta * (warping ? 3.8 : .065);
        if (star.z <= 8) { Object.assign(star, seedStar()); star.z = 1400; continue; }
        const scale = 650 / star.z;
        const x = cx + star.x * scale, y = cy + star.y * scale;
        if (x < -100 || x > width + 100 || y < -100 || y > height + 100) { Object.assign(star, seedStar()); star.z = 1400; continue; }
        const alpha = Math.min(.85, (1 - star.z / 1600) * (.7 + Math.sin(time * .001 + star.x) * .2));
        ctx.fillStyle = `rgba(200,227,192,${alpha})`;
        const size = Math.min(2, star.size * scale);
        if (warping) {
          const trailScale = 650 / (previousZ + 90);
          ctx.strokeStyle = `rgba(185,245,182,${alpha})`; ctx.lineWidth = size;
          ctx.beginPath(); ctx.moveTo(cx + star.x * trailScale, cy + star.y * trailScale); ctx.lineTo(x, y); ctx.stroke();
        } else { ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill(); }
      }
      if (!paused && time > nextMeteor) {
        meteors.push({ x: Math.random() * width, y: Math.random() * height * .4, life: 0 });
        nextMeteor = time + 2600 + Math.random() * 2500;
      }
      meteors = meteors.filter(m => m.life < 1100);
      for (const meteor of meteors) {
        if (!paused) { meteor.life += delta; meteor.x += delta * .65; meteor.y += delta * .28; }
        const gradient = ctx.createLinearGradient(meteor.x - 130, meteor.y - 56, meteor.x, meteor.y);
        gradient.addColorStop(0, '#c2f97000'); gradient.addColorStop(1, `rgba(203,255,185,${Math.sin(meteor.life / 1100 * Math.PI) * .65})`);
        ctx.strokeStyle = gradient; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(meteor.x - 130, meteor.y - 56); ctx.lineTo(meteor.x, meteor.y); ctx.stroke();
      }
    }
    drawPlanet();
    if (time - lastTelemetry > 160) {
      document.getElementById('velocity').textContent = warping ? (80 + Math.sin(time * .004) * 19).toFixed(2) : (7.82 + Math.sin(time * .001) * .14).toFixed(2);
      document.getElementById('sector').textContent = String(1 + Math.floor(time / 10000)).padStart(3, '0');
      lastTelemetry = time;
    }
  }
  function tick(now) {
    frame = null; draw(Math.min(now - (last || now), 40)); last = now;
    if (warpUntil && now >= warpUntil) {
      warpUntil = 0; status.textContent = 'FLIGHT MODE: CRUISE'; warpButton.disabled = false; document.body.classList.remove('warp-active');
    }
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function syncMotion() {
    document.body.classList.toggle('paused', paused); document.body.classList.remove('warp-active');
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    motionButton.textContent = paused ? '▷' : 'Ⅱ'; warpButton.disabled = paused;
    status.textContent = paused ? 'FLIGHT MODE: PAUSED' : 'FLIGHT MODE: CRUISE';
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; last = 0; warpUntil = 0;
    if (paused) { pointer.x = 0; pointer.y = 0; smoothPointer.x = 0; smoothPointer.y = 0; }
    draw(0);
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  media.addEventListener('change', event => { paused = event.matches; syncMotion(); });
  warpButton.addEventListener('click', () => {
    if (paused) return;
    warpUntil = performance.now() + 3200; warpButton.disabled = true;
    status.textContent = 'FLIGHT MODE: HYPERSPACE'; document.body.classList.add('warp-active');
  });
  window.addEventListener('pointermove', event => { if (!paused) { pointer.x = event.clientX / width - .5; pointer.y = event.clientY / height - .5; } }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  const progress = document.querySelector('.mission-progress');
  function updateScroll() { scroll = scrollY; const total = document.documentElement.scrollHeight - innerHeight; progress.style.transform = `scaleX(${total > 0 ? scroll / total : 0})`; }
  window.addEventListener('scroll', updateScroll, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (frame !== null) cancelAnimationFrame(frame); frame = null; }
    else { last = 0; if (!paused && frame === null) frame = requestAnimationFrame(tick); }
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  const links = [...document.querySelectorAll('nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        links.forEach(link => { const active = link.hash === '#' + entry.target.id; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      }
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in-view'); reveal.unobserve(entry.target); }
    }, { threshold: .08 });
    document.querySelectorAll('.section-heading,.about-grid,.job,.project,.toolkit-grid,.education,.contact h2').forEach((element, index) => {
      element.classList.add('reveal-ready'); element.style.transitionDelay = `${index % 3 * 70}ms`; reveal.observe(element);
    });
  }
  document.querySelectorAll('.project').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (paused || event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5, y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    card.addEventListener('focusin', () => { card.classList.add('in-view'); });
  });
  updateScroll(); resize(); syncMotion();
})();
