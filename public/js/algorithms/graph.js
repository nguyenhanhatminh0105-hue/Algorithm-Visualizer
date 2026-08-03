export function generateGraph(nodeCount) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (2 * Math.PI * i) / nodeCount;
    return { id: i, x: Math.cos(angle), y: Math.sin(angle) };
  });
  const order = [...Array(nodeCount).keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const adjacency = Array.from({ length: nodeCount }, () => new Set());
  const edges = [];
  for (let i = 1; i < order.length; i++) {
    const a = order[i];
    const b = order[Math.floor(Math.random() * i)];
    adjacency[a].add(b);
    adjacency[b].add(a);
    edges.push([a, b]);
  }
  const extraEdges = Math.floor(nodeCount / 3);
  for (let i = 0; i < extraEdges; i++) {
    const a = Math.floor(Math.random() * nodeCount);
    const b = Math.floor(Math.random() * nodeCount);
    if (a !== b && !adjacency[a].has(b)) {
      adjacency[a].add(b);
      adjacency[b].add(a);
      edges.push([a, b]);
    }
  }
  return { nodes, edges, adjacency, start: 0 };
}

function snapshot(graph, visited, current) {
  return { nodes: graph.nodes, edges: graph.edges, visited: [...visited], current };
}

export function* bfsGraph(graph) {
  const { adjacency, start } = graph;
  const visited = new Set([start]);
  const queue = [start];
  let qi = 0;
  yield snapshot(graph, visited, start);
  while (qi < queue.length) {
    const node = queue[qi++];
    for (const next of [...adjacency[node]].sort((a, b) => a - b)) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
      yield snapshot(graph, visited, next);
    }
  }
  return snapshot(graph, visited, null);
}

export function* dfsGraph(graph) {
  const { adjacency, start } = graph;
  const visited = new Set([start]);
  const stack = [start];
  yield snapshot(graph, visited, start);
  while (stack.length) {
    const node = stack[stack.length - 1];
    let advanced = false;
    for (const next of [...adjacency[node]].sort((a, b) => a - b)) {
      if (visited.has(next)) continue;
      visited.add(next);
      stack.push(next);
      yield snapshot(graph, visited, next);
      advanced = true;
      break;
    }
    if (!advanced) stack.pop();
  }
  return snapshot(graph, visited, null);
}
