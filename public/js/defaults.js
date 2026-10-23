// What the arena shows before anyone touches the controls: two contenders ready
// to race, each drawn at its starting position.

/** The first two algorithms of a category, so a first visit can press Run straight away. */
export function defaultContenders(category) {
  return category.algorithms.slice(0, 2);
}

/**
 * The frame an algorithm starts from. Runs on a copy, because some algorithms
 * mutate their input, and the real race must start from the same problem.
 */
export function firstFrame(category, algorithm, problem) {
  const generator = category.createRun(algorithm, structuredClone(problem));
  const { value } = generator.next();
  return value ?? null;
}
