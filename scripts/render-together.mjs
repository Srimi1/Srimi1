import { readFile, writeFile, mkdir, rename, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { createStory } from "../docs/together-core.mjs";
import { servePreview } from "./preview-server.mjs";

const root = resolve(import.meta.dirname, "..");
const docs = join(root, "docs"),
  output = join(root, "assets");
const qa = join(root, "qa", "together");
const fps = Number(process.env.STORY_FPS || 15);
if (!Number.isFinite(fps) || fps < 10 || fps > 30)
  throw new Error("STORY_FPS must be between 10 and 30");
const snapshot = JSON.parse(
  await readFile(join(docs, "data/activity.json"), "utf8"),
);
const dateParts = Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .map((part) => [part.type, part.value]),
);
const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
const asOf =
  process.env.STORY_DATE ||
  [(snapshot.updatedAt || today).slice(0, 10), today].sort()[0];
const story = createStory(snapshot, asOf);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const inputFiles = [
  "docs/index.html",
  "package-lock.json",
  "docs/kinematics.mjs",
  "docs/together-core.mjs",
  "docs/together-render.mjs",
  "docs/together.mjs",
  "docs/together.css",
  "scripts/render-together.mjs",
  "scripts/preview-server.mjs",
  "docs/assets/together/srijan.webp",
  "docs/assets/together/sarah.webp",
  "docs/assets/together/hug.webp",
  "docs/assets/fonts/barlow-condensed-800.woff2",
  "docs/assets/fonts/dm-sans-500.woff2",
  "docs/assets/fonts/space-mono-400.woff2",
];
const inputs = Object.fromEntries(
  await Promise.all(
    inputFiles.map(async (path) => [
      path,
      hash(await readFile(join(root, path))),
    ]),
  ),
);
const inputHash = hash(
  JSON.stringify({ calendar: story.world.calendar, asOf, fps, inputs }),
);
const readme = await readFile(join(root, "README.md"), "utf8");
let previous;
try {
  previous = JSON.parse(
    await readFile(join(output, "code-together.json"), "utf8"),
  );
} catch {}
let validCache = false;
if (previous?.inputHash === inputHash) {
  try {
    validCache =
      hash(await readFile(join(output, "code-together.gif"))) ===
        previous.gifSha256 &&
      hash(await readFile(join(docs, "assets/together/cover.jpg"))) ===
        previous.coverSha256 &&
      readme.includes(
        `assets/code-together.gif?v=${previous.gifSha256.slice(0, 12)}`,
      );
  } catch {}
}
if (process.argv.includes("--check")) {
  assert.ok(
    validCache,
    "README animation is missing or stale; run npm run render:story",
  );
  console.log(
    `Verified README animation: ${previous.frames} frames, ${previous.activeDays.length} contribution days, ${(previous.bytes / 1048576).toFixed(2)} MiB`,
  );
  process.exit(0);
}
if (validCache && process.env.FORCE_STORY !== "1") {
  console.log(
    "Contribution story is current; keeping the existing verified GIF.",
  );
  process.exit(0);
}
const candidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
let executablePath;
for (const path of candidates) {
  try {
    await access(path);
    executablePath = path;
    break;
  } catch {}
}
if (!executablePath)
  throw new Error(
    "Set CHROME_BIN to an installed Chrome or Chromium executable.",
  );
let gifsicle;
for (const path of [
  process.env.GIFSICLE_BIN,
  "/opt/homebrew/bin/gifsicle",
  "/usr/bin/gifsicle",
].filter(Boolean)) {
  try {
    await access(path);
    gifsicle = path;
    break;
  } catch {}
}
if (!gifsicle)
  throw new Error("Install Gifsicle or set GIFSICLE_BIN to its executable.");
