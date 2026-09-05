// Parse the signed-out calendar so authenticated owner access cannot expose private activity.
export function parsePublicCalendar(html) {
  const attr=(s,n)=>s.match(new RegExp(`\\b${n}="([^"]*)"`))?.[1];
  const tips=new Map([...html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)].map(m=>[attr(m[1],'for'),m[2].replace(/<[^>]*>/g,'').trim()]));
  const days=[];
  for(const m of html.matchAll(/<td\b([^>]*)>/g)){
    const date=attr(m[1],'data-date');if(!date)continue;
    const tip=tips.get(attr(m[1],'id')), count=tip?.match(/^(No|[\d,]+) contributions? on /)?.[1];
    const level=Number(attr(m[1],'data-level'));
    if(!count||!Number.isInteger(level)||level<0||level>4)throw new Error(`Unrecognized public calendar cell: ${date}`);
    days.push({date,contributionCount:count==='No'?0:Number(count.replaceAll(',','')),contributionLevel:['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'][level],weekday:new Date(date+'T12:00:00Z').getUTCDay()});
  }
  days.sort((a,b)=>a.date.localeCompare(b.date));
  if(days.length<350||days.length>371||new Set(days.map(d=>d.date)).size!==days.length)throw new Error('Unexpected public calendar date range');
  for(let i=1;i<days.length;i++)if(Date.parse(days[i].date)-Date.parse(days[i-1].date)!==86400000)throw new Error('Public calendar has a missing day');
  const weeks=[];for(const d of days){if(!weeks.length||d.weekday===0)weeks.push({contributionDays:[]});weeks.at(-1).contributionDays.push(d);}
  return {totalContributions:days.reduce((n,d)=>n+d.contributionCount,0),weeks,source:'https://github.com/users/Srimi1/contributions'};
}
