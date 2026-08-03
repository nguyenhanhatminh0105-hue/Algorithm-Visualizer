class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(priority, value) {
    this.items.push({ priority, value });
    this._bubbleUp(this.items.length - 1);
  }

  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length) {
      this.items[0] = last;
      this._bubbleDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].priority <= this.items[i].priority) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  _bubbleDown(i) {
    const n = this.items.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.items[left].priority < this.items[smallest].priority) smallest = left;
      if (right < n && this.items[right].priority < this.items[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
      i = smallest;
    }
  }
}

function neighbors(r, c, rows, cols) {
  const out = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < rows - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < cols - 1) out.push([r, c + 1]);
  return out;
}

function cloneStateGrid(rows, cols, walls) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (walls[r][c] ? 'wall' : 'empty'))
  );
}

function reconstructPath(cameFrom, end) {
  const path = [];
  let key = `${end[0]},${end[1]}`;
  while (cameFrom.has(key)) {
    const [r, c] = key.split(',').map(Number);
    path.push([r, c]);
    key = cameFrom.get(key);
  }
  return path;
}

function isReachable(walls, start, end, rows, cols) {
  const visited = new Set([`${start[0]},${start[1]}`]);
  const queue = [start];
  let qi = 0;
  while (qi < queue.length) {
    const [r, c] = queue[qi++];
    if (r === end[0] && c === end[1]) return true;
    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      const key = `${nr},${nc}`;
      if (walls[nr][nc] || visited.has(key)) continue;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }
  return false;
}

export function generateMaze(rows, cols, wallDensity) {
  const start = [0, 0];
  const end = [rows - 1, cols - 1];
  let walls;
  do {
    walls = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.random() < wallDensity)
    );
    walls[start[0]][start[1]] = false;
    walls[end[0]][end[1]] = false;
  } while (!isReachable(walls, start, end, rows, cols));
  const costs = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 1 + Math.floor(Math.random() * 4))
  );
  return { rows, cols, walls, costs, start, end };
}

export function* bfs({ rows, cols, walls, start, end }) {
  const state = cloneStateGrid(rows, cols, walls);
  const visited = new Set([`${start[0]},${start[1]}`]);
  const cameFrom = new Map();
  const queue = [start];
  let qi = 0;
  while (qi < queue.length) {
    const [r, c] = queue[qi++];
    if (state[r][c] === 'empty') state[r][c] = 'visited';
    yield { grid: state.map((row) => row.slice()), current: [r, c] };
    if (r === end[0] && c === end[1]) break;
    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      const key = `${nr},${nc}`;
      if (walls[nr][nc] || visited.has(key)) continue;
      visited.add(key);
      cameFrom.set(key, `${r},${c}`);
      queue.push([nr, nc]);
    }
  }
  for (const [r, c] of reconstructPath(cameFrom, end)) state[r][c] = 'path';
  return { grid: state, current: end };
}

export function* dfs({ rows, cols, walls, start, end }) {
  const state = cloneStateGrid(rows, cols, walls);
  const visited = new Set([`${start[0]},${start[1]}`]);
  const cameFrom = new Map();
  const stack = [start];
  while (stack.length) {
    const [r, c] = stack.pop();
    if (state[r][c] === 'empty') state[r][c] = 'visited';
    yield { grid: state.map((row) => row.slice()), current: [r, c] };
    if (r === end[0] && c === end[1]) break;
    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      const key = `${nr},${nc}`;
      if (walls[nr][nc] || visited.has(key)) continue;
      visited.add(key);
      cameFrom.set(key, `${r},${c}`);
      stack.push([nr, nc]);
    }
  }
  for (const [r, c] of reconstructPath(cameFrom, end)) state[r][c] = 'path';
  return { grid: state, current: end };
}

export function* dijkstra({ rows, cols, walls, costs, start, end }) {
  const state = cloneStateGrid(rows, cols, walls);
  const dist = new Map([[`${start[0]},${start[1]}`, 0]]);
  const cameFrom = new Map();
  const visited = new Set();
  const heap = new MinHeap();
  heap.push(0, start);
  while (heap.size) {
    const { priority, value } = heap.pop();
    const [r, c] = value;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (state[r][c] === 'empty') state[r][c] = 'visited';
    yield { grid: state.map((row) => row.slice()), current: [r, c] };
    if (r === end[0] && c === end[1]) break;
    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      if (walls[nr][nc]) continue;
      const nextKey = `${nr},${nc}`;
      const newDist = priority + costs[nr][nc];
      if (!dist.has(nextKey) || newDist < dist.get(nextKey)) {
        dist.set(nextKey, newDist);
        cameFrom.set(nextKey, key);
        heap.push(newDist, [nr, nc]);
      }
    }
  }
  for (const [r, c] of reconstructPath(cameFrom, end)) state[r][c] = 'path';
  return { grid: state, current: end };
}

export function* astar({ rows, cols, walls, costs, start, end }) {
  const state = cloneStateGrid(rows, cols, walls);
  const heuristic = ([r, c]) => Math.abs(r - end[0]) + Math.abs(c - end[1]);
  const dist = new Map([[`${start[0]},${start[1]}`, 0]]);
  const cameFrom = new Map();
  const visited = new Set();
  const heap = new MinHeap();
  heap.push(heuristic(start), start);
  while (heap.size) {
    const { value } = heap.pop();
    const [r, c] = value;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (state[r][c] === 'empty') state[r][c] = 'visited';
    yield { grid: state.map((row) => row.slice()), current: [r, c] };
    if (r === end[0] && c === end[1]) break;
    for (const [nr, nc] of neighbors(r, c, rows, cols)) {
      if (walls[nr][nc]) continue;
      const nextKey = `${nr},${nc}`;
      const newDist = dist.get(key) + costs[nr][nc];
      if (!dist.has(nextKey) || newDist < dist.get(nextKey)) {
        dist.set(nextKey, newDist);
        cameFrom.set(nextKey, key);
        heap.push(newDist + heuristic([nr, nc]), [nr, nc]);
      }
    }
  }
  for (const [r, c] of reconstructPath(cameFrom, end)) state[r][c] = 'path';
  return { grid: state, current: end };
}
