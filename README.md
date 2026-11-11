# Algorithm Arena

[![CI](https://github.com/nguyenhanhatminh0105-hue/Algorithm-Visualizer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nguyenhanhatminh0105-hue/Algorithm-Visualizer/actions/workflows/ci.yml)

**[Live demo](https://nguyenhanhatminh0105-hue.github.io/Algorithm-Visualizer/)**: runs in the browser, nothing to install.

Algorithm Arena is a website for visually comparing algorithms. Pick a
category, choose how hard the underlying problem should be, add two or more
algorithms as contenders, and watch them race against each other on the same
problem instance.

![Breadth-first search, Dijkstra and A* racing through the same weighted maze, with the scoreboard above](docs/screenshot.png)

## How a race reads

- **Scoreboard.** Each contender has a lane that fills as it works towards its
  own finish line. The step count for every contender is worked out before the
  race starts (`js/standings.js`), so the lanes show true progress, not a guess.
- **Result.** Fewest steps wins. The scoreboard gives each finisher a place and
  how far behind the winner it was, and sums the race up in one line, for
  example "Depth-First Search wins in 156 steps, 48% fewer than Breadth-First Search (299)".
- **Controls.** Pick a category from the tabs, toggle contenders on and off,
  set the input size, and change the speed (1× to 8×) while the race runs.
- **Links.** Each category has its own address, such as
  [`#pathfinding`](https://nguyenhanhatminh0105-hue.github.io/Algorithm-Visualizer/#pathfinding).

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

Each category has a size control (list size, grid size, node count, string
length, and so on) that regenerates the underlying problem. Any two or more of
its algorithms can race at once, always on the same input.

## Results

Average over 500 random inputs per category, at the default size. Every
algorithm in a category gets the same 500 inputs. Reproduce with `npm run bench`.

**Sorting** (list size 40)

| Algorithm | Average steps | Compared with the fastest | Fewest steps in |
|---|--:|--:|--:|
| Quick Sort | 278 | fastest | 100% of races |
| Merge Sort | 381 | 1.4× | 0% of races |
| Insertion Sort | 803 | 2.9× | 0% of races |
| Selection Sort | 815 | 2.9× | 0% of races |
| Bubble Sort | 1,138 | 4.1× | 0% of races |

**Maze / Pathfinding** (grid size 20)

| Algorithm | Average steps | Compared with the fastest | Fewest steps in |
|---|--:|--:|--:|
| Depth-First Search | 143 | fastest | 98% of races |
| A* Search | 284 | 2.0× | 2% of races |
| Dijkstra's Algorithm | 307 | 2.1× | 0% of races |
| Breadth-First Search | 309 | 2.2× | 0% of races |

**Dynamic Programming** (string length 12)

| Algorithm | Average steps | Compared with the fastest | Fewest steps in |
|---|--:|--:|--:|
| Top-Down Memoization | 114 | fastest | 100% of races |
| Bottom-Up Tabulation | 144 | 1.3× | 0% of races |

**Searching** (list size 40)

| Algorithm | Average steps | Compared with the fastest | Fewest steps in |
|---|--:|--:|--:|
| Binary Search | 4 | fastest | 92% of races |
| Linear Search | 21 | 4.9× | 8% of races |

**String Matching** (text length 60)

| Algorithm | Average steps | Compared with the fastest | Fewest steps in |
|---|--:|--:|--:|
| Knuth-Morris-Pratt | 70 | fastest | 95% of races |
| Naive Search | 73 | 1.1× | 12% of races |

How to read these:

- **A step is one move the animation shows**, such as a comparison, a swap or a
  cell explored. It is a fair way to compare algorithms on the same input, but
  it is not running time.
- **Depth-first search reaches the goal in the fewest steps, but its route is
  rarely the best one.** Breadth-first search explores more and finds the route
  with the fewest cells. Dijkstra and A* find the cheapest route on this
  weighted grid, and A* needs fewer steps to do it.
- **Memoization skips table cells the answer never needs**, which is why it
  beats filling the whole table.
- **Knuth-Morris-Pratt only edges out naive search here** because the text is
  random over five letters, so mismatches come early. Its advantage grows on
  repetitive text.
- Graph and tree traversals visit every node exactly once, so those two
  categories always tie on steps. They are there to compare the visiting order.

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
public/js/main.js         UI wiring: tabs, contenders, scoreboard, run loop
public/js/engine.js       step-by-step playback engine shared by all categories
public/js/standings.js    scoreboard maths: step counts, places, the result line
public/js/reveal.js       the finish animation for each category
public/js/categories.js   category definitions (algorithms, problem setup, rendering)
public/js/render.js       canvas rendering for each visualization type
public/js/algorithms/     algorithm implementations, grouped by category
scripts/bench.js          the numbers in Results, from 500 random inputs per category
```
