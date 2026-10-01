/**
 * ============================================================================
 * 🎮 SDGVERSE - ESPORTS BATTLE ROYALE AUDIO PACK GENERATOR (MP3 44.1kHz)
 * Generates all original MP3 sound effects requested by user specification.
 * Pure mathematical DSP synthesis + lamejs MP3 encoding. Zero copyrighted samples.
 * ============================================================================
 */

global.MPEGMode = require('lamejs/src/js/MPEGMode.js');
global.Lame = require('lamejs/src/js/Lame.js');
global.BitStream = require('lamejs/src/js/BitStream.js');
const lamejs = require('lamejs');
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const BASE_AUDIO_DIR = path.join(__dirname, 'public', 'audio');

const CATEGORIES = ['music', 'lobby', 'ui', 'game', 'results'];
CATEGORIES.forEach(cat => {
  const dir = path.join(BASE_AUDIO_DIR, cat);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

class SynthTrack {
  constructor(durationSec) {
    this.sampleRate = SAMPLE_RATE;
    this.length = Math.floor(durationSec * SAMPLE_RATE);
    this.left = new Float32Array(this.length);
    this.right = new Float32Array(this.length);
  }

  mix(idx, l, r) {
    if (idx >= 0 && idx < this.length) {
      this.left[idx] += l;
      this.right[idx] += r;
    }
  }

  // Sub-bass impact with exponential pitch sweep
  addImpact({ time = 0, duration = 0.8, startFreq = 140, endFreq = 30, volume = 0.8, pan = 0 }) {
    const start = Math.floor(time * this.sampleRate);
    const count = Math.floor(duration * this.sampleRate);
    let phase = 0;
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx >= this.length) break;
      const t = i / count;
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      phase += (2 * Math.PI * freq) / this.sampleRate;
      const env = Math.exp(-t * 5.0) * (1 - Math.exp(-i / 80));
      const s = (Math.sin(phase) + Math.sin(phase * 1.5) * 0.25) * volume * env;
      this.mix(idx, s * panL, s * panR);
    }
  }

  // Harmonic tone with attack and decay
  addTone({ time = 0, duration = 0.4, freq = 440, type = 'sine', volume = 0.5, attack = 0.005, decay = 0.15, pan = 0, sparkle = 0 }) {
    const start = Math.floor(time * this.sampleRate);
    const count = Math.floor(duration * this.sampleRate);
    const atk = Math.max(1, Math.floor(attack * this.sampleRate));
    let phase = 0;
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx >= this.length) break;
      phase += (2 * Math.PI * freq) / this.sampleRate;

      let env = 1.0;
      if (i < atk) env = i / atk;
      else env = Math.exp(-(i - atk) / (decay * this.sampleRate));

      let s = 0;
      if (type === 'sine') s = Math.sin(phase);
      else if (type === 'triangle') s = 2 * Math.abs(2 * ((phase / (2 * Math.PI)) % 1) - 1) - 1;
      else if (type === 'saw') s = 2 * ((phase / (2 * Math.PI)) % 1) - 1;

      if (sparkle > 0) s += Math.sin(phase * 2) * sparkle;
      this.mix(idx, s * volume * env * panL, s * volume * env * panR);
    }
  }

  // Pitch sweep (risers / falls)
  addSweep({ time = 0, duration = 0.5, startFreq = 200, endFreq = 1200, type = 'saw', volume = 0.4, panStart = -0.4, panEnd = 0.4 }) {
    const start = Math.floor(time * this.sampleRate);
    const count = Math.floor(duration * this.sampleRate);
    let phase = 0;

    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx >= this.length) break;
      const t = i / count;
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      phase += (2 * Math.PI * freq) / this.sampleRate;

      const pan = panStart + (panEnd - panStart) * t;
      const panL = Math.cos((pan + 1) * Math.PI / 4);
      const panR = Math.sin((pan + 1) * Math.PI / 4);
      const env = Math.sin(t * Math.PI);

      let s = (type === 'saw') ? (2 * ((phase / (2 * Math.PI)) % 1) - 1) : Math.sin(phase);
      this.mix(idx, s * volume * env * panL, s * volume * env * panR);
    }
  }

  // Radio squelch / noise burst (comm chatter texture)
  addRadioSquelch({ time = 0, duration = 0.15, centerFreq = 1800, volume = 0.35, pan = 0 }) {
    const start = Math.floor(time * this.sampleRate);
    const count = Math.floor(duration * this.sampleRate);
    let y1 = 0, y2 = 0;
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    const omega = (2 * Math.PI * centerFreq) / this.sampleRate;
    const Q = 3.0;
    const alpha = Math.sin(omega) / (2 * Q);
    const b0 = alpha, b1 = 0, b2 = -alpha;
    const a0 = 1 + alpha, a1 = -2 * Math.cos(omega), a2 = 1 - alpha;

    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx >= this.length) break;
      const white = (Math.random() * 2 - 1);
      const filtered = (b0 / a0) * white - (a1 / a0) * y1 - (a2 / a0) * y2;
      y2 = y1;
      y1 = filtered;

      const t = i / count;
      const env = Math.sin(t * Math.PI);
      const val = filtered * volume * env * 2.2;
      this.mix(idx, val * panL, val * panR);
    }
  }

  // Micro tactile UI click
  addClick({ time = 0, freq = 2000, duration = 0.02, volume = 0.5, pan = 0 }) {
    const start = Math.floor(time * this.sampleRate);
    const count = Math.floor(duration * this.sampleRate);
    let phase = 0;
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx >= this.length) break;
      const t = i / count;
      phase += (2 * Math.PI * freq) / this.sampleRate;
      const env = Math.exp(-t * 22.0);
      const val = Math.sin(phase) * volume * env;
      this.mix(idx, val * panL, val * panR);
    }
  }

  // Stereo Reverb
  applyReverb({ mix = 0.22, decay = 1.4, delayMs = 30 }) {
    const delayL = Math.floor((delayMs / 1000) * this.sampleRate);
    const delayR = Math.floor(((delayMs + 6) / 1000) * this.sampleRate);
    const feedback = Math.exp(-3.0 / decay);

    const bufL = new Float32Array(this.length);
    const bufR = new Float32Array(this.length);

    for (let i = 0; i < this.length; i++) {
      const pL = i >= delayL ? bufL[i - delayL] : 0;
      const pR = i >= delayR ? bufR[i - delayR] : 0;
      bufL[i] = this.left[i] + pL * feedback;
      bufR[i] = this.right[i] + pR * feedback;
      this.left[i] = this.left[i] * (1 - mix * 0.4) + bufL[i] * mix;
      this.right[i] = this.right[i] * (1 - mix * 0.4) + bufR[i] * mix;
    }
  }

  // Normalize and soft-limit to MP3 Buffer
  toMp3Buffer(bitrate = 192) {
    let max = 0.0001;
    for (let i = 0; i < this.length; i++) {
      const l = Math.abs(this.left[i]);
      const r = Math.abs(this.right[i]);
      if (l > max) max = l;
      if (r > max) max = r;
    }
    const gain = 0.92 / max;

    const samplesL = new Int16Array(this.length);
    const samplesR = new Int16Array(this.length);
    for (let i = 0; i < this.length; i++) {
      const l = Math.tanh(this.left[i] * gain);
      const r = Math.tanh(this.right[i] * gain);
      samplesL[i] = Math.floor(l < 0 ? l * 32768 : l * 32767);
      samplesR[i] = Math.floor(r < 0 ? r * 32768 : r * 32767);
    }

    const encoder = new lamejs.Mp3Encoder(2, this.sampleRate, bitrate);
    const chunks = [];
    const buf = encoder.encodeBuffer(samplesL, samplesR);
    if (buf.length > 0) chunks.push(Buffer.from(buf));
    const end = encoder.flush();
    if (end.length > 0) chunks.push(Buffer.from(end));

    return Buffer.concat(chunks);
  }
}

