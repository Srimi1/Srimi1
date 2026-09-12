# Architecture

## Profile generation

`scripts/refresh.mjs` fetches the public contribution calendar and repository metadata. `scripts/generate.mjs` converts the saved data into the hero, static arcade preview, contribution rhythm chart, and rotating-logo wrappers. The daily GitHub Action runs tests before regeneration and deployment.

The existing avatar remains the single source of truth at `docs/assets/avatar.png`. Generation reads it but never writes it.

## Arcade domain

`docs/breakout-core.mjs` owns pure, deterministic rules:

- calendar normalization and 2026 slot generation;
- quiet-run durability assignment;
- protected versus destructible classification;
- score, life, phase, and hit transitions;
- palette and layout constants.

This module has no DOM or Matter.js dependency and is unit tested directly.

## Arcade physics and rendering

`docs/breakout.mjs` owns the integration layer:

- Matter.js engine, static wall/paddle/brick bodies, ball, and loss sensor;
- fixed-step simulation and bounded velocity;
- pointer, touch, keyboard, pause, visibility, and reset controls;
- SVG rendering and DOM HUD synchronization;
- crack overlays, protected-hit pulses, impact rings, fragments, trail, and lightweight Web Audio feedback.

Matter.js is vendored at `docs/vendor/matter.min.js` so GitHub Pages gameplay does not depend on a third-party CDN. Its MIT license is preserved beside the build.

## Static site

`docs/index.html` provides semantic structure. `docs/style.css` owns the visual system, responsive layout, 3D logo motion, reduced-motion behavior, and arcade effects. The SVG board remains accessible through a generated text summary and date/contribution table.

## Data model

Every board slot has a date, week/weekday position, contribution count, contribution level, and kind:

- `future`: visible outline, no physics body;
- `protected`: contribution count greater than zero, indestructible pass-through physics sensor;
- `quiet`: zero contributions through the snapshot date, one to three integrity points.

A game is won when all quiet bricks are cleared. Protected bricks remain visible as the record of work.
