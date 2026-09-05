import {quietRoute,advance,summarize} from './game-core.mjs';
const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const el=(tag,attrs={},content)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(content)e.textContent=content;return e;};
const colors={NONE:'#1c3042',FIRST_QUARTILE:'#145170',SECOND_QUARTILE:'#087eae',THIRD_QUARTILE:'#0ba9ed',FOURTH_QUARTILE:'#78e2ff'};
const coord=d=>({x:28+d.x*19.8+7.5,y:61+d.weekday*22+7.5});
try {
  const response=await fetch('data/activity.json');if(!response.ok)throw new Error('Calendar unavailable');
  const data=await response.json();
  if(!Array.isArray(data.weeks)||!data.weeks.length)throw new Error('Calendar is empty');
  const stats=summarize(data.weeks),route=quietRoute(data.weeks),days=data.weeks.flatMap(w=>w.contributionDays),board=$('board');
  $('range').textContent=`${days[0].date} — ${days.at(-1).date}`;
  $('board-desc').textContent=`${stats.active} active days, ${stats.quiet} quiet days. Roll dice to explore empty squares in a winding path.`;
  $('active-days').textContent=stats.active;$('quiet-days').textContent=stats.quiet;
  $('total').textContent=stats.total.toLocaleString();$('best').textContent=stats.best+' days';$('current').textContent=stats.current+' days';
  $('meter-fill').style.width=`${stats.active/stats.days*100}%`;
  $('updated').textContent=`Snapshot: ${data.updatedAt.slice(0,10)} · Refreshes daily from GitHub · ${stats.days} calendar days`;
  let lastMonth='';const cells=new Map();
  for(const [x,w] of data.weeks.entries()) {
    const first=w.contributionDays[0],month=first.date.slice(0,7);
    if(month!==lastMonth){board.append(el('text',{x:28+x*19.8,y:33},new Date(first.date+'T12:00:00Z').toLocaleDateString('en',{month:'short',timeZone:'UTC'})));lastMonth=month;}
    for(const d of w.contributionDays){const p=coord({...d,x});const c=el('rect',{x:p.x-7.5,y:p.y-7.5,width:15,height:15,rx:3,fill:colors[d.contributionLevel]||colors.NONE,class:'cell'});c.append(el('title',{},`${d.date}: ${d.contributionCount} contributions`));board.append(c);cells.set(d.date,c);}
  }
  const table=document.createElement('table'),thead=document.createElement('thead');thead.innerHTML='<tr><th>Date</th><th>Contributions</th></tr>';table.append(thead);const tbody=document.createElement('tbody');
  for(const day of days){const tr=document.createElement('tr');for(const value of [day.date,day.contributionCount]){const td=document.createElement('td');td.textContent=value;tr.append(td);}tbody.append(tr);}table.append(tbody);$('accessible-data').append(table);
  const path=route.map(d=>{const p=coord(d);return `${p.x},${p.y}`;}).join(' L');
  if(path)board.append(el('path',{d:'M'+path,class:'trail'}));
  const player=el('g',{class:'paused',id:'player'});player.append(el('ellipse',{rx:11,ry:4,cy:6,class:'runner-shadow'}));const sprite=el('image',{href:'assets/runner.png',x:-20,y:-48,width:40,height:60,class:'runner-body'});player.append(sprite);board.append(player);
  let position=0,visited=new Set(),busy=false,auto=false,timer=null,generation=0;
  const status=t=>$('status').textContent=t;
  const moveTo=p=>player.setAttribute('transform',`translate(${p.x} ${p.y})`);
  const mark=()=>{visited.add(route[position].date);cells.get(route[position].date).classList.add('visited');$('progress').textContent=`${visited.size} / ${route.length} quiet squares explored`;};
  const stop=()=>{auto=false;clearTimeout(timer);$('tour').textContent='Auto tour';};
  async function travel(a,b,version){
    if(reduced){moveTo(b);return;}
    await new Promise(resolve=>{let begin;function tick(time){if(version!==generation){resolve();return;}begin??=time;const t=Math.min(1,(time-begin)/130);moveTo({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
  }
  async function roll(){
    if(busy||position>=route.length-1)return;
    busy=true;$('roll').disabled=true;player.classList.remove('paused');
    const die=1+Math.floor(Math.random()*6),target=advance(position,die,route.length),version=generation;$('dice').textContent=String(die);
    while(position<target){await travel(coord(route[position]),coord(route[position+1]),version);if(version!==generation)return;position++;mark();}
    player.classList.add('paused');busy=false;
    if(position===route.length-1){stop();status(`Trail complete! All ${route.length} quiet squares explored. Every day belongs in the story.`);}
    else {status(`Rolled ${die} · ${route[position].date} · No recorded contributions. Keep exploring.`);$('roll').disabled=auto;}
    if(auto)timer=setTimeout(roll,reduced?450:300);
  }
  function reset(){generation++;stop();busy=false;position=0;visited=new Set();for(const c of cells.values())c.classList.remove('visited');player.classList.add('paused');$('dice').textContent='1';if(route.length){moveTo(coord(route[0]));mark();}else player.style.display='none';$('roll').disabled=route.length<2;$('tour').disabled=route.length<2;$('reset').disabled=false;status(route.length>1?`Start: ${route[0].date} · Roll to explore the quiet-day trail.`:route.length===1?'One quiet square. Your trail is already complete.':'No quiet days in this snapshot. Every calendar day has contributions!');if(!route.length)$('progress').textContent='No empty squares to explore';}
  $('roll').addEventListener('click',roll);$('reset').addEventListener('click',reset);
  $('tour').addEventListener('click',()=>{if(auto){stop();$('roll').disabled=busy||position===route.length-1;}else{if(position===route.length-1)reset();auto=true;$('tour').textContent='Pause tour';$('roll').disabled=true;if(!busy)roll();}});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['BUTTON','INPUT','TEXTAREA','SUMMARY','A'].includes(document.activeElement?.tagName)){e.preventDefault();if(!auto)roll();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(!busy)$('roll').disabled=position===route.length-1;}});
  reset();
} catch(error){$('status').textContent='The calendar could not load. Reload the page to try again.';console.error(error);}
