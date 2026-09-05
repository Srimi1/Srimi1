import {writeFile} from 'node:fs/promises';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('Set GH_TOKEN or GITHUB_TOKEN to refresh GitHub data.');
async function api(path, body) {
  const res = await fetch(`https://api.github.com/${path}`, {method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined});
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);
  const j = await res.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j;
}
const publicResponse = await fetch('https://github.com/users/Srimi1/contributions', {headers:{Accept:'text/html'}});
if (!publicResponse.ok) throw new Error(`Public calendar HTTP ${publicResponse.status}`);
const {parsePublicCalendar} = await import('./public-calendar.mjs');
const calendar = parsePublicCalendar(await publicResponse.text());
let repos = [];
for (let page=1; ;page++) {
  const batch = await api(`users/Srimi1/repos?type=owner&per_page=100&page=${page}`);
  repos.push(...batch.filter(r => !r.private).map(({name,html_url,description,language,fork,archived,stargazers_count,pushed_at}) => ({name,html_url,description,language,fork,archived,stargazers_count,pushed_at})));
  if(batch.length < 100) break;
}
if (!calendar.weeks.length || !repos.length) throw new Error('Refusing to replace snapshot with empty data');
await writeFile('docs/data/activity.json',JSON.stringify({...calendar,updatedAt:new Date().toISOString()},null,2)+'\n');
await writeFile('docs/data/repositories.json',JSON.stringify(repos,null,2)+'\n');
await import('./generate.mjs');
