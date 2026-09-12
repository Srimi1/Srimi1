import {mkdir} from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:8000/';
const output = '/home/ubuntu/Srimi1/qa';
await mkdir(output, {recursive: true});

async function inspect(name, viewport) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}?qa=${name}`, {waitUntil: 'networkidle0'});
  await page.screenshot({path: `${output}/${name}.png`, fullPage: true});
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: innerWidth,
    projectCount: document.querySelectorAll('.project-card').length,
    protectedCount: document.querySelectorAll('.brick-cell.protected').length,
    quietCount: document.querySelectorAll('.brick-cell.quiet').length,
    futureCount: document.querySelectorAll('.brick-cell.future').length,
    logoAnimations: [...document.querySelectorAll('.logo-orbit')].map(element => getComputedStyle(element).animationName),
    status: document.querySelector('#status')?.textContent,
  }));

  if (name === 'desktop') {
    await page.click('#launch');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('KeyP');
    const paused = await page.$eval('#pause', element => element.textContent);
    await page.keyboard.press('KeyP');
    const resumed = await page.$eval('#pause', element => element.textContent);
    if (paused !== 'Resume' || resumed !== 'Pause') throw new Error(`keyboard pause cycle failed: ${paused}/${resumed}`);
    await new Promise(resolve => setTimeout(resolve, 700));
    await page.screenshot({path: `${output}/desktop-interaction.png`, fullPage: false});
  }

  await browser.close();
  return {name, layout, errors};
}

const results = [];
results.push(await inspect('desktop', {width: 1280, height: 720, deviceScaleFactor: 1}));
results.push(await inspect('mobile', {width: 390, height: 844, deviceScaleFactor: 1}));
for (const result of results) {
  if (result.errors.length) throw new Error(`${result.name} console errors: ${result.errors.join(' | ')}`);
  if (result.layout.projectCount !== 4) throw new Error(`${result.name} project count ${result.layout.projectCount}`);
  if (result.layout.protectedCount !== 60 || result.layout.quietCount !== 195 || result.layout.futureCount !== 110) throw new Error(`${result.name} board counts mismatch`);
  if (result.layout.logoAnimations.some(name => name !== 'logoOrbit')) throw new Error(`${result.name} logo animation missing`);
}
console.log(JSON.stringify(results, null, 2));
