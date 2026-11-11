import { CATEGORIES } from './categories.js';
import { Engine, ContenderRun } from './engine.js';
import { playTone, playStep, playFinish, playSequenceSweep, setMuted, valueToTone } from './audio.js?v=2';
import { SPEEDS, DEFAULT_SPEED } from './config.js';
import { defaultContenders, firstFrame } from './defaults.js';
import { getRevealPlan, animateReveal } from './reveal.js?v=2';
import { countSteps, progress, places, ordinal, gapToWinner, summary } from './standings.js';

const tabList = document.getElementById('category-tabs');
const categoryTitle = document.getElementById('category-title');
const categoryDescription = document.getElementById('category-description');
const difficultyLabel = document.getElementById('difficulty-label');
const difficultyRange = document.getElementById('difficulty-range');
const difficultyValue = document.getElementById('difficulty-value');
const speedOptions = document.getElementById('speed-options');
const chipGroup = document.getElementById('contender-chips');
const standingsList = document.getElementById('standings-list');
const legendList = document.getElementById('legend');
const arena = document.getElementById('arena');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');
const muteBtn = document.getElementById('mute-btn');
const statusEl = document.getElementById('status');

// One colour per contender, kept apart from the colours the canvases use for
// algorithm state (blue, amber, red, green), so a lane never looks like a state.
const LANE_COLORS = ['#6b8cff', '#b48cff', '#3fd0c0', '#f27fb2', '#d9c27a'];

const ICONS = {
  play: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>',
  soundOn: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.75h2.75L10 4.5v11l-3.75-3.25H3.5z"/><path d="M13 7.5a3.5 3.5 0 0 1 0 5M15.25 5.25a6.75 6.75 0 0 1 0 9.5"/></svg>',
  soundOff: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.75h2.75L10 4.5v11l-3.75-3.25H3.5z"/><path d="M13.25 7.75l4 4.5M17.25 7.75l-4 4.5"/></svg>',
};

const IDLE_STATUS = 'Every contender gets the same input. Fewest steps wins.';

let currentCategory = CATEGORIES[0];
let selected = new Set(); // ids of the algorithms in the race
let contenders = [];
let panels = new Map();
let rows = new Map();
let totals = new Map(); // steps each contender will need: its finish line
let engine = null;
let problem = null; // the next race's input, drawn in every panel before Run
let phase = 'idle'; // idle | running | paused | finished
let speed = DEFAULT_SPEED;
let isMuted = false;
const lastRunSteps = new Map();
const lastRunDone = new Map();

const formatSteps = (count) => `${count.toLocaleString('en-US')} ${count === 1 ? 'step' : 'steps'}`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setPhase(next) {
  phase = next;
  document.body.dataset.phase = next;
  const label = { idle: 'Run race', running: 'Pause', paused: 'Resume', finished: 'Race again' }[next];
  runBtn.innerHTML = `${next === 'running' ? ICONS.pause : ICONS.play}<span>${label}</span>`;
}

/** Any change to the setup ends the current race, so it can't keep drawing into the new panels. */
function stopRace() {
  if (engine) engine.pause();
  engine = null;
}

// ---------- Setup controls ----------

function buildTabs() {
  CATEGORIES.forEach((category) => {
    const tab = el('button', 'tab', category.tab || category.name);
    tab.type = 'button';
    tab.id = `tab-${category.id}`;
    tab.setAttribute('role', 'tab');
    tab.dataset.id = category.id;
    tab.addEventListener('click', () => selectCategory(category.id));
    tabList.appendChild(tab);
  });
  tabList.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const index = CATEGORIES.indexOf(currentCategory);
    const next = CATEGORIES[(index + step + CATEGORIES.length) % CATEGORIES.length];
    selectCategory(next.id);
    document.getElementById(`tab-${next.id}`).focus();
    event.preventDefault();
  });
}

function buildSpeedOptions() {
  SPEEDS.forEach((value) => {
    const label = el('label', 'segment');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'speed';
    input.value = value;
    input.checked = value === speed;
    input.addEventListener('change', () => {
      speed = value;
      if (engine) engine.setSpeed(speed);
    });
    label.appendChild(input);
    label.appendChild(el('span', '', `${value}×`));
    speedOptions.appendChild(label);
  });
}

function selectCategory(id) {
  stopRace();
  currentCategory = CATEGORIES.find((category) => category.id === id) || CATEGORIES[0];

  tabList.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.id === currentCategory.id;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && tabList.scrollWidth > tabList.clientWidth) {
      tabList.scrollTo({ left: tab.offsetLeft - tabList.offsetLeft - 16 });
    }
  });
  if (location.hash.slice(1) !== currentCategory.id) {
    history.replaceState(null, '', `#${currentCategory.id}`);
  }

  categoryTitle.textContent = currentCategory.name;
  categoryDescription.textContent = currentCategory.description;
  difficultyLabel.textContent = currentCategory.difficulty.label;
  difficultyRange.min = currentCategory.difficulty.min;
  difficultyRange.max = currentCategory.difficulty.max;
  difficultyRange.step = currentCategory.difficulty.step;
  difficultyRange.value = currentCategory.difficulty.default;
  difficultyValue.textContent = difficultyRange.value;
  paintRange();

  selected = new Set(defaultContenders(currentCategory).map((algorithm) => algorithm.id));
  problem = null;
  renderLegend();
  resetRace(IDLE_STATUS);
}

