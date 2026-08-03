let sharedAudioContext = null;
let sharedCompressor = null;
let isMuted = false;

// C major pentatonic across two octaves: no combination of these notes ever
// clashes, so when multiple contenders' tones overlap it still sounds like
// music instead of noise.
const SCALE_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0, 880.0];

function getAudioGraph() {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    // All tones route through one shared compressor so several contenders
    // playing at once gets gently leveled instead of clipping into distortion.
    sharedCompressor = sharedAudioContext.createDynamicsCompressor();
    sharedCompressor.threshold.value = -24;
    sharedCompressor.knee.value = 20;
    sharedCompressor.ratio.value = 8;
    sharedCompressor.attack.value = 0.003;
    sharedCompressor.release.value = 0.15;
    sharedCompressor.connect(sharedAudioContext.destination);
  }
  return { ctx: sharedAudioContext, compressor: sharedCompressor };
}

export function setMuted(value) {
  isMuted = value;
}

export function valueToTone(value, maxValue = 100) {
  const ratio = Math.max(0, Math.min(1, value / maxValue));
  return SCALE_HZ[Math.round(ratio * (SCALE_HZ.length - 1))];
}

export function playTone(frequency, durationMs, delaySec = 0) {
  if (isMuted) return;
  const { ctx, compressor } = getAudioGraph();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const startAt = ctx.currentTime + delaySec;
  const durationSec = durationMs / 1000;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(0.18, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

  oscillator.connect(gain);
  gain.connect(compressor);

  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec);
}

export function playStep() {
  playTone(SCALE_HZ[2], 45);
}

export function playFinish() {
  playTone(SCALE_HZ[5], 90);
  playTone(SCALE_HZ[8], 140, 0.09);
}
