import { mkdir, copyFile, access } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:8084/";
const output =
  process.env.VISUAL_OUTPUT || join(process.cwd(), "qa", "profile");
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
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: process.platform === "linux" ? ["--no-sandbox"] : [],
});
try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1050, deviceScaleFactor: 1 },
    tablet: { width: 820, height: 1100, deviceScaleFactor: 1 },
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
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on("requestfailed", (r) =>
      errors.push(`${r.failure()?.errorText} ${r.url()}`),
    );
    page.on("request", (r) => {
      if (
        r.url().startsWith("http") &&
        new URL(r.url()).origin !== new URL(url).origin
      )
        external.push(r.url());
    });
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (img) => img.decode()));
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${name} horizontal overflow`,
    );
    assert.equal(await page.$$eval(".project-row", (rows) => rows.length), 4);
    assert.equal(
      await page.$$eval(
        "canvas,button,script[src]",
        (elements) => elements.length,
      ),
      0,
      "The public page must remain a portfolio with no game runtime or controls.",
    );
    await page.screenshot({
      path: join(output, `${name}.png`),
      fullPage: true,
    });
    if (name === "desktop" && process.env.EXPORT_COVER === "1") {
      await (
        await page.$(".hero")
      ).screenshot({
        path: "assets/profile-cover.jpg",
        type: "jpeg",
        quality: 94,
      });
      await copyFile(
        "assets/profile-cover.jpg",
        "docs/assets/profile-cover.jpg",
      );
    }
    await page.click(".primary-link");
    assert.equal(new URL(page.url()).hash, "#work");
    assert.ok(
      await page.$eval("#work", (e) => {
        const r = e.getBoundingClientRect();
        return r.top >= -1 && r.top < innerHeight;
      }),
      "Work link must reach the projects.",
    );
    if (name === "desktop") {
      await page.goto(new URL("play.html", url).href, {
        waitUntil: "networkidle0",
      });
      await page.waitForFunction(
        () => document.querySelector(".hero") !== null,
      );
      assert.equal(
        await page.$$eval("canvas", (elements) => elements.length),
        0,
        "Old game links must lead to the portfolio.",
      );
    }
    assert.deepEqual(errors, [], `${name} browser errors`);
    assert.deepEqual(external, [], `${name} external runtime requests`);
    console.log(
      `${name}: portfolio, 4 projects, artwork, working links, no game, overflow, or browser errors passed`,
    );
    await page.close();
  }
  const svg = await browser.newPage();
  await svg.goto(new URL("assets/profile-intro.svg", url).href, {
    waitUntil: "networkidle0",
  });
  const before = await svg.$eval("#reveal", (e) => e.width.animVal.value);
  await new Promise((resolve) => setTimeout(resolve, 650));
  assert.ok(
    (await svg.$eval("#reveal", (e) => e.width.animVal.value)) > before,
    "Typing introduction must animate.",
  );
  await svg.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await svg.waitForFunction(
    () =>
      getComputedStyle(document.querySelector(".animated")).display === "none",
  );
  assert.notEqual(
    await svg.$eval(".still", (e) => getComputedStyle(e).display),
    "none",
  );
  console.log(
    "Typing intro: animation and static reduced-motion fallback passed",
  );
} finally {
  await browser.close();
}
