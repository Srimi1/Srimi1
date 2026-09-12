import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import {
  BOARD_W,
  START_LIVES,
  START_SPEED,
  MAX_SPEED,
  LEVEL_COLORS,
  quietHitsForRun,
  buildYearBoard,
  summarizeBoard,
  collisionRole,
  createGame,
  launch,
  hitBrick,
  loseLife,
} from '../docs/breakout-core.mjs';

const day = (date, count = 0, level = 'NONE') => ({date, contributionCount: count, contributionLevel: level});
const weeks = (...days) => [{contributionDays: days}];

test('the 2026 board contains every real date and no invented future activity', () => {
  const slots = buildYearBoard(weeks(
    day('2026-01-01'),
    day('2026-01-02', 2, 'FIRST_QUARTILE'),
    day('2026-01-03'),
  ), {year: 2026, snapshotDate: '2026-01-03'});
  const summary = summarizeBoard(slots);
  assert.equal(slots.length, 365);
  assert.equal(summary.elapsed, 3);
  assert.equal(summary.quiet, 2);
  assert.equal(summary.protected, 1);
  assert.equal(summary.future, 362);
  assert.equal(summary.contributions, 2);
  assert.equal(slots[0].date, '2026-01-01');
  assert.equal(slots.at(-1).date, '2026-12-31');
  assert.ok(slots.every(slot => slot.x >= 0 && slot.x + slot.w <= BOARD_W));
});

test('quiet runs become one-, two-, then three-hit blocks', () => {
  assert.deepEqual([1, 2, 3, 6, 7, 20].map(quietHitsForRun), [1, 1, 2, 2, 3, 3]);
  const slots = buildYearBoard(weeks(), {year: 2026, snapshotDate: '2026-01-08'}).slice(0, 8);
  assert.deepEqual(slots.map(slot => slot.maxHits), [1, 1, 2, 2, 2, 2, 3, 3]);
});

test('contribution blocks are protected and expose four blue intensity levels', () => {
  const slots = buildYearBoard(weeks(
    day('2026-01-01', 1, 'FIRST_QUARTILE'),
    day('2026-01-02', 2, 'SECOND_QUARTILE'),
    day('2026-01-03', 3, 'THIRD_QUARTILE'),
    day('2026-01-04', 4, 'FOURTH_QUARTILE'),
  ), {year: 2026, snapshotDate: '2026-01-04'}).slice(0, 4);
  assert.ok(slots.every(slot => slot.kind === 'protected' && slot.maxHits === 0));
  assert.deepEqual(slots.map(slot => LEVEL_COLORS[slot.level]), ['#8bdcff', '#39aef5', '#176fca', '#173a94']);
});

test('quiet blocks are solid, contribution blocks are pass-through sensors, and future dates have no body', () => {
  assert.equal(collisionRole({kind: 'quiet'}), 'solid');
  assert.equal(collisionRole({kind: 'protected'}), 'sensor');
  assert.equal(collisionRole({kind: 'future'}), 'none');
});

test('one-hit quiet blocks shatter on first contact and can finish the game', () => {
  const slot = {id: 'one', kind: 'quiet', alive: true, maxHits: 1, hitsLeft: 1};
  const game = createGame([slot]);
  assert.equal(launch(game), true);
  const event = hitBrick(game, 'one');
  assert.equal(event.type, 'shatter');
  assert.equal(event.won, true);
  assert.equal(game.phase, 'won');
  assert.equal(game.quietLeft, 0);
  assert.equal(game.score, 30);
});

test('two- and three-hit quiet blocks reveal damage before they shatter', () => {
  const game = createGame([
    {id: 'two', kind: 'quiet', alive: true, maxHits: 2, hitsLeft: 2},
    {id: 'three', kind: 'quiet', alive: true, maxHits: 3, hitsLeft: 3},
  ]);
  launch(game);
  assert.deepEqual(hitBrick(game, 'two').type, 'damage');
  assert.equal(game.bricks[0].hitsLeft, 1);
  assert.equal(hitBrick(game, 'two').type, 'shatter');
  assert.equal(game.bricks[0].alive, false);
  assert.equal(hitBrick(game, 'three').type, 'damage');
  assert.equal(hitBrick(game, 'three').type, 'damage');
  assert.equal(hitBrick(game, 'three').type, 'shatter');
  assert.equal(game.phase, 'won');
  assert.ok(game.speed > START_SPEED && game.speed <= MAX_SPEED);
});

test('protected contribution blocks never lose integrity or reduce the target count', () => {
  const protectedBrick = {id: 'work', kind: 'protected', alive: true, maxHits: 0, hitsLeft: 0, level: 'FOURTH_QUARTILE', count: 17};
  const quietBrick = {id: 'quiet', kind: 'quiet', alive: true, maxHits: 1, hitsLeft: 1};
  const game = createGame([protectedBrick, quietBrick]);
  launch(game);
  const before = game.quietLeft;
  const event = hitBrick(game, 'work');
  assert.deepEqual(event, {type: 'protected', id: 'work', level: 'FOURTH_QUARTILE', count: 17});
  assert.equal(game.bricks[0].alive, true);
  assert.equal(game.quietLeft, before);
  assert.equal(game.score, 0);
});

test('missing the paddle costs one life and re-serves until game over', () => {
  const game = createGame([{id: 'quiet', kind: 'quiet', alive: true, maxHits: 1, hitsLeft: 1}]);
  launch(game);
  assert.deepEqual(loseLife(game), {type: 'life', lives: START_LIVES - 1, score: 0});
  assert.equal(game.phase, 'serve');
  launch(game);
  game.lives = 1;
  assert.deepEqual(loseLife(game), {type: 'over', lives: 0, score: 0});
  assert.equal(game.phase, 'over');
});

test('Matter.js reflects a restitution-one ball from a static wall', () => {
  const {Engine, Bodies, Body, Composite} = Matter;
  const engine = Engine.create({gravity: {x: 0, y: 0}});
  const wall = Bodies.rectangle(5, 100, 10, 200, {isStatic: true, restitution: 1, friction: 0});
  const ball = Bodies.circle(35, 100, 5, {restitution: 1, friction: 0, frictionAir: 0});
  Composite.add(engine.world, [wall, ball]);
  Body.setVelocity(ball, {x: -6, y: 0});
  for (let index = 0; index < 8; index += 1) Engine.update(engine, 1000 / 60);
  assert.ok(ball.velocity.x > 0, `expected a reflected velocity, got ${ball.velocity.x}`);
  Engine.clear(engine);
});
