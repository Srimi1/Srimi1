# Maintaining the studio

The profile uses a compact, theme-aware README and a static GitHub Pages portfolio. Projects and navigation work without JavaScript. The small local module adds project filters, a command menu, and a persistent theme choice. Sarah's note is authored content, not a live AI service.

## Preview and checks

Use Node 22 or later and Chrome/Chromium. Run `npm ci`, then `npm run preview` and open http://127.0.0.1:8088/.

- `npm test`: public-calendar parsing and source validation.
- `PREVIEW_URL=http://127.0.0.1:8088/ npm run test:visual`: responsive layouts, assets, filters, keyboard interactions, theme, and progressive enhancement.
- `npm run generate`: regenerate the public activity chart and its website copy from checked-in snapshots.
- `npm run optimize:icons`: recreate 96px WebP project icons and a 128px Sarah portrait from preserved originals. Needs Chrome/Chromium; set `CHROME_BIN` when needed.

Browser screenshots go into ignored `qa/profile/`. The design comparison is at `docs/designs.html`; research and independent selection notes are in `design/`. Keep both README banner variants small and semantically equivalent. Keep critical introduction and project information in real text.

## Publishing and daily refresh

The existing Pages workflow runs tests and browser checks before publishing `docs/` on pushes to `main`. No build framework or runtime service is required. The daily workflow fetches only public contributions and repository metadata, validates them, and updates public data and the activity chart. A source failure preserves the previous snapshot. Historical hero assets are no longer regenerated.

Keep the original avatar, Sarah illustration, duo artwork, and project identities unchanged. Optimized icon derivatives preserve their source files. Keep `play.html` as an old-link redirect; the former game remains removed. See `ASSETS.md` for provenance.