/** Rebuilds the lineup, scoreboard and panels for the current selection. */
function resetRace(status) {
  stopRace();
  contenders = currentCategory.algorithms
    .map((algorithm, index) => ({ uid: algorithm.id, algorithm, name: algorithm.name, color: LANE_COLORS[index % LANE_COLORS.length] }))
    .filter((contender) => selected.has(contender.uid));
  renderChips();
  renderStandings();
  renderArena();
  setPhase('idle');
  setStatus(status);
}

function renderChips() {
  chipGroup.innerHTML = '';
  currentCategory.algorithms.forEach((algorithm, index) => {
    const chip = el('button', 'chip');
    chip.type = 'button';
    chip.style.setProperty('--lane', LANE_COLORS[index % LANE_COLORS.length]);
    chip.setAttribute('aria-pressed', String(selected.has(algorithm.id)));
    chip.appendChild(el('span', 'dot'));
    chip.appendChild(el('span', '', algorithm.name));
    chip.addEventListener('click', () => {
      if (selected.has(algorithm.id)) {
        if (selected.size <= 2) {
          setStatus('A race needs at least two contenders. Add another before removing this one.');
          return;
        }
        selected.delete(algorithm.id);
      } else {
        selected.add(algorithm.id);
      }
      resetRace(IDLE_STATUS);
    });
    chipGroup.appendChild(chip);
  });
}

function renderLegend() {
  legendList.innerHTML = '';
  (currentCategory.legend || []).forEach(([swatch, label]) => {
    const item = el('li');
    const mark = el('span', 'swatch');
    if (['ring', 'dot', 'outline'].includes(swatch)) mark.classList.add(`swatch-${swatch}`);
    else mark.style.background = swatch;
    item.appendChild(mark);
    item.appendChild(document.createTextNode(label));
    legendList.appendChild(item);
  });
}

// The slider's filled portion is drawn with a gradient stop, which CSS can't
// derive from the input's value on its own.
function paintRange() {
  const { min, max, value } = difficultyRange;
  difficultyRange.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
}

// ---------- Scoreboard ----------

function renderStandings() {
  standingsList.innerHTML = '';
  rows = new Map();
  contenders.forEach((contender) => {
    const item = el('li', 'lane');
    item.style.setProperty('--lane', contender.color);
    const place = el('span', 'place');
    const name = el('span', 'name');
    name.appendChild(el('span', 'dot'));
    name.appendChild(el('span', '', contender.name));
    const track = el('span', 'track');
    const fill = el('span', 'fill');
    track.appendChild(fill);
    const steps = el('span', 'steps', formatSteps(0));
    const gap = el('span', 'gap');
    item.append(place, name, track, steps, gap);
    standingsList.appendChild(item);
    rows.set(contender.uid, { item, place, fill, steps, gap });
  });
}

function updateStandings(allRuns) {
  const finishedPlaces = places(allRuns);
  const firsts = [...finishedPlaces.values()].filter((place) => place === 1).length;
  const winnerSteps = Math.min(...allRuns.filter((run) => run.done).map((run) => run.finishedAtStep));
  allRuns.forEach((run) => {
    const row = rows.get(run.id);
    const panel = panels.get(run.id);
    if (!row || !panel) return;
    row.fill.style.transform = `scaleX(${progress(run.steps, totals.get(run.id))})`;
    row.steps.textContent = formatSteps(run.steps);
    panel.steps.textContent = formatSteps(run.steps);

    const place = finishedPlaces.get(run.id);
    if (!place) return;
    row.place.textContent = ordinal(place);
    panel.place.textContent = ordinal(place);
    row.gap.textContent = place === 1 ? (firsts > 1 ? 'Tied for first' : 'Winner') : gapToWinner(run, winnerSteps);
    row.item.classList.toggle('winner', place === 1);
    panel.panel.classList.toggle('winner', place === 1);
  });
}

// ---------- Race panels ----------

/** Matches the canvas's pixel grid to its size on screen, so drawings stay sharp at any width. */
function sizePanel(panel) {
  const width = panel.canvas.clientWidth;
  if (!width) return false;
  const height = Math.round((width * 2) / 3);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  panel.width = width;
  panel.height = height;
  panel.canvas.width = Math.round(width * ratio);
  panel.canvas.height = Math.round(height * ratio);
  panel.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return true;
}

/** Draws now, and remembers how, so the panel can repaint itself after a resize. */
function draw(panel, paint) {
  panel.redraw = paint;
  paint();
}

