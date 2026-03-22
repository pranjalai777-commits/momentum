// Web Audio API sound effects — no external files needed
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playTick(pitch: number = 1) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 600 * pitch;
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
  } catch {}
}

export function playUrgentTick() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.1);
  } catch {}
}

export function playSuccess() {
  try {
    const c = getCtx();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {}
}

export function playEpicSuccess() {
  try {
    const c = getCtx();
    // Triumphant fanfare — major chord arpeggio with harmonics
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C5 E5 G5 C6 E6 G6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const osc2 = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc2.type = "triangle";
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 1.002; // slight detune for richness
      const t = c.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.5);
      osc2.stop(t + 0.5);
    });
  } catch {}
}

export function playLaunch() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.2);
  } catch {}
}

export function playWarning() {
  try {
    const c = getCtx();
    // Two-tone warning alarm
    for (let i = 0; i < 3; i++) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.value = i % 2 === 0 ? 700 : 900;
      const t = c.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  } catch {}
}

export function playAlarm() {
  try {
    const c = getCtx();
    // Urgent alarm — alternating tones
    for (let i = 0; i < 6; i++) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = i % 2 === 0 ? 600 : 800;
      const t = c.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  } catch {}
}

export function playSmallReward() {
  try {
    const c = getCtx();
    // Gentle two-note acknowledgement
    const notes = [440, 554]; // A4 C#5
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {}
}

export function playLevelUp() {
  try {
    const c = getCtx();
    // Epic ascending scale with harmonics
    const notes = [523, 659, 784, 1047, 1319, 1568, 2093];
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const osc2 = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc2.type = "triangle";
      osc.frequency.value = freq;
      osc2.frequency.value = freq * 2;
      const t = c.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.6);
      osc2.stop(t + 0.6);
    });
  } catch {}
}

export function playTimerTick() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.04, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.05);
  } catch {}
}

export function playExtend() {
  try {
    const c = getCtx();
    // Ascending "granted" sound
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.3);
  } catch {}
}
