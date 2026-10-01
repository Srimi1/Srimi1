# Repository structure

- `README.md`: introduction, Srijan–Sarah artwork, skill badges, selected projects, and public activity.
- `assets/profile-cover.jpg`, `assets/profile-intro.svg`, `assets/rhythm.svg`: static banner, small text animation, and public chart for GitHub.
- `docs/index.html`, `docs/profile.css`: static portfolio with local artwork/fonts and project links.
- `docs/play.html`: redirects old game links to the portfolio.
- `docs/profile-data.mjs`: contribution summary for chart generation.
- `docs/assets/`: preserved identities and project logos, duo art, local badges, licensed fonts, and mirrored profile graphics.
- `docs/data/`: public GitHub snapshots and selected-project metadata.
- `scripts/preview-server.mjs`: local static preview.
- `scripts/visual-check.mjs`: desktop, tablet, and mobile portfolio checks; optional static-cover capture.
- `scripts/public-calendar.mjs`, `scripts/refresh.mjs`, `scripts/generate.mjs`: public data validation and static-chart maintenance.
- `tests/calendar.test.mjs`: parsing and fail-closed source validation.
- `design/signal-art-prompt.md`: exact provenance prompt for the reused duo artwork.
- `.github/workflows/`: portfolio deployment and daily public-chart refresh.

The portfolio needs no JavaScript runtime. Puppeteer is only a development dependency. Historical README/design notes and unused original source assets remain preserved.
