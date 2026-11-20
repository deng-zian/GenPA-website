# GenPA project website

Project page for **GenPA: Image Generators as Efficient Robot Policies**.

- Website: https://deng-zian.github.io/GenPA-website/
- Research code, model weights, and dataset releases are in preparation.

## Preview locally

This is a static website. No build step or package installation is required.

```sh
python3 -m http.server 8770 --bind 127.0.0.1
```

Open http://127.0.0.1:8770/ in your browser.

## Structure

- `index.html`: page content, accessibility markup, and embedded research data.
- `style.css`: shared styles, components, responsive layouts, and motion preferences.
- `script.js`: motivation figures, explanatory popovers, supervision results, affiliations, and citation copying.
- `animation.js`: the interactive training and inference diagram.
- `method-tabs.js` and `gallery.js`: architecture and visual-supervision views.
- `latency.js` and `results.js`: latency exploration, benchmark tabs, and result definitions.
- `navigation.js`: section navigation.
- `assets/`: original figures, videos, paper, self-hosted font, and research data.
- `SOURCES.md`: content and asset attribution.
- `scripts/check_site.py`: local structure, link, data, and JavaScript checks.

The embedded JSON allows the page to work without data requests. Matching JSON assets are retained for maintenance; update both copies together when changing research data. Original media are listed in `asset-manifest.json` with SHA-256 hashes.

## Validate changes

```sh
python3 scripts/check_site.py
```

Python 3 is required. JavaScript syntax is also checked when Node.js is available. Review desktop and mobile layouts after changing styles or interactions.

## Publish

GitHub Pages serves the `main` branch from the repository root. The `.nojekyll` file enables direct static publication. Commit and push changes to update the site.

The Paper and Citation entries can be updated when the arXiv version is available. Replace the existing Code, Models, and Dataset placeholders when each release is ready.
