import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sorting from './sorting.js';

function runSort(fn, list) {
  const input = [...list];
  const result = fn(input);
  if (result && typeof result.next === 'function') {
    let step = result.next();
    while (!step.done) step = result.next();
    if (step.value && Array.isArray(step.value.array)) return step.value.array;
    return input;
  }
  return Array.isArray(result) ? result : input;
}

const cases = {
  'already-sorted list': [1, 2, 3, 4, 5],
  'reverse-sorted list': [5, 4, 3, 2, 1],
  'empty list': [],
  'list with duplicate values': [3, 1, 2, 3, 1, 2],
};

const sortFns = Object.entries(sorting).filter(([, value]) => typeof value === 'function');

assert.ok(sortFns.length > 0, 'sorting.js should export at least one sort function');

for (const [name, fn] of sortFns) {
  test(`${name} sorts all reference cases`, () => {
    for (const [caseName, list] of Object.entries(cases)) {
      const expected = [...list].sort((a, b) => a - b);
      const actual = runSort(fn, list);
      assert.deepEqual(actual, expected, `${name} failed on ${caseName}`);
    }
  });
}
