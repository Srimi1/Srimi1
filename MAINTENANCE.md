# Profile maintenance

The previous profile is preserved in `README.previous.md` and in Git history. This redesign changes only the profile repository; the project repositories and the GitHub account avatar are untouched.

## Data and refresh

`npm run refresh` reads GitHub's signed-out public contribution calendar and every page of public owned repositories, then regenerates the SVGs. It requires `GH_TOKEN` or `GITHUB_TOKEN`. It publishes an explicit allowlist of public metadata fields. Private repository names, descriptions, contents, and hidden activity are never part of the public snapshot. The calendar request has no Authorization header, even when the repository API uses a token. A change to GitHub’s calendar HTML fails closed instead of fabricating counts.

`npm run generate` rebuilds assets from the checked-in snapshot without credentials. It reads `docs/assets/avatar.png` but never writes it. `npm test` checks calendar parsing, streak calculations, full-year slot generation, one/two/three-hit durability, protected contribution blocks, game phases, scoring, and a Matter.js collision reflection. Node 22 or later is required. Matter.js 0.20.0 is the only runtime dependency and its browser build is vendored at `docs/vendor/matter.min.js` for reliable static hosting.

The refresh workflow runs daily at 01:23 UTC and can be dispatched manually. GitHub may delay scheduled runs. A failed API request leaves the last committed snapshot intact. The update date is visible on the charts and playground. GitHub's calendar can include up to 371 days across 53 weeks. Active days have a positive contribution count; quiet days have zero. An unfinished today does not reset the current streak until another quiet date intervenes.

The language chart counts original public repositories by primary language; forks and repositories without a detected language are excluded from the bars. It does not claim to measure commit language or proficiency. Partial months in the monthly chart remain partial.

## Game

GitHub READMEs cannot execute JavaScript, so `assets/breakout-v2.svg` is a deliberately static preview with no fake ball, paddle, hit spark, or mascot animation. It links to the playable GitHub Pages edition at https://srimi1.github.io/Srimi1/.

The playable game builds all 365 dates in 2026. Dates after the public snapshot are non-colliding outlines. Elapsed quiet dates are destructible blocks: the first two days of a quiet run require one hit, days three through six require two, and day seven onward requires three. Dates with recorded contributions are indestructible pass-through energy shields whose shade follows GitHub contribution intensity. They emit collision events and visual/audio feedback but do not alter the ball trajectory, preventing quiet targets from becoming permanently enclosed. The player wins by clearing every quiet block; protected blocks remain standing.

Matter.js owns ball, paddle, wall, brick, and loss-sensor collisions. `docs/breakout-core.mjs` owns deterministic calendar and game rules. `docs/breakout.mjs` connects the physics engine to SVG rendering, staged cracks, shatter fragments, impact rings, a short ball trail, Web Audio feedback, combo scoring, saved best score, and pointer/touch/keyboard input. Pause freezes the simulation; hiding the tab auto-pauses. Reduced motion removes transient animation and lowers the starting speed. The public data is also available as an accessible text table.

Preview locally with `python3 -m http.server 8080 --directory docs`, then open http://localhost:8080. GitHub Pages is configured to deploy through Actions, serving only `docs/`.

## Avatar and visual assets

`docs/assets/avatar.png` is the existing avatar and must remain byte-identical. The generated hero embeds this file so GitHub's image renderer has no external image dependency. The GitHub account photo is a separate account setting and is never changed by this repository.

The game art direction and impact references live in `design/` and are documented in `ASSETS.md`. P-Agents had no project identity asset, so `docs/assets/projects/p-agents.jpg` provides a generated mark. Existing project logos remain unchanged.

## Project selection and logo motion

The profile shows exactly four evidence-backed repositories: NotchHub, P-Agents, Internet Speed Reader, and The Keyboard Project. Selection requires a substantial implementation, concrete proof or reproducible validation, meaningful quality gates, reproducible setup, and honest claim boundaries. Stars and recency are not selection criteria. Experimental and partial projects remain available in the user's repository list but are not promoted on the profile.

`docs/data/featured-projects.json` is the editorial shortlist and source for generated README logo wrappers. `assets/logo-orbits/*.svg` embeds each selected logo and applies a complete 360-degree CSS 3D rotation with a stationary reduced-motion fallback. The GitHub Pages cards apply the same rotation directly in CSS.
