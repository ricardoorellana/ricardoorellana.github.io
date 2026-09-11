const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../theme.js'), 'utf8');
function page(reduced) {
  const document = { documentElement: { dataset: {} } };
  vm.runInNewContext(source, { document, window: { matchMedia: () => ({ matches: reduced }) } });
  return document.documentElement.dataset;
}
test('the Matrix palette is selected before paint', () => assert.equal(page(false).theme, 'matrix'));
test('reduced-motion visitors start paused', () => assert.equal(page(true).motion, 'paused'));
test('other visitors start with motion enabled', () => assert.equal(page(false).motion, 'running'));
