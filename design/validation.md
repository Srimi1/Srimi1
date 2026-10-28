# Redesign validation

Measured on 28 October 2026. These are file-size measurements and functional checks, not claims about real-world conversion or page-load timing.

## Asset budget

| Referenced assets | Before | After | Change |
| --- | ---: | ---: | ---: |
| README images (including optional artwork/chart; light banner variant) | 3,111,834 bytes | 286,854 bytes | 90.8% smaller |
| Four displayed project icons | 2,810,810 bytes | 10,262 bytes | 99.6% smaller |
| Optional Sarah portrait | 240,738 bytes | 5,094 bytes | 97.9% smaller |

The alternate dark README banner is also approximately 1.2 KB. Both the README and site use local assets. The site has no third-party runtime requests or framework dependency. Original art and project logos remain unchanged. Collapsed content may still be downloaded by browsers; the README total includes those images rather than assuming they are free.

## Verification

- GitHub's Markdown rendering API retained the theme-aware picture and all three native disclosures.
- Public-calendar parser tests and fail-closed source validation passed.
- Chromium browser checks cover desktop, tablet, 390px and 320px layouts; project filters; keyboard menu search, empty results, navigation and focus; themes; denied local storage; reduced motion; JavaScript-disabled content; local image decoding; and the old-link redirect.
- The ten-design gallery was checked at desktop, 390px and 320px, including native keyboard disclosures.
- Screenshot review caught missing arrow glyphs, tiny availability labels, and a mobile menu control; those were corrected before publication.

Run the commands in [MAINTENANCE.md](../MAINTENANCE.md) to reproduce local verification. GitHub Actions runs the functional and browser suites before deploying the portfolio.
