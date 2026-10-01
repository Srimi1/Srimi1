import {
  integrateBody,
  GRAVITY,
  JUMP_SPEED,
  RUN_SPEED,
} from "./kinematics.mjs";

export const STORY_VIEW = { width: 960, height: 480 };
export const STORY_STEP = 1 / 120;
export const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const smooth = (n) => {
  n = clamp(n);
  return n * n * (3 - 2 * n);
};
const dayMs = 86400000;

export function contributionWorld(
  snapshot,
  asOf = new Date().toISOString().slice(0, 10),
) {
  const end = Date.parse(asOf + "T12:00:00Z");
  if (
    !Number.isFinite(end) ||
    new Date(end).toISOString().slice(0, 10) !== asOf
  )
    throw new Error("Invalid calendar end date");
  const start = end - 29 * dayMs;
  const seen = new Set();
  const calendar = (snapshot.weeks || [])
    .flatMap((w) => w.contributionDays || [])
    .map((day) => {
      const stamp = Date.parse(day.date + "T12:00:00Z");
      if (
        !Number.isFinite(stamp) ||
        new Date(stamp).toISOString().slice(0, 10) !== day.date ||
        seen.has(day.date) ||
        !Number.isInteger(day.contributionCount) ||
        day.contributionCount < 0
      )
        throw new Error("Invalid contribution snapshot");
      seen.add(day.date);
      return { ...day, stamp };
    })
    .filter((d) => d.stamp <= end)
    .sort((a, b) => a.stamp - b.stamp);
  const days = calendar.filter((d) => d.stamp >= start);
  const active = days.filter((d) => d.contributionCount > 0);
  const levels = [
    "NONE",
    "FIRST_QUARTILE",
    "SECOND_QUARTILE",
    "THIRD_QUARTILE",
    "FOURTH_QUARTILE",
  ];
  const platforms = [{ id: "desk", x: 0, y: 394, w: 208, h: 50 }];
  let x = 284,
    priorDate;
  for (const day of active) {
    const level = levels.indexOf(day.contributionLevel);
    if (level < 1)
      throw new Error("Active day is missing contribution intensity");
    if (priorDate)
      x += Math.min(24, Math.max(0, (day.stamp - priorDate) / dayMs - 1) * 4);
    platforms.push({
      id: day.date,
      date: day.date,
      count: day.contributionCount,
      level,
      x,
      y: 425 - level * 8,
      w: 110,
      h: 23 + level * 8,
    });
    x += 165;
    priorDate = day.stamp;
  }
  const goal = { id: "finish", x: x + 8, y: 390, w: 430, h: 54 };
  platforms.push(goal);
  return {
    platforms,
    goal,
    width: goal.x + goal.w,
    calendar,
    days,
    active,
    windowStart: new Date(start).toISOString().slice(0, 10),
    windowEnd: asOf,
    total: active.reduce((sum, d) => sum + d.contributionCount, 0),
    annualTotal: calendar.reduce((sum, d) => sum + d.contributionCount, 0),
  };
}

function actor(id, x, world) {
  return {
    id,
    x,
    y: world.platforms[0].y - 69,
    w: 35,
    h: 69,
    vx: 0,
    vy: 0,
    grounded: true,
    platform: 0,
    wait: id === "srijan" ? 0.48 : 0,
    done: false,
    jumps: 0,
    visited: [],
    landings: [],
    distance: 0,
  };
}

