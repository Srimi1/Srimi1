# Signal / Run assets

The original character identities are preserved. The game pairs Srijan's black-haired, headphone-wearing avatar with Sarah's blue-haired, white-and-gold Sera character. The new cover is static. Gameplay animation occurs only after the player starts a run.

| Asset | Path | Source and use |
| --- | --- | --- |
| Original avatar | `docs/assets/avatar.png` | Existing profile asset, unchanged. SHA-256: `82e447e61831d5972c362216f2be8de6a829185b2b7b3b4a9e3a28245aad89aa`. |
| Avatar thumbnail | `docs/assets/avatar.webp` | A smaller encoding of the same avatar for the HUD. |
| Original Sarah | `docs/assets/sarah.png` | Recovered from the user's existing Sera character assets. Exact original Git blob: `e99f3bfee4dd66546b7499a91215fa9b8229966e`. |
| Sarah in the game | `docs/assets/sarah.webp` | Optimized encoding of the original transparent character, with no design changes. |
| Original running atlas | `docs/assets/run-cycle.png` | Existing eight-frame Srijan sprite sheet. Preserved. |
| Runtime running atlas | `docs/assets/runner-sprites.webp` | Optimized version of the same eight frames; alpha preserved. |
| New duo key art | `docs/assets/signal-keyart.webp` | Generated using the built-in image-generation tool, with the original avatar and Sarah as identity references. [Full prompt](design/signal-art-prompt.md). |
| Static profile cover | `assets/signal-cover.jpg` | A still capture of the actual title screen, exported by the browser QA script. Links to the real game. |
| Social preview cover | `docs/assets/signal-cover.jpg` | Byte-identical copy of the profile cover for the Pages Open Graph image. |
| Existing project logos | `docs/assets/projects/*` | Preserved project identity assets. |
| Fonts | `docs/assets/fonts/*` | Barlow Condensed, DM Sans, and Space Mono, sourced from Google Fonts and served locally. Their SIL Open Font Licenses are included. |

City layers, rooftop platforms, memory crystals, drones, the Guardian, relay gates, trails, and impact effects are drawn in Canvas. Sound effects and the optional ambient score are synthesized locally with Web Audio. There is no prerecorded game loop, third-party game runtime, remote font dependency, or API key requirement.

The original avatar and Sarah files are retained beside their optimized encodings. The previous arcade and its GIF remain recoverable through Git history, rather than being shipped as the current game.
