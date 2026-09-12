import {readFile, writeFile} from 'node:fs/promises';
import {cycleMarkup} from '../docs/runner.mjs';
import {summarize} from '../docs/game-core.mjs';

const read = p => readFile(p, 'utf8').then(JSON.parse);
const data = await read('docs/data/activity.json');
const repos = await read('docs/data/repositories.json');
const s = summarize(data.weeks);
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const image = async p => 'data:image/png;base64,' + (await readFile(p)).toString('base64');
const avatar = await image('docs/assets/avatar.png'), runner = await image('docs/assets/run-cycle.png');

const start = (h, title, desc) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="${h}" viewBox="0 0 1100 ${h}" role="img"><title>${esc(title)}</title><desc>${esc(desc)}</desc><style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;fill:#edf5ff}.muted{fill:#8eabc3}.mono{font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,monospace;letter-spacing:1.5px}.still{display:none}.reveal{transform-box:fill-box;transform-origin:bottom;animation:grow 1.5s ease-out both}@keyframes grow{from{transform:scaleY(.05)}to{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}.moving{display:none}.still{display:inline}}</style><rect width="1100" height="${h}" rx="24" fill="#08121e" stroke="#1c3347" stroke-width="1.5"/>`;
const text = (x, y, t, size=16, cls='') => `<text x="${x}" y="${y}" font-size="${size}" class="${cls}">${esc(t)}</text>`;

// 1. HERO BANNER
let hero = start(420, 'Srijan Saanand — Build what you wish existed.', 'Developer and student in India. Native apps, useful tools, and agent experiments.');
hero += `<defs><clipPath id="portrait"><rect x="720" y="24" width="356" height="372" rx="18"/></clipPath><linearGradient id="line"><stop stop-color="#08a9ff"/><stop offset="1" stop-color="#6edfff"/></linearGradient></defs><path d="M40 36H665" stroke="#203547"/><circle cx="49" cy="69" r="4" fill="#52e1bf"/>`;
hero += text(65, 74, 'SRIJAN SAANAND / @SRIMI1', 14, 'mono') + text(40, 150, 'Build what you', 52) + text(40, 211, 'wish existed.', 52) + text(40, 263, 'Native apps. Useful tools. Agent experiments.', 21, 'muted') + text(40, 300, 'Developer & student · India', 17, 'muted');
hero += `<rect x="40" y="337" width="626" height="3" rx="2" fill="url(#line)"/>` + text(40, 375, 'SWIFT   /   RUST   /   TYPESCRIPT   /   PYTHON   /   KOTLIN', 12, 'mono') + `<image x="720" y="24" width="356" height="372" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)" xlink:href="${avatar}"/></svg>`;
await writeFile('assets/hero-v2.svg', hero);

// 2. BREAKOUT ARCADE BANNER (BREAK THE YEAR)
const colors = {NONE: '#172b3c', FIRST_QUARTILE: '#125676', SECOND_QUARTILE: '#087fb3', THIRD_QUARTILE: '#0ba9ee', FOURTH_QUARTILE: '#77e3ff'};
const pos = d => [38 + d.x * 19.35, 95 + d.y * 18];

