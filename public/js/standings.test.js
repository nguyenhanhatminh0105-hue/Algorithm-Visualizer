import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from './categories.js';
import { ContenderRun } from './engine.js';
import { countSteps, progress, places, ordinal, gapToWinner, summary } from './standings.js';

const done = (id, name, steps) => ({ id, algorithmName: name, done: true, finishedAtStep: steps });
const running = (id, name) => ({ id, algorithmName: name, done: false, finishedAtStep: null });

test('the predicted step count is exactly what the real race takes', () => {
  for (const category of CATEGORIES) {
    const problem = category.createProblem(category.difficulty.default);
    for (const algorithm of category.algorithms) {
      const predicted = countSteps(category, algorithm, problem);
      const run = new ContenderRun(0, algorithm.name, category.createRun(algorithm, structuredClone(problem)));
      while (!run.done) run.step();
      assert.equal(predicted, run.finishedAtStep, `${category.id}/${algorithm.id}`);
      assert.ok(predicted > 0, `${category.id}/${algorithm.id} takes at least one step`);
    }
  }
});

test('counting steps leaves the shared problem untouched', () => {
  for (const category of CATEGORIES) {
    const problem = category.createProblem(category.difficulty.default);
    const before = JSON.stringify(problem);
    for (const algorithm of category.algorithms) countSteps(category, algorithm, problem);
    assert.equal(JSON.stringify(problem), before, category.id);
  }
});

test('progress runs from 0 to 1 and never past the finish line', () => {
  assert.equal(progress(0, 200), 0);
  assert.equal(progress(50, 200), 0.25);
  assert.equal(progress(250, 200), 1);
  assert.equal(progress(0, 0), 1);
});

test('fewer steps places higher, ties share a place, unfinished runs have none', () => {
  const result = places([done('a', 'A', 300), done('b', 'B', 120), done('c', 'C', 120), running('d', 'D'), done('e', 'E', 500)]);
  assert.equal(result.get('b'), 1);
  assert.equal(result.get('c'), 1);
  assert.equal(result.get('a'), 3);
  assert.equal(result.get('e'), 4);
  assert.equal(result.has('d'), false);
});

test('ordinals', () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21].map(ordinal), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st']);
});

test('the gap to the winner is a ratio, and empty for the winner', () => {
  assert.equal(gapToWinner(done('a', 'A', 100), 100), '');
  assert.equal(gapToWinner(done('b', 'B', 240), 100), '2.4× the winner');
  assert.equal(gapToWinner(done('c', 'C', 1830), 100), '18× the winner');
  assert.equal(gapToWinner(running('d', 'D'), 100), '');
  assert.equal(gapToWinner(done('e', 'E', 71), 68), '3 more steps');
  assert.equal(gapToWinner(done('f', 'F', 101), 100), '1 more step');
});

test('the summary names the winner and how much it saved over the slowest', () => {
  assert.equal(summary([done('a', 'Bubble Sort', 1000), running('b', 'Quick Sort')]), null);
  assert.equal(
    summary([done('a', 'Bubble Sort', 1000), done('b', 'Quick Sort', 250), done('c', 'Merge Sort', 400)]),
    'Quick Sort wins in 250 steps, 75% fewer than Bubble Sort (1,000).',
  );
  assert.equal(summary([done('a', 'Preorder', 20), done('b', 'Inorder', 20)]), 'A tie: every contender took 20 steps.');
  assert.equal(
    summary([done('a', 'Preorder', 20), done('b', 'Inorder', 20), done('c', 'Level Order', 31)]),
    'Preorder and Inorder tie for first in 20 steps.',
  );
});
