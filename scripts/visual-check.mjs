import { mkdir, copyFile, access } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:8084/";
const origin = new URL(url).origin;
const output = process.env.VISUAL_OUTPUT || join(process.cwd(), "qa", "profile");
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

// Assert visitor-visible behavior rather than a particular color or grid layout.
const selectors = {
  project: ".project-row",
  filter: "[data-filter]",
  count: "#filter-status",
  theme: ".theme-toggle",
  commandOpen: ".command-trigger",
  dialog: ".command-palette",
  input: "#command-search",
  results: ".command-links",
};
const projectUrls = [
  "https://github.com/Srimi1/Notch-hub",
  "https://github.com/Srimi1/P-Agents",
  "https://github.com/Srimi1/Internet-speed-reader",
  "https://github.com/Srimi1/The-Keyboard-project",
];

async function newPage(context = browser) {
  const page = await context.newPage();
  const errors = [], external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    errors.push(`${request.failure()?.errorText} ${request.url()}`);
  });
  page.on("request", (request) => {
    if (request.url().startsWith("http") && new URL(request.url()).origin !== origin)
      external.push(request.url());
  });
  return {
    page,
    assertClean(label) {
      assert.deepEqual(errors, [], `${label}: browser/resource errors`);
      assert.deepEqual(external, [], `${label}: external runtime requests`);
    },
  };
}

