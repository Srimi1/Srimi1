import {summarize} from './game-core.mjs';
import {
  BOARD_W,
  BOARD_H,
  BALL_R,
  PADDLE_W,
  PADDLE_H,
  PADDLE_Y,
  START_SPEED,
  LEVEL_COLORS,
  buildYearBoard,
  summarizeBoard,
  collisionRole,
  createGame,
  launch,
  hitBrick,
  loseLife,
} from './breakout-core.mjs';

const $ = id => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let autoplay = !reducedMotion;
let autoplayPending = false;
const Matter = window.Matter;
if (!Matter) throw new Error('Matter.js failed to load');
const {Engine, Bodies, Body, Composite, Events} = Matter;

const svg = (tag, attributes = {}, content = '') => {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (content) element.textContent = content;
  return element;
};
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const dateText = value => new Intl.DateTimeFormat('en', {month: 'short', day: 'numeric'}).format(new Date(`${value}T00:00:00Z`));

let audioContext;
function sound(kind) {
  if (reducedMotion || !audioContext) return;
  const settings = {
    damage: [280, 0.035, 'triangle'],
    shatter: [520, 0.06, 'square'],
    protected: [760, 0.025, 'sine'],
    paddle: [210, 0.018, 'sine'],
    life: [110, 0.12, 'sawtooth'],
  }[kind];
  if (!settings) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = settings[2];
  oscillator.frequency.setValueAtTime(settings[0], audioContext.currentTime);
  gain.gain.setValueAtTime(0.035, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + settings[1]);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + settings[1]);
}
function unlockAudio() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
}

