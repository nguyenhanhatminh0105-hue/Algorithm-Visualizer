function snapshot(array, extra) {
  return { array: array.slice(), ...extra };
}

export function* linearSearch(array, target) {
  for (let i = 0; i < array.length; i++) {
    yield snapshot(array, { current: i, found: false });
    if (array[i] === target) {
      return snapshot(array, { current: i, found: true, foundIndex: i });
    }
  }
  return snapshot(array, { found: false, foundIndex: -1 });
}

export function* binarySearch(array, target) {
  let low = 0;
  let high = array.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    yield snapshot(array, { current: mid, low, high, found: false });
    if (array[mid] === target) {
      return snapshot(array, { current: mid, low, high, found: true, foundIndex: mid });
    }
    if (array[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return snapshot(array, { found: false, foundIndex: -1 });
}
