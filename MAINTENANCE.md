# Maintaining Signal / Run

The GitHub profile uses a static, clickable cover; GitHub Pages serves the playable game from `docs/`. No run begins before a player presses Enter the city. The existing GitHub account avatar is unchanged.

## Development and verification

Use Node 22 or later and run `npm ci`. Preview the site with `python3 -m http.server 8084 --bind 127.0.0.1 --directory docs` and open http://127.0.0.1:8084/.

- `npm test` checks the calendar parser, sprite atlas, and game rules, including a complete three-sector victory using only valid controls in standard and assist mode.
- `npm run test:visual` checks desktop and phone layout, keyboard and touch movement, jump, attacks, pause/focus behavior, first-sector completion, progression, saved scores, and absence of browser errors. It writes screenshots to ignored `qa/`.
- `EXPORT_COVER=1 npm run test:visual` also exports the still title screen to `assets/signal-cover.jpg` and its byte-identical social-preview copy in `docs/assets/`. Run this after title-screen design changes.
- Set `CHROME_BIN`, `PREVIEW_URL`, or `VISUAL_OUTPUT` when using a different browser executable, preview port, or screenshot directory. The script detects macOS Chrome and common Linux Chrome/Chromium paths.

The publish workflow tests the rules and real browser interactions before deploying. Screenshots from CI are retained as a workflow artifact. A failed check prevents the new Pages deployment.

## Game

Three rooftop sectors lead to the final Null Guardian. Each relay requires six memory fragments; the final relay additionally requires defeating the Guardian. Players directly control movement, variable-height jump, dash attack, and Sarah's area pulse. All fourteen memories in each sector are optional beyond the six required. The game has no imposed time limit; speed and pickup/attack combos reward better runs.

`docs/signal-core.mjs` owns deterministic simulation and transitions. `docs/signal.mjs` handles Canvas rendering, original character sprites, keyboard and touch input, HUD, story messages, synthesized audio, fullscreen, and persistence. The simulation advances in 1/120-second steps. Holding jump gives more height; coyote time and jump buffering allow forgiving platform controls.

Pause freezes the simulation. Leaving or hiding the tab pauses it automatically; returning requires a deliberate resume. The title screen and overlays do not run an idle simulation. Reduced motion suppresses screen shake and particle bursts. Sound is off until the player enables it. Assist mode increases health, shortens dash cooldown, and increases pulse recharge and reach. Scores for standard and assist mode are stored separately on the current device; unavailable browser storage does not prevent play.

Sarah's dialogue is written for the game. No live AI service, account, API, analytics, or tracking SDK is used. Runtime artwork and fonts are hosted with the game.

## Profile graphics and identity

The daily refresh reads only GitHub's public contribution calendar and allowlisted public repository metadata. It updates the static contribution chart; it does not rewrite the game, README, cover, character identities, or project selection. `npm run generate` rebuilds these static graphics from the checked-in snapshot without credentials. `npm run refresh` needs `GH_TOKEN` or `GITHUB_TOKEN`, fails closed on source changes, and leaves the previous snapshot intact on failure.

`docs/assets/avatar.png` is the original avatar. Generation reads it and must never replace it. Its expected SHA-256 is documented in `ASSETS.md`. The four selected projects and their original marks remain preserved. `README.previous.md` and `design/legacy-breakout-notes.md` record earlier designs; their instructions describe the retired arcade.
