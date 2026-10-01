import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { summarize } from "../docs/game-core.mjs";

const read = (path) => readFile(path, "utf8").then(JSON.parse);
const data = await read("docs/data/activity.json");
const repos = await read("docs/data/repositories.json");
const stats = summarize(data.weeks);
const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const mimeFor = (path) =>
  ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" })[
    extname(path).toLowerCase()
  ] || "image/png";
const dataUri = async (path) =>
  `data:${mimeFor(path)};base64,${(await readFile(path)).toString("base64")}`;
const avatar = await dataUri("docs/assets/avatar.png");

const start = (height, title, description) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="${height}" viewBox="0 0 1100 ${height}" role="img"><title>${escapeXml(title)}</title><desc>${escapeXml(description)}</desc><style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;fill:#edf5ff}.muted{fill:#8eabc3}.mono{font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,monospace;letter-spacing:1.5px}</style><rect width="1100" height="${height}" rx="24" fill="#07131f" stroke="#1c3a50" stroke-width="1.5"/>`;
const text = (x, y, value, size = 16, cssClass = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" class="${cssClass}">${escapeXml(value)}</text>`;

// 1. HERO BANNER — the avatar remains read-only and byte-identical.
let hero = start(
  420,
  "Srijan Saanand — Build the proof.",
  "Developer and student in India building native products and agent systems with honest evidence.",
);
hero += `<defs><clipPath id="portrait"><rect x="720" y="24" width="356" height="372" rx="18"/></clipPath><linearGradient id="line"><stop stop-color="#168fe4"/><stop offset=".5" stop-color="#56d7ff"/><stop offset="1" stop-color="#61e6ca"/></linearGradient></defs><path d="M40 36H665" stroke="#203d52"/><circle cx="49" cy="69" r="4" fill="#61e6ca"/>`;
hero += text(65, 74, "SRIJAN SAANAND / @SRIMI1", 14, "mono");
hero += text(40, 150, "Useful ideas.", 54);
hero += text(40, 211, "Built all the way.", 54);
hero += text(
  40,
  263,
  "Native products. Agent systems. Honest evidence.",
  20,
  "muted",
);
hero += text(40, 300, "Developer & student · India", 17, "muted");
hero += `<rect x="40" y="337" width="626" height="3" rx="2" fill="url(#line)"/>`;
hero += text(
  40,
  375,
  "SWIFT   /   RUST   /   TYPESCRIPT   /   PYTHON",
  12,
  "mono",
);
hero += `<image x="720" y="24" width="356" height="372" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)" xlink:href="${avatar}"/></svg>`;
await writeFile("assets/hero-v2.svg", hero);

// 3. RHYTHM CHART
const months = {};
for (const week of data.weeks)
  for (const day of week.contributionDays)
    months[day.date.slice(0, 7)] =
      (months[day.date.slice(0, 7)] || 0) + day.contributionCount;
const languages = {};
for (const repo of repos.filter((repo) => !repo.fork && repo.language))
  languages[repo.language] = (languages[repo.language] || 0) + 1;
const topLanguages = Object.entries(languages)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
const monthEntries = Object.entries(months);
const maximum = Math.max(1, ...Object.values(months));
let chart = start(
  335,
  "Activity rhythm and languages",
  "Monthly contribution counts and public original repositories grouped by primary language.",
);
chart +=
  text(36, 40, "THE BUILD RHYTHM", 15, "mono") +
  text(36, 67, "Contributions per month", 14, "muted") +
  text(700, 40, "TOOLS OF THE TRADE", 15, "mono") +
  text(700, 67, "Public original repos · primary language", 14, "muted");
for (const [index, [month, count]] of monthEntries.entries()) {
  const x = 38 + index * 46;
  const height = (140 * count) / maximum;
  chart +=
    `<rect x="${x}" y="${248 - height}" width="28" height="${Math.max(2, height)}" rx="4" fill="#0caaf5"/>` +
    text(x, 239 - height, count, 10, "muted") +
    text(x, 274, month.slice(5), 11, "muted");
}
for (const [index, [language, count]] of topLanguages.entries()) {
  const y = 105 + index * 37;
  chart +=
    text(700, y, language, 14) +
    text(1030, y, count, 14, "muted") +
    `<rect x="800" y="${y - 10}" width="${(210 * count) / topLanguages[0][1]}" height="10" rx="5" fill="${["#09a9f4", "#57c6f7", "#90e0ff", "#347cbb", "#506a86"][index]}"/>`;
}
chart +=
  text(
    38,
    313,
    `Snapshot ${data.updatedAt.slice(0, 10)} · ${repos.length} public repositories · ${repos.filter((repo) => !repo.fork).length} originals · ${repos.filter((repo) => repo.fork).length} forks`,
    12,
    "muted",
  ) + "</svg>";
await writeFile("assets/rhythm.svg", chart);

console.log(
  `Generated static profile graphics: ${repos.length} public repos, ${stats.days} calendar days.`,
);
