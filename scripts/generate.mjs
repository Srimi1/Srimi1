import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname} from 'node:path';
import {summarize} from '../docs/game-core.mjs';
import {LEVEL_COLORS, buildYearBoard, summarizeBoard} from '../docs/breakout-core.mjs';

const read = path => readFile(path, 'utf8').then(JSON.parse);
const data = await read('docs/data/activity.json');
const repos = await read('docs/data/repositories.json');
const featured = await read('docs/data/featured-projects.json');
const stats = summarize(data.weeks);
const escapeXml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const mimeFor = path => ({'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml'}[extname(path).toLowerCase()] || 'image/png');
const dataUri = async path => `data:${mimeFor(path)};base64,${(await readFile(path)).toString('base64')}`;
const avatar = await dataUri('docs/assets/avatar.png');

const start = (height, title, description) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="${height}" viewBox="0 0 1100 ${height}" role="img"><title>${escapeXml(title)}</title><desc>${escapeXml(description)}</desc><style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;fill:#edf5ff}.muted{fill:#8eabc3}.mono{font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,monospace;letter-spacing:1.5px}.reveal{transform-box:fill-box;transform-origin:bottom;animation:grow 1.5s ease-out both}@keyframes grow{from{transform:scaleY(.05)}to{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style><rect width="1100" height="${height}" rx="24" fill="#07131f" stroke="#1c3a50" stroke-width="1.5"/>`;
const text = (x, y, value, size = 16, cssClass = '') => `<text x="${x}" y="${y}" font-size="${size}" class="${cssClass}">${escapeXml(value)}</text>`;

// 1. HERO BANNER — the avatar remains read-only and byte-identical.
let hero = start(420, 'Srijan Saanand — Build the proof.', 'Developer and student in India building native products and agent systems with honest evidence.');
hero += `<defs><clipPath id="portrait"><rect x="720" y="24" width="356" height="372" rx="18"/></clipPath><linearGradient id="line"><stop stop-color="#168fe4"/><stop offset=".5" stop-color="#56d7ff"/><stop offset="1" stop-color="#61e6ca"/></linearGradient></defs><path d="M40 36H665" stroke="#203d52"/><circle cx="49" cy="69" r="4" fill="#61e6ca"/>`;
hero += text(65, 74, 'SRIJAN SAANAND / @SRIMI1', 14, 'mono');
hero += text(40, 150, 'Useful ideas.', 54);
hero += text(40, 211, 'Built all the way.', 54);
hero += text(40, 263, 'Native products. Agent systems. Honest evidence.', 20, 'muted');
hero += text(40, 300, 'Developer & student · India', 17, 'muted');
hero += `<rect x="40" y="337" width="626" height="3" rx="2" fill="url(#line)"/>`;
hero += text(40, 375, 'SWIFT   /   RUST   /   TYPESCRIPT   /   PYTHON', 12, 'mono');
hero += `<image x="720" y="24" width="356" height="372" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)" xlink:href="${avatar}"/></svg>`;
await writeFile('assets/hero-v2.svg', hero);

