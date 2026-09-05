export function routeDays(weeks) {
  return weeks.flatMap((week, x) => {
    const ds = week.contributionDays.map(d => ({...d, x, y:d.weekday}));
    return x % 2 ? ds.reverse() : ds;
  });
}
export function quietRoute(weeks) { return routeDays(weeks).filter(d => d.contributionCount === 0); }
export function advance(position, roll, length) {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) throw new Error('Roll must be 1–6');
  return Math.min(Math.max(0, length - 1), position + roll);
}
export function summarize(weeks) {
  const days = weeks.flatMap(w => w.contributionDays);
  let best = 0, streak = 0;
  for (const d of days) { streak = d.contributionCount ? streak + 1 : 0; best = Math.max(best, streak); }
  // Today can be unfinished: yesterday's streak remains current until today closes.
  let end = days.length - 1;
  if (end >= 0 && !days[end].contributionCount) end--;
  let current = 0;
  for (let i = end; i >= 0 && days[i].contributionCount; i--) current++;
  return {days:days.length, active:days.filter(d => d.contributionCount > 0).length,
    quiet:days.filter(d => d.contributionCount === 0).length,
    total:days.reduce((s,d) => s+d.contributionCount,0), best, current};
}
