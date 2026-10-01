import { createRenderer } from "./together-render.mjs";

const canvas = document.querySelector("#together");
const button = document.querySelector("#motion");
const status = document.querySelector("#story-status");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let renderer,
  elapsed = 0,
  last,
  paused = reduced.matches,
  ready = false;
const params = new URLSearchParams(location.search);
const exporter = params.has("export");
try {
  const response = await fetch(new URL("data/activity.json", import.meta.url));
  if (!response.ok) throw new Error(`Calendar HTTP ${response.status}`);
  const snapshot = await response.json();
  const asOf =
    (exporter && params.get("date")) ||
    (snapshot.updatedAt || new Date().toISOString()).slice(0, 10);
  renderer = await createRenderer(canvas, snapshot, asOf);
  window.codeTogether = renderer;
  const w = renderer.story.world;
  status.textContent = `${w.active.length} worked days · ${w.total} contributions · ${w.windowStart} to ${w.windowEnd}`;
  canvas.dataset.ready = "true";
  button.disabled = false;
  ready = true;
} catch (error) {
  status.textContent =
    "The city is resting. Your last rendered story is available on GitHub.";
  console.error(error);
}
function sync() {
  button.textContent = paused ? "Watch story" : "Pause story";
  button.setAttribute("aria-pressed", String(paused));
}
sync();
button.addEventListener("click", () => {
  paused = !paused;
  last = undefined;
  sync();
});
reduced.addEventListener("change", (event) => {
  paused = event.matches;
  last = undefined;
  sync();
});
document.addEventListener("visibilitychange", () => {
  last = undefined;
});
function tick(now) {
  if (ready && !exporter && !paused && !document.hidden) {
    if (last !== undefined) elapsed += Math.min(0.1, (now - last) / 1000);
    renderer.draw(elapsed);
  }
  last = now;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
