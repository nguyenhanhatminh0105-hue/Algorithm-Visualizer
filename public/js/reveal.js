// The finish animation: when a contender is done, its canvas wipes from white
// to green in a meaningful order, in time with the finish sweep sound.
import { valueToTone, positionToTone } from './audio.js?v=2';
import {
  renderReveal,
  renderGraphReveal,
  renderTreeReveal,
  renderMazeReveal,
  renderDpReveal,
  renderStringReveal,
} from './render.js';

// The found path's grid cells alone don't preserve start-to-goal order, so
// walk the chain of path-adjacent cells to recover it. Path cells form a
// simple line (each has 1 or 2 path-neighbors); the two degree-1 ends are the
// cell next to start and the end cell itself (frame.current) - trace from the
// other one.
function tracePathOrder(grid, endCell) {
  const rows = grid.length;
  const cols = grid[0].length;
  const isPath = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] === 'path';
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isPath(r, c)) cells.push([r, c]);
    }
  }
  if (cells.length <= 1) return cells;

  const key = ([r, c]) => `${r},${c}`;
  const neighborsOf = ([r, c]) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([nr, nc]) => isPath(nr, nc));
  const endpoints = cells.filter((cell) => neighborsOf(cell).length === 1);
  const startCell = endpoints.find(([r, c]) => !(endCell && r === endCell[0] && c === endCell[1])) || endpoints[0] || cells[0];

  const ordered = [startCell];
  const visited = new Set([key(startCell)]);
  let current = startCell;
  while (ordered.length < cells.length) {
    const next = neighborsOf(current).find((n) => !visited.has(key(n)));
    if (!next) break;
    ordered.push(next);
    visited.add(key(next));
    current = next;
  }
  return ordered;
}

// Per category: an ordered low-to-high sequence of "reveal items", the
// matching ascending pitches, and a render(ctx, width, height, revealedCount)
// that draws the first revealedCount items (in that order) green and the rest
// white/neutral. Returns null if the category or frame doesn't support it.
export function getRevealPlan(categoryId, frame) {
  if (!frame) return null;

  if (categoryId === 'sorting' || categoryId === 'searching') {
    const array = frame.array;
    if (!Array.isArray(array) || !array.every((v) => typeof v === 'number')) return null;
    const order = array.map((v, i) => i).sort((a, b) => array[a] - array[b]);
    return {
      total: order.length,
      pitches: order.map((i) => valueToTone(array[i])),
      render: (ctx, w, h, count) => renderReveal(ctx, w, h, array, count),
    };
  }

  if (categoryId === 'graph') {
    const visited = frame.visited;
    if (!Array.isArray(visited) || !visited.length) return null;
    return {
      total: visited.length,
      pitches: visited.map((_, i) => positionToTone(i, visited.length)),
      render: (ctx, w, h, count) => renderGraphReveal(ctx, w, h, frame, new Set(visited.slice(0, count))),
    };
  }

  if (categoryId === 'tree') {
    if (!frame.positions) return null;
    const order = [...frame.positions.entries()].sort((a, b) => a[1].value - b[1].value).map(([id]) => id);
    if (!order.length) return null;
    return {
      total: order.length,
      pitches: order.map((id) => valueToTone(frame.positions.get(id).value)),
      render: (ctx, w, h, count) => renderTreeReveal(ctx, w, h, frame, new Set(order.slice(0, count))),
    };
  }

  if (categoryId === 'pathfinding') {
    if (!frame.grid) return null;
    const order = tracePathOrder(frame.grid, frame.current);
    if (!order.length) return null;
    return {
      total: order.length,
      pitches: order.map((_, i) => positionToTone(i, order.length)),
      render: (ctx, w, h, count) =>
        renderMazeReveal(ctx, w, h, frame, new Set(order.slice(0, count).map(([r, c]) => `${r},${c}`))),
    };
  }

  if (categoryId === 'dp') {
    if (!frame.table) return null;
    const cells = [];
    frame.table.forEach((row, r) => row.forEach((value, c) => {
      if (value >= 0) cells.push([r, c, value]);
    }));
    if (!cells.length) return null;
    cells.sort((a, b) => a[2] - b[2]);
    const maxValue = Math.max(1, ...cells.map((c) => c[2]));
    return {
      total: cells.length,
      pitches: cells.map(([, , v]) => valueToTone(v, maxValue)),
      render: (ctx, w, h, count) =>
        renderDpReveal(ctx, w, h, frame, new Set(cells.slice(0, count).map(([r, c]) => `${r},${c}`))),
    };
  }

  if (categoryId === 'string') {
    const matches = frame.matches;
    if (!Array.isArray(matches) || !matches.length) return null;
    return {
      total: matches.length,
      pitches: matches.map((_, i) => positionToTone(i, matches.length)),
      render: (ctx, w, h, count) => renderStringReveal(ctx, w, h, frame, count),
    };
  }

  return null;
}

// Paints a low-to-high reveal wipe on panel's canvas over totalDurationMs,
// matching the pacing of the finish sweep sound. Sets panel.revealing so the
// engine's normal per-tick render leaves this canvas alone until the wipe
// finishes (it would otherwise redraw over it every frame).
export function animateReveal(panel, plan, totalDurationMs = 700) {
  panel.revealing = true;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const revealedCount = Math.min(plan.total, Math.round((elapsed / totalDurationMs) * plan.total));
    plan.render(panel.ctx, panel.width, panel.height, revealedCount);
    if (elapsed < totalDurationMs) {
      requestAnimationFrame(tick);
    } else {
      panel.revealing = false;
    }
  }
  requestAnimationFrame(tick);
}