function steer(p, world, time) {
  p.wait = Math.max(0, p.wait - STORY_STEP);
  const next =
    world.platforms[Math.min(p.platform + 1, world.platforms.length - 1)];
  const target =
    next.id === "finish"
      ? next.x +
        (p.platform < world.platforms.length - 1
          ? 55
          : p.id === "srijan"
            ? 152
            : 231)
      : next.x + next.w / 2;
  const dx = target - (p.x + p.w / 2);
  let axis = p.done ? 0 : clamp(dx / 48, -1, 1);
  if (p.grounded && p.wait > 0) axis = 0;
  if (
    !p.done &&
    p.grounded &&
    p.wait === 0 &&
    p.platform < world.platforms.length - 1 &&
    dx < 210
  ) {
    p.vy = -JUMP_SPEED;
    p.grounded = false;
    p.jumps++;
  }
  const wasGrounded = p.grounded;
  p.vx +=
    (axis * RUN_SPEED - p.vx) *
    Math.min(1, STORY_STEP * (p.grounded ? 19 : 11));
  p.vy = Math.min(860, p.vy + GRAVITY * STORY_STEP);
  const previousX = p.x;
  const landed = integrateBody(p, world.platforms, world.width, STORY_STEP);
  p.distance += Math.abs(p.x - previousX);
  if (
    landed &&
    (!wasGrounded || world.platforms.indexOf(landed) > p.platform)
  ) {
    const index = world.platforms.indexOf(landed);
    if (index > p.platform) {
      p.platform = index;
      p.wait = 0.09;
      p.landings.push({ time, x: p.x + p.w / 2, y: landed.y, id: landed.id });
      if (landed.date) p.visited.push(landed.date);
    }
  }
  if (
    p.platform === world.platforms.length - 1 &&
    p.grounded &&
    Math.abs(dx) < 3 &&
    Math.abs(p.vx) < 7
  )
    p.done = true;
  if (p.y > STORY_VIEW.height + 100)
    throw new Error(`Autopilot fell: ${p.id} after ${p.platform}`);
}

export function simulateDuet(world) {
  const actors = [actor("srijan", 64, world), actor("sarah", 109, world)];
  const frames = [],
    events = [];
  let camera = 0;
  for (let i = 0; i < 120 * 70; i++) {
    const time = i * STORY_STEP;
    for (const p of actors) {
      const before = p.landings.length;
      steer(p, world, time);
      if (p.landings.length > before)
        events.push({ ...p.landings.at(-1), actor: p.id });
    }
    const target = clamp(
      (actors[0].x + actors[1].x) / 2 - 300,
      0,
      Math.max(0, world.width - STORY_VIEW.width),
    );
    camera += (target - camera) * Math.min(1, STORY_STEP * 5);
    frames.push({
      time,
      camera,
      actors: actors.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
        vx: p.vx,
        vy: p.vy,
        grounded: p.grounded,
        platform: p.platform,
        distance: p.distance,
        done: p.done,
      })),
    });
    if (actors.every((p) => p.done))
      return { frames, events, actors, duration: (i + 1) * STORY_STEP };
  }
  throw new Error("Contribution autopilot did not finish within 70 seconds");
}

export function createStory(snapshot, asOf) {
  const world = contributionWorld(snapshot, asOf);
  const duet = world.active.length
    ? simulateDuet(world)
    : { frames: [], events: [], actors: [], duration: 0 };
  const timings = {
    coffee: 5.2,
    compile: 2.7,
    run: duet.duration,
    burst: 2.6,
    hug: 5.4,
    return: 2.2,
  };
  let end = 0;
  const chapters = Object.entries(timings).map(([name, duration]) => ({
    name,
    start: end,
    end: (end += duration),
    duration,
  }));
  return { world, duet, chapters, duration: end };
}

export function storyFrame(story, elapsed) {
  const time = ((elapsed % story.duration) + story.duration) % story.duration;
  const chapter = story.chapters.find((c) => time < c.end) || story.chapters[0];
  const localTime = time - chapter.start;
  const run =
    story.duet.frames[
      Math.min(
        story.duet.frames.length - 1,
        Math.max(0, Math.floor(localTime / STORY_STEP)),
      )
    ];
  return {
    chapter: chapter.name,
    time,
    localTime,
    progress: chapter.duration ? localTime / chapter.duration : 0,
    run: chapter.name === "run" ? run : story.duet.frames.at(-1),
  };
}
