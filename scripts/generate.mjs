import { readFile, writeFile, copyFile } from "node:fs/promises";
import { summarize } from "../docs/profile-data.mjs";

const read = (path) => readFile(path, "utf8").then(JSON.parse);
const data = await read("docs/data/activity.json");
const repos = await read("docs/data/repositories.json");
const stats = summarize(data.weeks);
const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const start = (height, title, description) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="${height}" viewBox="0 0 1100 ${height}" role="img"><title>${escapeXml(title)}</title><desc>${escapeXml(description)}</desc><style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;fill:#edf5ff}.muted{fill:#8eabc3}.mono{font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,monospace;letter-spacing:1.5px}</style><rect width="1100" height="${height}" rx="24" fill="#07131f" stroke="#1c3a50" stroke-width="1.5"/>`;
const text = (x, y, value, size = 16, cssClass = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" class="${cssClass}">${escapeXml(value)}</text>`;

// Public activity only. Historical hero assets stay preserved, not regenerated.
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
await copyFile("assets/rhythm.svg", "docs/assets/rhythm.svg");

console.log(
  `Generated public activity chart: ${repos.length} public repos, ${stats.days} calendar days.`,
);
