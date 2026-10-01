import { mkdir, copyFile, access } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:8084/play.html";
const output = process.env.VISUAL_OUTPUT || join(process.cwd(), "qa");
const candidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
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
  throw new Error("Set CHROME_BIN to a Chrome or Chromium executable.");
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: process.platform === "linux" ? ["--no-sandbox"] : [],
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1050, deviceScaleFactor: 1 },
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
      externalRequests = [];
    page.on("request", (r) => {
      if (
        r.url().startsWith("http") &&
        new URL(r.url()).origin !== new URL(url).origin
      )
        externalRequests.push(r.url());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForFunction(
      () => !document.querySelector("#start").disabled,
    );
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      projects: document.querySelectorAll(".project-row").length,
      phase: document.querySelector("#canvas").dataset.phase || "ready",
    }));
    assert.ok(layout.width <= layout.viewport, `${name} horizontal overflow`);
    assert.equal(layout.projects, 4);
    assert.equal(layout.phase, "ready");
    const beforeIdle = await page.$eval(
      "#canvas",
      (e) => e.dataset.position || "100,465",
    );
    await delay(250);
    assert.equal(
      await page.$eval("#canvas", (e) => e.dataset.position || "100,465"),
      beforeIdle,
      "title must not autoplay",
    );
    await page.screenshot({
      path: join(output, `${name}-title.png`),
      fullPage: true,
    });
    await page.click("#sound");
    assert.equal(
      await page.$eval("#sound", (e) => e.getAttribute("aria-pressed")),
      "true",
    );
    await page.click("#sound");
    if (name === "desktop" && process.env.EXPORT_COVER === "1") {
      await page.$eval("#assist", (e) => {
        e.closest(".title-options").style.visibility = "hidden";
      });
      const title = await page.$("#title-screen");
      await title.screenshot({
        path: "assets/signal-cover.jpg",
        type: "jpeg",
        quality: 93,
      });
      await copyFile("assets/signal-cover.jpg", "docs/assets/signal-cover.jpg");
      await page.$eval("#assist", (e) => {
        e.closest(".title-options").style.visibility = "";
      });
    }
    await page.click("#start");
    assert.equal(
      await page.$eval("#canvas", (e) => e.dataset.phase),
      "playing",
    );
    const getPosition = () =>
      page.$eval("#canvas", (e) => e.dataset.position.split(",").map(Number));
    const startPosition = await getPosition();
    if (name === "mobile") {
      assert.equal(await page.$eval("#touch-controls", (e) => e.hidden), false);
      const box = await (await page.$('[data-hold="right"]')).boundingBox();
      await page.touchscreen.touchStart(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      await delay(500);
      await page.touchscreen.touchEnd();
    } else {
      await page.keyboard.down("ArrowRight");
      await delay(500);
      await page.keyboard.up("ArrowRight");
    }
    assert.ok(
      (await getPosition())[0] > startPosition[0] + 65,
      `${name} movement failed`,
    );
    await page.$eval("#canvas", (e) => e.focus());
    await page.keyboard.down("Space");
    await delay(120);
    assert.ok((await getPosition())[1] < 440, `${name} jump failed`);
    await page.keyboard.up("Space");
    await page.keyboard.press("ShiftLeft");
    await page.keyboard.press("KeyE");
    await delay(200);
    await page.screenshot({
      path: join(output, `${name}-playing.png`),
      fullPage: name === "mobile",
    });
    await page.keyboard.press("KeyP");
    assert.equal(await page.$eval("#canvas", (e) => e.dataset.phase), "paused");
    const pausedPosition = await getPosition();
    await delay(300);
    assert.deepEqual(await getPosition(), pausedPosition);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "back-to-title",
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "overlay-action",
    );
    await page.keyboard.press("KeyP");
    assert.equal(
      await page.$eval("#canvas", (e) => e.dataset.phase),
      "playing",
    );
    if (name === "desktop") {
      // Reach the first relay with real browser input, then check persistence and progression.
      await page.keyboard.down("ArrowRight");
      for (let i = 0; i < 20; i++) {
        if (await page.$eval("#canvas", (e) => e.dataset.phase !== "playing"))
          break;
        await page.keyboard.press("KeyE");
        await delay(700);
      }
      await page.keyboard.up("ArrowRight");
      assert.equal(
        await page.$eval("#canvas", (e) => e.dataset.phase),
        "sector-clear",
        "first sector must be reachable with normal input",
      );
      const saved = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("signal-run-v1-best")),
      );
      assert.ok(saved.normal > 1000, "score must persist");
      await page.screenshot({ path: join(output, "desktop-sector-clear.png") });
      await page.click("#overlay-action");
      assert.equal(
        await page.$eval("#sector-name", (e) => e.textContent),
        "THE VIOLET DISTRICT",
      );
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      assert.equal(
        await page.$eval("#canvas", (e) => e.dataset.phase),
        "paused",
        "tab blur must auto-pause",
      );
      await page.click("#back-to-title");
      await page.reload({ waitUntil: "networkidle0" });
      assert.ok(
        Number(
          (await page.$eval("#best-score", (e) => e.textContent)).replaceAll(
            ",",
            "",
          ),
        ) > 1000,
      );
      if (process.env.FULL_CAMPAIGN === "1") {
        await page.click("#assist");
        await page.click("#start");
        let bossCapture = false;
        for (let i = 0; i < 300; i++) {
          const state = await page.evaluate(() => ({
            phase: document.querySelector("#canvas").dataset.phase,
            x: Number(
              document.querySelector("#canvas").dataset.position.split(",")[0],
            ),
            sector: document.querySelector("#sector-name").textContent,
            pulse: parseFloat(
              document.querySelector("#pulse-meter").style.width,
            ),
            dash: document.querySelector("#dash-label").textContent,
            boss: parseFloat(
              document.querySelector("#boss-health").style.width,
            ),
          }));
          if (state.phase === "won") break;
          assert.notEqual(
            state.phase,
            "lost",
            `full browser campaign lost: ${JSON.stringify(state)}`,
          );
          if (state.phase === "sector-clear") {
            await page.keyboard.up("ArrowRight");
            await page.keyboard.up("ArrowLeft");
            await page.click("#overlay-action");
            continue;
          }
          const final = state.sector === "THE LAST RELAY";
          const bossX = 3305,
            fighting = final && state.boss > 0 && state.x > bossX - 250;
          const left = fighting && state.x > bossX + 45;
          await page.keyboard.up(left ? "ArrowRight" : "ArrowLeft");
          await page.keyboard.down(left ? "ArrowLeft" : "ArrowRight");
          const nearby = [
            610,
            1010,
            1440,
            1880,
            2350,
            2830,
            ...(state.sector !== "BLUE-HOUR ROOFTOPS" ? [780, 2120] : []),
          ].some((x) => Math.abs(x - state.x) < 150);
          if ((nearby || fighting) && state.pulse >= 45)
            await page.keyboard.press("KeyE");
          if (state.dash === "DASH READY" && (nearby || fighting))
            await page.keyboard.press("ShiftLeft");
          if (fighting && !bossCapture) {
            await page.screenshot({
              path: join(output, "desktop-guardian.png"),
            });
            bossCapture = true;
          }
          await delay(250);
        }
        await page.keyboard.up("ArrowRight");
        await page.keyboard.up("ArrowLeft");
        assert.equal(
          await page.$eval("#canvas", (e) => e.dataset.phase),
          "won",
          "all three sectors must be playable in the browser",
        );
        assert.equal(
          await page.$eval("#overlay-title", (e) => e.textContent),
          "We made it home.",
        );
        const campaignScore = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("signal-run-v1-best")),
        );
        assert.ok(campaignScore.assist > 5000);
        assert.equal(campaignScore.normal, saved.normal);
        await page.screenshot({ path: join(output, "desktop-victory.png") });
      }
    } else {
      await page.click("#pause");
      await page.click("#back-to-title");
      await page.click("#assist");
      await page.click("#start");
      assert.equal(
        await page.$eval("#health", (e) => e.getAttribute("aria-label")),
        "8 of 8 health",
      );
    }
    assert.deepEqual(errors, [], `${name} browser errors`);
    assert.deepEqual(
      externalRequests,
      [],
      `${name} runtime must not depend on external requests`,
    );
    results.push({
      name,
      layout,
      errors,
      movement: "passed",
      jump: "passed",
      pause: "passed",
      touch: name === "mobile" ? "passed" : "n/a",
    });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
