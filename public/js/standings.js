// The numbers behind the scoreboard. Everything here is plain data in, plain
// data out, so it runs under Node without a page.

/**
 * How many steps an algorithm takes on a problem. Runs on a copy, because some
 * algorithms mutate their input and the real race must start from the same one.
 * The scoreboard uses this as the finish line each contender is racing towards.
 */
export function countSteps(category, algorithm, problem) {
  const generator = category.createRun(algorithm, structuredClone(problem));
  let steps = 0;
  while (!generator.next().done) steps += 1;
  return steps;
}

/** A contender's progress towards its own finish line, from 0 to 1. */
export function progress(steps, totalSteps) {
  if (!totalSteps) return 1;
  return Math.min(1, steps / totalSteps);
}

/**
 * Finishing places for the runs that are done, keyed by run id. Fewer steps is
 * better, and equal step counts share a place (1, 1, 3).
 */
export function places(runs) {
  const finished = runs.filter((run) => run.done).sort((a, b) => a.finishedAtStep - b.finishedAtStep);
  const result = new Map();
  finished.forEach((run, index) => {
    const previous = finished[index - 1];
    const tied = previous && previous.finishedAtStep === run.finishedAtStep;
    result.set(run.id, tied ? result.get(previous.id) : index + 1);
  });
  return result;
}

export function ordinal(place) {
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' };
  const lastTwo = place % 100;
  return `${place}${(lastTwo >= 11 && lastTwo <= 13) ? 'th' : suffix[place % 10] || 'th'}`;
}

/**
 * How far behind the winner a finished run was: "2.4× the winner", or the
 * plain difference when the two are too close for a ratio to say anything.
 * Empty for a winner.
 */
export function gapToWinner(run, winnerSteps) {
  if (!run.done || !winnerSteps || run.finishedAtStep <= winnerSteps) return '';
  const ratio = run.finishedAtStep / winnerSteps;
  const extra = run.finishedAtStep - winnerSteps;
  if (ratio < 1.05) return `${extra.toLocaleString('en-US')} more ${extra === 1 ? 'step' : 'steps'}`;
  return `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× the winner`;
}

/** One sentence for the finished race, or null while anyone is still running. */
export function summary(runs) {
  if (!runs.length || !runs.every((run) => run.done)) return null;
  const sorted = [...runs].sort((a, b) => a.finishedAtStep - b.finishedAtStep);
  const winner = sorted[0];
  const last = sorted[sorted.length - 1];
  const steps = (n) => `${n.toLocaleString('en-US')} ${n === 1 ? 'step' : 'steps'}`;
  const winners = sorted.filter((run) => run.finishedAtStep === winner.finishedAtStep);

  if (winners.length === sorted.length) return `A tie: every contender took ${steps(winner.finishedAtStep)}.`;
  if (winners.length > 1) {
    return `${winners.map((run) => run.algorithmName).join(' and ')} tie for first in ${steps(winner.finishedAtStep)}.`;
  }
  const saved = Math.round((1 - winner.finishedAtStep / last.finishedAtStep) * 100);
  return `${winner.algorithmName} wins in ${steps(winner.finishedAtStep)}, ${saved}% fewer than ${last.algorithmName} (${last.finishedAtStep.toLocaleString('en-US')}).`;
}
