# Profile research notes

Reviewed 2026-10-28. Research used public web search, direct GitHub README inspection, GitHub documentation, and Srijan's public project material. These are examples of useful design patterns observed in live profiles, not evidence of higher conversion or a statistically established trend.

## Live examples

| Example | Verified pattern | Lesson for Srijan |
| --- | --- | --- |
| [Anthony Fu](https://github.com/antfu/antfu/blob/main/README.md) | A compact, centered navigation line | The README does not need to duplicate everything GitHub already shows. |
| [Simon Willison](https://github.com/simonw/simonw/blob/main/README.md) | Current projects followed by automated recent releases, writing, and notes | Lead with work and add activity only when it gives useful context. |
| [mrgwd](https://github.com/mrgwd/mrgwd/blob/main/README.md) | Concise identity and a stack disclosed through a details section | Optional depth can remain native to GitHub and keyboard accessible. |
| [Maggie Appleton](https://github.com/MaggieAppleton/MaggieAppleton/blob/main/README.md) | A distinctive one-sentence identity with direct links | Clear personal language can do more than a large set of badges. |
| [Tim Burgan](https://github.com/timburgan/timburgan/blob/master/README.md) | Chess interaction through issue links and Actions | GitHub-native play is possible, but issue traffic and automation create maintenance; this is a poor fit for the minimal brief. |

The practical direction is a project-first introduction, intentional visual identity, optional detail, and limited external dependencies. It preserves the personal charm of Srijan and Sarah while letting a visitor find actual work immediately.

## Platform constraints

- [GitHub profile README documentation](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme) explains how a public username repository exposes its README on the profile.
- [GitHub collapsed-section documentation](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections) documents `details` and `summary`, which provide actual interaction without scripts.
- [GitHub picture-element documentation](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/using-the-picture-element) documents theme-aware sources. A local light/dark identity asset can adapt to the viewer's theme.
- A README is a sanitized document, not an unrestricted website. Arbitrary page CSS and JavaScript interactions belong in the companion Pages site. The visual study explicitly shows conceptual layouts, not a promise that its CSS runs on a profile.

## User-specific evidence

The existing profile already has original Srijan and Sarah artwork and a coherent group of projects. Its four project icon requests together account for approximately 3.1 MB despite being displayed at small sizes. The introductory identity and language list are repeated, and the two-column project table is dense on small screens.

The design addresses these concrete issues through appropriately sized local assets, a shorter introduction, readable project rows, and optional details. The original artwork and project identities remain intact. Release claims remain consistent with public source READMEs; in particular, The Keyboard Project is pre-release.

## Decision record

The [selection record](selection.md) contains all ten directions, a transparent subjective matrix, and the three independent ranked reviews. The [visual gallery](../docs/designs.html) presents exactly ten original mini-mockups, their tradeoffs, and the chosen direction.
