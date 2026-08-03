function makeTable(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

function randomString(length) {
  const alphabet = 'ABCDE';
  let s = '';
  for (let i = 0; i < length; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function generateLcsProblem(size) {
  const a = randomString(size);
  const b = randomString(size);
  return { a, b };
}

function snapshot(table, current) {
  return { table: table.map((row) => row.slice()), current };
}

export function* lcsTabulation({ a, b }) {
  const table = makeTable(a.length + 1, b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i][j] = a[i - 1] === b[j - 1]
        ? table[i - 1][j - 1] + 1
        : Math.max(table[i - 1][j], table[i][j - 1]);
      yield snapshot(table, [i, j]);
    }
  }
  return snapshot(table, null);
}

export function* lcsMemoized({ a, b }) {
  const table = makeTable(a.length + 1, b.length + 1, -1);
  function* solve(i, j) {
    if (i === 0 || j === 0) return 0;
    if (table[i][j] !== -1) return table[i][j];
    let result;
    if (a[i - 1] === b[j - 1]) {
      result = (yield* solve(i - 1, j - 1)) + 1;
    } else {
      result = Math.max(yield* solve(i - 1, j), yield* solve(i, j - 1));
    }
    table[i][j] = result;
    yield snapshot(table, [i, j]);
    return result;
  }
  yield* solve(a.length, b.length);
  return snapshot(table, null);
}
