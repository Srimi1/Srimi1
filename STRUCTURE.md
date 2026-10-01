# Repository structure

- `README.md`: GitHub profile, a still cover linking to the game, four existing projects, and the public activity chart.
- `docs/index.html`: semantic title screen, game controls, Sarah's comms, mission explanation, and portfolio.
- `docs/style.css`: responsive visual layout, locally hosted fonts, touch controls, fullscreen, and reduced motion.
- `docs/signal-core.mjs`: game state, three sectors, movement/jump physics, collisions, attacks, damage, scoring, relays, Guardian, and terminal states. No DOM or browser dependency.
- `docs/signal.mjs`: fixed-step browser loop, Canvas scene and character rendering, input, overlays, optional Web Audio, and local best scores.
- `docs/runner.mjs`: frame coordinates and timing for the preserved eight-frame avatar atlas.
- `docs/assets/`: original identities, optimized runtime assets, key art, static social cover, project logos, and licensed local fonts.
- `docs/data/`: public GitHub snapshots and existing curated project metadata.
- `scripts/public-calendar.mjs`, `scripts/refresh.mjs`, `scripts/generate.mjs`: public-data parsing and static chart maintenance.
- `scripts/visual-check.mjs`: real browser input checks, screenshots, and optional still-cover export.
- `tests/`: deterministic game, contribution-parser, and sprite tests.
- `design/signal-art-prompt.md`: exact generation prompt and character-reference roles.
- `.github/workflows/`: validated Pages deployment and public-profile data refresh.

The new runtime has no third-party JavaScript dependencies. Puppeteer is used only during development and CI. Previous game code and the autoplay GIF are retained in Git history, rather than shipped on Pages.
