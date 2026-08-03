const { linearSearch, binarySearch } = require('./searching.js');

test('linearSearch returns -1 for empty array', () => {
  expect(linearSearch([], 5)).toBe(-1);
});

test('binarySearch returns -1 for empty array', () => {
  expect(binarySearch([], 5)).toBe(-1);
});
