import {
  createGame,
  startGame,
  nextSector,
  togglePause,
  stepGame,
  VIEW,
  STEP,
  SECTORS,
  clamp,
} from "./signal-core.mjs";
import { frameAt, RUN_FRAMES } from "./runner.mjs";

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d", { alpha: false });
function resizeView() {
  VIEW.width = matchMedia("(max-width: 700px)").matches ? 780 : 1120;
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
}
resizeView();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch =
  matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
const input = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  dashPressed: false,
  pulsePressed: false,
};
const held = new Set();
let game = createGame(),
  loaded = false,
  raf = null,
  lastFrame = 0,
  accumulator = 0;
let effects = [],
  healthKey = "",
  previousPhase = "ready",
  shake = 0,
  audioContext = null,
  sound = false,
  nextNote = 0;
const images = {};
const storageKey = "signal-run-v1-best";
let records = { normal: 0, assist: 0 };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  for (const key of Object.keys(records))
    if (Number.isFinite(saved?.[key])) records[key] = Math.max(0, saved[key]);
} catch {
  /* Scores remain usable in private browsing. */
}

function showBest() {
  const mode = $("assist").checked ? "assist" : "normal";
  $("best-score").textContent = records[mode]
    ? records[mode].toLocaleString()
    : "—";
  $("best-mode").textContent =
    mode === "assist" ? "ASSIST / THIS DEVICE" : "STANDARD / THIS DEVICE";
}
function saveBest() {
  const key = game.assist ? "assist" : "normal";
  records[key] = Math.max(records[key], game.score);
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    /* No storage permission is required to play. */
  }
  showBest();
}
showBest();
$("assist").addEventListener("change", showBest);

async function loadImage(name, path) {
  const image = new Image();
  image.src = path;
  await image.decode();
  images[name] = image;
}
Promise.all([
  loadImage("runner", "assets/runner-sprites.webp"),
  loadImage("sarah", "assets/sarah.webp"),
])
  .then(() => {
    loaded = true;
    $("start").disabled = false;
    $("start-label").textContent = "Enter the city";
    render();
  })
  .catch(() => {
    $("start-label").textContent = "Reload to reconnect";
    $("sarah-message").textContent =
      "The character artwork couldn’t load. Refresh the page to reconnect.";
  });

function clearInput() {
  held.clear();
  for (const key of Object.keys(input)) input[key] = false;
}
function syncHeld() {
  input.left =
    held.has("ArrowLeft") || held.has("KeyA") || held.has("touch-left");
  input.right =
    held.has("ArrowRight") || held.has("KeyD") || held.has("touch-right");
  input.jump =
    held.has("Space") ||
    held.has("ArrowUp") ||
    held.has("KeyW") ||
    held.has("touch-jump");
}
function begin() {
  if (!loaded) return;
  game = createGame({ assist: $("assist").checked });
  clearInput();
  effects = [];
  healthKey = "";
  shake = 0;
  nextNote = 0;
  startGame(game);
  consumeEvents();
  updateUI();
  $("title-screen").hidden = true;
  $("canvas-badge").hidden = true;
  $("touch-controls").hidden = !touch;
  canvas.focus({ preventScroll: true });
  if (touch)
    $("game").scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "instant" : "smooth",
    });
  audioContext?.resume().catch(() => {});
  ensureLoop();
}
$("start").addEventListener("click", begin);
function pause() {
  togglePause(game);
  clearInput();
  updateUI();
  if (game.phase === "playing") {
    canvas.focus({ preventScroll: true });
    ensureLoop();
  }
}
$("pause").addEventListener("click", pause);
function returnToTitle() {
  saveBest();
  game = createGame();
  clearInput();
  effects = [];
  $("title-screen").hidden = false;
  $("canvas-badge").hidden = false;
  $("touch-controls").hidden = true;
  updateUI();
  $("sarah-message").textContent =
    "“If the whole city goes quiet, I’ll still find your signal.”";
  $("start").focus({ preventScroll: true });
}
$("back-to-title").addEventListener("click", returnToTitle);
$("overlay-action").addEventListener("click", () => {
  if (game.phase === "paused") pause();
  else if (game.phase === "sector-clear") {
    nextSector(game);
    clearInput();
    effects = [];
    nextNote = game.time;
    consumeEvents();
    updateUI();
    canvas.focus({ preventScroll: true });
    ensureLoop();
  } else begin();
});

