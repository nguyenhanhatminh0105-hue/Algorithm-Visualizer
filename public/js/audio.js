let sharedAudioContext = null;
let isMuted = false;

function getAudioContext() {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioContext;
}

export function setMuted(value) {
  isMuted = value;
}

export function playTone(frequency, durationMs) {
  if (isMuted) return;
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
  gain.gain.linearRampToValueAtTime(0, now + durationSec);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + durationSec);
}

export function playStep() {
  playTone(440, 40);
}

export function playFinish() {
  playTone(880, 200);
}
