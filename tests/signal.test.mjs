import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  startGame,
  nextSector,
  togglePause,
  stepGame,
  VIEW,
  STEP,
  SECTORS,
} from "../docs/signal-core.mjs";

const tick = (game, seconds, input = {}) => {
  for (let i = 0; i < Math.round(seconds / STEP); i++)
    stepGame(game, typeof input === "function" ? input(i) : input);
};
const playing = (options) => {
  const game = createGame(options);
  startGame(game);
  return game;
};

test("the title waits for the player; idle and paused simulations cannot autoplay", () => {
  const game = createGame();
  const initial = game.player.x;
  tick(game, 10, { right: true });
  assert.equal(game.phase, "ready");
  assert.equal(game.time, 0);
  assert.equal(game.player.x, initial);
  startGame(game);
  tick(game, 0.3, { right: true });
  togglePause(game);
  const snapshot = JSON.stringify({ ...game, events: [] });
  tick(game, 5, { right: true, dashPressed: true });
  assert.equal(JSON.stringify({ ...game, events: [] }), snapshot);
  togglePause(game);
  tick(game, 0.3, { right: true });
  assert.ok(game.player.x > initial + 100);
});

test("manual movement accelerates, changes facing, and respects the world boundaries", () => {
  const game = playing();
  tick(game, 0.5, { right: true });
  assert.ok(game.player.x > 200);
  tick(game, 2, { left: true });
  assert.equal(game.player.x, 0);
  assert.equal(game.player.facing, -1);
});

test("jump height responds to holding the button and returns to a rooftop", () => {
  const held = playing(),
    tapped = playing();
  let high = VIEW.ground,
    low = VIEW.ground;
  for (let i = 0; i < 190; i++) {
    stepGame(held, { jump: i < 100, jumpPressed: i === 0 });
    stepGame(tapped, { jump: i === 0, jumpPressed: i === 0 });
    high = Math.min(high, held.player.y);
    low = Math.min(low, tapped.player.y);
  }
  assert.ok(high < low - 40);
  assert.equal(held.player.y + held.player.h, VIEW.ground);
  assert.equal(held.player.grounded, true);
});

test("coyote time allows a jump immediately after walking off an elevated ledge", () => {
  const game = playing(),
    platform = game.world.platforms[1];
  game.player.x = platform.x + platform.w + 1;
  game.player.y = platform.y - game.player.h;
  game.player.grounded = true;
  stepGame(game, { right: true });
  assert.equal(game.player.grounded, false);
  stepGame(game, { right: true, jump: true, jumpPressed: true });
  assert.ok(game.player.vy < -600);
});

test("a memory is collected once, adds score, and charges Sarah’s pulse", () => {
  const game = playing(),
    memory = game.world.memories[0];
  game.player.x = memory.x;
  stepGame(game);
  const score = game.score,
    charge = game.player.pulse;
  assert.equal(game.memories, 1);
  assert.equal(game.totalMemories, 1);
  assert.equal(score, 100);
  assert.ok(charge > 60);
  tick(game, 0.1);
  assert.equal(game.memories, 1);
  assert.equal(game.score, score);
});

test("dash destroys a nearby drone, grants contact immunity, and has a cooldown", () => {
  const game = playing(),
    enemy = game.world.enemies[0];
  game.player.x = enemy.x - 40;
  const health = game.player.hp;
  stepGame(game, { right: true, dashPressed: true });
  tick(game, 0.1, { right: true });
  assert.equal(enemy.hp, 0);
  assert.equal(game.player.hp, health);
  assert.equal(game.kills, 1);
  const cooldown = game.player.dashCooldown;
  stepGame(game, { dashPressed: true });
  assert.ok(game.player.dashCooldown < cooldown);
});

test("Sarah’s pulse costs charge, destroys only nearby enemies, and clears projectiles", () => {
  const game = playing(),
    nearby = game.world.enemies[0],
    distant = game.world.enemies[4];
  game.player.x = nearby.x - 60;
  game.world.bullets.push({
    x: game.player.x + 20,
    y: game.player.y + 20,
    vx: 0,
    vy: 0,
    life: 4,
    r: 6,
  });
  stepGame(game, { pulsePressed: true });
  assert.equal(nearby.hp, 0);
  assert.equal(distant.hp, 1);
  assert.equal(game.world.bullets.length, 0);
  assert.ok(game.player.pulse < 20);
  stepGame(game, { pulsePressed: true });
  assert.equal(game.kills, 1);
});

