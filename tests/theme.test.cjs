const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../theme.js'), 'utf8');

function page(search, hour = 22) {
  let now = new Date(2026, 8, 10, hour), id = 0;
  const timers = new Map(), events = {};
  const document = { documentElement: { dataset: {} }, hidden: false, addEventListener: (name, fn) => events[name] = fn };
  const window = { location: { search }, dispatchEvent() {}, addEventListener: (name, fn) => events[name] = fn };
  class Clock extends Date { constructor() { super(now); } }
  vm.runInNewContext(source, { document, window, Date: Clock, Event: class {}, URLSearchParams,
    clearTimeout: key => timers.delete(key), setTimeout: (fn, ms) => { timers.set(++id, { fn, ms }); return id; } });
  return { document, events, timers, theme: () => document.documentElement.dataset.timeTheme,
    advance: hour => { now = new Date(2026, 8, 10, hour); for (const { fn } of [...timers.values()]) fn(); } };
}

test('day preview overrides the nighttime clock and survives tab return', () => {
  const p = page('?theme=day');
  assert.equal(p.theme(), 'day');
  p.advance(23); p.events.pageshow(); p.events.visibilitychange();
  assert.equal(p.theme(), 'day');
});

test('night preview overrides the daytime clock', () => {
  const p = page('?theme=night', 12);
  assert.equal(p.theme(), 'night');
  p.advance(13); p.events.pageshow();
  assert.equal(p.theme(), 'night');
});

test('normal visits and invalid preview values follow the local clock', () => {
  for (const query of ['', '?theme=auto', '?theme=unknown']) {
    const p = page(query, 5);
    assert.equal(p.theme(), 'night');
    p.advance(6); assert.equal(p.theme(), 'day');
    p.advance(17); assert.equal(p.theme(), 'day');
    p.advance(18); assert.equal(p.theme(), 'night');
    assert.equal(p.timers.size, 1);
  }
});

test('automatic checks stop while hidden and resume without duplicate timers', () => {
  const p = page('', 17);
  p.document.hidden = true; p.events.visibilitychange();
  assert.equal(p.timers.size, 0);
  p.advance(20); p.document.hidden = false; p.events.visibilitychange();
  assert.equal(p.theme(), 'night'); assert.equal(p.timers.size, 1);
  p.events.pageshow(); assert.equal(p.timers.size, 1);
});
