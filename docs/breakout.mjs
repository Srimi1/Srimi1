import {summarize} from './game-core.mjs';
import {BOARD_W, BALL_R, START_SPEED, LEVEL_COLORS, buildBricks, createGame, serve, launch, movePaddle, step} from './breakout-core.mjs';
const $ = id => document.getElementById(id), ns = 'http://www.w3.org/2000/svg';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (tag, attrs = {}, content) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (content) e.textContent = content; return e; };
const KEY_SPEED = 560;
try {
  const response = await fetch('data/activity.json'); if (!response.ok) throw new Error('Calendar unavailable');
  const data = await response.json();
  if (!Array.isArray(data.weeks) || !data.weeks.length) throw new Error('Calendar is empty');
  const stats = summarize(data.weeks), days = data.weeks.flatMap(w => w.contributionDays), board = $('board');
  $('range').textContent = `${days[0].date} — ${days.at(-1).date}`;
  $('total').textContent = stats.total.toLocaleString(); $('best').textContent = stats.best + ' days'; $('current').textContent = stats.current + ' days';
  $('updated').textContent = `Snapshot: ${data.updatedAt.slice(0, 10)} · Refreshes daily from GitHub · ${stats.days} calendar days`;
  const table = document.createElement('table'), thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Date</th><th>Contributions</th></tr>'; table.append(thead);
  const tbody = document.createElement('tbody');
  for (const day of days) { const tr = document.createElement('tr'); for (const value of [day.date, day.contributionCount]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); } tbody.append(tr); }
  table.append(tbody); $('accessible-data').append(table);
  const freshBricks = () => buildBricks(data.weeks);
  if (!freshBricks().length) throw new Error('Calendar is empty');
  const brickEls = [];
  for (const b of freshBricks()) {
    const r = el('rect', {x: b.x, y: b.y, width: b.w, height: b.h, rx: 3, fill: LEVEL_COLORS[b.level] || LEVEL_COLORS.NONE, class: 'brick'});
    r.append(el('title', {}, `${b.date}: ${b.count} contributions · ${b.points} pts`));
    board.append(r); brickEls.push(r);
  }
  const paddleEl = el('rect', {rx: 7, class: 'paddle'}); board.append(paddleEl);
  const ballEl = el('circle', {r: BALL_R, class: 'ball'}); board.append(ballEl);
  let game = createGame(freshBricks());
  if (reduced) game.speed = Math.round(START_SPEED * 0.7);
  let best = Number(localStorage.getItem('breakout-best') || 0);
  let paused = false, last = 0;
  const keys = new Set();
  const status = t => $('status').textContent = t;
  const hud = () => {
    $('score').textContent = game.score; $('lives').textContent = game.lives;
    $('progress').textContent = `${game.bricksLeft} brick${game.bricksLeft === 1 ? '' : 's'} left · best ${Math.max(best, game.score)}`;
    $('meter-fill').style.width = `${(1 - game.bricksLeft / brickEls.length) * 100}%`;
  };
  const draw = () => {
    paddleEl.setAttribute('x', game.paddle.x - game.paddle.w / 2);
    paddleEl.setAttribute('y', game.paddle.y);
    paddleEl.setAttribute('width', game.paddle.w);
    paddleEl.setAttribute('height', game.paddle.h);
    ballEl.setAttribute('cx', game.ball.x); ballEl.setAttribute('cy', game.ball.y);
  };
  const syncButtons = () => {
    $('launch').disabled = game.phase !== 'serve' || paused;
    $('pause').disabled = game.phase !== 'play' && game.phase !== 'serve';
    $('pause').textContent = paused ? 'Resume' : 'Pause';
  };
  const first = game.bricks[0].date, lastDate = game.bricks.at(-1).date;
  $('board-desc').textContent = `${game.bricks.length} bricks from ${first} to ${lastDate}. Move the paddle to bounce the ball and clear every brick. Brighter bricks score more.`;
  function setPaused(on) {
    if (game.phase !== 'play' && game.phase !== 'serve') return;
    paused = on; syncButtons();
    status(paused ? 'Paused. Take a breath.' : game.phase === 'play' ? 'Back in play!' : 'Launch when ready.');
  }
  function newGame() {
    game = createGame(freshBricks());
    if (reduced) game.speed = Math.round(START_SPEED * 0.7);
    for (const r of brickEls) r.style.display = '';
    paused = false; hud(); draw(); syncButtons();
    status(`Wall ready: ${game.bricksLeft} bricks from ${first} to ${lastDate}. Launch the ball!`);
  }
  function doLaunch() {
    if (game.phase === 'over' || game.phase === 'won') newGame();
    if (launch(game, -Math.PI / 2 + (Math.random() * 0.6 - 0.3))) { status('Ball in play. Clear every brick!'); syncButtons(); }
  }
  function frame(t) {
    requestAnimationFrame(frame);
    if (!last) last = t;
    const dt = Math.min((t - last) / 1000, 1 / 30); last = t;
    if (!paused && (game.phase === 'play' || game.phase === 'serve')) {
      if (keys.has('left')) movePaddle(game, game.paddle.x - KEY_SPEED * dt);
      if (keys.has('right')) movePaddle(game, game.paddle.x + KEY_SPEED * dt);
    }
    if (!paused && game.phase === 'play') {
      const events = step(game, dt);
      for (const e of events) {
        if (e.type === 'brick') brickEls[e.index].style.display = 'none';
        else if (e.type === 'life') status(`Ball lost — ${e.lives} ${e.lives === 1 ? 'life' : 'lives'} left. Launch again!`);
        else if (e.type === 'win') { best = Math.max(best, e.score); try { localStorage.setItem('breakout-best', best); } catch {} status(`You cleared the calendar! Final score ${e.score}. Start a new game to play again.`); }
        else if (e.type === 'over') { best = Math.max(best, e.score); try { localStorage.setItem('breakout-best', best); } catch {} status(`Game over — final score ${e.score}. Start a new game to try again.`); }
      }
      if (events.length) { hud(); syncButtons(); }
    }
    draw();
  }
  board.addEventListener('pointermove', e => {
    const r = board.getBoundingClientRect();
    movePaddle(game, (e.clientX - r.left) / r.width * BOARD_W);
  });
  board.addEventListener('click', () => { if (!paused) doLaunch(); });
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    const inGame = tag && document.querySelector('.breakout').contains(document.activeElement);
    if (e.code === 'Space' && !['BUTTON', 'INPUT', 'TEXTAREA', 'SUMMARY', 'A'].includes(tag)) { e.preventDefault(); if (!paused) doLaunch(); }
    else if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
      keys.add(e.code === 'ArrowLeft' || e.code === 'KeyA' ? 'left' : 'right');
      if (inGame) e.preventDefault();
    }
    else if (e.code === 'KeyP' && inGame) setPaused(!paused);
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.delete('left');
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.delete('right');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
  $('launch').addEventListener('click', doLaunch);
  $('pause').addEventListener('click', () => setPaused(!paused));
  $('newgame').addEventListener('click', newGame);
  $('newgame').disabled = false;
  newGame();
  requestAnimationFrame(frame);
} catch (error) { $('status').textContent = 'The calendar could not load. Reload the page to try again.'; console.error(error); }
