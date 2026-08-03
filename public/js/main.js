import { CATEGORIES } from './categories.js';
import { Engine, ContenderRun } from './engine.js';
import { playTone, playStep, playFinish, playSequenceSweep, setMuted, valueToTone, positionToTone } from './audio.js';
import { DEFAULT_STEP_DELAY_MS } from './config.js';
import {
  renderReveal,
  renderGraphReveal,
  renderTreeReveal,
  renderMazeReveal,
  renderDpReveal,
  renderStringReveal,
} from './render.js';

const categorySelect = document.getElementById('category-select');
const categoryDescription = document.getElementById('category-description');
const difficultyLabel = document.getElementById('difficulty-label');
const difficultyRange = document.getElementById('difficulty-range');
const difficultyValue = document.getElementById('difficulty-value');
const algorithmSelect = document.getElementById('algorithm-select');
const addContenderBtn = document.getElementById('add-contender');
const contenderList = document.getElementById('contender-list');
const arena = document.getElementById('arena');
const runBtn = document.getElementById('run-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const muteBtn = document.getElementById('mute-btn');
const statusEl = document.getElementById('status');

let currentCategory = CATEGORIES[0];
let contenders = [];
let panels = new Map();
let engine = null;
let uidCounter = 0;
let isMuted = false;
const lastRunSteps = new Map();
const lastRunDone = new Map();

function populateCategories() {
  categorySelect.innerHTML = '';
  CATEGORIES.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

function removeAlgorithmOption(algorithmId) {
  const option = algorithmSelect.querySelector(`option[value="${algorithmId}"]`);
  if (option) option.remove();
}

function addAlgorithmOption(algorithm) {
  const targetIndex = currentCategory.algorithms.findIndex((a) => a.id === algorithm.id);
  const nextOption = Array.from(algorithmSelect.options).find((opt) => {
    const idx = currentCategory.algorithms.findIndex((a) => a.id === opt.value);
    return idx > targetIndex;
  });
  const option = document.createElement('option');
  option.value = algorithm.id;
  option.textContent = algorithm.name;
  algorithmSelect.insertBefore(option, nextOption || null);
}

function selectCategory(id) {
  currentCategory = CATEGORIES.find((category) => category.id === id) || CATEGORIES[0];
  categoryDescription.textContent = currentCategory.description;
  difficultyLabel.textContent = currentCategory.difficulty.label;
  difficultyRange.min = currentCategory.difficulty.min;
  difficultyRange.max = currentCategory.difficulty.max;
  difficultyRange.step = currentCategory.difficulty.step;
  difficultyRange.value = currentCategory.difficulty.default;
  difficultyValue.textContent = difficultyRange.value;

  algorithmSelect.innerHTML = '';
  currentCategory.algorithms.forEach((algorithm) => {
    if (contenders.some((contender) => contender.algorithm.id === algorithm.id)) return;
    const option = document.createElement('option');
    option.value = algorithm.id;
    option.textContent = algorithm.name;
    algorithmSelect.appendChild(option);
  });

  contenders = [];
  renderContenderList();
  renderArena();
  setStatus('Add at least two contenders, then press Run.');
}

function renderContenderList() {
  contenderList.innerHTML = '';
  contenders.forEach((contender, index) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = contender.name;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.className = 'remove-btn';
    removeButton.addEventListener('click', () => {
      contenders.splice(index, 1);
      addAlgorithmOption(contender.algorithm);
      renderContenderList();
      renderArena();
    });
    item.appendChild(label);
    item.appendChild(removeButton);
    contenderList.appendChild(item);
  });
}

function renderArena() {
  arena.innerHTML = '';
  panels = new Map();
  contenders.forEach((contender) => {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const title = document.createElement('h3');
    title.textContent = contender.name;

    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 240;

    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = 'Steps: 0';

    panel.appendChild(title);
    panel.appendChild(canvas);
    panel.appendChild(meta);
    arena.appendChild(panel);

    panels.set(contender.uid, { canvas, ctx: canvas.getContext('2d'), meta, panel });
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

// The found path's grid cells alone don't preserve start-to-goal order, so
// walk the chain of path-adjacent cells to recover it. Path cells form a
// simple line (each has 1 or 2 path-neighbors); the two degree-1 ends are the
// cell next to start and the end cell itself (frame.current) - trace from the
// other one.
function tracePathOrder(grid, endCell) {
  const rows = grid.length;
  const cols = grid[0].length;
  const isPath = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] === 'path';
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isPath(r, c)) cells.push([r, c]);
    }
  }
  if (cells.length <= 1) return cells;

  const key = ([r, c]) => `${r},${c}`;
  const neighborsOf = ([r, c]) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([nr, nc]) => isPath(nr, nc));
  const endpoints = cells.filter((cell) => neighborsOf(cell).length === 1);
  const startCell = endpoints.find(([r, c]) => !(endCell && r === endCell[0] && c === endCell[1])) || endpoints[0] || cells[0];

  const ordered = [startCell];
  const visited = new Set([key(startCell)]);
  let current = startCell;
  while (ordered.length < cells.length) {
    const next = neighborsOf(current).find((n) => !visited.has(key(n)));
    if (!next) break;
    ordered.push(next);
    visited.add(key(next));
    current = next;
  }
  return ordered;
}

