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

// Walls are the canvas background, so they read as gaps between open cells.
const CELL_COLORS = {
  wall: '#12141c',
  empty: '#262b3b',
  visited: '#3f5391',
  path: '#4caf72',
};

// Every maze runs from the top-left cell to the bottom-right one. A ring marks
// the start and a filled dot the goal, drawn over whatever state the cell is in.
function drawEndpoints(ctx, rows, cols, cellW, cellH) {
  const radius = Math.max(2, Math.min(cellW, cellH) * 0.28);
  const centre = (r, c) => [c * cellW + (cellW - 1) / 2, r * cellH + (cellH - 1) / 2];
  ctx.lineWidth = Math.max(1.5, radius * 0.5);
  ctx.strokeStyle = '#e6e8ef';
  ctx.fillStyle = '#e6e8ef';
  const [sx, sy] = centre(0, 0);
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.stroke();
  const [gx, gy] = centre(rows - 1, cols - 1);
  ctx.beginPath();
  ctx.arc(gx, gy, radius * 1.15, 0, Math.PI * 2);
  ctx.fill();
}

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
  drawEndpoints(ctx, rows, cols, cellW, cellH);
}

// Wall/empty/visited cells keep their normal colors; path cells (the found
// route) draw white until revealed, then green, in start-to-goal order.
export function renderMazeReveal(ctx, width, height, frame, revealedCells) {
  clear(ctx, width, height);
  if (!frame || !frame.grid) return;
  const grid = frame.grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const cellW = width / cols;
  const cellH = height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellType = grid[r][c];
      ctx.fillStyle =
        cellType === 'path' ? (revealedCells.has(`${r},${c}`) ? '#4caf72' : '#ffffff') : CELL_COLORS[cellType] || CELL_COLORS.empty;
      ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
    }
  }
  drawEndpoints(ctx, rows, cols, cellW, cellH);
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

// Nodes in revealedIds draw green, everything else white - same white-to-green
// wipe as the sorting reveal, applied to graph nodes instead of bars.
export function renderGraphReveal(ctx, width, height, frame, revealedIds) {
  clear(ctx, width, height);
  if (!frame || !frame.nodes) return;
  const { nodes, edges } = frame;
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
    ctx.fillStyle = revealedIds.has(i) ? '#4caf72' : '#ffffff';
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
    ctx.font = '600 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.value, x, y);
    drawNodes(node.left);
    drawNodes(node.right);
  }
  drawNodes(root);
}

// Nodes in revealedIds draw green, everything else white.
export function renderTreeReveal(ctx, width, height, frame, revealedIds) {
  clear(ctx, width, height);
  if (!frame || !frame.root) return;
  const { root, positions } = frame;
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
    ctx.fillStyle = revealedIds.has(node.id) ? '#4caf72' : '#ffffff';
    ctx.fill();
    ctx.fillStyle = '#0d0f16';
    ctx.font = '600 10px Inter, system-ui, sans-serif';
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

// Cells in revealedCells draw green, other computed cells draw white,
// never-computed cells (memoized search left them at -1) stay background-dark.
export function renderDpReveal(ctx, width, height, frame, revealedCells) {
  clear(ctx, width, height);
  if (!frame || !frame.table) return;
  const table = frame.table;
  const rows = table.length;
  const cols = table[0].length;
  const cellW = width / cols;
  const cellH = height / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (table[r][c] < 0) {
        ctx.fillStyle = '#12141c';
      } else {
        ctx.fillStyle = revealedCells.has(`${r},${c}`) ? '#4caf72' : '#ffffff';
      }
      ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
    }
  }
}

// The text wraps onto as many rows as it needs for every character to stay
// readable, with the pattern being searched for written above it.
function drawStringCells(ctx, width, height, frame, colorAt) {
  const { text, pattern = '' } = frame;
  const header = 34;
  const pad = 12;
  const inner = width - pad * 2;
  // Aim for cells about 24px wide, but never so many rows that they overflow.
  let cols = Math.min(text.length, Math.max(8, Math.floor(inner / 24)));
  const maxRows = Math.max(1, Math.floor((height - header - pad * 2) / 18));
  if (Math.ceil(text.length / cols) > maxRows) cols = Math.ceil(text.length / maxRows);
  const rows = Math.ceil(text.length / cols);
  const cellW = inner / cols;
  const cellH = Math.min(32, (height - header - pad * 2) / rows);
  const blockTop = Math.max(pad, (height - header - rows * cellH) / 2);
  const top = blockTop + header;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#9aa0b4';
  ctx.fillText('Pattern', pad, blockTop + 12);
  ctx.font = '600 13px ui-monospace, SFMono-Regular, Consolas, monospace';
  ctx.fillStyle = '#e6e8ef';
  ctx.fillText(pattern, pad + 54, blockTop + 12);

  ctx.textAlign = 'center';
  ctx.font = `${Math.min(13, Math.max(9, cellH * 0.5))}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  for (let i = 0; i < text.length; i++) {
    const x = pad + (i % cols) * cellW;
    const y = top + Math.floor(i / cols) * cellH;
    const color = colorAt(i);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cellW - 1, cellH - 1);
    ctx.fillStyle = color === '#262b3b' ? '#e6e8ef' : '#0d0f16';
    ctx.fillText(text[i], x + (cellW - 1) / 2, y + (cellH - 1) / 2 + 0.5);
  }
}

export function renderStringMatch(ctx, width, height, frame) {
  clear(ctx, width, height);
  if (!frame || !frame.text) return;
  const { pattern, textIndex, matches = [] } = frame;
  const patternLength = pattern ? pattern.length : 0;
  drawStringCells(ctx, width, height, frame, (i) => {
    if (matches.some((m) => i >= m && i < m + patternLength)) return '#4caf72';
    if (i === textIndex) return '#f2b344';
    return '#262b3b';
  });
}

// Match regions reveal green in the order they were found (already left to
// right); everything else stays the normal neutral background.
export function renderStringReveal(ctx, width, height, frame, revealedMatchCount) {
  clear(ctx, width, height);
  if (!frame || !frame.text) return;
  const { pattern, matches = [] } = frame;
  const patternLength = pattern ? pattern.length : 0;
  const revealedStarts = new Set(matches.slice(0, revealedMatchCount));
  drawStringCells(ctx, width, height, frame, (i) => {
    const matchStart = matches.find((m) => i >= m && i < m + patternLength);
    if (matchStart === undefined) return '#262b3b';
    return revealedStarts.has(matchStart) ? '#4caf72' : '#ffffff';
  });
}
