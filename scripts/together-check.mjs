import { mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const url = process.env.STORY_URL || "http://127.0.0.1:8084/";
const output = join(process.cwd(), "qa", "together-browser");
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
if (!executablePath) throw new Error("Set CHROME_BIN to Chrome or Chromium.");
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: process.platform === "linux" ? ["--no-sandbox"] : [],
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await mkdir(output, { recursive: true });
try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000, deviceScaleFactor: 1 },
    mobile: {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    },
  })) {
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
      if (
        r.url().startsWith("http") &&
        new URL(r.url()).origin !== new URL(url).origin
      )
        external.push(r.url());
    });
    page.on("requestfailed", (r) =>
      errors.push(`${r.failure()?.errorText} ${r.url()}`),
    );
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => document.querySelector("#together").dataset.ready === "true",
    );
    assert.equal(await page.$$eval(".project-row", (rows) => rows.length), 4);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${name} overflows`,
    );
    const time = () => page.$eval("#together", (c) => Number(c.dataset.time));
    const before = await time();
    await delay(300);
    assert.ok((await time()) > before, "Story must autoplay");
    await page.click("#motion");
    assert.equal(
      await page.$eval("#motion", (b) => b.textContent),
      "Watch story",
    );
    const paused = await time();
    await delay(250);
    assert.equal(await time(), paused, "Pause must freeze the story");
    await page.click("#motion");
    await delay(150);
    assert.ok((await time()) > paused);
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.waitForFunction(
      () => document.querySelector("#motion").textContent === "Watch story",
    );
    const reduced = await time();
    await delay(200);
    assert.equal(await time(), reduced);
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "no-preference" },
    ]);
    await page.waitForFunction(
      () => document.querySelector("#motion").textContent === "Pause story",
    );
    const data = await page.evaluate(() => ({
      days: window.codeTogether.story.world.active.map((d) => d.date),
      actors: window.codeTogether.story.duet.actors.map((p) => ({
        id: p.id,
        visited: p.visited,
        done: p.done,
      })),
    }));
    for (const actor of data.actors) {
      assert.equal(actor.done, true);
      assert.deepEqual(actor.visited, data.days);
    }
    if (name === "desktop" && process.env.VERIFY_STORY_LOOP === "1") {
      await page.waitForFunction(
        () => document.querySelector("#together").dataset.chapter === "hug",
        { timeout: 70000 },
      );
      await page.screenshot({
        path: join(output, "live-hug.png"),
        fullPage: true,
      });
      await page.waitForFunction(
        () => document.querySelector("#together").dataset.chapter === "coffee",
        { timeout: 15000 },
      );
    }
    await page.screenshot({
      path: join(output, `${name}.png`),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      `${name}: autoplay, pause, reduced motion, contribution route, 4 projects, no overflow or browser errors passed`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
