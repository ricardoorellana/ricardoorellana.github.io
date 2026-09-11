# Ricardo Orellana — Matrix portfolio

A complete Matrix-inspired portfolio and résumé built with plain HTML, CSS, and JavaScript. No runtime dependencies or build step. GitHub Pages serves the repository root.

## Preview

```sh
python3 -m http.server 8088
```

Open http://localhost:8088.

## Design and interaction

Black and phosphor green, large editorial typography, a canvas code portrait, flowing digital rain, animated project illustrations, scrolling text, and section reveals. The header motion control pauses animation; reduced-motion preferences start the site paused. Canvas animation is capped at 24 fps and stops in hidden tabs. The portrait stops rendering when off screen.

The terminal accepts `help`, `whoami`, `about`, `work`, `experience`, `skills`, `contact`, `resume`, `matrix`, `pause`, `play`, and `clear`. Arrow keys recall commands. It runs only a fixed local command map, never executes arbitrary code, and sends nothing to a server. “Enter the Matrix” briefly intensifies the rain.

The DevTools console has a one-time Matrix greeting and a clue to the hidden `rabbit` terminal command. The Easter egg respects the motion control, and the site does not attempt to detect whether DevTools is open.

Project filters show all work, fintech, or web and mobile. Press `j` to scroll down or `k` to scroll up; hold either key to keep moving. These shortcuts leave text inputs, editable content, and modified shortcuts alone. The mobile menu supports Escape, and every primary action works with a keyboard. Content and links remain available without JavaScript.

## Résumé and content

“Get my résumé” opens the browser print dialog. Choose Save as PDF to download. Print styles remove decoration, expose full profile URLs, and include all projects regardless of the active filter.

Career facts are preserved across `index.html` (including JSON-LD), `resume.json`, and `llms-full.txt`. Keep these in sync when updating work, projects, or skills. Project dates follow the project timeline and can differ from employment dates. Project visuals are original abstract illustrations, not product screenshots.

- `index.html` — content and metadata
- `styles.css` — responsive design, animation, and print styles
- `app.js` — canvases, terminal, navigation, filters, and motion controls
- `assets/` — favicon, icons, and social preview
- `resume.json`, `llms.txt`, `llms-full.txt` — machine-readable résumé
- `robots.txt`, `sitemap.xml`, `site.webmanifest` — discovery and app metadata

## Checks and static export

```sh
node --test
python3 scripts/build.py
```

The tests check résumé consistency, local references, and social-image dimensions. Reduced motion is handled by the stylesheet before paint and by `app.js` for interactions. The optional export refreshes `dist/` with the public files.
