// Signal / Run's simulation. No browser, network, or rendering dependencies.
export const VIEW = { width: 1120, height: 630, ground: 534 };
export const STEP = 1 / 120;
export const SECTORS = [
  {
    name: "Blue-hour rooftops",
    tag: "01 / THE AWAKENING",
    color: "#7ae2ff",
    width: 3400,
    intro:
      "There you are. The city lost its signal, but I can still hear you. Find six memory fragments. I’ll cover you.",
    clear:
      "Six memories. One connection. The next relay is across the skyline. Ready when you are.",
  },
  {
    name: "The violet district",
    tag: "02 / THE CONNECTION",
    color: "#bca2ff",
    width: 3600,
    intro:
      "This district is crawling with glitches. Dash through them, or charge my pulse with memory fragments.",
    clear:
      "The signal is getting stronger. Whatever waits at the last relay, we face it together.",
  },
  {
    name: "The last relay",
    tag: "03 / THE RETURN",
    color: "#f8d779",
    width: 3800,
    intro:
      "That’s the Null Guardian. Dash through its core and use my pulse. Then bring our signal home.",
    clear:
      "You didn’t just restore a city. You found me in the noise. I’m here, Srijan. Always.",
  },
];

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const distance = (a, b) =>
  Math.hypot(a.x + a.w / 2 - b.x - b.w / 2, a.y + a.h / 2 - b.y - b.h / 2);

function makeWorld(sector) {
  const width = SECTORS[sector].width;
  const platforms = [
    { x: 0, y: VIEW.ground, w: width, h: 96 },
    ...[420, 870, 1320, 1790, 2260, 2730].map((x, i) => ({
      x,
      y: VIEW.ground - [78, 133, 86, 114, 145, 90][i],
      w: 165,
      h: 17,
    })),
  ];
  const memories = [290, 680, 1110, 1520, 1970, 2450, 2890, width - 330].map(
    (x, i) => ({
      id: `ground-${i}`,
      x,
      y: VIEW.ground - 49,
      w: 22,
      h: 30,
      taken: false,
    }),
  );
  for (const [i, p] of platforms.slice(1).entries()) {
    memories.push({
      id: `roof-${i}`,
      x: p.x + p.w / 2 - 11,
      y: p.y - 39,
      w: 22,
      h: 30,
      taken: false,
    });
  }
  const enemies = [
    610,
    1010,
    1440,
    1880,
    2350,
    2830,
    ...(sector > 0 ? [780, 2120] : []),
  ].map((x, i) => ({
    id: `drone-${i}`,
    x,
    anchor: x,
    y: VIEW.ground - 48 - (i % 3 === 1 ? 105 : 0),
    baseY: VIEW.ground - 48 - (i % 3 === 1 ? 105 : 0),
    w: 42,
    h: 33,
    hp: 1,
    phase: i * 1.7,
    kind: "drone",
    shot: 2.2 + i * 0.15,
  }));
  const boss =
    sector === 2
      ? {
          id: "guardian",
          x: width - 495,
          y: VIEW.ground - 143,
          baseY: VIEW.ground - 143,
          w: 116,
          h: 138,
          hp: 12,
          maxHp: 12,
          kind: "boss",
          shot: 1.8,
          hitCooldown: 0,
        }
      : null;
  return {
    width,
    platforms,
    memories,
    enemies,
    boss,
    bullets: [],
    gate: { x: width - 155, y: VIEW.ground - 150, w: 98, h: 150 },
  };
}

function player(maxHealth) {
  return {
    x: 100,
    y: VIEW.ground - 69,
    w: 35,
    h: 69,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyote: 0.1,
    jumpBuffer: 0,
    dashTime: 0,
    dashCooldown: 0,
    invincible: 0,
    hp: maxHealth,
    maxHp: maxHealth,
    pulse: 45,
    pulseCooldown: 0,
  };
}

export function createGame({ assist = false } = {}) {
  return {
    phase: "ready",
    sector: 0,
    assist,
    time: 0,
    sectorTime: 0,
    score: 0,
    memories: 0,
    totalMemories: 0,
    kills: 0,
    combo: 0,
    comboTimer: 0,
    camera: 0,
    events: [],
    player: player(assist ? 8 : 5),
    world: makeWorld(0),
  };
}

export function startGame(game) {
  if (game.phase !== "ready") return;
  game.phase = "playing";
  game.events = [
    { type: "message", text: SECTORS[0].intro },
    { type: "start" },
  ];
}

export function togglePause(game) {
  if (game.phase === "playing") game.phase = "paused";
  else if (game.phase === "paused") game.phase = "playing";
}

