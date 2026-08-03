export class ContenderRun {
  constructor(id, algorithmName, generator) {
    this.id = id;
    this.algorithmName = algorithmName;
    this.generator = generator;
    this.steps = 0;
    this.done = false;
    this.finishedAtStep = null;
    this.frame = null;
  }

  step() {
    if (this.done) return;
    const result = this.generator.next();
    if (result.done) {
      this.done = true;
      this.finishedAtStep = this.steps;
      if (result.value) this.frame = result.value;
      return;
    }
    this.frame = result.value;
    this.steps += 1;
  }
}

export class Engine {
  constructor({ onTick, stepsPerTick = 1 }) {
    this.runs = [];
    this.onTick = onTick;
    this.stepsPerTick = stepsPerTick;
    this.running = false;
    this._rafId = null;
  }

  setRuns(runs) {
    this.runs = runs;
  }

  setSpeed(stepsPerTick) {
    this.stepsPerTick = Math.max(1, stepsPerTick);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      let allDone = true;
      for (const run of this.runs) {
        if (run.done) continue;
        allDone = false;
        for (let i = 0; i < this.stepsPerTick && !run.done; i++) {
          run.step();
        }
      }
      this.onTick(this.runs);
      if (allDone) {
        this.running = false;
        return;
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  pause() {
    this.running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}