let breakout = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="390" viewBox="0 0 1100 390" role="img">
<title>Break the Year — Srijan’s Contribution Breakout Arcade</title>
<desc>An arcade breakout game built from Srijan's real GitHub contribution calendar: ${s.total} contributions across ${s.days} calendar days.</desc>
<style>
  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; fill: #edf5ff; }
  .muted { fill: #8eabc3; }
  .mono { font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace; letter-spacing: 1.5px; }
  .accent { fill: #08a9ff; }
  .still { display: none; }
  @media (prefers-reduced-motion: reduce) {
    .moving { display: none !important; }
    .still { display: inline !important; }
  }
</style>
<defs>
  <linearGradient id="paddle-grad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#08a9ff" />
    <stop offset="50%" stop-color="#52e1bf" />
    <stop offset="100%" stop-color="#77e3ff" />
  </linearGradient>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="3" result="blur" />
    <feComposite in="SourceGraphic" in2="blur" operator="over" />
  </filter>
  <image id="run-sheet" width="1536" height="1024" xlink:href="${runner}"/>
</defs>

<!-- Background -->
<rect width="1100" height="390" rx="24" fill="#08121e" stroke="#1c3347" stroke-width="1.5"/>

<!-- Header -->
<text x="38" y="42" font-size="15" class="mono" fill="#08a9ff" font-weight="600">BREAK THE YEAR · THE CONTRIBUTION ARCADE</text>
<text x="38" y="68" font-size="14" class="muted">Smash through the calendar · Every brick is a GitHub contribution day</text>

<!-- Date range -->
<text x="760" y="42" font-size="12" class="muted" text-anchor="end">${data.weeks[0].contributionDays[0].date} →</text>
<text x="760" y="64" font-size="12" class="muted" text-anchor="end">${data.weeks.at(-1).contributionDays.at(-1).date}</text>

<!-- Play pill button -->
<a href="https://srimi1.github.io/Srimi1/" target="_blank">
  <g transform="translate(780, 28)" cursor="pointer">
    <rect width="280" height="42" rx="21" fill="#08a9ff" fill-opacity="0.15" stroke="#08a9ff" stroke-width="1.5"/>
    <text x="140" y="26" font-size="12" class="mono" text-anchor="middle" fill="#77e3ff" font-weight="bold">▶ PLAY ARCADE GAME ↗</text>
  </g>
</a>

<!-- Bricks Wall -->
<g id="bricks">
`;

for (const [x, w] of data.weeks.entries()) {
  for (const d of w.contributionDays) {
    const [px, py] = pos({...d, x, y: d.weekday});
    const col = colors[d.contributionLevel] || colors.NONE;
    breakout += `<rect x="${px}" y="${py}" width="15" height="14" rx="3" fill="${col}"><title>${d.date}: ${d.contributionCount} contributions</title></rect>\n`;
  }
}

breakout += `</g>

<!-- Animated Paddle -->
<g class="moving">
  <rect y="234" width="104" height="11" rx="5.5" fill="url(#paddle-grad)" filter="url(#glow)">
    <animate attributeName="x" dur="10s" repeatCount="indefinite"
      values="448; 618; 318; 718; 448"
      keyTimes="0; 0.25; 0.50; 0.75; 1"
      calcMode="spline"
      keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1" />
  </rect>
</g>
<rect class="still" x="498" y="234" width="104" height="11" rx="5.5" fill="url(#paddle-grad)" />

<!-- Animated Ball -->
<g class="moving">
  <circle r="6.5" fill="#ffffff" stroke="#77e3ff" stroke-width="1.5" filter="url(#glow)">
    <animateMotion dur="10s" repeatCount="indefinite"
      path="M 500 227 L 670 115 L 730 95 L 820 180 L 670 227 L 450 135 L 350 95 L 220 170 L 370 227 L 520 150 L 600 95 L 770 227 Z"
      calcMode="linear" />
  </circle>
</g>
<circle class="still" cx="550" cy="227" r="6.5" fill="#ffffff" stroke="#77e3ff" stroke-width="1.5" />

<!-- Brick Hit Spark Effects -->
<g class="moving">
  <circle cx="670" cy="115" r="1" fill="#77e3ff" opacity="0">
    <animate attributeName="r" values="2;16;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="0.75s"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="0.75s"/>
  </circle>
  <circle cx="730" cy="95" r="1" fill="#77e3ff" opacity="0">
    <animate attributeName="r" values="2;16;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="1.35s"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="1.35s"/>
  </circle>
  <circle cx="450" cy="135" r="1" fill="#77e3ff" opacity="0">
    <animate attributeName="r" values="2;16;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="3.25s"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="3.25s"/>
  </circle>
  <circle cx="350" cy="95" r="1" fill="#77e3ff" opacity="0">
    <animate attributeName="r" values="2;16;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="3.85s"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="3.85s"/>
  </circle>
  <circle cx="520" cy="150" r="1" fill="#77e3ff" opacity="0">
    <animate attributeName="r" values="2;16;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="5.75s"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="5.75s"/>
  </circle>
  <circle cx="600" cy="95" r="1" fill="#77e3ff" opacity="0">
    <animate attributeName="r" values="2;16;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="6.45s"/>
    <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.04;0.08" dur="10s" repeatCount="indefinite" begin="6.45s"/>
  </circle>
</g>

<!-- Mini Mascot (Player 01) -->
<g transform="translate(1015, 205)">
  <g class="moving">
    ${cycleMarkup('run-sheet')}
  </g>
  <g class="still">
    ${cycleMarkup('run-sheet', false)}
  </g>
  <text x="0" y="24" font-size="9" class="mono" text-anchor="middle" fill="#8eabc3">P1 SRIJAN</text>
</g>

<!-- Divider Line -->
<path d="M38 266H1062" stroke="#203547" stroke-width="1.5"/>

<!-- HUD / Stats -->
<g transform="translate(0, 5)">
  <text x="38" y="305" font-size="28" font-weight="bold">1,840</text>
  <text x="38" y="328" font-size="11" class="mono muted">ARCADE SCORE</text>

  <text x="260" y="305" font-size="28" font-weight="bold" fill="#52e1bf">❤❤❤</text>
  <text x="260" y="328" font-size="11" class="mono muted">BALLS LEFT</text>

  <text x="480" y="305" font-size="28" font-weight="bold">${s.total.toLocaleString()}</text>
  <text x="480" y="328" font-size="11" class="mono muted">CALENDAR BRICKS</text>

  <text x="740" y="305" font-size="28" font-weight="bold">${s.best} <tspan font-size="18" font-weight="normal" fill="#8eabc3">days</tspan></text>
  <text x="740" y="328" font-size="11" class="mono muted">BEST STREAK</text>
</g>

<!-- Footer hint -->
<text x="38" y="366" font-size="12" class="muted">Click anywhere to play the interactive Breakout game in your browser with real physics, sound, and live input.</text>

</svg>
`;

// Save both breakout-v2.svg and quest-v2.svg (for backwards compatibility)
await writeFile('assets/breakout-v2.svg', breakout);
await writeFile('assets/quest-v2.svg', breakout);

// 3. RHYTHM CHART
const months = {};
for (const w of data.weeks) for (const d of w.contributionDays) months[d.date.slice(0, 7)] = (months[d.date.slice(0, 7)] || 0) + d.contributionCount;
const langs = {};
for (const r of repos.filter(r => !r.fork && r.language)) langs[r.language] = (langs[r.language] || 0) + 1;
const top = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5), entries = Object.entries(months), max = Math.max(1, ...Object.values(months));
let chart = start(335, 'Activity rhythm and languages', 'Monthly contribution counts and public original repositories grouped by primary language.');
chart += text(36, 40, 'THE BUILD RHYTHM', 15, 'mono') + text(36, 67, 'Contributions per month', 14, 'muted') + text(700, 40, 'TOOLS OF THE TRADE', 15, 'mono') + text(700, 67, 'Public original repos · primary language', 14, 'muted');
for (const [i, [m, n]] of entries.entries()) {
  const x = 38 + i * 46, h = 140 * n / max;
  chart += `<rect class="reveal" x="${x}" y="${248 - h}" width="28" height="${Math.max(2, h)}" rx="4" fill="#0caaf5" style="animation-delay:${i * .06}s"/>` + text(x, 239 - h, n, 10, 'muted') + text(x, 274, m.slice(5), 11, 'muted');
}
for (const [i, [l, n]] of top.entries()) {
  const y = 105 + i * 37;
  chart += text(700, y, l, 14) + text(1030, y, n, 14, 'muted') + `<rect x="800" y="${y - 10}" width="${210 * n / top[0][1]}" height="10" rx="5" fill="${['#09a9f4', '#57c6f7', '#90e0ff', '#347cbb', '#506a86'][i]}" class="reveal"/>`;
}
chart += text(38, 313, `Snapshot ${data.updatedAt.slice(0, 10)} · ${repos.length} public repositories · ${repos.filter(r => !r.fork).length} originals · ${repos.filter(r => r.fork).length} forks`, 12, 'muted') + '</svg>';
await writeFile('assets/rhythm.svg', chart);

console.log(`Generated profile: ${repos.length} public repos, ${s.days} days, generated Break the Year arcade.`);

const demo = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-36 -74 72 88" role="img"><title>Srijan running — eight-frame stride cycle</title><style>.still{display:none}@media(prefers-reduced-motion:reduce){.moving{display:none}.still{display:inline}}</style><defs><image id="sheet" width="1536" height="1024" xlink:href="${runner}"/></defs><g class="moving">${cycleMarkup('sheet')}</g><g class="still">${cycleMarkup('sheet', false)}</g></svg>`;
await writeFile('docs/assets/run-demo.svg', demo);
