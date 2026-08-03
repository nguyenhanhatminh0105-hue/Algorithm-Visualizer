function snapshot(array, { compare = [], swap = [], sorted = [] } = {}) {
  return { array: array.slice(), compare, swap, sorted };
}

export function* bubbleSort(input) {
  const array = input.slice();
  const n = array.length;
  const sorted = [];
  for (let i = 0; i < n - 1; i++) {
    let swappedAny = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield snapshot(array, { compare: [j, j + 1], sorted });
      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swappedAny = true;
        yield snapshot(array, { swap: [j, j + 1], sorted });
      }
    }
    sorted.unshift(n - 1 - i);
    if (!swappedAny) break;
  }
  for (let i = 0; i < n; i++) if (!sorted.includes(i)) sorted.push(i);
  return snapshot(array, { sorted });
}

export function* selectionSort(input) {
  const array = input.slice();
  const n = array.length;
  const sorted = [];
  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      yield snapshot(array, { compare: [min, j], sorted });
      if (array[j] < array[min]) min = j;
    }
    if (min !== i) {
      [array[i], array[min]] = [array[min], array[i]];
      yield snapshot(array, { swap: [i, min], sorted });
    }
    sorted.push(i);
  }
  return snapshot(array, { sorted });
}

export function* insertionSort(input) {
  const array = input.slice();
  const n = array.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield snapshot(array, { compare: [j - 1, j] });
      if (array[j - 1] > array[j]) {
        [array[j - 1], array[j]] = [array[j], array[j - 1]];
        yield snapshot(array, { swap: [j - 1, j] });
        j--;
      } else break;
    }
  }
  return snapshot(array, { sorted: array.map((_, i) => i) });
}

export function* quickSort(input) {
  const array = input.slice();
  function* sort(lo, hi) {
    if (lo >= hi) return;
    const pivot = array[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield snapshot(array, { compare: [j, hi] });
      if (array[j] < pivot) {
        [array[i], array[j]] = [array[j], array[i]];
        if (i !== j) yield snapshot(array, { swap: [i, j] });
        i++;
      }
    }
    [array[i], array[hi]] = [array[hi], array[i]];
    yield snapshot(array, { swap: [i, hi] });
    yield* sort(lo, i - 1);
    yield* sort(i + 1, hi);
  }
  yield* sort(0, array.length - 1);
  return snapshot(array, { sorted: array.map((_, i) => i) });
}

export function* mergeSort(input) {
  const array = input.slice();
  function* sort(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* sort(lo, mid);
    yield* sort(mid, hi);
    const left = array.slice(lo, mid);
    const right = array.slice(mid, hi);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      yield snapshot(array, { compare: [lo + i, mid + j] });
      if (left[i] <= right[j]) array[k++] = left[i++];
      else array[k++] = right[j++];
      yield snapshot(array, { swap: [k - 1] });
    }
    while (i < left.length) {
      array[k++] = left[i++];
      yield snapshot(array, { swap: [k - 1] });
    }
    while (j < right.length) {
      array[k++] = right[j++];
      yield snapshot(array, { swap: [k - 1] });
    }
  }
  yield* sort(0, array.length);
  return snapshot(array, { sorted: array.map((_, i) => i) });
}