const { server, origin } = await servePreview(0, { exporter: true });
let browser;
try {
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: process.platform === "linux" ? ["--no-sandbox"] : [],
  });
  const page = await browser.newPage(),
    errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  page.on("request", (r) => {
    if (r.url().startsWith("http") && new URL(r.url()).origin !== origin)
      external.push(r.url());
  });
  await page.setViewport({ width: 1200, height: 850, deviceScaleFactor: 1 });
  await page.goto(`${origin}/?export=1&date=${asOf}`, {
    waitUntil: "networkidle0",
  });
  await page.waitForFunction(
    () =>
      window.codeTogether &&
      document.querySelector("#together").dataset.ready === "true",
  );
  assert.equal(await page.$$eval(".project-row", (rows) => rows.length), 4);
  await mkdir(qa, { recursive: true });
  await mkdir(output, { recursive: true });
  // Save full-size production scene previews, not mockups.
  const chapters = await page.evaluate(
    () => window.codeTogether.story.chapters,
  );
  for (const chapter of chapters) {
    if (!chapter.duration) continue;
    const fraction =
      chapter.name === "hug" ? 0.85 : chapter.name === "coffee" ? 0.72 : 0.5;
    const data = await page.evaluate(
      (t) => {
        const r = window.codeTogether;
        r.draw(t);
        return r.canvas.toDataURL("image/png").split(",")[1];
      },
      chapter.start + chapter.duration * fraction,
    );
    await writeFile(
      join(qa, `${chapter.name}.png`),
      Buffer.from(data, "base64"),
    );
  }
  const coverData = await page.evaluate(() => {
    const r = window.codeTogether;
    r.draw(3.7);
    return r.canvas.toDataURL("image/jpeg", 0.94).split(",")[1];
  });
  const cover = Buffer.from(coverData, "base64");
  // Real browser checks for layout, opt-out of motion, and a complete two-character route.
  await page.evaluate(() => window.codeTogether.draw(0));
  await page.screenshot({ path: join(qa, "desktop.png"), fullPage: true });
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.waitForFunction(
    () =>
      window.codeTogether &&
      document.querySelector("#together").dataset.ready === "true",
  );
  await page.evaluate(() => window.codeTogether.draw(0));
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile layout overflows",
  );
  await page.screenshot({ path: join(qa, "mobile.png"), fullPage: true });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.waitForFunction(
    () => document.querySelector("#motion").textContent === "Watch story",
  );
  assert.equal(
    await page.$eval("#motion", (e) => e.textContent),
    "Watch story",
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.waitForFunction(
    () => document.querySelector("#motion").textContent === "Pause story",
  );
  const route = await page.evaluate(() =>
    window.codeTogether.story.duet.actors.map((p) => ({
      id: p.id,
      done: p.done,
      visited: p.visited,
      jumps: p.jumps,
    })),
  );
  for (const p of route) {
    assert.equal(p.done, true);
    assert.deepEqual(
      p.visited,
      story.world.active.map((d) => d.date),
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  await page.exposeFunction("exportProgress", (value) =>
    console.log(`Rendering ${value}%`),
  );
  const encoded = await page.evaluate(async (fps) => {
    const { GIFEncoder, quantize, applyPalette } =
      await import("/__gifenc.mjs");
    const r = window.codeTogether,
      width = 800,
      height = 400;
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameContext = frameCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    function capture(t) {
      r.draw(t);
      frameContext.drawImage(r.canvas, 0, 0, width, height);
      return frameContext.getImageData(0, 0, width, height).data;
    }
    const sampleTimes = [
      0,
      3.8,
      ...r.story.chapters
        .filter((c) => c.duration > 0)
        .flatMap((c) => [
          c.start + c.duration * 0.25,
          c.start + c.duration * 0.8,
        ]),
    ];
    const sample = new Uint8Array(
      sampleTimes.length * Math.ceil((width * height) / 8) * 4,
    );
    let offset = 0;
    for (const t of sampleTimes) {
      const data = capture(t);
      for (let i = 0; i < data.length; i += 32) {
        sample.set(data.subarray(i, i + 4), offset);
        offset += 4;
      }
    }
    const colors = quantize(sample.subarray(0, offset), 255);
    // Compute the global RGB565 lookup once, keeping palette choices stable across frames.
    const grid = new Uint8Array(65536 * 4);
    for (let key = 0; key < 65536; key++) {
      grid[key * 4] = ((key >> 11) & 31) * 8 + 4;
      grid[key * 4 + 1] = ((key >> 5) & 63) * 4 + 2;
      grid[key * 4 + 2] = (key & 31) * 8 + 4;
      grid[key * 4 + 3] = 255;
    }
    const lookup = applyPalette(grid, colors);
    const palette = [[0, 0, 0], ...colors];
    const gif = GIFEncoder();
    const frames = Math.ceil(r.story.duration * fps);
    let previous;
    for (let frame = 0; frame < frames; frame++) {
      const data = capture(frame / fps);
      const indexed = new Uint8Array(width * height),
        delta = new Uint8Array(width * height);
      for (let i = 0; i < indexed.length; i++) {
        const j = i * 4,
          key =
            ((data[j] >> 3) << 11) |
            ((data[j + 1] >> 2) << 5) |
            (data[j + 2] >> 3);
        const value = lookup[key] + 1;
        indexed[i] = value;
        delta[i] = previous && previous[i] === value ? 0 : value;
      }
      const delay =
        (Math.round(((frame + 1) * 100) / fps) -
          Math.round((frame * 100) / fps)) *
        10;
      gif.writeFrame(delta, width, height, {
        palette: frame === 0 ? palette : undefined,
        delay,
        repeat: 0,
        transparent: frame > 0,
        transparentIndex: 0,
        dispose: 1,
      });
      previous = indexed;
      if (frame % Math.max(1, Math.floor(frames / 10)) === 0)
        await window.exportProgress(Math.round((frame / frames) * 100));
    }
    gif.finish();
    const bytes = gif.bytesView();
    let binary = "";
    for (let i = 0; i < bytes.length; i += 32768)
      binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return {
      base64: btoa(binary),
      frames,
      width,
      height,
      duration: Math.round((frames * 100) / fps) / 100,
    };
  }, fps);
  console.log("Optimizing the rendered story…");
  const optimized = spawnSync(
    gifsicle,
    [
      "--optimize=3",
      "--lossy=20",
      "--no-conserve-memory",
      "--no-ignore-errors",
    ],
    {
      input: Buffer.from(encoded.base64, "base64"),
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  if (optimized.status !== 0)
    throw new Error(
      `GIF optimization failed: ${optimized.stderr?.toString() || optimized.error}`,
    );
  const gif = optimized.stdout;
  const decoded = spawnSync(gifsicle, ["--info", "--no-ignore-errors"], {
    input: gif,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (decoded.status !== 0)
    throw new Error(`GIF decoding failed: ${decoded.stderr || decoded.error}`);
  const frameCount = Number(decoded.stdout.match(/(\d+) images/)?.[1]);
  const decodedDuration = [
    ...decoded.stdout.matchAll(/\bdelay ([\d.]+)s/g),
  ].reduce((sum, match) => sum + Number(match[1]), 0);
  assert.ok(frameCount > 100, "GIF lost its animated frames");
  assert.ok(
    decoded.stdout.includes("loop forever"),
    "GIF must loop automatically",
  );
  assert.ok(
    Math.abs(decodedDuration - encoded.duration) < 0.011,
    "Encoded story timing changed",
  );
  assert.equal(gif.subarray(0, 6).toString(), "GIF89a");
  assert.equal(gif.at(-1), 0x3b);
  assert.ok(
    gif.length < 10 * 1024 * 1024,
    `GIF is too large (${(gif.length / 1048576).toFixed(2)} MiB)`,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  const manifest = {
    title: "Code Together — Srijan × Sarah",
    source: snapshot.source,
    inputHash,
    inputs,
    windowStart: story.world.windowStart,
    windowEnd: story.world.windowEnd,
    activeDays: story.world.active.map((d) => ({
      date: d.date,
      contributions: d.contributionCount,
    })),
    route,
    frames: frameCount,
    encodedFrames: encoded.frames,
    fps,
    width: encoded.width,
    height: encoded.height,
    duration: encoded.duration,
    bytes: gif.length,
    gifSha256: hash(gif),
    coverSha256: hash(cover),
  };
  // Only replace the successful README output after the entire render and all checks pass.
  await writeFile(join(output, "code-together.gif.next"), gif);
  await writeFile(join(docs, "assets/together/cover.jpg"), cover);
  await rename(
    join(output, "code-together.gif.next"),
    join(output, "code-together.gif"),
  );
  await writeFile(
    join(output, "code-together.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  const versionedReadme = readme.replace(
    /src="assets\/code-together\.gif(?:\?v=[a-f0-9]+)?"/,
    `src="assets/code-together.gif?v=${manifest.gifSha256.slice(0, 12)}"`,
  );
  assert.notEqual(
    versionedReadme.indexOf(
      `assets/code-together.gif?v=${manifest.gifSha256.slice(0, 12)}`,
    ),
    -1,
    "README must embed the story",
  );
  if (versionedReadme !== readme)
    await writeFile(join(root, "README.md"), versionedReadme);
  console.log(
    `README story ready: ${frameCount} frames / ${encoded.duration}s / ${(gif.length / 1048576).toFixed(2)} MiB. Both characters visited ${story.world.active.length} worked days.`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
