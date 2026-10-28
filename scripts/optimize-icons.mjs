// Create display-sized copies; original project identities stay untouched.
import { access, stat, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { servePreview } from "./preview-server.mjs";

const candidates = [
  process.env.CHROME_BIN,
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  try {
    await access(candidate);
    executablePath = candidate;
    break;
  } catch {}
}
if (!executablePath) throw new Error("Set CHROME_BIN to Chrome or Chromium.");
const originals = [
  ["assets/projects/notch-hub.png", "assets/projects/notch-hub.webp", 96],
  ["assets/projects/p-agents.jpg", "assets/projects/p-agents.webp", 96],
  [
    "assets/projects/internet-speed-reader.png",
    "assets/projects/internet-speed-reader.webp",
    96,
  ],
  [
    "assets/projects/the-keyboard-project.png",
    "assets/projects/the-keyboard-project.webp",
    96,
  ],
  ["assets/sarah.webp", "assets/sarah-small.webp", 128],
];
const { server, origin } = await servePreview();
let browser;
try {
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: process.platform === "linux" ? ["--no-sandbox"] : [],
  });
  const page = await browser.newPage();
  await page.goto(origin);
  let before = 0,
    after = 0;
  for (const [source, target, size] of originals) {
    const data = await page.evaluate(
      async ({ source, size }) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d");
        const scale = Math.min(size / image.width, size / image.height);
        const width = image.width * scale,
          height = image.height * scale;
        context.drawImage(
          image,
          (size - width) / 2,
          (size - height) / 2,
          width,
          height,
        );
        return canvas.toDataURL("image/webp", 0.85).split(",")[1];
      },
      { source, size },
    );
    const bytes = Buffer.from(data, "base64");
    await writeFile(`docs/${target}`, bytes);
    before += (await stat(`docs/${source}`)).size;
    after += bytes.length;
    console.log(`${target}: ${bytes.length} bytes (${size} × ${size} WebP)`);
  }
  console.log(
    `Display assets: ${before} → ${after} bytes; ${(100 * (1 - after / before)).toFixed(1)}% smaller.`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
