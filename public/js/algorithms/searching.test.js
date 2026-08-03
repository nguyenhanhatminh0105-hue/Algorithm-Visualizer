import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linearSearch, binarySearch } from './searching.js';

function runToCompletion(generator) {
  let step = generator.next();
  while (!step.done) step = generator.next();
  return step.value;
}

test('linearSearch returns -1 for empty array', () => {
  const result = runToCompletion(linearSearch([], 5));
  assert.equal(result.foundIndex, -1);
});

test('binarySearch returns -1 for empty array', () => {
  const result = runToCompletion(binarySearch([], 5));
  assert.equal(result.foundIndex, -1);
});
