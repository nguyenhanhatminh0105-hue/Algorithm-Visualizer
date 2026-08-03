import { CATEGORIES } from './categories.js';
import { Engine, ContenderRun } from './engine.js';

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
const speedRange = document.getElementById('speed-range');
const statusEl = document.getElementById('status');

let currentCategory = CATEGORIES[0];
let contenders = [];
let panels = new Map();
let engine = null;
let uidCounter = 0;

function populateCategories() {
  categorySelect.innerHTML = '';
  CATEGORIES.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
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

addContenderBtn.addEventListener('click', () => {
  const algorithm = currentCategory.algorithms.find((a) => a.id === algorithmSelect.value);
  if (!algorithm) return;
  contenders.push({ uid: uidCounter++, algorithm, name: algorithm.name });
  renderContenderList();
  renderArena();
});

difficultyRange.addEventListener('input', () => {
  difficultyValue.textContent = difficultyRange.value;
});

categorySelect.addEventListener('change', () => selectCategory(categorySelect.value));

speedRange.addEventListener('input', () => {
  if (engine) engine.setSpeed(Number(speedRange.value));
});

runBtn.addEventListener('click', () => {
  if (contenders.length < 2) {
    setStatus('Add at least two contenders before running.');
    return;
  }
  if (engine) engine.pause();

  const difficulty = Number(difficultyRange.value);
  const problem = currentCategory.createProblem(difficulty);
  renderArena();

  const runs = contenders.map((contender) => {
    const generator = currentCategory.createRun(contender.algorithm, problem);
    return new ContenderRun(contender.uid, contender.name, generator);
  });

  engine = new Engine({
    stepsPerTick: Number(speedRange.value),
    onTick(allRuns) {
      allRuns.forEach((run) => {
        const panel = panels.get(run.id);
        if (!panel) return;
        currentCategory.render(panel.ctx, panel.canvas.width, panel.canvas.height, run.frame);
        panel.meta.textContent = `Steps: ${run.steps}${run.done ? ' — finished' : ''}`;
        panel.panel.classList.toggle('finished', run.done);
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

populateCategories();
selectCategory(CATEGORIES[0].id);
