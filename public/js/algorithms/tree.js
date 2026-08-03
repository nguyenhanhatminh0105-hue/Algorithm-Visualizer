function buildTree(values) {
  let idCounter = 0;
  function insert(node, value) {
    if (!node) return { id: idCounter++, value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }
  let root = null;
  for (const v of values) root = insert(root, v);
  return root;
}

function layout(root) {
  let x = 0;
  const positions = new Map();
  function assign(node, depth) {
    if (!node) return;
    assign(node.left, depth + 1);
    positions.set(node.id, { x: x++, y: depth, value: node.value });
    assign(node.right, depth + 1);
  }
  assign(root, 0);
  return positions;
}

export function generateTree(size) {
  const values = new Set();
  while (values.size < size) values.add(1 + Math.floor(Math.random() * 99));
  const root = buildTree([...values]);
  const positions = layout(root);
  return { root, positions };
}

function snapshot(tree, visited, current) {
  return { root: tree.root, positions: tree.positions, visited: [...visited], current };
}

export function* preorder(tree) {
  const visited = [];
  function* walk(node) {
    if (!node) return;
    visited.push(node.id);
    yield snapshot(tree, visited, node.id);
    yield* walk(node.left);
    yield* walk(node.right);
  }
  yield* walk(tree.root);
  return snapshot(tree, visited, null);
}

export function* inorder(tree) {
  const visited = [];
  function* walk(node) {
    if (!node) return;
    yield* walk(node.left);
    visited.push(node.id);
    yield snapshot(tree, visited, node.id);
    yield* walk(node.right);
  }
  yield* walk(tree.root);
  return snapshot(tree, visited, null);
}

export function* postorder(tree) {
  const visited = [];
  function* walk(node) {
    if (!node) return;
    yield* walk(node.left);
    yield* walk(node.right);
    visited.push(node.id);
    yield snapshot(tree, visited, node.id);
  }
  yield* walk(tree.root);
  return snapshot(tree, visited, null);
}

export function* levelOrder(tree) {
  const visited = [];
  const queue = tree.root ? [tree.root] : [];
  while (queue.length) {
    const node = queue.shift();
    visited.push(node.id);
    yield snapshot(tree, visited, node.id);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return snapshot(tree, visited, null);
}