// Per category: an ordered low-to-high sequence of "reveal items", the
// matching ascending pitches, and a render(ctx, width, height, revealedCount)
// that draws the first revealedCount items (in that order) green and the rest
// white/neutral. Returns null if the category or frame doesn't support it.
function getRevealPlan(categoryId, frame) {
  if (!frame) return null;

  if (categoryId === 'sorting' || categoryId === 'searching') {
    const array = frame.array;
    if (!Array.isArray(array) || !array.every((v) => typeof v === 'number')) return null;
    const order = array.map((v, i) => i).sort((a, b) => array[a] - array[b]);
    return {
      total: order.length,
      pitches: order.map((i) => valueToTone(array[i])),
      render: (ctx, w, h, count) => renderReveal(ctx, w, h, array, count),
    };
  }

  if (categoryId === 'graph') {
    const visited = frame.visited;
    if (!Array.isArray(visited) || !visited.length) return null;
    return {
      total: visited.length,
      pitches: visited.map((_, i) => positionToTone(i, visited.length)),
      render: (ctx, w, h, count) => renderGraphReveal(ctx, w, h, frame, new Set(visited.slice(0, count))),
    };
  }

  if (categoryId === 'tree') {
    if (!frame.positions) return null;
    const order = [...frame.positions.entries()].sort((a, b) => a[1].value - b[1].value).map(([id]) => id);
    if (!order.length) return null;
    return {
      total: order.length,
      pitches: order.map((id) => valueToTone(frame.positions.get(id).value)),
      render: (ctx, w, h, count) => renderTreeReveal(ctx, w, h, frame, new Set(order.slice(0, count))),
    };
  }

  if (categoryId === 'pathfinding') {
    if (!frame.grid) return null;
    const order = tracePathOrder(frame.grid, frame.current);
    if (!order.length) return null;
    return {
      total: order.length,
      pitches: order.map((_, i) => positionToTone(i, order.length)),
      render: (ctx, w, h, count) =>
        renderMazeReveal(ctx, w, h, frame, new Set(order.slice(0, count).map(([r, c]) => `${r},${c}`))),
    };
  }

  if (categoryId === 'dp') {
    if (!frame.table) return null;
    const cells = [];
    frame.table.forEach((row, r) => row.forEach((value, c) => {
      if (value >= 0) cells.push([r, c, value]);
    }));
    if (!cells.length) return null;
    cells.sort((a, b) => a[2] - b[2]);
    const maxValue = Math.max(1, ...cells.map((c) => c[2]));
    return {
      total: cells.length,
      pitches: cells.map(([, , v]) => valueToTone(v, maxValue)),
      render: (ctx, w, h, count) =>
        renderDpReveal(ctx, w, h, frame, new Set(cells.slice(0, count).map(([r, c]) => `${r},${c}`))),
    };
  }

  if (categoryId === 'string') {
    const matches = frame.matches;
    if (!Array.isArray(matches) || !matches.length) return null;
    return {
      total: matches.length,
      pitches: matches.map((_, i) => positionToTone(i, matches.length)),
      render: (ctx, w, h, count) => renderStringReveal(ctx, w, h, frame, count),
    };
  }

  return null;
}

