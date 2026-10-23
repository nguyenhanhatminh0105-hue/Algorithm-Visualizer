import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from './categories.js';
import { defaultContenders, firstFrame } from './defaults.js';

test('every category starts with two different contenders, so Run works on first visit', () => {
  for (const category of CATEGORIES) {
    const picks = defaultContenders(category);
    assert.equal(picks.length, 2, category.id);
    assert.notEqual(picks[0].id, picks[1].id, category.id);
    for (const pick of picks) assert.ok(category.algorithms.includes(pick), `${category.id}: ${pick.id}`);
  }
});

test('every algorithm has a starting frame to draw before the race begins', () => {
  for (const category of CATEGORIES) {
    const problem = category.createProblem(category.difficulty.default);
    for (const algorithm of category.algorithms) {
      const frame = firstFrame(category, algorithm, problem);
      assert.ok(frame && typeof frame === 'object', `${category.id}/${algorithm.id}`);
    }
  }
});

test('drawing the starting frame leaves the shared problem untouched for the real race', () => {
  for (const category of CATEGORIES) {
    const problem = category.createProblem(category.difficulty.default);
    const before = JSON.stringify(problem);
    for (const algorithm of category.algorithms) firstFrame(category, algorithm, problem);
    assert.equal(JSON.stringify(problem), before, category.id);
  }
});
