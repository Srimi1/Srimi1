// Pure Breakout domain rules. Matter.js owns collision resolution in breakout.mjs;
// this module owns calendar layout, durability, scoring, lives, and game phases.
export const BOARD_W = 1000;
export const BOARD_H = 620;
export const BALL_R = 8;
export const PADDLE_W = 118;
export const PADDLE_H = 15;
export const PADDLE_Y = BOARD_H - 38;
export const START_LIVES = 3;
export const START_SPEED = 8.2;
export const MAX_SPEED = 12.4;
export const SPEED_UP = 0.055;
export const GAME_YEAR = 2026;
export const BRICK_COLS = 53;
export const BRICK_TOP = 102;
export const BRICK_H = 24;
export const BRICK_GAP_X = 3;
export const BRICK_GAP_Y = 5;
export const BRICK_MARGIN_X = 28;
export const LEVEL_ORDER = ['FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
export const LEVEL_COLORS = {
  NONE: '#19334b',
  FIRST_QUARTILE: '#8bdcff',
  SECOND_QUARTILE: '#39aef5',
  THIRD_QUARTILE: '#176fca',
  FOURTH_QUARTILE: '#173a94',
  FUTURE: '#0c1925',
};

const pad = value => String(value).padStart(2, '0');
const iso = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const utcDate = value => {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
const addDays = (date, amount) => new Date(date.getTime() + amount * 86400000);

export function quietHitsForRun(runLength) {
  if (runLength >= 7) return 3;
  if (runLength >= 3) return 2;
  return 1;
}

export function buildYearBoard(weeks, {year = GAME_YEAR, snapshotDate} = {}) {
  const byDate = new Map();
  for (const week of weeks || []) {
    for (const day of week.contributionDays || []) byDate.set(day.date, day);
  }

  const first = new Date(Date.UTC(year, 0, 1));
  const last = new Date(Date.UTC(year, 11, 31));
  const startSunday = addDays(first, -first.getUTCDay());
  const latestData = [...byDate.keys()].sort().at(-1) || `${year}-01-01`;
  const snapshot = utcDate(snapshotDate || latestData);
  const brickW = (BOARD_W - BRICK_MARGIN_X * 2 - (BRICK_COLS - 1) * BRICK_GAP_X) / BRICK_COLS;
  const slots = [];
  let quietRun = 0;

  for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
    const date = iso(cursor);
    const source = byDate.get(date);
    const contributionCount = Number(source?.contributionCount || 0);
    const future = cursor > snapshot;
    const protectedDay = !future && contributionCount > 0;
    if (future || protectedDay) quietRun = 0;
    else quietRun += 1;
    const maxHits = future || protectedDay ? 0 : quietHitsForRun(quietRun);
    const weekIndex = Math.floor((cursor - startSunday) / (7 * 86400000));
    const weekday = cursor.getUTCDay();

    slots.push({
      id: date,
      date,
      year,
      weekIndex,
      weekday,
      x: BRICK_MARGIN_X + weekIndex * (brickW + BRICK_GAP_X),
      y: BRICK_TOP + weekday * (BRICK_H + BRICK_GAP_Y),
      w: brickW,
      h: BRICK_H,
      count: contributionCount,
      level: source?.contributionLevel || 'NONE',
      kind: future ? 'future' : protectedDay ? 'protected' : 'quiet',
      maxHits,
      hitsLeft: maxHits,
      quietRun,
      alive: !future,
    });
  }
  return slots;
}

export function summarizeBoard(slots) {
  return slots.reduce((summary, slot) => {
    summary.total += 1;
    summary[slot.kind] += 1;
    if (slot.kind !== 'future') summary.elapsed += 1;
    if (slot.kind === 'protected') summary.contributions += slot.count;
    return summary;
  }, {total: 0, elapsed: 0, quiet: 0, protected: 0, future: 0, contributions: 0});
}

export function collisionRole(slot) {
  if (slot.kind === 'future') return 'none';
  if (slot.kind === 'protected') return 'sensor';
  return 'solid';
}

export function createGame(slots) {
  const bricks = slots.map(slot => ({...slot}));
  return {
    phase: 'serve',
    score: 0,
    lives: START_LIVES,
    combo: 0,
    speed: START_SPEED,
    bricks,
    quietLeft: bricks.filter(brick => brick.kind === 'quiet' && brick.alive).length,
  };
}

export function launch(state) {
  if (state.phase !== 'serve') return false;
  state.phase = 'play';
  return true;
}

export function hitBrick(state, id) {
  if (state.phase !== 'play') return null;
  const brick = state.bricks.find(candidate => candidate.id === id);
  if (!brick || !brick.alive || brick.kind === 'future') return null;

  if (brick.kind === 'protected') {
    state.combo = 0;
    return {type: 'protected', id, level: brick.level, count: brick.count};
  }

  brick.hitsLeft -= 1;
  state.combo += 1;
  const damagePoints = 10 * state.combo;
  state.score += damagePoints;

  if (brick.hitsLeft > 0) {
    return {
      type: 'damage',
      id,
      hitsLeft: brick.hitsLeft,
      maxHits: brick.maxHits,
      score: state.score,
      combo: state.combo,
      points: damagePoints,
    };
  }

  brick.alive = false;
  state.quietLeft -= 1;
  const breakBonus = 20 * brick.maxHits;
  state.score += breakBonus;
  state.speed = Math.min(MAX_SPEED, state.speed + SPEED_UP);
  const event = {
    type: 'shatter',
    id,
    maxHits: brick.maxHits,
    score: state.score,
    combo: state.combo,
    points: damagePoints + breakBonus,
    quietLeft: state.quietLeft,
  };
  if (state.quietLeft === 0) {
    state.phase = 'won';
    return {...event, won: true};
  }
  return event;
}

export function loseLife(state) {
  if (state.phase !== 'play') return null;
  state.lives -= 1;
  state.combo = 0;
  if (state.lives <= 0) {
    state.phase = 'over';
    return {type: 'over', lives: 0, score: state.score};
  }
  state.phase = 'serve';
  return {type: 'life', lives: state.lives, score: state.score};
}
