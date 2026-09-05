# Profile maintenance

The previous profile is preserved in `README.previous.md` and in Git history. This redesign changes the profile repository; the project repositories are untouched.

## Data and refresh

`npm run refresh` reads GitHub's signed-out public contribution calendar and every page of public owned repositories, then regenerates the SVGs. It requires `GH_TOKEN` or `GITHUB_TOKEN`. It publishes an explicit allowlist of public metadata fields. Private repository names, descriptions, contents, and hidden activity are never part of the public snapshot. The calendar request has no Authorization header, even when the repository API uses a token. A change to GitHub’s calendar HTML fails closed instead of fabricating counts.

`npm run generate` rebuilds assets from the checked-in snapshot without credentials. `npm test` checks route uniqueness, contribution filtering, finish clamping, empty calendars, and streak calculations. Node 22 or later; no package dependencies.

The refresh workflow runs daily at 01:23 UTC and can be dispatched manually. GitHub may delay scheduled runs. A failed API request leaves the last committed snapshot intact. The update date is visible on the charts and playground. GitHub's calendar can include up to 371 days across 53 weeks. Active days have a positive contribution count; quiet days have zero. An unfinished today does not reset the current streak until another quiet date intervenes.

The language chart counts original public repositories by primary language; forks and repositories without a detected language are excluded from the bars. It does not claim to measure commit language or proficiency. Partial months in the monthly chart remain partial.

## Game

GitHub READMEs cannot execute JavaScript, so `assets/quest.svg` contains a self-contained SVG motion animation. `docs/` contains the playable GitHub Pages edition at https://srimi1.github.io/Srimi1/.

The route snakes down one week and up the next, selecting only zero-contribution squares. A roll advances 1–6 quiet squares, marking each square along the way. Blue contribution days are passed over; their data never changes. Finishing visits every quiet square. Auto tour plays the same game. Pause stops future rolls; a roll already moving finishes. Restart cancels any pending movement and resets progress. Space rolls unless focus is on another interactive control. Reduced motion removes sprite bobbing and interpolation; auto tour is always opt-in. Hiding the tab pauses the tour. The data is also available in a text table.

The SVG has a stationary sprite as its reduced-motion fallback. Browser animation support and GitHub image caching can affect when the updated animation is visible.

Preview locally: `python3 -m http.server 8080 --directory docs` then open http://localhost:8080. GitHub Pages is configured to deploy through Actions, serving only `docs/`.

## Avatar assets

`docs/assets/avatar.png` is the supplied original avatar. `docs/assets/runner.png` is the miniature character produced with the built-in image generation tool. Its prompt is preserved in `assets/runner-prompt.txt`. PNG transparency is preserved. SVGs embed the images so GitHub's image renderer has no external image dependency. The GitHub account photo is a separate account setting.

The public catalogue is a dated editorial scan. Daily refresh updates numeric charts and the game, not authored project descriptions; revisit those when project status changes.
