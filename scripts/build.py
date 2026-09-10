"""Prepare the GitHub Pages source for a static Sites preview."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parent.parent
out = root / 'dist'
(out / 'assets').mkdir(parents=True, exist_ok=True)
for name in ('index.html', 'styles.css', 'app.js', 'theme.js', 'assets/favicon.svg'):
    shutil.copy2(root / name, out / name)
print('Static site ready in dist/')