try {
  const response = await fetch('data/activity.json');
  if (!response.ok) throw new Error('Calendar unavailable');
  const data = await response.json();
  if (!Array.isArray(data.weeks) || !data.weeks.length) throw new Error('Calendar is empty');

  const stats = summarize(data.weeks);
  const days = data.weeks.flatMap(week => week.contributionDays);
  const snapshotDate = days.at(-1).date;
  const slots = buildYearBoard(data.weeks, {year: 2026, snapshotDate});
  const boardSummary = summarizeBoard(slots);
  const board = $('board');
  const boardScroll = document.querySelector('.board-scroll');
  const effectsLayer = svg('g', {id: 'effects', 'aria-hidden': 'true'});
  const cellsLayer = svg('g', {id: 'cells'});
  const trailLayer = svg('g', {id: 'trail', 'aria-hidden': 'true'});
  const actorsLayer = svg('g', {id: 'actors', 'aria-hidden': 'true'});
  const cellElements = new Map();
  const bodyById = new Map();
  const brickByBodyId = new Map();
  let engine;
  let game;
  let ballBody;
  let paddleBody;
  let paused = false;
  let best = Number(localStorage.getItem('breakout-best-v3') || 0);
  let statusTimer;
  const keys = new Set();
  let accumulator = 0;
  let lastFrame = performance.now();

  $('range').textContent = `2026 · through ${dateText(snapshotDate)}`;
  $('total').textContent = stats.total.toLocaleString();
  $('best').textContent = `${stats.best} days`;
  $('current').textContent = `${stats.current} days`;
  $('updated').textContent = `Snapshot: ${data.updatedAt.slice(0, 10)} · ${boardSummary.protected} contribution days · ${boardSummary.quiet} quiet days to clear`;
  $('protected-count').textContent = boardSummary.protected;
  $('quiet-count').textContent = boardSummary.quiet;

  const accessibleSummary = document.createElement('p');
  accessibleSummary.textContent = `The 2026 board contains ${boardSummary.total} dates: ${boardSummary.protected} protected contribution days, ${boardSummary.quiet} destructible quiet days through ${snapshotDate}, and ${boardSummary.future} future placeholders.`;
  $('accessible-data').append(accessibleSummary);
  const table = document.createElement('table');
  table.innerHTML = '<thead><tr><th>Date</th><th>Contributions</th><th>Game role</th></tr></thead>';
  const tbody = document.createElement('tbody');
  for (const slot of slots.filter(slot => slot.kind !== 'future')) {
    const row = document.createElement('tr');
    for (const value of [slot.date, slot.count, slot.kind === 'protected' ? 'Protected' : `${slot.maxHits} hit${slot.maxHits === 1 ? '' : 's'}`]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    tbody.append(row);
  }
  table.append(tbody);
  $('accessible-data').append(table);

  function renderCalendar() {
    board.replaceChildren();
    cellsLayer.replaceChildren();
    effectsLayer.replaceChildren();
    const months = new Map();
    for (const slot of slots) if (!months.has(slot.date.slice(0, 7))) months.set(slot.date.slice(0, 7), slot.x);
    const definitions = svg('defs');
    const paddleGradient = svg('linearGradient', {id: 'paddleGradient', x1: '0', y1: '0', x2: '1', y2: '0'});
    paddleGradient.append(
      svg('stop', {offset: '0%', 'stop-color': '#168fe4'}),
      svg('stop', {offset: '50%', 'stop-color': '#8be5ff'}),
      svg('stop', {offset: '100%', 'stop-color': '#61e6ca'}),
    );
    definitions.append(paddleGradient);
    const labels = svg('g', {class: 'calendar-labels'});
    for (const [month, x] of months) labels.append(svg('text', {x, y: 83}, new Intl.DateTimeFormat('en', {month: 'short'}).format(new Date(`${month}-01T00:00:00Z`))));
    for (const [weekday, label] of [[1, 'MON'], [3, 'WED'], [5, 'FRI']]) labels.append(svg('text', {x: 2, y: 118 + weekday * 29}, label));
    board.append(definitions, labels, cellsLayer, trailLayer, actorsLayer, effectsLayer);

    for (const slot of slots) {
      const group = svg('g', {class: `brick-cell ${slot.kind} integrity-${slot.maxHits}`, 'data-id': slot.id});
      const rect = svg('rect', {
        x: slot.x,
        y: slot.y,
        width: slot.w,
        height: slot.h,
        rx: 2.5,
        fill: slot.kind === 'future' ? LEVEL_COLORS.FUTURE : slot.kind === 'protected' ? LEVEL_COLORS[slot.level] : LEVEL_COLORS.NONE,
      });
      const crackOne = svg('path', {class: 'crack crack-one', d: `M${slot.x + slot.w * .2} ${slot.y + 2} L${slot.x + slot.w * .54} ${slot.y + slot.h * .46} L${slot.x + slot.w * .38} ${slot.y + slot.h - 2}`});
      const crackTwo = svg('path', {class: 'crack crack-two', d: `M${slot.x + slot.w - 2} ${slot.y + slot.h * .18} L${slot.x + slot.w * .54} ${slot.y + slot.h * .46} L${slot.x + 2} ${slot.y + slot.h * .72}`});
      const title = svg('title', {}, slot.kind === 'future'
        ? `${slot.date}: future date`
        : slot.kind === 'protected'
          ? `${slot.date}: ${slot.count} contributions · protected`
          : `${slot.date}: quiet day · ${slot.maxHits} hit${slot.maxHits === 1 ? '' : 's'} to clear`);
      group.append(rect, crackOne, crackTwo, title);
      cellsLayer.append(group);
      cellElements.set(slot.id, group);
    }
  }

  const trail = Array.from({length: reducedMotion ? 0 : 6}, (_, index) => {
    const dot = svg('circle', {r: Math.max(1.8, BALL_R - (index + 1) * 1.05), class: 'trail-dot'});
    trailLayer.append(dot);
    return dot;
  });
  let trailPoints = [];
  const paddleElement = svg('rect', {rx: 7.5, class: 'paddle'});
  const ballElement = svg('circle', {r: BALL_R, class: 'ball'});
  actorsLayer.append(paddleElement, ballElement);

  function createBrickBody(brick) {
    const role = collisionRole(brick);
    const body = Bodies.rectangle(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.w, brick.h, {
      isStatic: true,
      isSensor: role === 'sensor',
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
      label: `brick:${brick.id}`,
    });
    bodyById.set(brick.id, body);
    brickByBodyId.set(body.id, brick.id);
    return body;
  }

  function setBallSpeed() {
    if (!ballBody || game.phase !== 'play') return;
    let {x, y} = ballBody.velocity;
    if (Math.abs(y) < 2.2) y = (y >= 0 ? 1 : -1) * 2.2;
    const current = Math.hypot(x, y) || 1;
    Body.setVelocity(ballBody, {x: x / current * game.speed, y: y / current * game.speed});
    Body.setAngularVelocity(ballBody, 0);
  }

  function serveBall() {
    Body.setPosition(ballBody, {x: paddleBody.position.x, y: PADDLE_Y - BALL_R - PADDLE_H / 2 - 1});
    Body.setVelocity(ballBody, {x: 0, y: 0});
    Body.setAngularVelocity(ballBody, 0);
    trailPoints = [];
  }

  function spawnImpact(x, y, color, shatter = false) {
    if (reducedMotion) return;
    const ring = svg('circle', {cx: x, cy: y, r: 4, class: 'impact-ring', stroke: color});
    effectsLayer.append(ring);
    ring.animate([{r: 4, opacity: .9}, {r: 20, opacity: 0}], {duration: 360, easing: 'ease-out'}).finished.finally(() => ring.remove());
    if (!shatter) return;
    for (let index = 0; index < 7; index += 1) {
      const angle = index / 7 * Math.PI * 2;
      const distance = 18 + (index % 3) * 6;
      const shard = svg('path', {d: `M${x - 3} ${y - 2} L${x + 4} ${y} L${x - 1} ${y + 5} Z`, fill: color, class: 'shard'});
      effectsLayer.append(shard);
      shard.animate([
        {transform: 'translate(0 0) rotate(0deg)', opacity: 1},
        {transform: `translate(${Math.cos(angle) * distance}px ${Math.sin(angle) * distance + 13}px) rotate(${90 + index * 38}deg)`, opacity: 0},
      ], {duration: 520, easing: 'cubic-bezier(.2,.75,.3,1)'}).finished.finally(() => shard.remove());
    }
  }

  function flashStatus(message) {
    clearTimeout(statusTimer);
    $('status').textContent = message;
    statusTimer = setTimeout(() => {
      if (game.phase !== 'play') return;
      $('status').textContent = autoplay
        ? 'Autoplaying — the paddle is tracking the ball. Move the mouse or press an arrow key to take over.'
        : 'Clear every quiet day. Contribution days hold the line.';
    }, 2200);
  }

  function scheduleAutoplay(action, delay) {
    if (autoplayPending) return;
    autoplayPending = true;
    setTimeout(() => {
      autoplayPending = false;
      if (autoplay && !paused) action();
    }, delay);
  }

  function takeControl() {
    if (!autoplay) return;
    autoplay = false;
    autoplayPending = false;
    flashStatus('You have the paddle now. Autoplay is off — reload the page to watch it play itself again.');
  }

  function saveBest() {
    best = Math.max(best, game.score);
    try { localStorage.setItem('breakout-best-v3', best); } catch {}
  }

  function updateHud() {
    $('score').textContent = game.score.toLocaleString();
    $('lives').textContent = game.lives;
    $('combo').textContent = `×${Math.max(1, game.combo)}`;
    $('progress').textContent = `${game.quietLeft} quiet blocks left · best ${Math.max(best, game.score).toLocaleString()}`;
    $('meter-fill').style.width = `${(1 - game.quietLeft / boardSummary.quiet) * 100}%`;
    $('launch').disabled = game.phase !== 'serve' || paused;
    $('pause').disabled = !['serve', 'play'].includes(game.phase);
    $('pause').textContent = paused ? 'Resume' : 'Pause';
  }

  function handleBrickHit(id) {
    const brick = game.bricks.find(candidate => candidate.id === id);
    if (!brick) return;
    const event = hitBrick(game, id);
    if (!event) return;
    const element = cellElements.get(id);
    const x = brick.x + brick.w / 2;
    const y = brick.y + brick.h / 2;

    if (event.type === 'protected') {
      element.classList.remove('protected-hit');
      void element.getBBox();
      element.classList.add('protected-hit');
      setTimeout(() => element.classList.remove('protected-hit'), 320);
      spawnImpact(x, y, LEVEL_COLORS[brick.level]);
      sound('protected');
      flashStatus(`${dateText(id)} is protected by ${brick.count} contribution${brick.count === 1 ? '' : 's'}.`);
      return;
    }

    if (event.type === 'damage') {
      const damage = event.maxHits - event.hitsLeft;
      element.classList.add(`damage-${damage}`);
      spawnImpact(x, y, '#55c7ff');
      sound('damage');
      flashStatus(`${dateText(id)} cracked · ${event.hitsLeft} hit${event.hitsLeft === 1 ? '' : 's'} left.`);
    } else if (event.type === 'shatter') {
      element.classList.add('shattering');
      spawnImpact(x, y, '#8bdcff', true);
      sound('shatter');
      const body = bodyById.get(id);
      if (body) Composite.remove(engine.world, body);
      bodyById.delete(id);
      setTimeout(() => element.remove(), reducedMotion ? 0 : 240);
      flashStatus(`${dateText(id)} cleared · +${event.points} · combo ×${event.combo}.`);
      if (event.won) {
        saveBest();
        flashStatus(`Year cleared. ${boardSummary.protected} contribution days still stand. Final score ${event.score.toLocaleString()}.`);
      }
    }
    updateHud();
  }

  function installCollisions() {
    Events.on(engine, 'collisionStart', event => {
      for (const pair of event.pairs) {
        const bodies = [pair.bodyA, pair.bodyB];
        if (!bodies.includes(ballBody)) continue;
        const other = bodies[0] === ballBody ? bodies[1] : bodies[0];
        const brickId = brickByBodyId.get(other.id);
        if (brickId) handleBrickHit(brickId);
        else if (other.label === 'paddle' && ballBody.velocity.y > 0) {
          const offset = clamp((ballBody.position.x - paddleBody.position.x) / (PADDLE_W / 2), -1, 1);
          const angle = offset * 1.02;
          Body.setPosition(ballBody, {x: ballBody.position.x, y: PADDLE_Y - BALL_R - PADDLE_H / 2 - 1});
          Body.setVelocity(ballBody, {x: game.speed * Math.sin(angle), y: -Math.abs(game.speed * Math.cos(angle))});
          game.combo = 0;
          sound('paddle');
          updateHud();
        } else if (other.label === 'loss') {
          const result = loseLife(game);
          if (!result) continue;
          sound('life');
          if (result.type === 'over') {
            saveBest();
            flashStatus(`Game over · ${result.score.toLocaleString()} points. Reset and try another line.`);
          } else {
            serveBall();
            flashStatus(`Ball lost · ${result.lives} ${result.lives === 1 ? 'life' : 'lives'} left. Launch when ready.`);
          }
          updateHud();
        }
      }
    });
  }

  function buildPhysics() {
    if (engine) {
      Events.off(engine);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
    }
    engine = Engine.create({gravity: {x: 0, y: 0}, enableSleeping: false});
    const wallOptions = {isStatic: true, restitution: 1, friction: 0, frictionStatic: 0};
    const walls = [
      Bodies.rectangle(-12, BOARD_H / 2, 24, BOARD_H * 2, {...wallOptions, label: 'wall-left'}),
      Bodies.rectangle(BOARD_W + 12, BOARD_H / 2, 24, BOARD_H * 2, {...wallOptions, label: 'wall-right'}),
      Bodies.rectangle(BOARD_W / 2, -12, BOARD_W * 2, 24, {...wallOptions, label: 'wall-top'}),
    ];
    const loss = Bodies.rectangle(BOARD_W / 2, BOARD_H + 36, BOARD_W * 2, 30, {isStatic: true, isSensor: true, label: 'loss'});
    paddleBody = Bodies.rectangle(BOARD_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H, {...wallOptions, label: 'paddle', chamfer: {radius: 7}});
    ballBody = Bodies.circle(BOARD_W / 2, PADDLE_Y - BALL_R - PADDLE_H / 2 - 1, BALL_R, {
      restitution: 1,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      inertia: Infinity,
      label: 'ball',
    });
    bodyById.clear();
    brickByBodyId.clear();
    const bricks = game.bricks.filter(brick => brick.kind !== 'future' && brick.alive).map(createBrickBody);
    Composite.add(engine.world, [...walls, loss, paddleBody, ballBody, ...bricks]);
    installCollisions();
    serveBall();
  }

  function movePaddle(x) {
    const next = clamp(x, PADDLE_W / 2, BOARD_W - PADDLE_W / 2);
    Body.setPosition(paddleBody, {x: next, y: PADDLE_Y});
    if (game.phase === 'serve') serveBall();
  }

  function startBall() {
    if (paused) return;
    unlockAudio();
    if (['over', 'won'].includes(game.phase)) newGame();
    if (!launch(game)) return;
    const offset = Math.random() * .7 - .35;
    Body.setVelocity(ballBody, {x: game.speed * Math.sin(offset), y: -Math.abs(game.speed * Math.cos(offset))});
    flashStatus('Ball in play. Clear quiet days; contribution days are permanent bumpers.');
    updateHud();
  }

  function setPaused(next) {
    if (!['serve', 'play'].includes(game.phase)) return;
    paused = next;
    flashStatus(paused ? 'Paused. The year will wait.' : game.phase === 'play' ? 'Back in play.' : 'Launch when ready.');
    updateHud();
  }

  function newGame() {
    game = createGame(slots);
    if (reducedMotion) game.speed = START_SPEED * .82;
    paused = false;
    renderCalendar();
    buildPhysics();
    updateHud();
    flashStatus(autoplay
      ? `${boardSummary.quiet} quiet blocks are breakable. Autoplaying now — move the paddle any time to take over.`
      : `${boardSummary.quiet} quiet blocks are breakable. ${boardSummary.protected} contribution days will hold.`);
  }

  function draw() {
    paddleElement.setAttribute('x', paddleBody.position.x - PADDLE_W / 2);
    paddleElement.setAttribute('y', PADDLE_Y - PADDLE_H / 2);
    paddleElement.setAttribute('width', PADDLE_W);
    paddleElement.setAttribute('height', PADDLE_H);
    ballElement.setAttribute('cx', ballBody.position.x);
    ballElement.setAttribute('cy', ballBody.position.y);
    if (game.phase === 'play' && trail.length) {
      trailPoints.unshift({x: ballBody.position.x, y: ballBody.position.y});
      trailPoints = trailPoints.slice(0, trail.length + 1);
      trail.forEach((dot, index) => {
        const point = trailPoints[index + 1] || trailPoints.at(-1) || ballBody.position;
        dot.setAttribute('cx', point.x);
        dot.setAttribute('cy', point.y);
        dot.style.opacity = String((trail.length - index) / trail.length * .28);
      });
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = Math.min(50, now - lastFrame);
    lastFrame = now;
    if (!paused && game.phase === 'play') {
      accumulator += delta;
      while (accumulator >= 1000 / 120) {
        Engine.update(engine, 1000 / 120);
        setBallSpeed();
        accumulator -= 1000 / 120;
      }
      if (autoplay) movePaddle(ballBody.position.x);
    } else if (!paused && game.phase === 'serve') {
      if (autoplay) {
        movePaddle(BOARD_W / 2);
        scheduleAutoplay(startBall, 850);
      }
      serveBall();
    } else if (!paused && autoplay && ['over', 'won'].includes(game.phase)) {
      scheduleAutoplay(newGame, 2600);
    }
    if (!paused) {
      const keyboardSpeed = 9.5;
      if (keys.has('left')) movePaddle(paddleBody.position.x - keyboardSpeed);
      if (keys.has('right')) movePaddle(paddleBody.position.x + keyboardSpeed);
    }
    draw();
  }

  board.addEventListener('pointermove', event => {
    if (autoplay) return;
    const bounds = board.getBoundingClientRect();
    movePaddle((event.clientX - bounds.left) / bounds.width * BOARD_W);
  });
  board.addEventListener('pointerdown', () => { takeControl(); startBall(); });
  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName;
    const interactive = ['BUTTON', 'INPUT', 'TEXTAREA', 'SUMMARY', 'A'].includes(tag);
    if (event.code === 'Space' && !interactive) {
      event.preventDefault();
      takeControl();
      startBall();
    } else if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
      takeControl();
      keys.add(event.code === 'ArrowLeft' || event.code === 'KeyA' ? 'left' : 'right');
      if (document.querySelector('.breakout').contains(document.activeElement)) event.preventDefault();
    } else if (event.code === 'KeyP' && !interactive) {
      takeControl();
      setPaused(!paused);
    }
  });
  document.addEventListener('keyup', event => {
    if (['ArrowLeft', 'KeyA'].includes(event.code)) keys.delete('left');
    if (['ArrowRight', 'KeyD'].includes(event.code)) keys.delete('right');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
  boardScroll.addEventListener('focus', () => flashStatus('Game focused. Use left and right arrows to move; Space launches; P pauses.'));
  $('launch').addEventListener('click', () => { takeControl(); startBall(); });
  $('pause').addEventListener('click', () => { takeControl(); setPaused(!paused); });
  $('newgame').addEventListener('click', () => { takeControl(); unlockAudio(); newGame(); });

  $('board-desc').textContent = `Break the Quiet Days is a 2026 Breakout board. ${boardSummary.quiet} quiet days can be cleared in one to three hits. ${boardSummary.protected} days with recorded contributions are indestructible blue bumpers. ${boardSummary.future} future dates are outlines.`;
  newGame();
  requestAnimationFrame(frame);
} catch (error) {
  $('status').textContent = 'The calendar could not load. Reload the page to try again.';
  console.error(error);
}
