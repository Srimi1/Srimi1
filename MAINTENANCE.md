# Maintaining the profile

The website is a static portfolio starring Srijan and Sarah from Sera. The README uses a still banner, a small typing introduction, skill badges, selected projects, and public activity. The game and long story animation are removed. `play.html` redirects old links to the portfolio.

## Preview and checks

Use Node 22 or later and Chrome/Chromium. Run `npm ci`, then `npm run preview` and open http://127.0.0.1:8088/.

- `npm test`: public-calendar parsing and validation.
- `PREVIEW_URL=http://127.0.0.1:8088/ npm run test:visual`: desktop, tablet, and mobile layouts, local assets, project links, old-link redirect, and typing/reduced-motion behavior.
- `PREVIEW_URL=http://127.0.0.1:8088/ EXPORT_COVER=1 npm run test:visual`: also capture the actual static portfolio hero for the README and social preview.
- `npm run generate`: regenerate static public charts and mirror the current activity chart into the website.

Set `CHROME_BIN` if Chrome is at another location. Screenshots go into ignored `qa/profile/`. When changing the hero layout, export its still banner again before publishing. Keep the two `profile-intro.svg` copies identical. Reduced-motion visitors see a complete static sentence.

## Daily refresh

The existing GitHub workflow runs daily and supports manual dispatch. It fetches the signed-out public contribution calendar and public repository metadata, validates the source, and updates only public data and static charts. It does not regenerate story animations or restore games. A source failure preserves the existing snapshot.

Keep the original avatar, Sarah illustration, and selected-project identities unchanged. See `ASSETS.md` for sources and preserved art.