function renderArena() {
  arena.innerHTML = '';
  arena.dataset.count = contenders.length;
  panels = new Map();
  contenders.forEach((contender) => {
    const panel = el('article', 'panel');
    panel.style.setProperty('--lane', contender.color);

    const head = el('header', 'panel-head');
    const title = el('h3');
    title.appendChild(el('span', 'dot'));
    title.appendChild(el('span', '', contender.name));
    const place = el('span', 'place');
    const steps = el('span', 'steps', formatSteps(0));
    head.append(title, place, steps);

    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${contender.name} working on the ${currentCategory.name.toLowerCase()} problem`);

    panel.append(head, canvas);
    arena.appendChild(panel);

    const entry = { canvas, ctx: canvas.getContext('2d'), panel, place, steps, width: 0, height: 0, redraw: null };
    sizePanel(entry);
    panels.set(contender.uid, entry);
  });
  drawStartingFrames();
}

/** Draws each contender at its starting position, so the arena is never an empty box. */
function drawStartingFrames() {
  if (!problem) problem = currentCategory.createProblem(Number(difficultyRange.value));
  totals = new Map();
  contenders.forEach((contender) => {
    totals.set(contender.uid, countSteps(currentCategory, contender.algorithm, problem));
    const panel = panels.get(contender.uid);
    const frame = firstFrame(currentCategory, contender.algorithm, problem);
    if (panel && frame) draw(panel, () => currentCategory.render(panel.ctx, panel.width, panel.height, frame));
  });
}

new ResizeObserver(() => {
  panels.forEach((panel) => {
    if (panel.canvas.clientWidth === panel.width) return;
    if (sizePanel(panel) && panel.redraw && !panel.revealing) panel.redraw();
  });
}).observe(arena);

// ---------- Running a race ----------

function startRace() {
  stopRace();
  renderStandings();
  renderArena(); // draws the starting frames from `problem`, which this race then uses

  // On a phone the race sits below the controls; bring it into view.
  const board = standingsList.closest('.standings');
  if (board.getBoundingClientRect().top > innerHeight * 0.5) {
    const instant = matchMedia('(prefers-reduced-motion: reduce)').matches;
    board.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
  }
  const raceProblem = problem;
  problem = null; // the next race gets a fresh input
  const category = currentCategory;

  lastRunSteps.clear();
  lastRunDone.clear();

  const runs = contenders.map((contender) => {
    const generator = category.createRun(contender.algorithm, raceProblem);
    return new ContenderRun(contender.uid, contender.name, generator);
  });

  engine = new Engine({
    stepsPerTick: speed,
    onTick(allRuns) {
      allRuns.forEach((run) => {
        const panel = panels.get(run.id);
        if (!panel) return;
        if (!panel.revealing && !lastRunDone.get(run.id)) {
          const frame = run.frame;
          draw(panel, () => category.render(panel.ctx, panel.width, panel.height, frame));
        }

        if (run.steps !== lastRunSteps.get(run.id)) {
          lastRunSteps.set(run.id, run.steps);
          const touched = run.frame && (run.frame.compare || run.frame.swap);
          const index = touched && touched[0];
          const value = run.frame && run.frame.array && index != null ? run.frame.array[index] : undefined;
          if (typeof value === 'number') {
            playTone(valueToTone(value), 45);
          } else {
            playStep();
          }
        }

        if (run.done && !lastRunDone.get(run.id)) {
          const plan = getRevealPlan(category.id, run.frame);
          if (plan) {
            playSequenceSweep(plan.pitches);
            panel.redraw = () => plan.render(panel.ctx, panel.width, panel.height, plan.total);
            animateReveal(panel, plan);
          } else {
            playFinish();
          }
        }
        lastRunDone.set(run.id, run.done);
      });

      updateStandings(allRuns);
      const result = summary(allRuns);
      if (result) {
        setPhase('finished');
        setStatus(result);
      }
    },
  });
  engine.setRuns(runs);
  engine.start();
  setPhase('running');
  setStatus('Racing…');
}

runBtn.addEventListener('click', () => {
  if (phase === 'running') {
    engine.pause();
    setPhase('paused');
    setStatus('Paused.');
  } else if (phase === 'paused') {
    engine.start();
    setPhase('running');
    setStatus('Racing…');
  } else {
    startRace();
  }
});

resetBtn.addEventListener('click', () => {
  problem = null;
  resetRace(IDLE_STATUS);
});

difficultyRange.addEventListener('input', () => {
  difficultyValue.textContent = difficultyRange.value;
  paintRange();
});
difficultyRange.addEventListener('change', () => {
  problem = null;
  resetRace(IDLE_STATUS);
});

function paintMute() {
  muteBtn.innerHTML = isMuted ? ICONS.soundOff : ICONS.soundOn;
  muteBtn.setAttribute('aria-pressed', String(!isMuted));
  muteBtn.title = isMuted ? 'Sound is off' : 'Sound is on';
}
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  setMuted(isMuted);
  paintMute();
});

window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id !== currentCategory.id && CATEGORIES.some((category) => category.id === id)) selectCategory(id);
});

buildTabs();
buildSpeedOptions();
paintMute();
selectCategory(location.hash.slice(1));
// Canvas text is drawn in Inter; repaint once it has loaded.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => panels.forEach((panel) => panel.redraw && !panel.revealing && panel.redraw()));
}