async function loadPage(page, target = url) {
  await page.goto(target, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Validate assets in closed disclosures as well as those initially on screen.
    for (const image of document.images) image.loading = "eager";
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
}

async function assertContent(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: horizontal overflow`);
  assert.equal(await page.$$eval("h1", (headings) => headings.length), 1, `${label}: one main heading`);
  const links = await page.$$eval(`${selectors.project} a[href], a${selectors.project}[href]`, (anchors) => anchors.map((anchor) => anchor.href));
  for (const href of projectUrls) assert.ok(links.includes(href), `${label}: missing project link ${href}`);
  assert.equal(await page.$$eval(selectors.project, (projects) => projects.length), 4, `${label}: four selected projects`);
  assert.equal(await page.$$eval("canvas", (elements) => elements.length), 0, `${label}: no game runtime`);
  const badAnchors = await page.$$eval('a[href^="#"]', (anchors) => anchors.filter((anchor) => {
    const id = decodeURIComponent(anchor.hash.slice(1));
    return id && !document.getElementById(id);
  }).map((anchor) => anchor.getAttribute("href")));
  assert.deepEqual(badAnchors, [], `${label}: valid in-page destinations`);
  const unnamedImages = await page.$$eval("img", (images) => images.filter((image) => !image.hasAttribute("alt")).map((image) => image.src));
  assert.deepEqual(unnamedImages, [], `${label}: images have text alternatives`);
}

async function visibleProjects(page) {
  return page.$$eval(selectors.project, (projects) => projects.filter((project) => project.getClientRects().length > 0).length);
}

async function checkFilters(page) {
  for (const [category, expected] of [["apps", 3], ["agents", 1], ["all", 4]]) {
    const filter = `${selectors.filter}[data-filter="${category}"]`;
    await page.click(filter);
    assert.equal(await visibleProjects(page), expected, `${category}: visible result count`);
    assert.equal(await page.$eval(filter, (button) => button.getAttribute("aria-pressed")), "true", `${category}: selected filter announced`);
    assert.equal(await page.$$eval(`${selectors.filter}[aria-pressed="true"]`, (buttons) => buttons.length), 1, "Exactly one filter is selected");
    assert.match(await page.$eval(selectors.count, (element) => element.textContent), new RegExp(`\\b${expected}\\b`), `${category}: status agrees with visible projects`);
  }
  assert.ok(await page.$eval(selectors.count, (element) => element.getAttribute("aria-live") || element.getAttribute("role") === "status"), "Filter result count is announced");
}

async function openPalette(page, shortcut = false) {
  if (shortcut) {
    await page.keyboard.down("Control");
    await page.keyboard.press("k");
    await page.keyboard.up("Control");
  } else {
    await page.click(selectors.commandOpen);
  }
  await page.waitForFunction((selector) => document.querySelector(selector).open, {}, selectors.dialog);
  assert.ok(await page.$eval(selectors.input, (input) => document.activeElement === input), "Command input receives focus");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Palette fits viewport");
}

async function checkPalette(page) {
  await page.focus(selectors.commandOpen);
  await openPalette(page, true);
  await page.keyboard.press("Escape");
  await page.waitForFunction((selector) => !document.querySelector(selector).open, {}, selectors.dialog);
  assert.ok(await page.$eval(selectors.commandOpen, (button) => document.activeElement === button), "Escape returns focus to the opener");

  await page.click(`${selectors.filter}[data-filter="agents"]`);
  await openPalette(page);
  await page.type(selectors.input, "no-such-project-928374");
  const results = await page.$eval(".command-empty", (element) => element.hidden ? "" : element.textContent);
  assert.match(results, /no (results|matches|commands)/i, "Unmatched query has a clear empty state");
  assert.equal(await page.$eval(".command-empty", (element) => element.getAttribute("role")), "status", "Empty search has a status role");
  assert.equal(await page.$eval(".command-empty", (element) => element.getAttribute("aria-live")), "polite", "Empty search is announced without interrupting");
  assert.equal(await page.$$eval(`${selectors.results} a[href], ${selectors.results} button`, (elements) => elements.filter((element) => element.getClientRects().length > 0).length), 0, "Empty search contains no selectable result");
  await page.$eval(selectors.input, (input) => { input.value = ""; input.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.type(selectors.input, "work");
  assert.ok(await page.$eval(`${selectors.results} a[href="#work"]`, (anchor) => anchor.getClientRects().length > 0), "Search finds the work destination");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#work");
  assert.equal(await page.$eval(selectors.dialog, (dialog) => dialog.open), false, "Selecting a command closes the palette");
  await page.waitForFunction(() => document.activeElement === document.querySelector("#work-title"));
  assert.equal(await visibleProjects(page), 4, "The work command restores all projects");

  await openPalette(page);
  await page.type(selectors.input, "Sarah");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#sarah-note" && document.querySelector("#sarah-note").open);
  assert.equal(await page.$eval(selectors.dialog, (dialog) => dialog.open), false, "The Sarah command closes the palette");
  await page.waitForFunction(() => document.activeElement === document.querySelector("#sarah-note summary"));
  assert.ok(await page.$eval("#sarah-note summary", (summary) => summary.getClientRects().length > 0), "The Sarah command reveals and focuses the disclosure");
}

async function theme(page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
}

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 1050, deviceScaleFactor: 1 },
    tablet: { width: 768, height: 1024, deviceScaleFactor: 1 },
    mobile: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
    narrow: { width: 320, height: 740, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  })) {
    const { page, assertClean } = await newPage();
    await page.setViewport(viewport);
    await loadPage(page);
    await assertContent(page, name);
    await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
    if (name === "desktop" && process.env.EXPORT_COVER === "1") {
      await (await page.$(".hero")).screenshot({ path: "assets/profile-cover.jpg", type: "jpeg", quality: 94 });
      await copyFile("assets/profile-cover.jpg", "docs/assets/profile-cover.jpg");
    }
    await checkFilters(page);
    await checkPalette(page);
    assertClean(name);
    await page.close();
    console.log(`${name}: content, local assets, links, responsive layout, filters and palette passed`);
  }

  const themeContext = await browser.createBrowserContext();
  const { page: appearance, assertClean: appearanceClean } = await newPage(themeContext);
  await appearance.setViewport({ width: 1440, height: 1050, deviceScaleFactor: 1 });
  await appearance.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await loadPage(appearance);
  assert.equal(await theme(appearance), "dark", "First visit follows system dark mode");
  await appearance.screenshot({ path: join(output, "desktop-dark.png"), fullPage: true });
  await appearance.click(selectors.theme);
  assert.equal(await theme(appearance), "light", "Theme control switches to light");
  await loadPage(appearance);
  assert.equal(await theme(appearance), "light", "Chosen theme persists across reloads");
  await appearance.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  assert.ok(await appearance.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior !== "smooth"), "Reduced motion disables smooth scrolling");
  const runningMotion = await appearance.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running" && animation.effect?.getTiming().duration > 1).length);
  assert.equal(runningMotion, 0, "Reduced motion has no ongoing decorative animation");
  appearanceClean("appearance");
  await themeContext.close();

  const fallbackContext = await browser.createBrowserContext();
  const { page: fallback, assertClean: fallbackClean } = await newPage(fallbackContext);
  await fallback.evaluateOnNewDocument(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage disabled", "SecurityError"); } }));
  await fallback.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await loadPage(fallback);
  assert.equal(await theme(fallback), "light", "Storage unavailable: system theme remains usable");
  await fallback.click(selectors.theme);
  assert.equal(await theme(fallback), "dark", "Storage unavailable: theme control still works");
  await checkFilters(fallback);
  fallbackClean("storage fallback");
  await fallbackContext.close();

  const { page: noScript, assertClean: noScriptClean } = await newPage();
  await noScript.setJavaScriptEnabled(false);
  await noScript.setViewport({ width: 320, height: 740 });
  await loadPage(noScript);
  await assertContent(noScript, "JavaScript disabled");
  assert.equal(await visibleProjects(noScript), 4, "All projects remain visible without JavaScript");
  for (const selector of [selectors.commandOpen, selectors.theme, selectors.filter]) {
    assert.equal(await noScript.$$eval(selector, (elements) => elements.filter((element) => element.getClientRects().length > 0).length), 0, "Script-only controls stay hidden without JavaScript");
  }
  await noScript.screenshot({ path: join(output, "no-javascript.png"), fullPage: true });
  noScriptClean("JavaScript disabled");
  await noScript.close();

  const { page: redirect, assertClean: redirectClean } = await newPage();
  await loadPage(redirect, new URL("play.html", url).href);
  await redirect.waitForSelector(".hero");
  await assertContent(redirect, "Legacy link");
  redirectClean("Legacy link");
  await redirect.close();
  console.log("Theme persistence, unavailable storage, reduced motion, no-JavaScript content and legacy redirect passed");
} finally {
  await browser.close();
}