// 2. STATIC FULL-YEAR ARCADE PREVIEW — intentionally no fake ball, paddle, mascot, or animation.
const days = data.weeks.flatMap(week => week.contributionDays);
const snapshotDate = days.at(-1).date;
const board = buildYearBoard(data.weeks, {year: 2026, snapshotDate});
const boardSummary = summarizeBoard(board);
const cellX = slot => 37 + slot.weekIndex * 19.35;
const cellY = slot => 99 + slot.weekday * 21;
let breakout = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="390" viewBox="0 0 1100 390" role="img">
<title>Break the Quiet Days — Srijan's 2026 Contribution Fortress</title>
<desc>A static full-year game preview. ${boardSummary.quiet} quiet days are destructible; ${boardSummary.protected} dates with recorded contributions are protected pass-through energy shields.</desc>
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;fill:#edf5ff}.muted{fill:#8eabc3}.mono{font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,monospace;letter-spacing:1.35px}.quiet{fill:#173047}.future{fill:#0b1824;fill-opacity:.16;stroke:#28465a;stroke-dasharray:2 2}.hit1{stroke:#2d5873;stroke-width:1}.hit2{stroke:#5c8299;stroke-width:1.3}.hit3{stroke:#8fb8cb;stroke-width:1.7}</style>
<defs><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#168fe4"/><stop offset="1" stop-color="#61e6ca"/></linearGradient></defs>
<rect width="1100" height="390" rx="24" fill="#07131f" stroke="#1c3a50" stroke-width="1.5"/>
<text x="38" y="42" font-size="15" class="mono" fill="#42c8ff" font-weight="600">BREAK THE QUIET DAYS · 2026 CONTRIBUTION FORTRESS</text>
<text x="38" y="68" font-size="14" class="muted">Clear the quiet dates. Every recorded contribution remains an indestructible pass-through energy shield.</text>
<text x="1062" y="42" font-size="12" class="muted" text-anchor="end">SNAPSHOT ${escapeXml(snapshotDate)}</text>
<text x="1062" y="64" font-size="11" class="mono" text-anchor="end" fill="#61e6ca">REAL GITHUB DATA</text>
<g id="year-grid">`;
for (const slot of board) {
  const cssClass = slot.kind === 'future' ? 'future' : slot.kind === 'protected' ? '' : `quiet hit${slot.maxHits}`;
  const fill = slot.kind === 'protected' ? LEVEL_COLORS[slot.level] : undefined;
  breakout += `<rect x="${cellX(slot).toFixed(2)}" y="${cellY(slot)}" width="15" height="15" rx="2.5" class="${cssClass}"${fill ? ` fill="${fill}"` : ''}><title>${escapeXml(slot.kind === 'protected' ? `${slot.date}: ${slot.count} contributions · protected` : slot.kind === 'future' ? `${slot.date}: future date` : `${slot.date}: quiet · ${slot.maxHits} hits`)}</title></rect>`;
}
breakout += `</g>
<path d="M38 271H1062" stroke="#203d52" stroke-width="1.5"/>
<text x="38" y="306" font-size="28" font-weight="650">${boardSummary.quiet}</text><text x="38" y="329" font-size="11" class="mono muted">QUIET BLOCKS TO CLEAR</text>
<text x="305" y="306" font-size="28" font-weight="650" fill="#56d7ff">${boardSummary.protected}</text><text x="305" y="329" font-size="11" class="mono muted">PROTECTED CONTRIBUTION DAYS</text>
<text x="623" y="306" font-size="28" font-weight="650">${boardSummary.future}</text><text x="623" y="329" font-size="11" class="mono muted">FUTURE DATE OUTLINES</text>
<a href="https://srimi1.github.io/Srimi1/" target="_blank"><g transform="translate(850 285)" cursor="pointer"><rect width="212" height="47" rx="23.5" fill="url(#accent)"/><text x="106" y="29" text-anchor="middle" font-size="11" class="mono" fill="#03121d" font-weight="700">PLAY PHYSICS ARCADE ↗</text></g></a>
<text x="38" y="365" font-size="12" class="muted">Quiet-run depth sets 1–3 hit durability. The linked game adds real collision physics, cracks, fragments, combos, and lives.</text>
</svg>`;
await writeFile('assets/breakout-v2.svg', breakout);
await writeFile('assets/quest-v2.svg', breakout);

// 3. RHYTHM CHART
const months = {};
for (const week of data.weeks) for (const day of week.contributionDays) months[day.date.slice(0, 7)] = (months[day.date.slice(0, 7)] || 0) + day.contributionCount;
const languages = {};
for (const repo of repos.filter(repo => !repo.fork && repo.language)) languages[repo.language] = (languages[repo.language] || 0) + 1;
const topLanguages = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5);
const monthEntries = Object.entries(months);
const maximum = Math.max(1, ...Object.values(months));
let chart = start(335, 'Activity rhythm and languages', 'Monthly contribution counts and public original repositories grouped by primary language.');
chart += text(36, 40, 'THE BUILD RHYTHM', 15, 'mono') + text(36, 67, 'Contributions per month', 14, 'muted') + text(700, 40, 'TOOLS OF THE TRADE', 15, 'mono') + text(700, 67, 'Public original repos · primary language', 14, 'muted');
for (const [index, [month, count]] of monthEntries.entries()) {
  const x = 38 + index * 46;
  const height = 140 * count / maximum;
  chart += `<rect class="reveal" x="${x}" y="${248 - height}" width="28" height="${Math.max(2, height)}" rx="4" fill="#0caaf5" style="animation-delay:${index * .06}s"/>` + text(x, 239 - height, count, 10, 'muted') + text(x, 274, month.slice(5), 11, 'muted');
}
for (const [index, [language, count]] of topLanguages.entries()) {
  const y = 105 + index * 37;
  chart += text(700, y, language, 14) + text(1030, y, count, 14, 'muted') + `<rect x="800" y="${y - 10}" width="${210 * count / topLanguages[0][1]}" height="10" rx="5" fill="${['#09a9f4', '#57c6f7', '#90e0ff', '#347cbb', '#506a86'][index]}" class="reveal"/>`;
}
chart += text(38, 313, `Snapshot ${data.updatedAt.slice(0, 10)} · ${repos.length} public repositories · ${repos.filter(repo => !repo.fork).length} originals · ${repos.filter(repo => repo.fork).length} forks`, 12, 'muted') + '</svg>';
await writeFile('assets/rhythm.svg', chart);

// 4. 360-DEGREE LOGO WRAPPERS FOR THE GITHUB README
await mkdir('assets/logo-orbits', {recursive: true});
for (const [index, project] of featured.entries()) {
  const logo = await dataUri(`docs/${project.image}`);
  const delay = -(index * 1.75);
  const wrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img"><title>${escapeXml(project.name)} logo rotating through 360 degrees</title><style>.logo{transform-box:fill-box;transform-origin:center;animation:orbit 7s cubic-bezier(.45,.05,.55,.95) ${delay}s infinite}.halo{animation:breathe 3.5s ease-in-out ${delay}s infinite}@keyframes orbit{0%{transform:perspective(300px) rotateY(0deg) rotateX(0deg)}25%{transform:perspective(300px) rotateY(90deg) rotateX(7deg)}50%{transform:perspective(300px) rotateY(180deg) rotateX(0deg)}75%{transform:perspective(300px) rotateY(270deg) rotateX(-7deg)}100%{transform:perspective(300px) rotateY(360deg) rotateX(0deg)}}@keyframes breathe{50%{opacity:.7;transform:scale(1.08)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}.logo{transform:none!important}}</style><defs><radialGradient id="bg"><stop stop-color="#153a57"/><stop offset="1" stop-color="#07131f"/></radialGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".42"/></filter><clipPath id="clip"><rect x="24" y="24" width="80" height="80" rx="18"/></clipPath></defs><rect x="8" y="8" width="112" height="112" rx="28" fill="url(#bg)" stroke="#294b63"/><circle class="halo" cx="64" cy="64" r="43" fill="none" stroke="#42c8ff" stroke-opacity=".18"/><g class="logo" filter="url(#shadow)"><image x="24" y="24" width="80" height="80" preserveAspectRatio="xMidYMid meet" clip-path="url(#clip)" xlink:href="${logo}"/></g></svg>`;
  await writeFile(`assets/logo-orbits/${project.repo}.svg`, wrapper);
}

console.log(`Generated profile: ${repos.length} public repos, ${stats.days} calendar days, ${boardSummary.quiet} quiet blocks, ${boardSummary.protected} protected days, ${featured.length} rotating project logos.`);
