# Implementation Memory

- The avatar must not change. Record and compare the SHA-256 hash of `docs/assets/avatar.png` before and after generation.
- The existing profile showed six featured projects, an experiment table, small tools, and seven more logo links. The evidence audit selected exactly four projects: NotchHub, P-Agents, Internet Speed Reader, and The Keyboard Project.
- Success was judged by working implementation, release or reproducible proof, tests/CI, documentation, and claim integrity. Stars and recency were not treated as proof.
- Matter.js 0.20.0 was selected as the stable open-source collision engine. It is vendored for offline/static-host reliability.
- The activity snapshot ends on 2026-09-12 and contains 255 elapsed 2026 dates: 60 with recorded contributions and 195 quiet days. The remaining 110 dates are future outlines, not fake inactivity.
- The README arcade artwork must stay static. The old automated ball, paddle, spark, and mascot sequence is intentionally removed; only the linked playground is interactive.
- CSS 3D logo motion must stop under `prefers-reduced-motion: reduce`.
- Protected contribution bricks use light, medium, dark, and deep-blue treatments. They pulse when hit but never break.
- A solvability regression found five quiet cells enclosed by protected dates when those dates were solid. Protected contribution cells are therefore pass-through Matter.js sensors: they still register hits and pulse, but the ball continues through and every quiet target remains reachable.
- Quiet-brick integrity is based on consecutive quiet-run depth: one hit for the first two days, two hits for days three through six, and three hits from day seven onward.

## Visual QA notes

The first redesigned desktop preview at 1280×720 showed the new hero, proof card, and the complete January–December fortress without horizontal clipping. The activity pattern and four protected blue intensities were visually legible; October–December appeared correctly as dashed future slots. The decorative running character and fake README-style ball animation were absent. The browser's accessibility extraction reported the exact 365/60/195/110 board summary and only the four audited project cards.

## Final screenshot QA

The 1280×720 full-page capture rendered at 1280 pixels wide with no page-level horizontal overflow. The hero hierarchy, full-year arcade, two-column four-project grid, data summary, and footer were all readable. The 390×844 full-page capture rendered at exactly 390 pixels wide with no page-level horizontal overflow. The hero collapsed to one column, the game remained contained in its card with an intentionally scrollable board viewport, project cards became a clean one-column stack, and the stats/links remained readable. Both automated captures reported zero console or page errors and the exact 60 protected, 195 quiet, and 110 future cell counts.