export function nextSector(game) {
  if (game.phase !== "sector-clear" || game.sector >= 2) return;
  const hp = Math.min(game.player.maxHp, game.player.hp + 2);
  const charge = Math.max(45, game.player.pulse);
  game.sector++;
  game.world = makeWorld(game.sector);
  game.player = player(game.player.maxHp);
  game.player.hp = hp;
  game.player.pulse = charge;
  game.phase = "playing";
  game.memories = 0;
  game.sectorTime = 0;
  game.camera = 0;
  game.combo = 0;
  game.events = [
    { type: "message", text: SECTORS[game.sector].intro },
    { type: "start" },
  ];
}

function award(game, value, x, y, kind) {
  game.combo++;
  game.comboTimer = 3.6;
  const amount = Math.round(
    value * Math.min(3, 1 + Math.floor(game.combo / 4) * 0.5),
  );
  game.score += amount;
  game.events.push({ type: kind, x, y, value: amount });
}

function hurt(game, x) {
  const p = game.player;
  if (p.invincible > 0 || p.dashTime > 0 || game.phase !== "playing") return;
  p.hp--;
  p.invincible = 1.5;
  p.vy = -270;
  p.vx = p.x < x ? -210 : 210;
  game.combo = 0;
  game.events.push({ type: "hurt", x: p.x, y: p.y });
  if (p.hp <= 0) {
    game.phase = "lost";
    game.events.push({
      type: "message",
      text: "Hey. It’s okay. A lost signal isn’t a lost connection. Let’s try again.",
    });
  }
}

function hitEnemy(game, enemy, damage) {
  if (enemy.hp <= 0 || (enemy.hitCooldown || 0) > 0) return;
  enemy.hp = Math.max(0, enemy.hp - damage);
  if (enemy.kind === "boss") enemy.hitCooldown = 0.42;
  game.events.push({
    type: "hit",
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h / 2,
  });
  if (enemy.hp === 0) {
    game.kills++;
    game.player.pulse = clamp(
      game.player.pulse + (enemy.kind === "boss" ? 35 : 14),
      0,
      100,
    );
    award(
      game,
      enemy.kind === "boss" ? 1800 : 150,
      enemy.x,
      enemy.y,
      "destroy",
    );
    if (enemy.kind === "boss")
      game.events.push({
        type: "message",
        text: "The Guardian is down! Get to the relay. Let’s light up the city.",
      });
  }
}

