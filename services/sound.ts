// Short synthesized sounds (Web Audio), so the app ships no audio files.

export type Sound = 'correct' | 'wrong' | 'boom' | 'milestone' | 'drop' | 'tick' | 'game_over' | 'personal_best';

let ctx: AudioContext | null = null;

function tone(c: AudioContext, freq: number, start: number, length: number, type: OscillatorType, volume: number, endFreq?: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + length);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + length);
}

/** White noise, `seconds` long (made once per length and reused). */
const noiseCache = new Map<number, AudioBuffer>();
function noise(c: AudioContext, seconds: number) {
  let buffer = noiseCache.get(seconds);
  if (!buffer) {
    buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseCache.set(seconds, buffer);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  return src;
}

/** Soft clipping: makes the explosion crunchy and loud without harsh digital clipping. */
function drive(c: AudioContext, amount: number) {
  const shaper = c.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  shaper.curve = curve;
  shaper.oversample = '4x';
  return shaper;
}

/**
 * A new plane: a clean sonar-style ping (C6, gliding down a touch) with a
 * softer echo just after it.
 */
function radarPing(c: AudioContext, now: number) {
  tone(c, 1046.5, now, 0.5, 'sine', 0.09, 980);
  tone(c, 1046.5, now + 0.18, 0.4, 'sine', 0.03, 990);
}

/**
 * Explosion, in layers: a sharp crack, a heavy distorted blast that darkens as it
 * fades, a deep sub drop you feel, and crackling debris after it.
 */
function explosion(c: AudioContext, now: number) {
  const master = c.createDynamicsCompressor();
  master.threshold.value = -14;
  master.knee.value = 6;
  master.ratio.value = 6;
  master.attack.value = 0.002;
  master.release.value = 0.25;
  const out = c.createGain();
  out.gain.value = 1.0;
  master.connect(out).connect(c.destination);

  // 1. Crack: a very short, bright burst.
  const crack = noise(c, 0.1);
  const crackHp = c.createBiquadFilter();
  crackHp.type = 'highpass';
  crackHp.frequency.value = 1800;
  const crackGain = c.createGain();
  crackGain.gain.setValueAtTime(0.9, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  crack.connect(crackHp).connect(crackGain).connect(master);
  crack.start(now);
  crack.stop(now + 0.08);

  // 2. Blast: distorted noise, low-pass falling from bright to rumble.
  const blast = noise(c, 1.2);
  const blastLp = c.createBiquadFilter();
  blastLp.type = 'lowpass';
  blastLp.Q.value = 0.8;
  blastLp.frequency.setValueAtTime(6000, now);
  blastLp.frequency.exponentialRampToValueAtTime(900, now + 0.18);
  blastLp.frequency.exponentialRampToValueAtTime(120, now + 1.0);
  const blastGain = c.createGain();
  blastGain.gain.setValueAtTime(0.0001, now);
  blastGain.gain.exponentialRampToValueAtTime(0.85, now + 0.008);
  blastGain.gain.exponentialRampToValueAtTime(0.35, now + 0.25);
  blastGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
  blast.connect(drive(c, 3)).connect(blastLp).connect(blastGain).connect(master);
  blast.start(now);
  blast.stop(now + 1.15);

  // 3. Sub drop: a sine that falls from punchy to very low.
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(160, now);
  sub.frequency.exponentialRampToValueAtTime(42, now + 0.45);
  const subGain = c.createGain();
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.9, now + 0.01);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  sub.connect(drive(c, 2)).connect(subGain).connect(master);
  sub.start(now);
  sub.stop(now + 0.62);

  // 4. Debris: random little crackles over the next half second.
  for (let i = 0; i < 14; i++) {
    const t = now + 0.08 + Math.random() * 0.55;
    const bit = noise(c, 0.1);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500 + Math.random() * 3500;
    bp.Q.value = 3;
    const g = c.createGain();
    const level = 0.25 * (1 - (t - now) / 0.7);
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03 + Math.random() * 0.03);
    bit.connect(bp).connect(g).connect(master);
    bit.start(t);
    bit.stop(t + 0.07);
  }
}

export function playSound(type: Sound) {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;

  switch (type) {
    case 'correct':
      tone(ctx, 523.25, now, 0.1, 'sine', 0.06);
      tone(ctx, 659.25, now + 0.09, 0.12, 'sine', 0.06);
      break;
    case 'wrong':
      tone(ctx, 180, now, 0.2, 'triangle', 0.06, 140);
      break;
    case 'boom':
      explosion(ctx, now);
      break;
    case 'milestone':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx!, f, now + i * 0.07, 0.1, 'triangle', 0.06));
      break;
    case 'drop':
      radarPing(ctx, now);
      break;
    case 'tick':
      tone(ctx, 880, now, 0.05, 'square', 0.015);
      break;
    case 'game_over':
      [783.99, 659.25, 523.25, 392].forEach((f, i) => tone(ctx!, f, now + i * 0.14, 0.2, 'sine', 0.06));
      break;
    case 'personal_best':
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(ctx!, f, now + i * 0.09, 0.2, 'sine', 0.07));
      break;
  }
}
