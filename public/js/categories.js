import * as sorting from './algorithms/sorting.js';
import * as searching from './algorithms/searching.js';
import * as maze from './algorithms/maze.js';
import * as graph from './algorithms/graph.js';
import * as tree from './algorithms/tree.js';
import * as dp from './algorithms/dp.js';
import * as stringMatch from './algorithms/string.js';
import {
  renderBars,
  renderSearch,
  renderGrid,
  renderGraph,
  renderTree,
  renderDpGrid,
  renderStringMatch,
} from './render.js';

function randomArray(size) {
  return Array.from({ length: size }, () => 5 + Math.floor(Math.random() * 95));
}

export const CATEGORIES = [
  {
    id: 'sorting',
    name: 'Sorting',
    description: 'Compare how different algorithms rearrange a list into order.',
    difficulty: { label: 'List size', min: 8, max: 120, step: 1, default: 40 },
    algorithms: [
      { id: 'bubble', name: 'Bubble Sort', fn: sorting.bubbleSort },
      { id: 'selection', name: 'Selection Sort', fn: sorting.selectionSort },
      { id: 'insertion', name: 'Insertion Sort', fn: sorting.insertionSort },
      { id: 'quick', name: 'Quick Sort', fn: sorting.quickSort },
      { id: 'merge', name: 'Merge Sort', fn: sorting.mergeSort },
    ],
    render: renderBars,
    createProblem(difficulty) {
      return { array: randomArray(difficulty) };
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem.array);
    },
  },
  {
    id: 'searching',
    name: 'Searching',
    description: 'Compare how different algorithms locate a value in a sorted list.',
    difficulty: { label: 'List size', min: 8, max: 200, step: 1, default: 40 },
    algorithms: [
      { id: 'linear', name: 'Linear Search', fn: searching.linearSearch },
      { id: 'binary', name: 'Binary Search', fn: searching.binarySearch },
    ],
    render: renderSearch,
    createProblem(difficulty) {
      const array = randomArray(difficulty).sort((a, b) => a - b);
      const target = array[Math.floor(Math.random() * array.length)];
      return { array, target };
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem.array, problem.target);
    },
  },
  {
    id: 'pathfinding',
    name: 'Maze / Pathfinding',
    description: 'Compare how different algorithms find a route through a grid.',
    difficulty: { label: 'Grid size', min: 8, max: 40, step: 1, default: 20 },
    algorithms: [
      { id: 'bfs', name: 'Breadth-First Search', fn: maze.bfs },
      { id: 'dfs', name: 'Depth-First Search', fn: maze.dfs },
      { id: 'dijkstra', name: "Dijkstra's Algorithm", fn: maze.dijkstra },
      { id: 'astar', name: 'A* Search', fn: maze.astar },
    ],
    render: renderGrid,
    createProblem(difficulty) {
      return maze.generateMaze(difficulty, difficulty, 0.22);
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem);
    },
  },
  {
    id: 'graph',
    name: 'Graph Traversal',
    description: 'Compare how different algorithms explore a connected graph.',
    difficulty: { label: 'Node count', min: 6, max: 40, step: 1, default: 16 },
    algorithms: [
      { id: 'bfs', name: 'Breadth-First Search', fn: graph.bfsGraph },
      { id: 'dfs', name: 'Depth-First Search', fn: graph.dfsGraph },
    ],
    render: renderGraph,
    createProblem(difficulty) {
      return graph.generateGraph(difficulty);
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem);
    },
  },
  {
    id: 'tree',
    name: 'Tree Traversal',
    description: 'Compare the order in which different traversals visit a binary tree.',
    difficulty: { label: 'Node count', min: 5, max: 60, step: 1, default: 20 },
    algorithms: [
      { id: 'preorder', name: 'Preorder', fn: tree.preorder },
      { id: 'inorder', name: 'Inorder', fn: tree.inorder },
      { id: 'postorder', name: 'Postorder', fn: tree.postorder },
      { id: 'level', name: 'Level Order', fn: tree.levelOrder },
    ],
    render: renderTree,
    createProblem(difficulty) {
      return tree.generateTree(difficulty);
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem);
    },
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    description: 'Compare how a table-filling and a memoized approach solve longest common subsequence.',
    difficulty: { label: 'String length', min: 4, max: 30, step: 1, default: 12 },
    algorithms: [
      { id: 'tabulation', name: 'Bottom-Up Tabulation', fn: dp.lcsTabulation },
      { id: 'memoized', name: 'Top-Down Memoization', fn: dp.lcsMemoized },
    ],
    render: renderDpGrid,
    createProblem(difficulty) {
      return dp.generateLcsProblem(difficulty);
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem);
    },
  },
  {
    id: 'string',
    name: 'String Matching',
    description: 'Compare how different algorithms find a pattern inside a longer text.',
    difficulty: { label: 'Text length', min: 12, max: 200, step: 1, default: 60 },
    algorithms: [
      { id: 'naive', name: 'Naive Search', fn: stringMatch.naiveSearch },
      { id: 'kmp', name: 'Knuth-Morris-Pratt', fn: stringMatch.kmpSearch },
    ],
    render: renderStringMatch,
    createProblem(difficulty) {
      return stringMatch.generateStringProblem(difficulty);
    },
    createRun(algorithm, problem) {
      return algorithm.fn(problem);
    },
  },
];
