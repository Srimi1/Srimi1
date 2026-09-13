# Assets

**Art direction:** A premium dark-navy developer-tool interface that combines the spatial clarity of a GitHub contribution graph with the tactile feedback of a modern arcade cabinet. Cyan, light blue, deep blue, and near-indigo communicate recorded contribution intensity. Quiet blocks crack and fragment; protected blocks retain their shape and answer impacts with a restrained rim pulse.

| Asset | Path | Purpose | Notes |
| --- | --- | --- | --- |
| Arcade visual target | `design/reference-break-the-year.jpg` | Spatial and palette reference for the full-year board | Generated at 16:9, then downscaled without cropping. |
| Impact effects reference | `design/impact-effects-reference.jpg` | Crack, fragment, pulse, ring, and trail reference | Generated at 4:3, then downscaled without cropping. |
| P-Agents icon | `docs/assets/projects/p-agents.jpg` | Missing project identity asset | Generated as a square developer-tool icon and reduced to 512 px. |
| Existing avatar | `docs/assets/avatar.png` | Profile and site identity | Preserved byte-for-byte; never regenerated. |
| Existing app marks | `docs/assets/projects/*` | Project identity | Original project artwork; no semantic edits. |
| Rotating wrappers | `assets/logo-orbits/*.svg` | 360-degree 3D logo motion in GitHub README | Generated locally from selected app marks with reduced-motion fallback. |
| Arcade autoplay loop | `assets/arcade-autoplay.gif` | Proof the README arcade actually autoplays, since GitHub strips scripts from README HTML | A real recording of the live Pages build (Chrome + Matter.js, captured with Puppeteer), not a mockup. Re-record after gameplay or visual changes; it is not part of the automated daily refresh. |

The gameplay effects are deterministic SVG/CSS/Web Audio rendering rather than baked image sprites so they remain sharp at every viewport size.
