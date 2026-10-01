# Maintaining Code Together

The README embeds `assets/code-together.gif`. The Pages homepage runs the same automatic story; `play.html` preserves the original manual city game. GitHub cannot execute the JavaScript simulation inside a README, so its animation is a rendered snapshot refreshed daily.

## Preview and checks

Use Node 22 or later, Chrome/Chromium, and Gifsicle. Run `npm ci`. Install the optimizer with `brew install gifsicle` on macOS or `sudo apt-get install gifsicle` on Ubuntu. The daily workflow installs it automatically.

Run `npm run preview` and open http://127.0.0.1:8088/. The original game is at http://127.0.0.1:8088/play.html.

- `npm test`: calendar validation, original game rules/campaign, and complete contribution duets on current, dense, sparse, and leap-day calendars, plus empty/invalid input and deterministic loop wrapping.
- `STORY_URL=http://127.0.0.1:8088/ VERIFY_STORY_LOOP=1 npm run test:story`: real desktop/phone autoplay, pause, reduced motion, an entire loop through the hug, preserved projects, layout, and browser errors.
- `PREVIEW_URL=http://127.0.0.1:8088/play.html FULL_CAMPAIGN=1 npm run test:visual`: original keyboard/touch campaign after the shared-physics extraction.
- `npm run render:story`: its own preview server and Chrome render scene previews, verify layout/routes, encode and optimize the GIF, decode its timing/loop metadata, and export the actual coffee cover and provenance manifest.
- `npm run check:story`: verify committed GIF/cover checksums and whether the recorded inputs match current code, art, fonts, calendar, and window.

Set `CHROME_BIN` or `GIFSICLE_BIN` for other executable locations. `FORCE_STORY=1` forces an export. `STORY_DATE=YYYY-MM-DD` selects a development window, and `STORY_FPS` defaults to 15. Scene previews go into ignored `qa/`.

## Simulation and refresh

`docs/together-core.mjs` routes two independent characters at 120 steps per second, using the motion constants and landing integration shared with the original game in `docs/kinematics.mjs`. Both characters must reach the final platform before the finale. `docs/together-render.mjs` draws the story and reads transparent sprite bounds without modifying the identity images.

`docs/together.mjs` starts playback automatically. The pause button freezes elapsed time; hidden tabs also stop it. Reduced-motion visitors start with a still scene and can choose to watch. The README GIF is silent and loops automatically; its exact exported timing is recorded in the manifest.

The daily workflow reads the signed-out public calendar and public repository metadata, then renders the story. It commits updated data, charts, GIF/manifest, and cover only after successful validation. Source parsing fails closed, and a failed render preserves the previous published GIF.

Worked dates retain their exact counts, with bounded platform heights and compressed quiet gaps. Future dates produce no platforms. Empty activity shows coffee/coding and an honest quiet-calendar message without fabricated workdays.

Keep the original avatar, Sarah illustration, and four selected project identities unchanged. Earlier profile designs remain recoverable in Git history; `README.previous.md` and `design/legacy-breakout-notes.md` are historical. See `ASSETS.md` and `design/code-together-art-prompts.md` for artwork provenance.
