# Character identities and Code Together assets

New artwork uses the built-in image-generation tool with the preserved original Srijan avatar and Sarah illustration as exact identity references. [Full prompts and reference roles](design/code-together-art-prompts.md).

| Asset                | Path                                                                                        | Source and purpose                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Original Srijan      | `docs/assets/avatar.png`                                                                    | Unchanged. SHA-256 `82e447e61831d5972c362216f2be8de6a829185b2b7b3b4a9e3a28245aad89aa`.                                         |
| Original Sarah       | `docs/assets/sarah.png`                                                                     | Unchanged recovered Sera illustration. Original Git blob `e99f3bfee4dd66546b7499a91215fa9b8229966e`.                           |
| Srijan pose atlas    | `docs/assets/together/srijan.webp`                                                          | Transparent 4×3 sheet: four run poses, standing, anticipation, rising/falling jump, two typing poses, holding coffee, sipping. |
| Sarah pose atlas     | `docs/assets/together/sarah.webp`                                                           | Separate transparent 4×3 sheet with matching artwork and independently animated actions.                                       |
| Coordinated hug      | `docs/assets/together/hug.webp`                                                             | Transparent 3×2 sequence: facing, approaching, reaching, contact, embrace, settled hug.                                        |
| README story         | `assets/code-together.gif`                                                                  | Actual Canvas simulation exported as an optimized looping, silent GIF.                                                         |
| Story provenance     | `assets/code-together.json`                                                                 | Public source, date/count mapping, completed routes, dimensions/timing, and checksums.                                         |
| Social cover         | `docs/assets/together/cover.jpg`                                                            | Actual coffee-scene still for Pages social sharing.                                                                            |
| Original game assets | `docs/assets/signal-*`, `runner-sprites.webp`, `run-cycle.png`, `sarah.webp`, `avatar.webp` | Preserved for the original playable city at `play.html`.                                                                       |
| Project logos        | `docs/assets/projects/*`                                                                    | Preserved existing selected-project images.                                                                                    |
| Local fonts          | `docs/assets/fonts/*`                                                                       | Existing Barlow Condensed, DM Sans, Space Mono, with their SIL Open Font Licenses.                                             |

The city, desks, monitors, keyboards, code, coffee steam, contribution platforms, trails, heart, compiler rings, and final energy bloom are drawn in Canvas. All artwork and fonts are locally hosted. No live AI service, key, analytics, or tracking is required.

GIF export uses development-only [gifenc](https://github.com/mattdesl/gifenc) and [Gifsicle](https://www.lcdf.org/gifsicle/). The browser experience has no third-party JavaScript runtime dependencies.