// ============================================================================
// 🎼 SOUND DESIGN SPECIFICATIONS
// ============================================================================

const sounds = {
  // LOBBY SOUNDS
  'lobby/player_join.mp3': () => {
    // radio comm -> digital confirmation -> short bass impact (0.8s)
    const t = new SynthTrack(0.85);
    t.addRadioSquelch({ time: 0.01, duration: 0.12, centerFreq: 2200, volume: 0.35, pan: -0.3 });
    t.addClick({ time: 0.12, freq: 1600, duration: 0.03, volume: 0.4 });
    t.addTone({ time: 0.15, duration: 0.2, freq: 587.33, type: 'triangle', volume: 0.38, decay: 0.12, pan: -0.2 }); // D5
    t.addTone({ time: 0.24, duration: 0.45, freq: 880.00, type: 'triangle', volume: 0.45, decay: 0.3, sparkle: 0.3, pan: 0.2 }); // A5
    t.addImpact({ time: 0.24, duration: 0.4, startFreq: 120, endFreq: 45, volume: 0.55 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  'lobby/player_leave.mp3': () => {
    // short radio disconnect -> descending digital tone (0.6s)
    const t = new SynthTrack(0.65);
    t.addRadioSquelch({ time: 0.01, duration: 0.08, centerFreq: 1500, volume: 0.3, pan: 0.3 });
    t.addTone({ time: 0.08, duration: 0.2, freq: 523.25, type: 'sine', volume: 0.35, decay: 0.1, pan: 0.1 }); // C5
    t.addTone({ time: 0.20, duration: 0.35, freq: 329.63, type: 'triangle', volume: 0.38, decay: 0.25, pan: -0.2 }); // E4
    t.addImpact({ time: 0.22, duration: 0.3, startFreq: 80, endFreq: 35, volume: 0.4 });
    t.applyReverb({ mix: 0.18, decay: 0.8 });
    return t;
  },

  'lobby/player_count.mp3': () => {
    // Subtle digital telemetry pulse (0.2s)
    const t = new SynthTrack(0.25);
    t.addClick({ time: 0.01, freq: 1400, duration: 0.02, volume: 0.4 });
    t.addTone({ time: 0.02, duration: 0.15, freq: 1046.50, type: 'sine', volume: 0.3, decay: 0.08 }); // C6
    t.addImpact({ time: 0.02, duration: 0.15, startFreq: 90, endFreq: 50, volume: 0.3 });
    return t;
  },

  'lobby/room_full.mp3': () => {
    // digital charge -> rising synth -> powerful confirmation hit (1.5s)
    const t = new SynthTrack(1.6);
    t.addSweep({ time: 0.02, duration: 0.45, startFreq: 220, endFreq: 880, type: 'saw', volume: 0.4, panStart: -0.6, panEnd: 0.6 });
    t.addImpact({ time: 0.48, duration: 1.0, startFreq: 150, endFreq: 28, volume: 0.95 });
    // Heroic power triad: D5, F#5, A5
    [587.33, 739.99, 880.00].forEach((f, i) => {
      t.addTone({ time: 0.5, duration: 0.9, freq: f, type: 'triangle', volume: 0.35, decay: 0.6, sparkle: 0.25, pan: (i - 1) * 0.3 });
    });
    t.applyReverb({ mix: 0.28, decay: 1.5 });
    return t;
  },

  // UI SOUNDS
  'ui/button_click.mp3': () => {
    // Premium tactile digital click (0.2s)
    const t = new SynthTrack(0.22);
    t.addClick({ time: 0.005, freq: 1900, duration: 0.025, volume: 0.6 });
    t.addImpact({ time: 0.01, duration: 0.12, startFreq: 110, endFreq: 45, volume: 0.45 });
    return t;
  },

  'ui/button_hover.mp3': () => {
    // Subtle futuristic UI tick (0.12s)
    const t = new SynthTrack(0.14);
    t.addClick({ time: 0.005, freq: 2400, duration: 0.015, volume: 0.3 });
    return t;
  },

  'ui/menu_open.mp3': () => {
    // Smooth futuristic whoosh + electronic activation (0.45s)
    const t = new SynthTrack(0.48);
    t.addSweep({ time: 0.01, duration: 0.28, startFreq: 250, endFreq: 1400, type: 'sine', volume: 0.35, panStart: -0.4, panEnd: 0.4 });
    t.addTone({ time: 0.18, duration: 0.25, freq: 1174.66, type: 'triangle', volume: 0.3, decay: 0.15 });
    t.applyReverb({ mix: 0.15, decay: 0.7 });
    return t;
  },

  'ui/menu_close.mp3': () => {
    // Short reverse whoosh + soft digital click (0.35s)
    const t = new SynthTrack(0.38);
    t.addSweep({ time: 0.01, duration: 0.2, startFreq: 1400, endFreq: 250, type: 'sine', volume: 0.32, panStart: 0.4, panEnd: -0.4 });
    t.addClick({ time: 0.18, freq: 1500, duration: 0.02, volume: 0.4 });
    return t;
  },

  // GAMEPLAY SOUNDS
  'game/game_start.mp3': () => {
    // Click -> power charge -> deep impact -> short silence -> countdown transition (2.5s)
    const t = new SynthTrack(2.6);
    t.addClick({ time: 0.01, freq: 1800, duration: 0.03, volume: 0.5 });
    t.addSweep({ time: 0.1, duration: 0.8, startFreq: 100, endFreq: 880, type: 'saw', volume: 0.45, panStart: -0.6, panEnd: 0.6 });
    const impTime = 0.95;
    t.addImpact({ time: impTime, duration: 1.4, startFreq: 160, endFreq: 26, volume: 1.0 });
    // E-Major battle blast
    [329.63, 415.30, 493.88, 659.25].forEach((f, i) => {
      t.addTone({ time: impTime + 0.02, duration: 1.3, freq: f, type: 'triangle', volume: 0.32, decay: 0.8, sparkle: 0.25, pan: (i - 1.5) * 0.3 });
    });
    t.applyReverb({ mix: 0.3, decay: 2.0 });
    return t;
  },

  'game/countdown_3.mp3': () => {
    // Deep electronic impact + UI tone tuned to G2 (98Hz) (0.7s)
    const t = new SynthTrack(0.72);
    t.addImpact({ time: 0.01, duration: 0.55, startFreq: 180, endFreq: 98, volume: 0.85, pan: -0.2 });
    t.addTone({ time: 0.02, duration: 0.35, freq: 196.00, type: 'triangle', volume: 0.4, decay: 0.2, pan: -0.2 });
    t.addClick({ time: 0.01, freq: 1200, duration: 0.025, volume: 0.35 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  'game/countdown_2.mp3': () => {
    // Higher-pitched impact tuned to C3 (130.8Hz) (0.7s)
    const t = new SynthTrack(0.72);
    t.addImpact({ time: 0.01, duration: 0.55, startFreq: 220, endFreq: 130.8, volume: 0.88, pan: 0.0 });
    t.addTone({ time: 0.02, duration: 0.35, freq: 261.63, type: 'triangle', volume: 0.42, decay: 0.2, pan: 0.0 });
    t.addClick({ time: 0.01, freq: 1500, duration: 0.025, volume: 0.4 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  'game/countdown_1.mp3': () => {
    // Strong tension impact at D3 (146.8Hz) + rising energy (0.8s)
    const t = new SynthTrack(0.82);
    t.addSweep({ time: 0.0, duration: 0.25, startFreq: 220, endFreq: 587, type: 'saw', volume: 0.35, panStart: -0.4, panEnd: 0.4 });
    t.addImpact({ time: 0.25, duration: 0.55, startFreq: 260, endFreq: 146.8, volume: 0.9, pan: 0.2 });
    t.addTone({ time: 0.26, duration: 0.45, freq: 587.33, type: 'triangle', volume: 0.45, decay: 0.25, sparkle: 0.3, pan: 0.2 });
    t.applyReverb({ mix: 0.25, decay: 1.2 });
    return t;
  },

  'game/countdown_go.mp3': () => {
    // Massive clean game-start esports impact + digital energy burst (1.0s)
    const t = new SynthTrack(1.05);
    t.addSweep({ time: 0.0, duration: 0.2, startFreq: 160, endFreq: 880, type: 'saw', volume: 0.45, panStart: -0.7, panEnd: 0.7 });
    const impTime = 0.2;
    t.addImpact({ time: impTime, duration: 0.8, startFreq: 160, endFreq: 26, volume: 1.0 });
    [739.99, 1108.73, 1479.98].forEach((f, i) => {
      t.addTone({ time: impTime + 0.01, duration: 0.75, freq: f, type: 'triangle', volume: 0.35, decay: 0.5, sparkle: 0.3, pan: (i - 1) * 0.4 });
    });
    t.addClick({ time: impTime, freq: 2400, duration: 0.06, volume: 0.45 });
    t.applyReverb({ mix: 0.28, decay: 1.5 });
    return t;
  },

  'game/question_reveal.mp3': () => {
    // Digital scan -> short futuristic impact -> subtle energy pulse (0.8s)
    const t = new SynthTrack(0.85);
    t.addSweep({ time: 0.02, duration: 0.22, startFreq: 300, endFreq: 1400, type: 'sine', volume: 0.35, panStart: -0.5, panEnd: 0.3 });
    t.addImpact({ time: 0.2, duration: 0.55, startFreq: 130, endFreq: 40, volume: 0.65 });
    t.addTone({ time: 0.22, duration: 0.55, freq: 1760, type: 'triangle', volume: 0.38, decay: 0.3, sparkle: 0.3 });
    t.applyReverb({ mix: 0.22, decay: 1.1 });
    return t;
  },

  'game/answer_select.mp3': () => {
    // Digital click + tactile confirmation pulse (0.25s)
    const t = new SynthTrack(0.28);
    t.addClick({ time: 0.005, freq: 1800, duration: 0.025, volume: 0.6 });
    t.addImpact({ time: 0.02, duration: 0.18, startFreq: 110, endFreq: 45, volume: 0.5 });
    t.addTone({ time: 0.03, duration: 0.15, freq: 987.77, type: 'sine', volume: 0.25, decay: 0.08 });
    return t;
  },

  'game/correct_answer.mp3': () => {
    // Short bass hit -> 3-note ascending electronic melody (F#5, A#5, C#6) -> bright confirmation (1.2s)
    const t = new SynthTrack(1.25);
    t.addImpact({ time: 0.02, duration: 0.6, startFreq: 110, endFreq: 40, volume: 0.6 });
    t.addTone({ time: 0.05, duration: 0.3, freq: 739.99, type: 'triangle', volume: 0.38, decay: 0.18, pan: -0.3 });
    t.addTone({ time: 0.16, duration: 0.3, freq: 932.33, type: 'triangle', volume: 0.42, decay: 0.18, pan: 0.0 });
    t.addTone({ time: 0.28, duration: 0.8, freq: 1108.73, type: 'triangle', volume: 0.5, decay: 0.6, sparkle: 0.4, pan: 0.3 });
    t.applyReverb({ mix: 0.28, decay: 1.6 });
    return t;
  },

  'game/wrong_answer.mp3': () => {
    // Short low-frequency hit -> descending digital tone (0.8s)
    const t = new SynthTrack(0.85);
    t.addSweep({ time: 0.02, duration: 0.4, startFreq: 261.63, endFreq: 174.61, type: 'triangle', volume: 0.42, panStart: 0.2, panEnd: -0.2 });
    t.addImpact({ time: 0.08, duration: 0.5, startFreq: 85, endFreq: 35, volume: 0.5 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  'game/time_warning.mp3': () => {
    // Rapid futuristic pulses increasing in speed (1.4s)
    const t = new SynthTrack(1.45);
    const times = [0.05, 0.32, 0.55, 0.75, 0.92, 1.06, 1.18, 1.28, 1.37];
    times.forEach((tm, i) => {
      const f = 880 + (i / times.length) * 350;
      t.addTone({ time: tm, duration: 0.08, freq: f, type: 'sine', volume: 0.35 + i * 0.02, decay: 0.05, pan: (i % 2 === 0 ? -0.3 : 0.3) });
      t.addClick({ time: tm, freq: f * 1.5, duration: 0.02, volume: 0.25 });
    });
    return t;
  },

  'game/time_up.mp3': () => {
    // Sudden stop -> deep impact -> digital shutdown sound (1.5s)
    const t = new SynthTrack(1.55);
    t.addClick({ time: 0.01, freq: 1500, duration: 0.04, volume: 0.5 });
    t.addImpact({ time: 0.04, duration: 1.2, startFreq: 140, endFreq: 26, volume: 0.95 });
    t.addSweep({ time: 0.1, duration: 0.45, startFreq: 659.25, endFreq: 110, type: 'triangle', volume: 0.35, panStart: 0.2, panEnd: -0.2 });
    t.applyReverb({ mix: 0.25, decay: 1.5 });
    return t;
  },

  // RESULTS SOUNDS
  'results/leaderboard_open.mp3': () => {
    // Digital scanning -> multiple small UI ticks -> ranking confirmation tone (1.8s)
    const t = new SynthTrack(1.85);
    [0.05, 0.15, 0.25, 0.35, 0.45].forEach((tm, i) => {
      t.addClick({ time: tm, freq: 1200 + i * 180, duration: 0.025, volume: 0.3, pan: (i % 2 === 0 ? -0.4 : 0.4) });
    });
    t.addSweep({ time: 0.2, duration: 0.45, startFreq: 300, endFreq: 1200, type: 'sine', volume: 0.35 });
    t.addImpact({ time: 0.55, duration: 1.1, startFreq: 130, endFreq: 35, volume: 0.85 });
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      t.addTone({ time: 0.56 + i * 0.08, duration: 0.8, freq: f, type: 'triangle', volume: 0.35, decay: 0.5, sparkle: 0.3 });
    });
    t.applyReverb({ mix: 0.3, decay: 1.8 });
    return t;
  },

  'results/rank_up.mp3': () => {
    // Short ascending digital sound (0.9s)
    const t = new SynthTrack(0.95);
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      t.addTone({ time: 0.04 + i * 0.08, duration: 0.25, freq: f, type: 'triangle', volume: 0.38, decay: 0.15, pan: (i - 1.5) * 0.2 });
    });
    t.addImpact({ time: 0.35, duration: 0.5, startFreq: 110, endFreq: 40, volume: 0.6 });
    t.applyReverb({ mix: 0.22, decay: 1.0 });
    return t;
  },

  'results/rank_down.mp3': () => {
    // Short descending digital sound (0.9s)
    const t = new SynthTrack(0.95);
    [783.99, 659.25, 523.25, 392.00].forEach((f, i) => {
      t.addTone({ time: 0.04 + i * 0.08, duration: 0.25, freq: f, type: 'sine', volume: 0.35, decay: 0.15, pan: (1.5 - i) * 0.2 });
    });
    t.addImpact({ time: 0.35, duration: 0.5, startFreq: 85, endFreq: 35, volume: 0.5 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  'results/victory.mp3': () => {
    // Deep impact -> rising synth -> multiple layered electronic tones -> powerful final chord (3.5s)
    const t = new SynthTrack(3.6);
    t.addImpact({ time: 0.02, duration: 1.5, startFreq: 160, endFreq: 24, volume: 1.0 });
    t.addSweep({ time: 0.3, duration: 1.0, startFreq: 110, endFreq: 880, type: 'saw', volume: 0.45, panStart: -0.7, panEnd: 0.7 });
    const chordTime = 1.35;
    t.addImpact({ time: chordTime, duration: 2.1, startFreq: 170, endFreq: 22, volume: 1.0 });
    // E-Major / A-Major Ninth Victory Chord
    [220, 277.18, 329.63, 415.30, 493.88, 659.25, 880].forEach((f, i) => {
      t.addTone({ time: chordTime + 0.02, duration: 2.2, freq: f, type: 'triangle', volume: 0.32, decay: 1.8, sparkle: 0.3, pan: (i - 3) * 0.25 });
    });
    t.applyReverb({ mix: 0.38, decay: 2.6 });
    return t;
  },

  'results/game_complete.mp3': () => {
    // Uplifting celebration chord + subtle planetary biosphere ambience (3.2s)
    const t = new SynthTrack(3.3);
    t.addImpact({ time: 0.02, duration: 0.6, startFreq: 110, endFreq: 40, volume: 0.6 });
    const chordTime = 0.5;
    t.addImpact({ time: chordTime, duration: 2.0, startFreq: 130, endFreq: 28, volume: 0.85 });
    [293.66, 369.99, 440.00, 659.25, 880.00].forEach((f, i) => {
      t.addTone({ time: chordTime + 0.02, duration: 2.5, freq: f, type: 'triangle', volume: 0.35, decay: 1.8, sparkle: 0.25, pan: (i - 2) * 0.3 });
    });
    t.applyReverb({ mix: 0.35, decay: 2.4 });
    return t;
  }
};

// ============================================================================
// 🚀 RUN GENERATION
// ============================================================================

console.log('===================================================');
console.log('🎵 Generating Battle Royale / SDG Game MP3 Pack...');
console.log('===================================================');

let count = 0;
for (const [relPath, gen] of Object.entries(sounds)) {
  const track = gen();
  const mp3Buf = track.toMp3Buffer(192);
  const fullPath = path.join(BASE_AUDIO_DIR, relPath);
  fs.writeFileSync(fullPath, mp3Buf);
  count++;
  console.log(`✅ Generated: ${relPath.padEnd(32)} [${(mp3Buf.length / 1024).toFixed(1)} KB]`);
}

console.log('===================================================');
console.log(`🎉 SUCCESS: Generated ${count} original MP3 sound effects!`);
console.log('===================================================');
