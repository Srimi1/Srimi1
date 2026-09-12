import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_W, BOARD_H, BALL_R, PADDLE_Y, START_LIVES, START_SPEED, BRICK_COLS, LEVEL_COLORS, levelPoints, buildBricks, createGame, serve, launch, movePaddle, hitAxis, step} from '../docs/breakout-core.mjs';
const LV = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
const week = (level = 'NONE', count = 0, days = 7) => ({contributionDays: Array.from({length: days}, (_, i) => ({date: `d-${level}-${i}`, weekday: i, contributionCount: count, contributionLevel: level}))});
const singleBrick = () => [{x: 100, y: 100, w: 60, h: 20, level: 'NONE', count: 0, date: 'd', points: 10, alive: true}];
const play = bricks => { const g = createGame(bricks); g.phase = 'play'; return g; };
test('bricks mirror the recent calendar: columns are weeks, rows are weekdays', () => {
  const weeks = LV.map((l, i) => week(l, i));
  const bricks = buildBricks(weeks);
  assert.equal(bricks.length, 5 * 7);
  assert.ok(bricks.every(b => b.x >= 0 && b.x + b.w <= BOARD_W && b.y >= 0 && b.h > 0));
  const first = bricks[0], second = bricks[7];
  assert.ok(second.x > first.x); // next week, next column
  assert.ok(bricks[1].y > first.y); // next weekday, next row
  assert.equal(LEVEL_COLORS[bricks[7 * 4].level], '#78e2ff');
  assert.deepEqual([0, 1, 2, 3, 4].map(i => bricks[i * 7].points), [10, 20, 30, 40, 50]);
  assert.equal(levelPoints('BOGUS'), 10);
});
test('short and empty calendars produce fewer or no bricks', () => {
  assert.equal(buildBricks([week(), week()]).length, 14);
  assert.equal(buildBricks([week('NONE', 0, 3)]).length, 3);
  assert.deepEqual(buildBricks([]), []);
  assert.ok(buildBricks(Array.from({length: 20}, () => week())).length <= BRICK_COLS * 7);
});
test('serve parks the ball; launch only fires from serve at full speed', () => {
  const g = createGame(singleBrick());
  movePaddle(g, 111); serve(g);
  assert.equal(g.phase, 'serve'); assert.equal(g.ball.x, 111); assert.equal(g.ball.y, PADDLE_Y - BALL_R);
  assert.equal(launch(g), true); assert.equal(g.phase, 'play');
  assert.ok(Math.abs(Math.hypot(g.ball.vx, g.ball.vy) - START_SPEED) < 1e-9);
  assert.equal(launch(g), false);
});
test('paddle stays on the board and carries a served ball', () => {
  const g = createGame(singleBrick());
  movePaddle(g, -9999); assert.equal(g.paddle.x, g.paddle.w / 2); assert.equal(g.ball.x, g.paddle.w / 2);
  movePaddle(g, 9999); assert.equal(g.paddle.x, BOARD_W - g.paddle.w / 2);
});
test('free flight moves the ball and walls reflect it', () => {
  const g = play(singleBrick());
  g.ball.x = 500; g.ball.y = 400; g.ball.vx = 100; g.ball.vy = -50;
  step(g, 0.1); assert.equal(g.ball.x, 510); assert.equal(g.ball.y, 395);
  g.ball.x = BALL_R + 1; g.ball.vx = -300; step(g, 0.05); assert.ok(g.ball.vx > 0);
  g.ball.x = BOARD_W - BALL_R - 1; g.ball.vx = 300; step(g, 0.05); assert.ok(g.ball.vx < 0);
  g.ball.y = BALL_R + 1; g.ball.vy = -300; step(g, 0.05); assert.ok(g.ball.vy > 0);
});
test('paddle bounces the ball upward, steered by hit offset', () => {
  const g = play(singleBrick());
  g.ball.x = g.paddle.x; g.ball.y = PADDLE_Y - BALL_R - 1; g.ball.vx = 0; g.ball.vy = 300;
  const e = step(g, 0.02);
  assert.ok(g.ball.vy < 0); assert.ok(e.some(x => x.type === 'paddle'));
  g.ball.x = g.paddle.x + g.paddle.w / 2; g.ball.y = PADDLE_Y - BALL_R - 1; g.ball.vx = 0; g.ball.vy = 300;
  step(g, 0.02); assert.ok(g.ball.vx > 0 && g.ball.vy < 0);
  g.ball.x = g.paddle.x - g.paddle.w / 2; g.ball.y = PADDLE_Y - BALL_R - 1; g.ball.vx = 0; g.ball.vy = 300;
  step(g, 0.02); assert.ok(g.ball.vx < 0 && g.ball.vy < 0);
});
test('brick hits score, count down, and reflect the ball', () => {
  const g = play(singleBrick());
  g.ball.x = 130; g.ball.y = 90; g.ball.vx = 0; g.ball.vy = 300;
  const e = step(g, 0.05);
  assert.equal(g.bricks[0].alive, false); assert.equal(g.bricksLeft, 0); assert.equal(g.score, 10);
  assert.ok(g.ball.vy < 0); assert.deepEqual(e[0], {type: 'brick', index: 0, points: 10});
  assert.equal(hitAxis({x: 0, y: 0, r: 5}, {x: 100, y: 100, w: 10, h: 10}), null);
  assert.equal(hitAxis({x: 105, y: 90, r: 12}, {x: 100, y: 100, w: 60, h: 20}), 'y');
});
test('missing the paddle costs a life and re-serves; the last life ends the game', () => {
  const g = play(singleBrick());
  assert.equal(g.lives, START_LIVES);
  g.ball.y = BOARD_H + BALL_R + 1; g.ball.vy = 100;
  const e = step(g, 0.01);
  assert.equal(g.lives, START_LIVES - 1); assert.equal(g.phase, 'serve');
  assert.deepEqual(e[0], {type: 'life', lives: START_LIVES - 1});
  g.lives = 1; g.phase = 'play'; g.ball.y = BOARD_H + BALL_R + 1; g.ball.vy = 100;
  const e2 = step(g, 0.01);
  assert.equal(g.phase, 'over'); assert.ok(e2.some(x => x.type === 'over'));
});
test('clearing the last brick wins with the final score', () => {
  const g = play(singleBrick());
  g.ball.x = 130; g.ball.y = 90; g.ball.vx = 0; g.ball.vy = 300;
  const e = step(g, 0.05);
  assert.equal(g.phase, 'won'); assert.deepEqual(e.at(-1), {type: 'win', score: 10});
  assert.deepEqual(step(g, 0.1), []);
});