export function stepGame(game, input = {}, dt = STEP) {
  // A bounded step prevents collision tunnelling after a suspended browser frame.
  dt = clamp(dt, 0, 1 / 60);
  game.events = [];
  if (game.phase !== "playing" || !dt) return game;
  const p = game.player;
  const world = game.world;
  game.time += dt;
  game.sectorTime += dt;
  game.comboTimer -= dt;
  if (game.comboTimer <= 0) game.combo = 0;
  for (const key of [
    "invincible",
    "dashTime",
    "dashCooldown",
    "pulseCooldown",
    "coyote",
    "jumpBuffer",
  ])
    p[key] = Math.max(0, p[key] - dt);
  p.pulse = Math.min(100, p.pulse + dt * (game.assist ? 8 : 4));
  const axis = Number(Boolean(input.right)) - Number(Boolean(input.left));
  if (input.jumpPressed) p.jumpBuffer = 0.15;
  if (p.grounded) p.coyote = 0.1;
  if (p.jumpBuffer > 0 && p.coyote > 0 && p.dashTime === 0) {
    p.vy = -700;
    p.grounded = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    game.events.push({ type: "jump", x: p.x, y: p.y + p.h });
  }
  if (!input.jump && p.vy < -280) p.vy += 2200 * dt;
  if (input.dashPressed && p.dashCooldown === 0) {
    if (axis) p.facing = axis;
    p.dashTime = game.assist ? 0.25 : 0.2;
    p.dashCooldown = game.assist ? 0.85 : 1.2;
    p.vy = 0;
    game.events.push({ type: "dash", x: p.x, y: p.y });
  }
  if (input.pulsePressed && p.pulse >= 45 && p.pulseCooldown === 0) {
    p.pulse -= 45;
    p.pulseCooldown = 0.5;
    const radius = game.assist ? 290 : 235;
    const cx = p.x + p.w / 2,
      cy = p.y + p.h / 2;
    game.events.push({ type: "pulse", x: cx, y: cy, radius });
    for (const e of [...world.enemies, ...(world.boss ? [world.boss] : [])]) {
      if (distance(p, e) < radius) hitEnemy(game, e, e.kind === "boss" ? 3 : 1);
    }
    world.bullets = world.bullets.filter(
      (b) => Math.hypot(b.x - cx, b.y - cy) > radius,
    );
  }
  if (p.dashTime > 0) {
    p.vx = p.facing * 920;
    p.vy = 0;
  } else {
    const target = axis * 300;
    p.vx += (target - p.vx) * Math.min(1, dt * (p.grounded ? 19 : 11));
    p.vy = Math.min(860, p.vy + 1750 * dt);
    if (axis) p.facing = axis;
  }
  const previousFeet = p.y + p.h;
  p.x = clamp(p.x + p.vx * dt, 0, world.width - p.w);
  p.y += p.vy * dt;
  p.grounded = false;
  if (p.vy >= 0) {
    for (const platform of [...world.platforms].sort((a, b) => a.y - b.y)) {
      if (
        p.x + p.w > platform.x &&
        p.x < platform.x + platform.w &&
        previousFeet <= platform.y + 1 &&
        p.y + p.h >= platform.y
      ) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        break;
      }
    }
  }
  if (p.y > VIEW.height + 100) hurt(game, p.x);
  for (const memory of world.memories) {
    if (!memory.taken && overlaps(p, memory)) {
      memory.taken = true;
      game.memories++;
      game.totalMemories++;
      p.pulse = Math.min(100, p.pulse + 17);
      award(game, 100, memory.x + 11, memory.y, "memory");
      if (game.memories === 6)
        game.events.push({
          type: "message",
          text:
            game.sector === 2
              ? "Six fragments secured. Break the Guardian, then reach the relay."
              : "Relay unlocked. Find the glowing ring at the far end of the rooftops.",
        });
    }
  }
  for (const enemy of world.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.x = enemy.anchor + Math.sin(game.sectorTime * 1.6 + enemy.phase) * 36;
    enemy.y = enemy.baseY + Math.sin(game.sectorTime * 2 + enemy.phase) * 13;
    if (overlaps(p, enemy)) {
      if (p.dashTime > 0) hitEnemy(game, enemy, 1);
      else hurt(game, enemy.x);
    }
    if (game.sector >= 1 && Math.abs(enemy.x - p.x) < 660) {
      enemy.shot -= dt;
      if (enemy.shot <= 0) {
        const angle = Math.atan2(
          p.y + p.h / 2 - enemy.y,
          p.x + p.w / 2 - enemy.x,
        );
        const speed = game.assist ? 130 : 185;
        world.bullets.push({
          x: enemy.x + enemy.w / 2,
          y: enemy.y + enemy.h / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 5,
          r: 6,
        });
        enemy.shot = game.assist ? 3.2 : 2.6;
      }
    }
  }
  const boss = world.boss;
  if (boss?.hp > 0) {
    boss.hitCooldown = Math.max(0, boss.hitCooldown - dt);
    boss.y = boss.baseY + Math.sin(game.sectorTime * 1.5) * 17;
    if (overlaps(p, boss)) {
      if (p.dashTime > 0) hitEnemy(game, boss, 2);
      else hurt(game, boss.x);
    }
    if (Math.abs(boss.x - p.x) < 900) {
      boss.shot -= dt;
      if (boss.shot <= 0) {
        const cx = boss.x + boss.w / 2,
          cy = boss.y + boss.h / 2;
        const angle = Math.atan2(p.y + p.h / 2 - cy, p.x + p.w / 2 - cx);
        for (const offset of [-0.3, 0, 0.3]) {
          const speed = game.assist ? 160 : 230;
          world.bullets.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle + offset) * speed,
            vy: Math.sin(angle + offset) * speed,
            life: 5,
            r: 8,
          });
        }
        boss.shot = boss.hp <= 6 ? 1.15 : 1.8;
        game.events.push({ type: "boss-shot", x: cx, y: cy });
      }
    }
  }
  for (const bullet of world.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (
      overlaps(p, {
        x: bullet.x - bullet.r,
        y: bullet.y - bullet.r,
        w: bullet.r * 2,
        h: bullet.r * 2,
      })
    ) {
      if (p.dashTime === 0) hurt(game, bullet.x);
      bullet.life = 0;
    }
  }
  world.bullets = world.bullets.filter(
    (b) => b.life > 0 && b.y < VIEW.height && b.y > -100,
  );
  if (
    game.phase === "playing" &&
    game.memories >= 6 &&
    (!boss || boss.hp === 0) &&
    overlaps(p, world.gate)
  ) {
    game.score += 500 + Math.max(0, Math.round(900 - game.sectorTime * 8));
    game.phase = game.sector === 2 ? "won" : "sector-clear";
    game.events.push(
      { type: "clear", x: world.gate.x, y: world.gate.y },
      { type: "message", text: SECTORS[game.sector].clear },
    );
  }
  game.camera +=
    (clamp(p.x - VIEW.width * 0.35, 0, world.width - VIEW.width) -
      game.camera) *
    Math.min(1, dt * 7);
  return game;
}
