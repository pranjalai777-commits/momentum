#!/usr/bin/env node
/**
 * Regenerates all .wav files to exactly match the wireframe's Web Audio API sound specs.
 * Source: Wireframe/ignite-5-go-main/src/lib/sounds.ts
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '../assets/sounds-v2');

// ── WAV writer ────────────────────────────────────────────────────────────────
function writeWav(filename, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  let off = 0;

  buf.write('RIFF', off); off += 4;
  buf.writeUInt32LE(36 + dataSize, off); off += 4;
  buf.write('WAVE', off); off += 4;
  buf.write('fmt ', off); off += 4;
  buf.writeUInt32LE(16, off); off += 4;
  buf.writeUInt16LE(1, off); off += 2;   // PCM
  buf.writeUInt16LE(1, off); off += 2;   // mono
  buf.writeUInt32LE(SAMPLE_RATE, off); off += 4;
  buf.writeUInt32LE(SAMPLE_RATE * 2, off); off += 4;
  buf.writeUInt16LE(2, off); off += 2;
  buf.writeUInt16LE(16, off); off += 2;
  buf.write('data', off); off += 4;
  buf.writeUInt32LE(dataSize, off); off += 4;

  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), off);
    off += 2;
  }

  fs.writeFileSync(path.join(OUT_DIR, filename), buf);
  const ms = ((numSamples / SAMPLE_RATE) * 1000).toFixed(0);
  console.log(`  ✓  ${filename.padEnd(20)} ${ms}ms`);
}

// ── Oscillator waveforms ──────────────────────────────────────────────────────
const osc = {
  sine:     (f, t) => Math.sin(2 * Math.PI * f * t),
  square:   (f, t) => Math.sign(Math.sin(2 * Math.PI * f * t)) || 1,
  triangle: (f, t) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t)),
  sawtooth: (f, t) => 2 * ((f * t) % 1) - 1,
};

// Exponential ramp: A → B over T seconds  (Web Audio API behaviour)
function expRamp(A, B, t, T) {
  if (t <= 0) return A;
  if (t >= T) return B;
  return A * Math.pow(B / A, t / T);
}

// ── Simple single-oscillator tone ─────────────────────────────────────────────
function genTone({ type = 'sine', freq, gain0, gainEnd, duration }) {
  const n = Math.ceil(SAMPLE_RATE * duration);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    s[i] = expRamp(gain0, gainEnd, t, duration) * osc[type](freq, t);
  }
  return s;
}

// ── Mix layers with per-layer sample offsets ──────────────────────────────────
function mix(layers) {
  let maxLen = 0;
  for (const { samples, offset = 0 } of layers) maxLen = Math.max(maxLen, samples.length + offset);
  const out = new Float32Array(maxLen);
  for (const { samples, offset = 0 } of layers) {
    for (let i = 0; i < samples.length; i++) out[offset + i] += samples[i];
  }
  return out;
}

// ── Frequency-sweep tone (exponential ramp on frequency + gain) ───────────────
function genFreqSweep({ freqStart, freqEnd, freqRampDuration, gain0, gainEnd, totalDuration }) {
  const n = Math.ceil(SAMPLE_RATE * totalDuration);
  const s = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = expRamp(freqStart, freqEnd, t, freqRampDuration);
    const gain = expRamp(gain0, gainEnd, t, totalDuration);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    s[i] = gain * Math.sin(phase);
  }
  return s;
}

function offsetSamples(samples, delaySeconds) {
  return { samples, offset: Math.round(delaySeconds * SAMPLE_RATE) };
}

console.log('\nGenerating sounds from wireframe Web Audio API specs…\n');

// ── 1. tick  — sine 600 Hz, 0.12 s. Web gain is 0.15, but a 600 Hz sine at
// 15% amplitude is nearly inaudible on phone speakers (they roll off mids and
// can't be boosted past player.volume=1), so we encode ~+15 dB for perceived
// parity with the browser.
writeWav('tick.wav',
  genTone({ type: 'sine', freq: 600, gain0: 0.85, gainEnd: 0.001, duration: 0.12 })
);

// ── 2. urgent-tick  — square 880 Hz, gain 0.12 → 0.001, 0.10 s ──────────────
writeWav('urgent-tick.wav',
  genTone({ type: 'square', freq: 880, gain0: 0.12, gainEnd: 0.001, duration: 0.10 })
);

// ── 3. success  — 4-note arpeggio C5 E5 G5 C6, sine, 0.08 s stagger, 0.30 s ─
{
  const notes = [523, 659, 784, 1047];
  writeWav('success.wav', mix(
    notes.map((freq, i) => offsetSamples(
      genTone({ type: 'sine', freq, gain0: 0.18, gainEnd: 0.001, duration: 0.30 }),
      i * 0.08
    ))
  ));
}

// ── 4. epic-success  — 6 notes, sine + detuned triangle, 0.07 s stagger, 0.5 s
{
  const notes = [523, 659, 784, 1047, 1319, 1568];
  const layers = [];
  notes.forEach((freq, i) => {
    const delay = i * 0.07;
    layers.push(offsetSamples(genTone({ type: 'sine',     freq,          gain0: 0.15, gainEnd: 0.001, duration: 0.50 }), delay));
    layers.push(offsetSamples(genTone({ type: 'triangle', freq: freq * 1.002, gain0: 0.15, gainEnd: 0.001, duration: 0.50 }), delay));
  });
  writeWav('epic-success.wav', mix(layers));
}

// ── 5. launch  — sine sweep 200 → 600 Hz (over 0.15 s), gain 0.12 → 0.001, 0.20 s
writeWav('launch.wav',
  genFreqSweep({ freqStart: 200, freqEnd: 600, freqRampDuration: 0.15,
                 gain0: 0.12, gainEnd: 0.001, totalDuration: 0.20 })
);

// ── 6. warning  — 3 × alternating square 700/900 Hz, 0.10 gain, 0.18 s, 0.2 s stagger
{
  const layers = [];
  for (let i = 0; i < 3; i++) {
    layers.push(offsetSamples(
      genTone({ type: 'square', freq: i % 2 === 0 ? 700 : 900, gain0: 0.10, gainEnd: 0.001, duration: 0.18 }),
      i * 0.20
    ));
  }
  writeWav('warning.wav', mix(layers));
}

// ── 7. alarm  — 6 × alternating sawtooth 600/800 Hz, gain 0.08, 0.13 s, 0.15 s stagger
{
  const layers = [];
  for (let i = 0; i < 6; i++) {
    layers.push(offsetSamples(
      genTone({ type: 'sawtooth', freq: i % 2 === 0 ? 600 : 800, gain0: 0.08, gainEnd: 0.001, duration: 0.13 }),
      i * 0.15
    ));
  }
  writeWav('alarm.wav', mix(layers));
}

// ── 8. small-reward  — 2 sine notes A4(440) C#5(554), gain 0.10, 0.25 s, 0.12 s stagger
writeWav('small-reward.wav', mix([
  offsetSamples(genTone({ type: 'sine', freq: 440, gain0: 0.10, gainEnd: 0.001, duration: 0.25 }), 0),
  offsetSamples(genTone({ type: 'sine', freq: 554, gain0: 0.10, gainEnd: 0.001, duration: 0.25 }), 0.12),
]));

// ── 9. level-up  — 7-note ascending scale, sine + triangle@2x, 0.12 gain, 0.60 s, 0.06 s stagger
{
  const notes = [523, 659, 784, 1047, 1319, 1568, 2093];
  const layers = [];
  notes.forEach((freq, i) => {
    const delay = i * 0.06;
    layers.push(offsetSamples(genTone({ type: 'sine',     freq,       gain0: 0.12, gainEnd: 0.001, duration: 0.60 }), delay));
    layers.push(offsetSamples(genTone({ type: 'triangle', freq: freq * 2, gain0: 0.12, gainEnd: 0.001, duration: 0.60 }), delay));
  });
  writeWav('level-up.wav', mix(layers));
}

// ── 10. timer-tick  — sine 1000 Hz, 0.05 s. Web gain 0.04, boosted 3× for
// phone speakers (same reasoning as tick.wav).
writeWav('timer-tick.wav',
  genTone({ type: 'sine', freq: 1000, gain0: 0.12, gainEnd: 0.001, duration: 0.05 })
);

// ── 11. extend  — sine sweep 400 → 800 Hz (over 0.2 s), gain 0.10 → 0.001, 0.30 s
writeWav('extend.wav',
  genFreqSweep({ freqStart: 400, freqEnd: 800, freqRampDuration: 0.20,
                 gain0: 0.10, gainEnd: 0.001, totalDuration: 0.30 })
);

// ── 12. tick-115  — sine 690 Hz (600 * 1.15), 0.12 s. Boosted like tick.wav.
writeWav('tick-115.wav',
  genTone({ type: 'sine', freq: 600 * 1.15, gain0: 0.85, gainEnd: 0.001, duration: 0.12 })
);

// ── 13. tick-130  — sine 780 Hz (600 * 1.30), 0.12 s. Boosted like tick.wav.
writeWav('tick-130.wav',
  genTone({ type: 'sine', freq: 600 * 1.30, gain0: 0.85, gainEnd: 0.001, duration: 0.12 })
);

console.log('\n✅  All 13 sounds generated successfully.\n');
