// Runs every algorithm on the same random inputs, many times over, and prints
// the average step counts as Markdown tables. The README's results come from
// this script: `npm run bench`.
import { CATEGORIES } from '../public/js/categories.js';
import { countSteps } from '../public/js/standings.js';

const RUNS = 500;
const format = (n) => Math.round(n).toLocaleString('en-US');

for (const category of CATEGORIES) {
  const size = category.difficulty.default;
  const totals = new Map(category.algorithms.map((a) => [a.id, 0]));
  const wins = new Map(category.algorithms.map((a) => [a.id, 0]));

  for (let run = 0; run < RUNS; run++) {
    const problem = category.createProblem(size);
    const steps = category.algorithms.map((a) => [a.id, countSteps(category, a, problem)]);
    const best = Math.min(...steps.map(([, n]) => n));
    for (const [id, n] of steps) {
      totals.set(id, totals.get(id) + n);
      if (n === best) wins.set(id, wins.get(id) + 1);
    }
  }

  const rows = category.algorithms
    .map((a) => ({ name: a.name, mean: totals.get(a.id) / RUNS, wins: wins.get(a.id) / RUNS }))
    .sort((a, b) => a.mean - b.mean);
  const fastest = rows[0].mean;

  console.log(`**${category.name}** (${category.difficulty.label.toLowerCase()} ${size})\n`);
  console.log('| Algorithm | Average steps | Compared with the fastest | Fewest steps in |');
  console.log('|---|--:|--:|--:|');
  for (const row of rows) {
    const ratio = row.mean / fastest;
    console.log(`| ${row.name} | ${format(row.mean)} | ${ratio < 1.005 ? 'fastest' : `${ratio.toFixed(1)}×`} | ${Math.round(row.wins * 100)}% of races |`);
  }
  console.log('');
}
