/* The résumé now exists in four places: the rendered page, the JSON-LD graph,
   resume.json, and the llms.txt pair. These checks fail loudly when one of
   them is updated and the others are not. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const html = read('index.html');
const resume = JSON.parse(read('resume.json'));
const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const node = type => graph.find(entry => entry['@type'] === type);

const SITE = 'https://ricardoorellana.github.io';
const EMPLOYERS = ['Change.org', 'ARCOS LLC', 'Bitso', 'EPAM Systems Mexico', 'Rever Inc.', 'Propelics'];

test('the page, JSON-LD, and resume.json agree on who this is', () => {
  const person = node('Person');
  assert.equal(person.name, 'Ricardo Orellana');
  assert.equal(person.jobTitle, 'Senior Software Engineer');
  assert.equal(person.url, `${SITE}/`);
  assert.equal(resume.basics.name, person.name);
  assert.equal(resume.basics.label, person.jobTitle);
  assert.equal(person.worksFor.name, resume.work[0].name);
  assert.match(html, /<title>Ricardo Orellana — Senior Software Engineer<\/title>/);
});

test('every employer on the page appears in all machine-readable copies', () => {
  const onPage = [...html.matchAll(/<div class="job-body">\s*<h3>([^<]+)/g)].map(m => m[1].trim());
  assert.deepEqual(onPage, EMPLOYERS, 'timeline order changed');
  assert.deepEqual(resume.work.map(job => job.name), EMPLOYERS);

  const roles = graph.find(entry => entry['@id'] === `${SITE}/#experience`).itemListElement;
  assert.deepEqual(roles.map(entry => entry.item.worksFor.name), EMPLOYERS);
  assert.equal(roles.length, EMPLOYERS.length);

  const full = read('llms-full.txt');
  for (const employer of EMPLOYERS) assert.ok(full.includes(employer), `llms-full.txt is missing ${employer}`);
  assert.ok(read('llms.txt').includes(EMPLOYERS[0]), 'llms.txt should name the current employer');
});

test('projects are listed consistently across the page and the data files', () => {
  const onPage = [...html.matchAll(/<h3>([^<]+)<\/h3>\s*<p>[^<]*<\/p>\s*<\/article>|<div class="project-content">\s*<p class="project-category[^"]*">[^<]*<\/p>\s*<h3>([^<]+)</g)]
    .map(m => (m[1] || m[2]).trim());
  const listed = graph.find(entry => entry['@id'] === `${SITE}/#projects`).itemListElement.map(e => e.item.name);
  assert.equal(listed.length, resume.projects.length);
  assert.deepEqual(listed, resume.projects.map(p => p.name));
  for (const name of listed) assert.ok(onPage.includes(name), `${name} is in the data but not on the page`);
});

test('every local file the page asks for exists', () => {
  const refs = new Set([...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)].map(m => m[1]));
  assert.ok(refs.size >= 5, 'expected the page to reference local assets by absolute path');
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), `referenced but missing: ${ref}`);
  }
});

test('the declared og:image size matches the file on disk', () => {
  const png = fs.readFileSync(path.join(root, 'assets/og-image.png'));
  assert.equal(png.subarray(12, 16).toString('ascii'), 'IHDR');
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(width, Number(html.match(/og:image:width" content="(\d+)"/)[1]));
  assert.equal(height, Number(html.match(/og:image:height" content="(\d+)"/)[1]));
});

test('crawler files point at URLs that are actually published', () => {
  const robots = read('robots.txt');
  assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap\\.xml`));

  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.includes(`${SITE}/`), 'sitemap should list the homepage');
  for (const loc of locs) {
    const rest = loc.slice(SITE.length + 1);
    if (rest) assert.ok(fs.existsSync(path.join(root, rest)), `sitemap lists a missing file: ${rest}`);
  }
});
