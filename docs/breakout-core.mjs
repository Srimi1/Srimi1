// Pure Breakout rules: no DOM, fully unit-testable. The UI in breakout.mjs
// renders this state into SVG and feeds it input + animation frames.
export const BOARD_W = 1000;
export const BOARD_H = 480;
export const BALL_R = 8;
export const PADDLE_W = 110;
export const PADDLE_H = 14;
export const PADDLE_Y = BOARD_H - 34;
export const START_LIVES = 3;
export const START_SPEED = 380;
export const MAX_SPEED = 720;
export const SPEED_UP = 1.6;
export const BRICK_COLS = 10;
export const BRICK_TOP = 46;
export const BRICK_H = 22;
export const BRICK_GAP = 6;
export const BRICK_MARGIN = 24;
export const LEVEL_ORDER = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
export const LEVEL_COLORS = {NONE: '#26405a', FIRST_QUARTILE: '#145170', SECOND_QUARTILE: '#087eae', THIRD_QUARTILE: '#0ba9ed', FOURTH_QUARTILE: '#78e2ff'};
export const levelPoints = level => 10 * (1 + Math.max(0, LEVEL_ORDER.indexOf(level)));

// One brick per calendar day: the last BRICK_COLS weeks become columns,
// weekdays become rows, so the wall IS the recent contribution graph.
export function buildBricks(weeks, cols = BRICK_COLS) {
  const slice = weeks.slice(-cols);
  const n = slice.length;
  if (!n) return [];
  const w = (BOARD_W - 2 * BRICK_MARGIN - (n - 1) * BRICK_GAP) / n;
  const bricks = [];
  slice.forEach((week, col) => {
    for (const day of week.contributionDays) {
      bricks.push({
        x: BRICK_MARGIN + col * (w + BRICK_GAP),
        y: BRICK_TOP + day.weekday * (BRICK_H + BRICK_GAP),
        w, h: BRICK_H,
        level: day.contributionLevel || 'NONE',
        count: day.contributionCount || 0,
        date: day.date,
        points: levelPoints(day.contributionLevel),
        alive: true,
      });
    }
  });
  return bricks;
}

export function createGame(bricks) {
  const state = {
    phase: 'serve', score: 0, lives: START_LIVES,
    speed: START_SPEED, bricks, bricksLeft: bricks.filter(b => b.alive).length,
    paddle: {x: BOARD_W / 2, w: PADDLE_W, h: PADDLE_H, y: PADDLE_Y},
    ball: {x: BOARD_W / 2, y: PADDLE_Y - BALL_R, vx: 0, vy: 0, r: BALL_R},
  };
  return state;
}

export function serve(state) {
  state.phase = 'serve';
  state.ball.x = state.paddle.x;
  state.ball.y = state.paddle.y - state.ball.r;
  state.ball.vx = 0;
  state.ball.vy = 0;
}

export function launch(state, angle = -Math.PI / 3) {
  if (state.phase !== 'serve') return false;
  state.phase = 'play';
  state.ball.vx = state.speed * Math.cos(angle);
  state.ball.vy = state.speed * Math.sin(angle);
  return true;
}

export function movePaddle(state, x) {
  state.paddle.x = Math.min(BOARD_W - state.paddle.w / 2, Math.max(state.paddle.w / 2, x));
  if (state.phase === 'serve') { state.ball.x = state.paddle.x; }
}

// Returns 'x' or 'y' for the reflection axis when the ball overlaps a rect, else null.
export function hitAxis(ball, rect) {
  const cx = Math.min(rect.x + rect.w, Math.max(rect.x, ball.x));
  const cy = Math.min(rect.y + rect.h, Math.max(rect.y, ball.y));
  const dx = ball.x - cx, dy = ball.y - cy;
  if (dx * dx + dy * dy > ball.r * ball.r) return null;
  const penX = ball.r - Math.abs(dx), penY = ball.r - Math.abs(dy);
  return penX < penY ? 'x' : 'y';
}

function bouncePaddle(state) {
  const offset = Math.min(1, Math.max(-1, (state.ball.x - state.paddle.x) / (state.paddle.w / 2)));
  const a = offset * 1.05; // up to ~60° off vertical
  state.ball.vx = state.speed * Math.sin(a);
  state.ball.vy = -Math.abs(state.speed * Math.cos(a));
  state.ball.y = state.paddle.y - state.ball.r;
}

// Advance the simulation by dt seconds. Returns events for the UI/tests.
export function step(state, dt) {
  if (state.phase !== 'play') return [];
  const events = [];
  const ball = state.ball;
  const dist = Math.hypot(ball.vx, ball.vy) * dt;
  const n = Math.max(1, Math.ceil(dist / ball.r));
  for (let s = 0; s < n; s++) {
    ball.x += ball.vx * dt / n;
    ball.y += ball.vy * dt / n;
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
    else if (ball.x > BOARD_W - ball.r) { ball.x = BOARD_W - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
    const p = state.paddle;
    if (ball.vy > 0 && hitAxis(ball, {x: p.x - p.w / 2, y: p.y, w: p.w, h: p.h})) { bouncePaddle(state); events.push({type: 'paddle'}); }
    for (let i = 0; i < state.bricks.length; i++) {
      const brick = state.bricks[i];
      if (!brick.alive) continue;
      const axis = hitAxis(ball, brick);
      if (!axis) continue;
      brick.alive = false;
      state.bricksLeft--;
      state.score += brick.points;
      state.speed = Math.min(MAX_SPEED, state.speed + SPEED_UP);
      if (axis === 'x') { ball.vx = ball.x < brick.x + brick.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx); }
      else { ball.vy = ball.y < brick.y + brick.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy); }
      events.push({type: 'brick', index: i, points: brick.points});
      break;
    }
  }
  if (state.bricksLeft === 0) { state.phase = 'won'; events.push({type: 'win', score: state.score}); }
  else if (ball.y - ball.r > BOARD_H) {
    state.lives--;
    events.push({type: 'life', lives: state.lives});
    if (state.lives <= 0) { state.phase = 'over'; events.push({type: 'over', score: state.score}); }
    else serve(state);
  }
  return events;
}
