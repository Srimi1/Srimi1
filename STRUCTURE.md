# Repository structure

- `README.md`: compact GitHub profile with selected work and native disclosures.
- `assets/studio-light.svg`, `assets/studio-dark.svg`: theme-aware identity headers.
- `assets/rhythm.svg`: generated public contribution and repository-language chart.
- `docs/index.html`, `docs/profile.css`, `docs/profile.mjs`: progressively enhanced portfolio; no runtime dependencies or third-party requests.
- `docs/designs.html`: visual comparison of ten design directions.
- `docs/play.html`: redirect for historical links.
- `docs/assets/`: preserved original art, 96px project-icon derivatives, local licensed fonts, and chart.
- `docs/data/`: public snapshots and historical selected-project metadata.
- `scripts/preview-server.mjs`, `scripts/visual-check.mjs`: local preview and browser verification.
- `scripts/optimize-icons.mjs`: reproducible project-icon optimization.
- `scripts/public-calendar.mjs`, `scripts/refresh.mjs`, `scripts/generate.mjs`: public-data validation and chart refresh.
- `tests/calendar.test.mjs`: parser and source validation tests.
- `design/research.md`, `design/selection.md`: sources and independent design judgments.
- `.github/workflows/`: checked deployment and daily public-data refresh.

Puppeteer is a development dependency only. Historical artwork, README versions, and source design notes remain preserved.
