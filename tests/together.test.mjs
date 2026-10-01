import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createStory,
  contributionWorld,
  storyFrame,
} from "../docs/together-core.mjs";

const levels = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
];
function calendar(start, counts) {
  return {
    weeks: [
      {
        contributionDays: counts.map((count, i) => ({
          date: new Date(Date.parse(start + "T12:00:00Z") + i * 86400000)
            .toISOString()
            .slice(0, 10),
          contributionCount: count,
          contributionLevel: levels[count ? Math.min(4, count) : 0],
        })),
      },
    ],
  };
}
function verifyCompletion(story) {
  for (const actor of story.duet.actors) {
    assert.equal(actor.done, true, `${actor.id} did not arrive`);
    assert.deepEqual(
      actor.visited,
      story.world.active.map((d) => d.date),
    );
    assert.ok(
      actor.jumps >= story.world.active.length,
      `${actor.id} did not jump through the route`,
    );
    assert.ok(
      actor.x > story.world.goal.x &&
        actor.x + actor.w < story.world.goal.x + story.world.goal.w,
    );
  }
  assert.equal(story.duet.actors.length, 2);
  assert.notEqual(story.duet.actors[0].x, story.duet.actors[1].x);
  assert.ok(
    story.duet.frames.some(
      (f) => f.actors[0].grounded !== f.actors[1].grounded,
    ),
    "Characters must have independent jump state",
  );
}
test("current public calendar completes with every worked day visited by both characters", async () => {
  const snapshot = JSON.parse(
    await readFile(new URL("../docs/data/activity.json", import.meta.url)),
  );
  const story = createStory(snapshot, snapshot.updatedAt.slice(0, 10));
  verifyCompletion(story);
  assert.ok(story.duration < 70);
});
test("dense alternating platform heights complete using actual landing physics", () => {
  const s = createStory(
    calendar(
      "2026-09-02",
      Array.from({ length: 30 }, (_, i) => [1, 4, 2, 3][i % 4]),
    ),
    "2026-10-01",
  );
  assert.equal(s.world.active.length, 30);
  verifyCompletion(s);
});
test("long quiet gaps remain reachable and do not invent contribution days", () => {
  const counts = Array(30).fill(0);
  counts[0] = 4;
  counts[29] = 1;
  const s = createStory(calendar("2026-09-02", counts), "2026-10-01");
  assert.deepEqual(
    s.world.platforms.filter((p) => p.date).map((p) => p.date),
    ["2026-09-02", "2026-10-01"],
  );
  verifyCompletion(s);
});
test("calendar window excludes older and future days while preserving exact counts", () => {
  const w = contributionWorld(
    calendar("2026-09-01", Array(32).fill(3)),
    "2026-10-01",
  );
  assert.equal(w.active.length, 30);
  assert.equal(w.active[0].date, "2026-09-02");
  assert.equal(w.active.at(-1).date, "2026-10-01");
  assert.equal(w.total, 90);
  assert.equal(
    w.platforms.filter((p) => p.date).reduce((sum, p) => sum + p.count, 0),
    w.total,
  );
});
test("empty activity keeps an honest coffee story without fake workday platforms", () => {
  const s = createStory(
    calendar("2026-09-02", Array(30).fill(0)),
    "2026-10-01",
  );
  assert.equal(s.world.active.length, 0);
  assert.equal(s.duet.frames.length, 0);
  assert.equal(s.world.platforms.filter((p) => p.date).length, 0);
  assert.ok(s.chapters.some((c) => c.name === "hug"));
});
test("invalid or duplicated source data fails before rendering", () => {
  const duplicate = calendar("2026-09-02", [1]);
  duplicate.weeks[0].contributionDays.push({
    ...duplicate.weeks[0].contributionDays[0],
  });
  assert.throws(
    () => createStory(duplicate, "2026-10-01"),
    /Invalid contribution snapshot/,
  );
  assert.throws(
    () => contributionWorld(calendar("2026-09-02", [-1]), "2026-10-01"),
    /Invalid contribution snapshot/,
  );
  assert.throws(
    () => contributionWorld(calendar("2026-09-02", [1]), "2026-02-30"),
    /Invalid calendar end date/,
  );
});
test("leap-day route and exact loop wrap keep the story deterministic", () => {
  const snapshot = calendar("2024-02-20", [1, 0, 4, 2, 0, 3, 4, 1, 0, 3, 2]);
  const a = createStory(snapshot, "2024-03-01"),
    b = createStory(snapshot, "2024-03-01");
  verifyCompletion(a);
  assert.deepEqual(a.duet.frames, b.duet.frames);
  assert.deepEqual(storyFrame(a, 0), storyFrame(a, a.duration));
  assert.equal(a.world.active.at(-2).date, "2024-02-29");
});
