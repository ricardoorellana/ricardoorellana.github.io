"""Copy the public site into dist/ for a static preview.

GitHub Pages serves the repository root directly, so this export is optional —
it exists for previewing the exact set of files that go live.
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'

# Everything a visitor, a crawler, or a language model can request.
FILES = [
    'index.html', 'styles.css', 'app.js', 'theme.js',
    'robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt',
    'resume.json', 'site.webmanifest', '.nojekyll',
]

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

for name in FILES:
    source = ROOT / name
    if not source.exists():
        raise SystemExit(f'missing public file: {name}')
    shutil.copy2(source, OUT / name)

shutil.copytree(ROOT / 'assets', OUT / 'assets')

count = sum(1 for p in OUT.rglob('*') if p.is_file())
print(f'Static site ready in dist/ ({count} files)')