// Paints a low-to-high reveal wipe on panel's canvas over totalDurationMs,
// matching the pacing of the finish sweep sound. Sets panel.revealing so the
// engine's normal per-tick render leaves this canvas alone until the wipe
// finishes (it would otherwise redraw over it every frame).
function animateReveal(panel, plan, totalDurationMs = 700) {
  panel.revealing = true;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const revealedCount = Math.min(plan.total, Math.round((elapsed / totalDurationMs) * plan.total));
    plan.render(panel.ctx, panel.canvas.width, panel.canvas.height, revealedCount);
    if (elapsed < totalDurationMs) {
      requestAnimationFrame(tick);
    } else {
      panel.revealing = false;
    }
  }
  requestAnimationFrame(tick);
}

addContenderBtn.addEventListener('click', () => {
  const algorithm = currentCategory.algorithms.find((a) => a.id === algorithmSelect.value);
  if (!algorithm) return;
  contenders.push({ uid: uidCounter++, algorithm, name: algorithm.name });
  removeAlgorithmOption(algorithm.id);
  renderContenderList();
  renderArena();
});

difficultyRange.addEventListener('input', () => {
  difficultyValue.textContent = difficultyRange.value;
});

categorySelect.addEventListener('change', () => selectCategory(categorySelect.value));

runBtn.addEventListener('click', () => {
  if (contenders.length < 2) {
    setStatus('Add at least two contenders before running.');
    return;
  }
  if (engine) engine.pause();

  const difficulty = Number(difficultyRange.value);
  const problem = currentCategory.createProblem(difficulty);
  renderArena();

  lastRunSteps.clear();
  lastRunDone.clear();

  const runs = contenders.map((contender) => {
    const generator = currentCategory.createRun(contender.algorithm, problem);
    return new ContenderRun(contender.uid, contender.name, generator);
  });

  engine = new Engine({
    stepsPerTick: Math.max(1, Math.round(DEFAULT_STEP_DELAY_MS / 500)),
    onTick(allRuns) {
      allRuns.forEach((run) => {
        const panel = panels.get(run.id);
        if (!panel) return;
        if (!panel.revealing) {
          currentCategory.render(panel.ctx, panel.canvas.width, panel.canvas.height, run.frame);
        }
        panel.meta.textContent = `Steps: ${run.steps}${run.done ? ' — finished' : ''}`;
        panel.panel.classList.toggle('finished', run.done);

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
          const plan = getRevealPlan(currentCategory.id, run.frame);
          if (plan) {
            playSequenceSweep(plan.pitches);
            animateReveal(panel, plan);
          } else {
            playFinish();
          }
        }
        lastRunDone.set(run.id, run.done);
      });
      if (allRuns.every((run) => run.done)) {
        const winner = allRuns.reduce((best, run) =>
          run.finishedAtStep < best.finishedAtStep ? run : best
        );
        const winnerPanel = panels.get(winner.id);
        if (winnerPanel) winnerPanel.panel.classList.add('winner');
        setStatus(`${winner.algorithmName} finished first in ${winner.finishedAtStep} steps.`);
      }
    },
  });
  engine.setRuns(runs);
  engine.start();
  setStatus('Running…');
});

pauseBtn.addEventListener('click', () => {
  if (engine) engine.pause();
  setStatus('Paused.');
});

resetBtn.addEventListener('click', () => {
  if (engine) engine.pause();
  renderArena();
  setStatus('Reset. Press Run to start again.');
});

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  setMuted(isMuted);
  muteBtn.textContent = isMuted ? 'Muted' : 'Mute';
});

populateCategories();
selectCategory(CATEGORIES[0].id);
