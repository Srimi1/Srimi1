# Profile and Game Plan: Break the Quiet Days

## Product goal

Refresh Srijan's GitHub profile without changing the existing avatar. Replace broad project promotion with a strict, evidence-backed portfolio shortlist. Rebuild the contribution arcade so it expresses a clear idea: **quiet days can be cleared, while days with recorded contributions endure**.

## Risk tasks

### 1. Full-year contribution fortress

- **Why isolated:** The board must represent every date in 2026 without inventing contributions after the latest GitHub snapshot.
- **Approach:** Build all 365 date slots. Dates through the snapshot become physical bricks; future dates are non-colliding outlines. Recorded-contribution dates are protected static bodies. Quiet dates are destructible static bodies with one to three integrity points based on the length of the surrounding quiet run.
- **Verify:** The 2026 snapshot produces 365 visual slots, 255 elapsed days, 60 protected contribution bricks, 195 quiet bricks, and 110 future slots.

### 2. Collision stability

- **Why isolated:** Fast Breakout balls can tunnel through narrow 53-column bricks or gain/lose energy unpredictably.
- **Approach:** Use Matter.js 0.20.0 with a fixed-step update loop, sub-step-safe wall geometry, frictionless restitution, capped speed progression, and explicit paddle-angle steering.
- **Verify:** The ball reflects from every wall, the paddle directs the return angle by contact offset, speed remains bounded, and the loss sensor removes exactly one life.

### 3. Damage and protected-hit feedback

- **Why isolated:** Repeated contacts must not double-count while visual state and physical bodies remain synchronized.
- **Approach:** Process Matter.js collision-start events once per contact pair. Quiet bricks lose one integrity point, reveal cracks, and shatter only at zero. Protected blocks remain in the world and emit an intensity-colored pulse. Broken blocks are removed from both Matter.js and the SVG renderer.
- **Verify:** One-, two-, and three-hit quiet bricks break on exactly the expected collision; protected bricks never lose integrity; every final hit updates score and remaining count once.

## Main build

- Preserve `docs/assets/avatar.png` byte-for-byte and continue using it in the hero and site header.
- Change the hero message to emphasize useful, verified work.
- Feature only NotchHub, P-Agents, Internet Speed Reader, and The Keyboard Project.
- Add measurable success parameters and accurate shipped/pre-release labels to every card.
- Add continuous 360-degree 3D logo rotation with a reduced-motion fallback.
- Remove the decorative running character and remove the fake animated ball/paddle sequence from the README arcade banner.
- Add a static full-year fortress preview to the README and a real interactive Matter.js game on GitHub Pages.
- Add crisp impact rings, cracks, fragments, a short ball trail, hit audio, combo scoring, pause/reset controls, keyboard/pointer/touch input, and saved best score.

## Verification

- `npm test` passes, including contribution-board rules, one/two/three-hit durability, protected bricks, win/life transitions, and Matter.js wall reflection.
- `npm run generate` preserves the avatar hash, regenerates static profile graphics, and emits four animated logo wrappers.
- The desktop and mobile pages render without overflow or browser-console errors.
- The board visibly presents the 2026 year, protected blue shades, quiet-brick integrity, and future placeholders.
- Gameplay verifies launch, paddle movement, collisions, cracks, shatter, pause, reset, life loss, score, and win-state logic.
- README contains only the four evidence-backed projects and no old experiment showcase sections.
