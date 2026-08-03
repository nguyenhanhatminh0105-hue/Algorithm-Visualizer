function clear(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#12141c';
  ctx.fillRect(0, 0, width, height);
}

export function renderBars(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.array) return;
  const { array, compare = [], swap = [], sorted = [] } = frame;
  const max = Math.max(...array, 1);
  const barWidth = width / array.length;
  array.forEach((value, i) => {
    let color = '#5b7fff';
    if (sorted.includes(i)) color = '#4caf72';
    else if (swap.includes(i)) color = '#ef5959';
    else if (compare.includes(i)) color = '#f2b344';
    const barHeight = (value / max) * (height - 10);
    ctx.fillStyle = color;
    ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
  });
}

// Draws every bar white except the lowest-valued revealedCount of them, which
// draw green - used to paint a low-to-high reveal wipe in sync with the finish
// sweep sound, independent of whatever colors the live algorithm animation used.
export function renderReveal(ctx, width, height, array, revealedCount) {
  clear(ctx, width, height);
  const max = Math.max(...array, 1);
  const barWidth = width / array.length;
  const revealed = new Set(
    array
      .map((value, i) => i)
      .sort((a, b) => array[a] - array[b])
      .slice(0, revealedCount),
  );
  array.forEach((value, i) => {
    const barHeight = (value / max) * (height - 10);
    ctx.fillStyle = revealed.has(i) ? '#4caf72' : '#ffffff';
    ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
  });
}

export function renderSearch(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.array) return;
  const { array, current, low, high, found, foundIndex } = frame;
  const max = Math.max(...array, 1);
  const barWidth = width / array.length;
  array.forEach((value, i) => {
    let color = '#5b7fff';
    if (typeof low === 'number' && typeof high === 'number' && (i < low || i > high)) color = '#333a4d';
    if (i === current) color = '#f2b344';
    if (found && i === foundIndex) color = '#4caf72';
    const barHeight = (value / max) * (height - 10);
    ctx.fillStyle = color;
    ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
  });
}

const CELL_COLORS = {
  wall: '#2b2f3d',
  empty: '#1b1e29',
  visited: '#3a4a75',
  path: '#4caf72',
};

export function renderGrid(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.grid) return;
  const grid = frame.grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const cellW = width / cols;
  const cellH = height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = CELL_COLORS[grid[r][c]] || CELL_COLORS.empty;
      ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
    }
  }
  if (frame.current) {
    const [r, c] = frame.current;
    ctx.fillStyle = '#f2b344';
    ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
  }
}

export function renderGraph(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.nodes) return;
  const { nodes, edges, visited = [], current } = frame;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const pos = nodes.map((n) => [cx + n.x * radius, cy + n.y * radius]);
  ctx.strokeStyle = '#333a4d';
  ctx.lineWidth = 1;
  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(pos[a][0], pos[a][1]);
    ctx.lineTo(pos[b][0], pos[b][1]);
    ctx.stroke();
  });
  nodes.forEach((n, i) => {
    ctx.beginPath();
    ctx.arc(pos[i][0], pos[i][1], 10, 0, Math.PI * 2);
    ctx.fillStyle = i === current ? '#f2b344' : visited.includes(i) ? '#4caf72' : '#5b7fff';
    ctx.fill();
  });
}

export function renderTree(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.root) return;
  const { root, positions, visited = [], current } = frame;
  let maxX = 0;
  let maxY = 0;
  positions.forEach((p) => {
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  const stepX = width / (maxX + 2);
  const stepY = height / (maxY + 2);
  const coord = (id) => {
    const p = positions.get(id);
    return [stepX * (p.x + 1), stepY * (p.y + 1)];
  };
  ctx.strokeStyle = '#333a4d';
  function drawEdges(node) {
    if (!node) return;
    const [x, y] = coord(node.id);
    for (const child of [node.left, node.right]) {
      if (!child) continue;
      const [cx, cy] = coord(child.id);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      drawEdges(child);
    }
  }
  drawEdges(root);
  function drawNodes(node) {
    if (!node) return;
    const [x, y] = coord(node.id);
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = node.id === current ? '#f2b344' : visited.includes(node.id) ? '#4caf72' : '#5b7fff';
    ctx.fill();
    ctx.fillStyle = '#0d0f16';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.value, x, y);
    drawNodes(node.left);
    drawNodes(node.right);
  }
  drawNodes(root);
}

export function renderDpGrid(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.table) return;
  const table = frame.table;
  const rows = table.length;
  const cols = table[0].length;
  const cellW = width / cols;
  const cellH = height / rows;
  const max = Math.max(1, ...table.flat());
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = table[r][c];
      const intensity = Math.max(0, value) / max;
      ctx.fillStyle = `rgba(91,127,255,${0.15 + intensity * 0.7})`;
      ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
    }
  }
  if (frame.current) {
    const [r, c] = frame.current;
    ctx.strokeStyle = '#f2b344';
    ctx.lineWidth = 2;
    ctx.strokeRect(c * cellW + 1, r * cellH + 1, cellW - 3, cellH - 3);
  }
}

export function renderStringMatch(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.text) return;
  const { text, pattern, textIndex, matches = [] } = frame;
  const cellW = width / text.length;
  const rowY = height / 2 - 15;
  const patternLength = pattern ? pattern.length : 0;
  for (let i = 0; i < text.length; i++) {
    let color = '#1b1e29';
    if (matches.some((m) => i >= m && i < m + patternLength)) color = '#4caf72';
    else if (i === textIndex) color = '#f2b344';
    ctx.fillStyle = color;
    ctx.fillRect(i * cellW, rowY, cellW - 1, 30);
    ctx.fillStyle = '#e6e8ef';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text[i], i * cellW + cellW / 2, rowY + 20);
  }
}
