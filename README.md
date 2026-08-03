# Algorithm Arena

[![CI](https://github.com/Beepbob07/algorithm-arena/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Beepbob07/algorithm-arena/actions/workflows/ci.yml)

Algorithm Arena is a website for visually comparing algorithms. Pick a
category, choose how hard the underlying problem should be, add two or more
algorithms as contenders, and watch them race against each other on the same
problem instance.

## Categories

- **Sorting** — Bubble, Selection, Insertion, Quick, and Merge sort racing to
  order the same list.
- **Searching** — Linear vs. Binary search on the same sorted list.
- **Maze / Pathfinding** — BFS, DFS, Dijkstra, and A* finding a route through
  the same grid.
- **Graph Traversal** — BFS vs. DFS exploring the same random graph.
- **Tree Traversal** — Preorder, Inorder, Postorder, and Level Order visiting
  the same binary tree.
- **Dynamic Programming** — Bottom-up tabulation vs. top-down memoization
  solving the same longest-common-subsequence problem.
- **String Matching** — Naive search vs. Knuth-Morris-Pratt finding the same
  pattern in the same text.

Each category exposes a difficulty control (list size, grid size, node
count, string length, and so on) that regenerates the underlying problem, and
lets you add or remove any number of contenders before running the race.

## Running locally

Requires Node.js 18 or later.

```
npm start
```

Then open http://localhost:3000 in a browser.

### Running tests

```
npm test
```

## Project structure

```
server.js                 minimal static file server (no dependencies)
public/index.html         page layout
public/style.css          styling
public/js/main.js         UI wiring: category, difficulty, contenders, run loop
public/js/engine.js       step-by-step playback engine shared by all categories
public/js/categories.js   category definitions (algorithms, problem setup, rendering)
public/js/render.js       canvas rendering for each visualization type
public/js/algorithms/     algorithm implementations, grouped by category
```