async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if ($("game").requestFullscreen) await $("game").requestFullscreen();
  } catch {
    /* A browser may deny fullscreen; the embedded game remains playable. */
  }
}
$("fullscreen").addEventListener("click", fullscreen);
if (!document.fullscreenEnabled) $("fullscreen").hidden = true;
const gameKeys = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyA",
  "KeyD",
  "KeyW",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "KeyX",
  "KeyE",
  "KeyP",
  "Escape",
  "KeyF",
]);
document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (event.code === "Tab" && !$("overlay").hidden) {
    const first = $("overlay-action"),
      last = $("back-to-title");
    if (event.shiftKey && target === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && target === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }
  if (target.matches("input, textarea, select")) return;
  // Game shortcuts only own keyboard focus inside the arcade.
  if (
    !$("game").contains(target) ||
    game.phase === "ready" ||
    !gameKeys.has(event.code)
  )
    return;
  if (target.tagName === "BUTTON" && ["Space", "Enter"].includes(event.code))
    return;
  event.preventDefault();
  if (event.repeat) {
    if (
      game.phase === "playing" &&
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "KeyA",
        "KeyD",
        "KeyW",
        "Space",
      ].includes(event.code)
    ) {
      held.add(event.code);
      syncHeld();
    }
    return;
  }
  if (event.code === "KeyF") {
    fullscreen();
    return;
  }
  if (["KeyP", "Escape"].includes(event.code)) {
    pause();
    return;
  }
  if (game.phase !== "playing") return;
  held.add(event.code);
  syncHeld();
  if (["Space", "ArrowUp", "KeyW"].includes(event.code))
    input.jumpPressed = true;
  if (["ShiftLeft", "ShiftRight", "KeyX"].includes(event.code))
    input.dashPressed = true;
  if (event.code === "KeyE") input.pulsePressed = true;
});
document.addEventListener("keyup", (event) => {
  held.delete(event.code);
  syncHeld();
});
document.querySelectorAll(".touch-controls button").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (game.phase !== "playing") return;
    button.setPointerCapture(event.pointerId);
    if (button.dataset.hold) {
      held.add(`touch-${button.dataset.hold}`);
      syncHeld();
      if (button.dataset.hold === "jump") input.jumpPressed = true;
    } else input[`${button.dataset.action}Pressed`] = true;
  });
  const release = () => {
    if (button.dataset.hold) {
      held.delete(`touch-${button.dataset.hold}`);
      syncHeld();
    }
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});
function autoPause() {
  clearInput();
  if (game.phase === "playing") {
    togglePause(game);
    updateUI();
  }
}
window.addEventListener("blur", autoPause);
window.addEventListener("resize", () => {
  resizeView();
  render();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) autoPause();
});