test("damage has an invulnerability window and health zero ends the run", () => {
  const game = playing(),
    enemy = game.world.enemies[0];
  game.player.x = enemy.x;
  stepGame(game);
  assert.equal(game.player.hp, 4);
  tick(game, 0.05);
  assert.equal(game.player.hp, 4);
  game.player.hp = 1;
  game.player.invincible = 0;
  game.player.x = enemy.x;
  game.player.y = enemy.y;
  stepGame(game);
  assert.equal(game.phase, "lost");
  const time = game.time;
  tick(game, 1);
  assert.equal(game.time, time);
});

test("a relay stays locked until six fragments are recovered", () => {
  const game = playing();
  game.player.x = game.world.gate.x;
  tick(game, 0.1);
  assert.equal(game.phase, "playing");
  game.memories = 6;
  stepGame(game);
  assert.equal(game.phase, "sector-clear");
  const score = game.score;
  tick(game, 1);
  assert.equal(game.score, score);
});

test("new sectors preserve the run, heal two points, and never skip the Guardian", () => {
  const game = playing();
  game.phase = "sector-clear";
  game.player.hp = 2;
  game.score = 500;
  nextSector(game);
  assert.equal(game.sector, 1);
  assert.equal(game.player.hp, 4);
  assert.equal(game.score, 500);
  assert.equal(game.memories, 0);
  game.phase = "sector-clear";
  nextSector(game);
  assert.equal(game.sector, 2);
  assert.ok(game.world.boss);
  game.memories = 6;
  game.player.x = game.world.gate.x;
  stepGame(game);
  assert.equal(game.phase, "playing");
  game.world.boss.hp = 0;
  stepGame(game);
  assert.equal(game.phase, "won");
});

test("the Guardian takes dash and pulse damage once per attack window", () => {
  const game = playing();
  game.phase = "sector-clear";
  nextSector(game);
  game.phase = "sector-clear";
  nextSector(game);
  const boss = game.world.boss;
  game.player.x = boss.x - 70;
  stepGame(game, { pulsePressed: true });
  assert.equal(boss.hp, 9);
  game.player.pulse = 100;
  game.player.pulseCooldown = 0;
  stepGame(game, { pulsePressed: true });
  assert.equal(boss.hp, 9);
  tick(game, 0.5);
  game.player.x = boss.x - 40;
  game.player.y = VIEW.ground - game.player.h;
  stepGame(game, { right: true, dashPressed: true });
  tick(game, 0.1, { right: true });
  assert.equal(boss.hp, 7);
});

test("assist mode adds health and shortens dash cooldown without changing mission goals", () => {
  const regular = playing(),
    assist = playing({ assist: true });
  assert.equal(regular.player.hp, 5);
  assert.equal(assist.player.hp, 8);
  stepGame(regular, { dashPressed: true });
  stepGame(assist, { dashPressed: true });
  assert.ok(assist.player.dashCooldown < regular.player.dashCooldown);
  assert.equal(assist.world.memories.length, regular.world.memories.length);
});

test("all three sectors can be won using only movement, dash and pulse, without state cheats", () => {
  for (const assist of [false, true]) {
    const game = playing({ assist });
    for (
      let frame = 0;
      frame < 120 * 150 && !["lost", "won"].includes(game.phase);
      frame++
    ) {
      if (game.phase === "sector-clear") {
        nextSector(game);
        continue;
      }
      const p = game.player,
        boss = game.world.boss;
      const threats = game.world.enemies.filter(
        (e) =>
          e.hp > 0 && Math.abs(e.x - p.x) < 195 && Math.abs(e.y - p.y) < 100,
      );
      const nearBoss = boss?.hp > 0 && Math.abs(boss.x - p.x) < 235;
      let right = true,
        left = false;
      if (boss?.hp > 0 && p.x > boss.x - 250) {
        right = p.x < boss.x + 45;
        left = !right;
      }
      const pulsePressed =
        (threats.length > 0 || nearBoss) &&
        p.pulse >= 45 &&
        p.pulseCooldown === 0;
      const dashPressed =
        !pulsePressed &&
        p.dashCooldown === 0 &&
        (nearBoss || threats.some((e) => Math.abs(e.x - p.x) < 105));
      stepGame(game, { right, left, pulsePressed, dashPressed });
    }
    assert.equal(
      game.phase,
      "won",
      `${assist ? "assist" : "standard"} stopped in sector ${game.sector} at x=${game.player.x}, hp=${game.player.hp}, fragments=${game.memories}, boss=${game.world.boss?.hp}`,
    );
    assert.equal(game.sector, SECTORS.length - 1);
    assert.ok(game.totalMemories >= 18);
    assert.ok(game.score > 5000);
  }
});
