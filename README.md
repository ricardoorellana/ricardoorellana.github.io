# Ricardo Orellana — Portfolio

A responsive, space-inspired portfolio built with HTML, CSS, and JavaScript. The root files work directly with GitHub Pages; there are no runtime dependencies or build requirements.

## Local preview

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. Use **Warp speed** to accelerate the starfield or the pause control to stop motion. The scene includes a rotating wireframe globe, orbital ship, radar sweeps, shooting stars, scroll reveals, and pointer-reactive project cards. System reduced-motion preferences are respected. Fonts load from Google Fonts with system fallbacks.

## Optional static export

```sh
python3 scripts/build.py
```

This copies the public files into `dist/`. GitHub Pages serves the root files directly, so this export is optional.

## Content

Edit `index.html` for biography, employment, projects, technology, and social profile links; `styles.css` for presentation; and `app.js` for interactions. Project artwork is abstract CSS illustration, not product screenshots. Project dates follow the supplied project list, which may differ from employment dates.