function tone(
  frequency,
  duration = 0.13,
  type = "sine",
  volume = 0.025,
  delay = 0,
) {
  if (!sound || !audioContext || audioContext.state !== "running") return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
$("sound").addEventListener("click", () => {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  if (!audioContext) audioContext = new Audio();
  sound = !sound;
  audioContext.resume().catch(() => {});
  $("sound").textContent = sound ? "SOUND ON" : "SOUND OFF";
  $("sound").setAttribute("aria-pressed", String(sound));
  if (sound) {
    nextNote = game.time;
    tone(523.25);
  }
});
function soundtrack() {
  if (!sound || game.time < nextNote) return;
  const chords = [
    [130.81, 196, 261.63],
    [110, 164.81, 220],
    [146.83, 220, 293.66],
    [98, 146.83, 196],
  ];
  const chord = chords[Math.floor(game.time / 3) % chords.length];
  for (const [i, note] of chord.entries())
    tone(note, 1.8, "sine", 0.006, i * 0.14);
  tone(chord[2] * 2, 0.5, "sine", 0.009, 0.7);
  nextNote = game.time + 3;
}

function consumeEvents() {
  for (const event of game.events) {
    if (event.type === "message") {
      $("sarah-message").textContent = `“${event.text}”`;
      continue;
    }
    if (event.type === "memory") {
      tone(620 + Math.min(game.combo, 8) * 65, 0.16);
      tone(1046, 0.2, "sine", 0.018, 0.06);
    }
    if (event.type === "dash") tone(185, 0.16, "triangle");
    if (event.type === "pulse") {
      tone(220, 0.35, "triangle");
      tone(440, 0.55, "sine", 0.025, 0.08);
    }
    if (event.type === "hurt") {
      tone(82, 0.23, "sawtooth", 0.013);
      shake = reducedMotion ? 0 : 5;
    }
    if (event.type === "destroy") {
      tone(110, 0.15, "triangle");
      shake = reducedMotion ? 0 : 2.5;
    }
    if (event.type === "clear") {
      [523, 659, 784, 1046].forEach((n, i) =>
        tone(n, 0.45, "sine", 0.02, i * 0.1),
      );
      saveBest();
    }
    if (event.type === "pulse") effects.push({ ...event, life: 0.6, max: 0.6 });
    if (
      ["memory", "destroy", "hit", "jump", "dash", "hurt", "clear"].includes(
        event.type,
      )
    ) {
      if (event.value)
        effects.push({
          type: "score",
          x: event.x,
          y: event.y - 12,
          value: event.value,
          life: 0.8,
          max: 0.8,
        });
      if (!reducedMotion)
        for (let i = 0; i < (event.type === "destroy" ? 15 : 7); i++) {
          const angle = i * 2.39996 + game.time;
          effects.push({
            type: "spark",
            x: event.x,
            y: event.y,
            vx: Math.cos(angle) * (45 + i * 7),
            vy: Math.sin(angle) * (45 + i * 7),
            color:
              event.type === "hurt"
                ? "#ff889d"
                : event.type === "destroy"
                  ? "#ffb980"
                  : "#8de5fa",
            life: 0.5,
            max: 0.5,
          });
        }
    }
  }
}

function updateUI() {
  const active = game.phase !== "ready";
  $("hud").hidden = !active;
  $("abilities").hidden = !active;
  $("pause").hidden = game.phase !== "playing";
  canvas.dataset.phase = game.phase;
  canvas.dataset.position = `${Math.round(game.player.x)},${Math.round(game.player.y)}`;
  $("sector-name").textContent = SECTORS[game.sector].name.toUpperCase();
  $("fragment-count").textContent = `${game.memories} / 6`;
  $("score").textContent = String(game.score).padStart(6, "0");
  const multiplier = Math.min(3, 1 + Math.floor(game.combo / 4) * 0.5);
  $("combo").textContent =
    game.combo >= 4
      ? `CONNECTION ×${multiplier.toFixed(1)}`
      : game.assist
        ? "ASSIST MODE"
        : "KEEP THE CONNECTION";
  const health = `${game.player.hp}/${game.player.maxHp}`;
  if (health !== healthKey) {
    $("health").replaceChildren(
      ...Array.from({ length: game.player.maxHp }, (_, i) => {
        const span = document.createElement("span");
        span.className = `heart${i >= game.player.hp ? " empty" : ""}`;
        span.textContent = "♥";
        span.setAttribute("aria-hidden", "true");
        return span;
      }),
    );
    $("health").setAttribute(
      "aria-label",
      `${game.player.hp} of ${game.player.maxHp} health`,
    );
    healthKey = health;
  }
  $("pulse-meter").style.width = `${game.player.pulse}%`;
  $("pulse-meter").style.background =
    game.player.pulse >= 45 ? "#8de5fa" : "#506d8b";
  $("dash-label").textContent =
    game.player.dashCooldown > 0
      ? `DASH ${game.player.dashCooldown.toFixed(1)}s`
      : "DASH READY";
  const boss = game.world.boss;
  $("boss-hud").hidden =
    !boss || boss.hp <= 0 || Math.abs(boss.x - game.player.x) > 950;
  if (boss) $("boss-health").style.width = `${(boss.hp / boss.maxHp) * 100}%`;
  const overlaid = ["paused", "sector-clear", "lost", "won"].includes(
    game.phase,
  );
  $("overlay").hidden = !overlaid;
  if (game.phase !== previousPhase) {
    if (overlaid) {
      const content = {
        paused: [
          "SIGNAL ON HOLD",
          "Take a breath.",
          "Your connection will be right here when you’re ready.",
          "Resume the run",
        ],
        "sector-clear": [
          SECTORS[game.sector].tag,
          "Connection restored.",
          SECTORS[game.sector].clear,
          "Enter the next district",
        ],
        lost: [
          "THE SIGNAL IS STILL THERE",
          "Find me again.",
          "Every run is another chance. Try assist mode from the title screen for extra health and faster recharge.",
          "Try again",
        ],
        won: [
          "ALL THREE RELAYS RESTORED",
          "We made it home.",
          SECTORS[2].clear,
          "One more adventure",
        ],
      }[game.phase];
      $("overlay-kicker").textContent = content[0];
      $("overlay-title").textContent = content[1];
      $("overlay-copy").textContent = content[2];
      $("overlay-action").textContent = `${content[3]} →`;
      $("overlay-score").textContent =
        game.phase === "paused"
          ? ""
          : `${game.score.toLocaleString()} POINTS · ${game.totalMemories} MEMORIES`;
      clearInput();
      $("overlay-action").focus({ preventScroll: true });
      if (["won", "lost"].includes(game.phase)) saveBest();
    }
    previousPhase = game.phase;
  }
}

const stars = Array.from({ length: 64 }, (_, i) => ({
  x: (i * 173.91) % VIEW.width,
  y: (i * 91.7) % 270,
  r: i % 7 === 0 ? 1.2 : 0.6,
}));
const cityLayers = [0, 1, 2].map((layer) =>
  Array.from({ length: 27 }, (_, i) => ({
    x: i * 78 + (i % 3) * 11,
    w: 40 + ((i * 19) % 46),
    h: 80 + ((i * 61 + layer * 31) % (layer === 0 ? 245 : 200)),
    seed: i * 7 + layer * 13,
  })),
);

function rounded(x, y, w, h, r = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function glow(color, blur = 12) {
  ctx.shadowColor = color;
  ctx.shadowBlur = reducedMotion ? 0 : blur;
}
function label(text, x, y, size = 11, color = "#8fa3bc", align = "left") {
  const readableSize = size * (VIEW.width < 1000 ? 1.45 : 1);
  ctx.shadowBlur = 0;
  ctx.font = `${readableSize}px "Space Mono", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}
function skyline() {
  const colors = [
    ["#0b162c", "#243855", "#15233c"],
    ["#14132c", "#3b2955", "#272038"],
    ["#1c1726", "#514039", "#2c2133"],
  ][game.sector];
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.57, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = "#afc7e5";
  for (const star of stars) {
    ctx.globalAlpha = 0.4 + (star.x % 3) * 0.15;
    ctx.beginPath();
    ctx.arc(
      (star.x - game.camera * 0.04 + VIEW.width) % VIEW.width,
      star.y,
      star.r,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const moonX = VIEW.width * 0.745 - game.camera * 0.055;
  glow("#a3cdf9", 24);
  ctx.fillStyle = "#bbcbe4";
  ctx.beginPath();
  ctx.arc(moonX, 125, 31, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.arc(moonX - 13, 115, 29, 0, Math.PI * 2);
  ctx.fill();
  const ringX = VIEW.width * 0.667 - game.camera * 0.1;
  ctx.strokeStyle = `${SECTORS[game.sector].color}55`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(ringX, 223, 160, 28, -0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ringX, 223, 153, 23, -0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#a7dafa14";
  ctx.fillRect(ringX - 2, 65, 4, 333);
  for (const [layer, buildings] of cityLayers.entries()) {
    const speed = [0.13, 0.29, 0.48][layer],
      bottom = [468, 518, 580][layer];
    const palette = [
      ["#111e35", "#a4c7ea20"],
      ["#122035", "#e6cb9544"],
      ["#0b172a", "#77a6c933"],
    ][layer];
    for (const building of buildings) {
      const x = building.x - ((game.camera * speed) % 1950);
      if (x < -100 || x > VIEW.width + 100) continue;
      const y = bottom - building.h;
      ctx.fillStyle = palette[0];
      ctx.fillRect(x, y, building.w, building.h);
      ctx.fillRect(
        x + building.w * 0.34,
        y - 8 - (building.seed % 14),
        building.w * 0.3,
        10 + (building.seed % 14),
      );
      ctx.fillStyle = palette[1];
      for (let row = 0; row < building.h / 15 - 1; row++)
        for (let col = 0; col < building.w / 11 - 1; col++) {
          if ((row * 7 + col * 11 + building.seed) % 5 > 1)
            ctx.fillRect(x + 6 + col * 11, y + 12 + row * 15, 3, 5);
        }
      ctx.strokeStyle = "#32425930";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + building.w, y);
      ctx.stroke();
    }
  }
  const mist = ctx.createLinearGradient(0, 320, 0, 590);
  mist.addColorStop(0, "#5484aa00");
  mist.addColorStop(1, "#5484aa15");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 320, VIEW.width, 270);
}

function platforms() {
  for (const platform of game.world.platforms) {
    const x = platform.x - game.camera;
    if (x > VIEW.width || x + platform.w < 0) continue;
    const floor = platform.y === VIEW.ground;
    ctx.fillStyle = floor ? "#101b2c" : "#263249";
    ctx.fillRect(x, platform.y, platform.w, platform.h);
    ctx.fillStyle = floor ? "#425673" : "#6f839f";
    ctx.fillRect(x, platform.y, platform.w, 3);
    ctx.fillStyle = SECTORS[game.sector].color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, platform.y + 3, platform.w, 1);
    ctx.globalAlpha = 1;
    if (floor) {
      ctx.fillStyle = "#080f1d";
      ctx.fillRect(x, platform.y + 19, platform.w, 4);
      const offset = Math.floor(game.camera / 120) * 120;
      for (let p = offset; p < game.camera + VIEW.width + 120; p += 120) {
        ctx.fillStyle = "#1d2b40";
        ctx.fillRect(p - game.camera + 4, platform.y + 26, 2, 77);
        ctx.fillStyle = "#d9bd7340";
        ctx.fillRect(p - game.camera + 26, platform.y + 38, 49, 23);
        ctx.fillStyle = "#071020";
        ctx.fillRect(p - game.camera + 48, platform.y + 37, 3, 24);
      }
    } else {
      ctx.fillStyle = "#111c30";
      ctx.fillRect(x + 6, platform.y + 8, platform.w - 12, 5);
      ctx.fillStyle = "#566981";
      ctx.fillRect(x + 12, platform.y + 17, 4, 21);
      ctx.fillRect(x + platform.w - 16, platform.y + 17, 4, 21);
      ctx.fillStyle = "#92c9e950";
      ctx.fillRect(x + platform.w - 24, platform.y - 12, 2, 12);
    }
  }
  // Rooftop signs and vents establish scale without introducing collision ambiguity.
  for (let i = 0; i < 11; i++) {
    const x = i * 335 + 180 - game.camera;
    if (x < -70 || x > VIEW.width + 70) continue;
    ctx.fillStyle = "#203049";
    ctx.fillRect(x, VIEW.ground - 26, 43, 26);
    ctx.fillStyle = "#3b4e66";
    ctx.fillRect(x - 3, VIEW.ground - 29, 49, 4);
    ctx.strokeStyle = "#081423";
    ctx.lineWidth = 2;
    for (let line = 0; line < 4; line++) {
      ctx.beginPath();
      ctx.moveTo(x + 8, VIEW.ground - 20 + line * 4);
      ctx.lineTo(x + 35, VIEW.ground - 20 + line * 4);
      ctx.stroke();
    }
  }
}
function crystal(memory) {
  if (memory.taken) return;
  const x = memory.x + 11 - game.camera,
    y =
      memory.y +
      15 +
      (reducedMotion ? 0 : Math.sin(game.time * 2.7 + memory.x) * 4);
  if (x < -30 || x > VIEW.width + 30) return;
  ctx.save();
  ctx.translate(x, y);
  glow("#74dcff", 15);
  ctx.fillStyle = "#83ddf6";
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#dbf6ff";
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(0, 15);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#a6eafd55";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 30, 13, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function enemyDrone(enemy) {
  if (enemy.hp <= 0) return;
  const x = enemy.x - game.camera + enemy.w / 2,
    y = enemy.y + enemy.h / 2;
  if (x < -80 || x > VIEW.width + 80) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#192033";
  ctx.strokeStyle = "#e69bae";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-25, -5);
  ctx.lineTo(-16, -17);
  ctx.lineTo(16, -17);
  ctx.lineTo(25, -5);
  ctx.lineTo(16, 12);
  ctx.lineTo(-16, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#dc78963d";
  ctx.fillRect(-31, -2, 7, 6);
  ctx.fillRect(24, -2, 7, 6);
  glow("#ff819e", 11);
  ctx.fillStyle = "#ff819e";
  rounded(-10, -5, 20, 6, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f4c1d0";
  ctx.fillRect(-3, -4, 6, 4);
  ctx.strokeStyle = "#b4689b80";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, 13);
  ctx.lineTo(-18, 24);
  ctx.moveTo(13, 13);
  ctx.lineTo(18, 24);
  ctx.stroke();
  ctx.restore();
}
function guardian(boss) {
  if (!boss || boss.hp <= 0) return;
  const x = boss.x - game.camera + boss.w / 2,
    y = boss.y + boss.h / 2;
  if (x > VIEW.width + 200 || x < -200) return;
  ctx.save();
  ctx.translate(x, y);
  const t = game.time;
  const color = boss.hitCooldown > 0 ? "#ffffff" : "#fa85a3";
  glow(color, 18);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 67, t * 0.24, t * 0.24 + Math.PI * 1.68);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#241d36";
  ctx.strokeStyle = "#925a82";
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.lineTo(43, -30);
  ctx.lineTo(32, 24);
  ctx.lineTo(0, 59);
  ctx.lineTo(-32, 24);
  ctx.lineTo(-43, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  glow(color, 24);
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(19, 0);
  ctx.lineTo(0, 25);
  ctx.lineTo(-19, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#5d3d62";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 40, -25);
    ctx.lineTo(side * 86, -40);
    ctx.lineTo(side * 75, 28);
    ctx.lineTo(side * 45, 18);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - t * 0.42;
    ctx.fillStyle = "#ad6f9b";
    ctx.fillRect(Math.cos(a) * 85 - 3, Math.sin(a) * 75 - 3, 6, 6);
  }
  ctx.restore();
}
function relay() {
  const gate = game.world.gate,
    x = gate.x - game.camera + gate.w / 2,
    y = gate.y + 74;
  if (x > VIEW.width + 100) return;
  const unlocked =
      game.memories >= 6 && (!game.world.boss || game.world.boss.hp === 0),
    color = unlocked ? "#8de5fa" : "#71849d";
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  glow(color, unlocked ? 24 : 5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 37, 65, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 31, 59, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 61);
  gradient.addColorStop(0, unlocked ? "#95ecff38" : "#00000000");
  gradient.addColorStop(1, "#90e8ff00");
  ctx.fillStyle = gradient;
  ctx.fillRect(-45, -70, 90, 140);
  label(
    unlocked
      ? "RELAY OPEN"
      : game.world.boss?.hp > 0
        ? "DEFEAT GUARDIAN"
        : "FIND 6 MEMORIES",
    0,
    -90,
    9,
    color,
    "center",
  );
  ctx.restore();
}
function characters() {
  const p = game.player,
    x = p.x - game.camera;
  const companionX = x - p.facing * 68 + 15,
    companionY = p.y - 63 + (reducedMotion ? 0 : Math.sin(game.time * 2.1) * 6);
  ctx.save();
  ctx.strokeStyle = "#81d8f544";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(x + 17, p.y + 24);
  ctx.quadraticCurveTo(
    x - p.facing * 35,
    companionY + 64,
    companionX,
    companionY + 45,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.8;
  glow("#8fdfff", 9);
  if (images.sarah)
    ctx.drawImage(images.sarah, companionX - 26, companionY, 54, 81);
  ctx.restore();
  ctx.fillStyle = "#040a15aa";
  ctx.beginPath();
  ctx.ellipse(x + 17, VIEW.ground - 2, 25, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (p.invincible > 0 && Math.floor(game.time * 12) % 2 === 0)
    ctx.globalAlpha = 0.45;
  const index =
    p.dashTime > 0 ? 3 : Math.abs(p.vx) > 35 ? frameAt(game.time * 1000) : 0;
  const frame = RUN_FRAMES[index];
  ctx.save();
  ctx.translate(x + p.w / 2, p.y + p.h);
  ctx.scale(p.facing, 1);
  if (p.dashTime > 0 && !reducedMotion) {
    for (let i = 3; i > 0; i--) {
      ctx.globalAlpha = 0.06 * (4 - i);
      ctx.drawImage(
        images.runner,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -43 - i * 16,
        -99,
        86,
        106,
      );
    }
    ctx.globalAlpha = 1;
    glow("#84e8ff", 14);
  }
  if (images.runner)
    ctx.drawImage(
      images.runner,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -43,
      -99,
      86,
      106,
    );
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  if (game.sectorTime < 9)
    label("YOU", x + 17, p.y - 27, 8, "#c7e9f4", "center");
}

function render() {
  if (!ctx || !loaded) return;
  ctx.save();
  if (shake > 0 && !reducedMotion)
    ctx.translate(
      Math.sin(game.time * 97) * shake,
      Math.cos(game.time * 81) * shake * 0.5,
    );
  skyline();
  platforms();
  game.world.memories.forEach(crystal);
  game.world.enemies.forEach(enemyDrone);
  guardian(game.world.boss);
  relay();
  for (const bullet of game.world.bullets) {
    ctx.fillStyle = "#ffc1be";
    glow("#ff8caa", 10);
    ctx.beginPath();
    ctx.arc(bullet.x - game.camera, bullet.y, bullet.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  characters();
  for (const effect of effects) {
    const x = effect.x - game.camera,
      alpha = clamp(effect.life / effect.max, 0, 1);
    ctx.globalAlpha = alpha;
    if (effect.type === "spark") {
      ctx.fillStyle = effect.color;
      ctx.fillRect(x, effect.y, 2.5, 2.5);
    } else if (effect.type === "score")
      label(
        `+${effect.value}`,
        x,
        effect.y - (1 - alpha) * 35,
        13,
        "#f4db89",
        "center",
      );
    else if (effect.type === "pulse") {
      ctx.strokeStyle = "#9cecff";
      ctx.lineWidth = reducedMotion ? 2 : 4 * alpha;
      const radius = reducedMotion
        ? effect.radius
        : effect.radius * (1 - alpha);
      ctx.beginPath();
      ctx.arc(x, effect.y, Math.max(1, radius), 0, Math.PI * 2);
      ctx.stroke();
      if (!reducedMotion) {
        ctx.fillStyle = "#9cecff0b";
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  if (game.sectorTime < 7 && game.phase === "playing") {
    label(SECTORS[game.sector].tag, 38, 161, 10, SECTORS[game.sector].color);
    label("Find six memories. Reach the relay.", 38, 185, 12, "#b0c3d9");
    label("SPACE jump   SHIFT dash   E pulse", 38, 210, 10, "#8098b5");
  }
  ctx.restore();
}

function ensureLoop() {
  if (raf === null) {
    lastFrame = 0;
    accumulator = 0;
    raf = requestAnimationFrame(frame);
  }
}
function frame(timestamp) {
  raf = null;
  const delta = lastFrame
    ? Math.min(0.05, (timestamp - lastFrame) / 1000)
    : STEP;
  lastFrame = timestamp;
  if (game.phase === "playing") {
    accumulator += delta;
    while (accumulator >= STEP && game.phase === "playing") {
      stepGame(game, input, STEP);
      consumeEvents();
      input.jumpPressed = input.dashPressed = input.pulsePressed = false;
      for (const effect of effects) {
        effect.life -= STEP;
        if (effect.type === "spark") {
          effect.x += effect.vx * STEP;
          effect.y += effect.vy * STEP;
          effect.vy += 150 * STEP;
        }
      }
      effects = effects.filter((e) => e.life > 0).slice(-120);
      shake *= 0.92;
      accumulator -= STEP;
    }
    soundtrack();
    updateUI();
    render();
  }
  if (game.phase === "playing") raf = requestAnimationFrame(frame);
}
