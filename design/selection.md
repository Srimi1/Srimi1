# Profile design selection

This study compares ten original design directions for Srijan's GitHub profile and its companion Pages portfolio. The visual review board is [docs/designs.html](../docs/designs.html). Existing illustrations and design source files are preserved.

## The brief and the evidence

The goal is a minimal, creative, interactive profile that makes Srijan's work easier to understand and loads reliably. Public project READMEs establish a coherent identity: a developer and student in India building native applications and agent systems. The existing profile also identifies Sarah as his AI companion from Sera. `MAINTENANCE.md` requires preserving the original avatar, Sarah illustration, and selected-project identities.

The existing README repeats the introduction and the tools list, places work below a large artwork, and requests original project icons whose combined size is approximately 3.1 MB. Two-column table content is dense on a narrow screen. The redesign can make a meaningful improvement through hierarchy and asset sizing rather than by adding remote widgets.

## Ten directions

These scores are subjective design judgments, not user research, conversion data, or claims about popularity. Each criterion is scored out of ten. The weighted total uses personal fit 30%, clarity 25%, creativity 20%, performance 15%, and GitHub compatibility 10%. Performance assumes local, appropriately sized assets. Compatibility rewards ordinary links, supported HTML, and native disclosure elements.

| Direction | Personal fit | Clarity | Creativity | Performance | GitHub fit | Weighted total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 01 · Quiet Systems Studio | 10 | 10 | 9 | 10 | 10 | 9.80 |
| 02 · Product Shelf | 10 | 9 | 8 | 9 | 10 | 9.20 |
| 03 · Builder's Field Notes | 9 | 9 | 8 | 10 | 10 | 9.05 |
| 04 · Human + AI Diptych | 10 | 8 | 10 | 8 | 9 | 9.10 |
| 05 · Terminal Index | 8 | 8 | 8 | 10 | 10 | 8.50 |
| 06 · Native Systems Blueprint | 9 | 8 | 9 | 9 | 9 | 8.75 |
| 07 · Choose Your Path | 9 | 9 | 9 | 10 | 10 | 9.25 |
| 08 · Release Ledger | 8 | 9 | 6 | 10 | 10 | 8.35 |
| 09 · Illustrated Postcard | 9 | 8 | 9 | 8 | 9 | 8.60 |
| 10 · Contribution Observatory | 7 | 7 | 9 | 8 | 9 | 7.75 |

1. **Quiet Systems Studio:** a compact identity, one introduction, concise project rows, and optional personal details. Best overall balance of immediacy, personality, and weight.
2. **Product Shelf:** small app packages with purpose and release stage. Excellent project fit; less expression of Sarah.
3. **Builder's Field Notes:** notes about why each project exists. Personal and lightweight; ongoing notes require upkeep.
4. **Human + AI Diptych:** Srijan and Sarah introduce two related worlds. Highly personal; large character art can dominate.
5. **Terminal Index:** ordinary links and disclosures styled as a readable command index. Light and memorable; less aligned with native GUI products.
6. **Native Systems Blueprint:** an architecture drawing connects interfaces, local data, and agent execution. Strong technical story; less personal.
7. **Choose Your Path:** three disclosures for applications, agents, and Sarah. Useful native interaction; avoid hiding all projects initially.
8. **Release Ledger:** a precise list distinguishing available apps, source tooling, and pre-release work. Clear but less expressive.
9. **Illustrated Postcard:** a restrained slice of existing character artwork with a brief greeting and direct project links. Memorable; artwork must not obscure content.
10. **Contribution Observatory:** a small locally rendered rhythm graphic. Adds continuity; contribution counts should not outrank project quality.

## Selected direction

Use **Quiet Systems Studio** as the foundation. Borrow clear project purposes and release stages from Product Shelf, and optional exploration from Choose Your Path. Keep the work visible by default. Preserve Sarah as a personal, optional discovery. Use the existing Pages portfolio for richer interaction while the README remains native to GitHub.

The gallery previews are conceptual HTML/CSS miniatures; they are not assertions that arbitrary CSS or JavaScript runs in a GitHub README. The activity bars in direction 10 are explicitly illustrative and are not live contribution data.

## Independent reviews

The design, research, and technical-audit agents separately ranked the same ten concepts. Their ranked votes are distinct from the design author's numerical matrix above; no numerical scores were invented for the other reviewers.

| Reviewer | First | Second | Third |
| --- | --- | --- | --- |
| Design directions | 01 · Quiet Systems Studio | 07 · Choose Your Path | 02 · Product Shelf |
| Trend research | 02 · Product Shelf | 01 · Quiet Systems Studio | 04 · Human + AI Diptych |
| Technical audit | 01 · Quiet Systems Studio | 07 · Choose Your Path | 04 · Human + AI Diptych |

Quiet Systems Studio received two first-place votes and one second-place vote. The coordinating agent selected it as the foundation, combining project outcomes from Product Shelf, native disclosure from Choose Your Path, and Sarah's optional personal detail from Human + AI Diptych.

The supporting [research notes](research.md) document live examples and platform constraints without presenting these observations as quantitative trend evidence.

## Verified project context

- [NotchHub](https://github.com/Srimi1/Notch-hub): a native, local-first macOS dashboard. Public builds use ad-hoc signatures and are not notarized.
- [Internet Speed Reader](https://github.com/Srimi1/Internet-speed-reader): native macOS live traffic monitoring and manual capacity tests. Public builds use ad-hoc signatures and are not notarized.
- [P-Agents](https://github.com/Srimi1/P-Agents): a Rust agent harness with streaming, gated tools, parallel delegation, and session replay.
- [The Keyboard Project](https://github.com/Srimi1/The-Keyboard-project): a pre-release device candidate. Physical-device acceptance remains open.
- [Sera](https://github.com/Srimi1/Sera-Autonomous-Agent): the public project context for Sarah, identified in the existing profile as Srijan's AI companion.

## Platform references

- [Managing a profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme): profile placement and supported content.
- [Organizing information with collapsed sections](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/organizing-information-with-collapsed-sections): supported `details` and `summary` interaction.

