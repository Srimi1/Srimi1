export function summarize(weeks) {
  const days = weeks.flatMap((w) => w.contributionDays);
  let best = 0,
    streak = 0;
  for (const d of days) {
    streak = d.contributionCount ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  // Today can be unfinished: yesterday's streak remains current until today closes.
  let end = days.length - 1;
  if (end >= 0 && !days[end].contributionCount) end--;
  let current = 0;
  for (let i = end; i >= 0 && days[i].contributionCount; i--) current++;
  return {
    days: days.length,
    active: days.filter((d) => d.contributionCount > 0).length,
    quiet: days.filter((d) => d.contributionCount === 0).length,
    total: days.reduce((s, d) => s + d.contributionCount, 0),
    best,
    current,
  };
}
