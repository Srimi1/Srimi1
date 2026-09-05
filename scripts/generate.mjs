import {readFile,writeFile} from 'node:fs/promises';
import {cycleMarkup} from '../docs/runner.mjs';
import {quietRoute,summarize} from '../docs/game-core.mjs';
const read = p => readFile(p,'utf8').then(JSON.parse);
const data = await read('docs/data/activity.json');
const repos = await read('docs/data/repositories.json');
const s = summarize(data.weeks), route=quietRoute(data.weeks);
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const image = async p => 'data:image/png;base64,'+(await readFile(p)).toString('base64');
const avatar = await image('docs/assets/avatar.png'), runner = await image('docs/assets/run-cycle.png');
const start = (h,title,desc) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1100" height="${h}" viewBox="0 0 1100 ${h}" role="img"><title>${esc(title)}</title><desc>${esc(desc)}</desc><style>text{font-family:Arial,Helvetica,sans-serif;fill:#edf5ff}.muted{fill:#8eabc3}.mono{font-family:monospace;letter-spacing:2px}.still{display:none}.reveal{transform-box:fill-box;transform-origin:bottom;animation:grow 1.5s ease-out both}@keyframes grow{from{transform:scaleY(.05)}to{transform:scaleY(1)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}.moving{display:none}.still{display:inline}}</style><rect width="1100" height="${h}" rx="24" fill="#08121e"/>`;
const text=(x,y,t,size=16,cls='')=>`<text x="${x}" y="${y}" font-size="${size}" class="${cls}">${esc(t)}</text>`;
let hero=start(420,'Srijan Saanand — Build what you wish existed.','Developer and student in India. Native apps, useful tools, and agent experiments.');
hero+=`<defs><clipPath id="portrait"><rect x="720" y="24" width="356" height="372" rx="18"/></clipPath><linearGradient id="line"><stop stop-color="#08a9ff"/><stop offset="1" stop-color="#6edfff"/></linearGradient></defs><path d="M40 36H665" stroke="#203547"/><circle cx="49" cy="69" r="4" fill="#52e1bf"/>`;
hero+=text(65,74,'SRIJAN SAANAND / @SRIMI1',14,'mono')+text(40,150,'Build what you',52)+text(40,211,'wish existed.',52)+text(40,263,'Native apps. Useful tools. Agent experiments.',21,'muted')+text(40,300,'Developer & student · India',17,'muted');
hero+=`<rect x="40" y="337" width="626" height="3" rx="2" fill="url(#line)"/>`+text(40,375,'SWIFT   /   RUST   /   TYPESCRIPT   /   PYTHON   /   KOTLIN',12,'mono')+`<image x="720" y="24" width="356" height="372" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)" xlink:href="${avatar}"/></svg>`;
await writeFile('assets/hero-v2.svg',hero);
const colors={NONE:'#172b3c',FIRST_QUARTILE:'#125676',SECOND_QUARTILE:'#087fb3',THIRD_QUARTILE:'#08a9ee',FOURTH_QUARTILE:'#77e3ff'};
const pos=d=>[38+d.x*19.35,110+d.y*19.35];
let svg=start(390,'Quiet Days Quest — Srijan’s contribution calendar',`${s.total} contributions, ${s.active} contribution days and ${s.quiet} days with no recorded contributions. A mini avatar follows empty calendar cells. GitHub contributions do not measure all work.`);
svg+=text(36,40,'QUIET DAYS QUEST',16,'mono')+text(36,68,'Every square is part of the journey.',18,'muted')+text(790,42,`${data.weeks[0].contributionDays[0].date} →`,12,'muted')+text(790,64,data.weeks.at(-1).contributionDays.at(-1).date,12,'muted');
for(const [x,w] of data.weeks.entries()) for(const d of w.contributionDays) {
 const [px,py]=pos({...d,x,y:d.weekday});
 svg+=`<rect x="${px}" y="${py}" width="15" height="15" rx="3" fill="${colors[d.contributionLevel]||colors.NONE}"><title>${d.date}: ${d.contributionCount} contributions</title></rect>`;
}
if(route.length) {
 const pts=route.map(d=>{const [x,y]=pos(d);return `${x+7.5},${y+7.5}`});
 const path='M'+pts.join(' L');

 const [x,y]=pos(route[0]);
 svg+=`<defs><image id="run-sheet" width="1536" height="1024" xlink:href="${runner}"/></defs>`;
 svg+=`<g class="still" transform="translate(${x+7.5} ${y+7.5})">${cycleMarkup('run-sheet',false)}</g><g class="moving"><animateMotion dur="120s" repeatCount="indefinite" path="${path}" calcMode="paced"/><ellipse cy="5" rx="11" ry="3" fill="#08a9ff" opacity=".45"/>${cycleMarkup('run-sheet')}</g>`;
}
svg+=`<path d="M36 270H1064" stroke="#263c4f"/>`;
for(const [i,[v,l]] of [[s.total,'CONTRIBUTIONS'],[s.active,'ACTIVE DAYS'],[s.quiet,'QUIET DAYS'],[s.best,'BEST STREAK']].entries()) svg+=text(38+i*264,318,v,32)+text(38+i*264,344,l,11,'mono');
svg+=text(38,373,'Empty squares = no recorded GitHub contributions. Rest, study, and offline work still count.',12,'muted')+'</svg>';
await writeFile('assets/quest-v2.svg',svg);
const months={};for(const w of data.weeks)for(const d of w.contributionDays)months[d.date.slice(0,7)]=(months[d.date.slice(0,7)]||0)+d.contributionCount;
const langs={};for(const r of repos.filter(r=>!r.fork&&r.language))langs[r.language]=(langs[r.language]||0)+1;
const top=Object.entries(langs).sort((a,b)=>b[1]-a[1]).slice(0,5), entries=Object.entries(months), max=Math.max(1,...Object.values(months));
let chart=start(335,'Activity rhythm and languages','Monthly contribution counts and public original repositories grouped by primary language.');
chart+=text(36,40,'THE BUILD RHYTHM',15,'mono')+text(36,67,'Contributions per month',14,'muted')+text(700,40,'TOOLS OF THE TRADE',15,'mono')+text(700,67,'Public original repos · primary language',14,'muted');
for(const [i,[m,n]] of entries.entries()) {const x=38+i*46,h=140*n/max;chart+=`<rect class="reveal" x="${x}" y="${248-h}" width="28" height="${Math.max(2,h)}" rx="4" fill="#0caaf5" style="animation-delay:${i*.06}s"/>`+text(x,239-h,n,10,'muted')+text(x,274,m.slice(5),11,'muted');}
for(const [i,[l,n]] of top.entries()){const y=105+i*37;chart+=text(700,y,l,14)+text(1030,y,n,14,'muted')+`<rect x="800" y="${y-10}" width="${210*n/top[0][1]}" height="10" rx="5" fill="${['#09a9f4','#57c6f7','#90e0ff','#347cbb','#506a86'][i]}" class="reveal"/>`;}
chart+=text(38,313,`Snapshot ${data.updatedAt.slice(0,10)} · ${repos.length} public repositories · ${repos.filter(r=>!r.fork).length} originals · ${repos.filter(r=>r.fork).length} forks`,12,'muted')+'</svg>';
await writeFile('assets/rhythm.svg',chart);
console.log(`Generated profile: ${repos.length} public repos, ${s.days} days, ${route.length} quiet-day waypoints.`);

const demo=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-36 -74 72 88" role="img"><title>Srijan running — eight-frame stride cycle</title><style>.still{display:none}@media(prefers-reduced-motion:reduce){.moving{display:none}.still{display:inline}}</style><defs><image id="sheet" width="1536" height="1024" xlink:href="${runner}"/></defs><g class="moving">${cycleMarkup('sheet')}</g><g class="still">${cycleMarkup('sheet',false)}</g></svg>`;
await writeFile('docs/assets/run-demo.svg',demo);
