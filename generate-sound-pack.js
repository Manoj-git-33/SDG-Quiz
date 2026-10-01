/**
 * ============================================================================
 * 🌐 SDGVERSE - ORIGINAL SOUND EFFECT PACK GENERATOR (WAV 48kHz Stereo)
 * Generates 29 completely original, premium esports + SDG competition sound effects.
 * 100% mathematical DSP synthesis: No samples, no copyright, pure original audio.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 48000;
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// 🎛️ DSP & SYNTHESIS AUDIO BUFFER HELPERS
// ============================================================================

class AudioTrack {
  constructor(durationSec) {
    this.sampleRate = SAMPLE_RATE;
    this.length = Math.floor(durationSec * SAMPLE_RATE);
    this.left = new Float32Array(this.length);
    this.right = new Float32Array(this.length);
  }

  mixSample(index, lVal, rVal) {
    if (index >= 0 && index < this.length) {
      this.left[index] += lVal;
      this.right[index] += rVal;
    }
  }

  // Dual-oscillator sub-bass impact with exponential pitch decay
  addImpact({ time = 0, duration = 1.0, startFreq = 140, endFreq = 28, volume = 0.8, pan = 0 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(duration * this.sampleRate);
    let phase = 0;
    let phase2 = 0;

    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / numSamples;
      // Exponential pitch drop
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      phase += (2 * Math.PI * freq) / this.sampleRate;
      phase2 += (2 * Math.PI * freq * 1.5) / this.sampleRate;

      // Exponential amp decay
      const env = Math.exp(-t * 5.0) * (1 - Math.exp(-i / 80)); // fast 2ms attack
      const s1 = Math.sin(phase);
      const s2 = (Math.sin(phase2) * 0.3); // warm 2nd harmonic
      const val = (s1 + s2) * volume * env;

      this.mixSample(idx, val * panL, val * panR);
    }
  }

  // Tone / Arpeggio Note generator with envelope & harmonics
  addTone({ time = 0, duration = 0.5, freq = 440, type = 'sine', volume = 0.5, attack = 0.01, decay = 0.1, pan = 0, octaveSparkle = 0 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(duration * this.sampleRate);
    const attackSamples = Math.max(1, Math.floor(attack * this.sampleRate));
    let phase = 0;
    let phaseOct = 0;

    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / this.sampleRate;
      phase += (2 * Math.PI * freq) / this.sampleRate;
      phaseOct += (2 * Math.PI * freq * 2) / this.sampleRate;

      // Amplitude Envelope
      let env = 1.0;
      if (i < attackSamples) {
        env = i / attackSamples;
      } else {
        const decayTime = (i - attackSamples) / this.sampleRate;
        env = Math.exp(-decayTime / decay);
      }

      let osc = 0;
      if (type === 'sine') {
        osc = Math.sin(phase);
      } else if (type === 'triangle') {
        osc = 2 * Math.abs(2 * ((phase / (2 * Math.PI)) % 1) - 1) - 1;
      } else if (type === 'saw') {
        osc = 2 * ((phase / (2 * Math.PI)) % 1) - 1;
      }

      if (octaveSparkle > 0) {
        osc += Math.sin(phaseOct) * octaveSparkle;
      }

      const val = osc * volume * env;
      this.mixSample(idx, val * panL, val * panR);
    }
  }

  // Pitch-sweeping synth (risers, falls, swooshes)
  addPitchSweep({ time = 0, duration = 1.0, startFreq = 200, endFreq = 1200, type = 'saw', volume = 0.4, panStart = -0.5, panEnd = 0.5, cutoffStart = 300, cutoffEnd = 4000 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(duration * this.sampleRate);
    let phase = 0;

    // Filter state
    let y1L = 0, y2L = 0, y1R = 0, y2R = 0;

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / numSamples;
      const freq = startFreq * Math.pow(endFreq / startFreq, t);
      phase += (2 * Math.PI * freq) / this.sampleRate;

      const pan = panStart + (panEnd - panStart) * t;
      const panL = Math.cos((pan + 1) * Math.PI / 4);
      const panR = Math.sin((pan + 1) * Math.PI / 4);

      // Amplitude envelope (smooth in, dramatic cut or swell)
      const env = Math.sin(t * Math.PI * 0.85);

      let osc = 0;
      if (type === 'saw') {
        osc = 2 * ((phase / (2 * Math.PI)) % 1) - 1;
      } else if (type === 'triangle') {
        osc = 2 * Math.abs(2 * ((phase / (2 * Math.PI)) % 1) - 1) - 1;
      } else {
        osc = Math.sin(phase);
      }

      // Simple 1-pole dynamic lowpass filter
      const cutoff = cutoffStart * Math.pow(cutoffEnd / cutoffStart, t);
      const rc = 1.0 / (2 * Math.PI * Math.min(cutoff, this.sampleRate * 0.45));
      const dt = 1.0 / this.sampleRate;
      const alpha = dt / (rc + dt);

      y1L += alpha * (osc - y1L);
      y1R += alpha * (osc - y1R);

      this.mixSample(idx, y1L * volume * env * panL, y1R * volume * env * panR);
    }
  }

  // High-precision FM synthesis for crystalline, plasma, and water droplet sounds
  addFMTone({ time = 0, duration = 0.8, carrierFreq = 880, modRatio = 2.0, modIndex = 1.5, volume = 0.4, decay = 0.2, pan = 0 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(duration * this.sampleRate);
    let carPhase = 0;
    let modPhase = 0;
    const modFreq = carrierFreq * modRatio;

    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / this.sampleRate;
      const env = Math.exp(-t / decay);
      const currentModIndex = modIndex * env;

      modPhase += (2 * Math.PI * modFreq) / this.sampleRate;
      const modVal = Math.sin(modPhase) * currentModIndex;

      carPhase += (2 * Math.PI * (carrierFreq + modVal * carrierFreq)) / this.sampleRate;
      const carVal = Math.sin(carPhase) * volume * env;

      this.mixSample(idx, carVal * panL, carVal * panR);
    }
  }

  // Water droplet simulation (FM pitch envelope + liquid cavity resonance)
  addWaterDrop({ time = 0, baseFreq = 850, volume = 0.45, pan = 0 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(0.25 * this.sampleRate);
    let phase = 0;

    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / numSamples;
      // Droplet rapid pitch arc
      const freq = baseFreq * (0.8 + 1.4 * Math.sin(t * Math.PI * 0.8));
      phase += (2 * Math.PI * freq) / this.sampleRate;

      const env = Math.exp(-t * 12.0);
      const val = Math.sin(phase) * volume * env;

      this.mixSample(idx, val * panL, val * panR);
    }
  }

  // Bandpass-filtered Pink Noise for wind, atmospheric rush, and environment
  addWindSweep({ time = 0, duration = 2.0, centerFreqStart = 300, centerFreqEnd = 1200, volume = 0.3, pan = 0 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(duration * this.sampleRate);

    // Pink noise state
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    // Resonant bandpass state
    let y1 = 0, y2 = 0;

    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / numSamples;
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;

      // Swept resonant bandpass filter
      const centerFreq = centerFreqStart + (centerFreqEnd - centerFreqStart) * t;
      const omega = (2 * Math.PI * centerFreq) / this.sampleRate;
      const Q = 3.5;
      const alpha = Math.sin(omega) / (2 * Q);

      const b_0 = alpha;
      const b_1 = 0;
      const b_2 = -alpha;
      const a_0 = 1 + alpha;
      const a_1 = -2 * Math.cos(omega);
      const a_2 = 1 - alpha;

      // Filter processing
      const filtered = (b_0 / a_0) * pink - (a_1 / a_0) * y1 - (a_2 / a_0) * y2;
      y2 = y1;
      y1 = filtered;

      const env = Math.sin(t * Math.PI);
      const val = filtered * volume * env * 2.5;

      this.mixSample(idx, val * panL, val * panR);
    }
  }

  // Micro tactile UI click
  addClick({ time = 0, freq = 1800, duration = 0.03, volume = 0.5, pan = 0 }) {
    const startSample = Math.floor(time * this.sampleRate);
    const numSamples = Math.floor(duration * this.sampleRate);
    let phase = 0;

    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);

    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= this.length) break;

      const t = i / numSamples;
      phase += (2 * Math.PI * freq) / this.sampleRate;
      const env = Math.exp(-t * 25.0);
      const val = Math.sin(phase) * volume * env;

      this.mixSample(idx, val * panL, val * panR);
    }
  }

  // Algorithmic Stereo Diffusion Reverb / Space simulation
  applyReverb({ mix = 0.25, decay = 1.8, delayMs = 35 }) {
    const delaySamplesL = Math.floor((delayMs / 1000) * this.sampleRate);
    const delaySamplesR = Math.floor(((delayMs + 7) / 1000) * this.sampleRate); // stereo Haas spread
    const feedback = Math.exp(-3.0 / decay);

    const bufL = new Float32Array(this.length);
    const bufR = new Float32Array(this.length);

    for (let i = 0; i < this.length; i++) {
      const prevL = i >= delaySamplesL ? bufL[i - delaySamplesL] : 0;
      const prevR = i >= delaySamplesR ? bufR[i - delaySamplesR] : 0;

      bufL[i] = this.left[i] + prevL * feedback;
      bufR[i] = this.right[i] + prevR * feedback;

      // Mix wet into dry
      this.left[i] = this.left[i] * (1 - mix * 0.4) + bufL[i] * mix;
      this.right[i] = this.right[i] * (1 - mix * 0.4) + bufR[i] * mix;
    }
  }

  // Master brickwall limiter & soft saturation normalization
  finalize() {
    // 1. Find peak
    let maxAmp = 0.0001;
    for (let i = 0; i < this.length; i++) {
      const aL = Math.abs(this.left[i]);
      const aR = Math.abs(this.right[i]);
      if (aL > maxAmp) maxAmp = aL;
      if (aR > maxAmp) maxAmp = aR;
    }

    // 2. Target normalize to -0.6 dBFS (0.933) with gentle tanh soft saturation
    const targetPeak = 0.93;
    const gain = targetPeak / maxAmp;

    for (let i = 0; i < this.length; i++) {
      // Soft-clip limiter curve: tanh
      this.left[i] = Math.tanh(this.left[i] * gain);
      this.right[i] = Math.tanh(this.right[i] * gain);
    }
  }

  // Render to 16-bit PCM Stereo WAV Buffer
  toWavBuffer() {
    this.finalize();

    const numChannels = 2;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = this.sampleRate * blockAlign;
    const dataSize = this.length * blockAlign;
    const bufferSize = 44 + dataSize;

    const buffer = Buffer.alloc(bufferSize);

    // RIFF identifier
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(bufferSize - 8, 4);
    buffer.write('WAVE', 8);

    // 'fmt ' chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
    buffer.writeUInt16LE(1, 20);  // audio format (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(this.sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34); // bits per sample

    // 'data' chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    let offset = 44;
    for (let i = 0; i < this.length; i++) {
      // Clamp between -1.0 and 1.0
      let l = Math.max(-1.0, Math.min(1.0, this.left[i]));
      let r = Math.max(-1.0, Math.min(1.0, this.right[i]));

      const sampleL = Math.floor(l < 0 ? l * 32768 : l * 32767);
      const sampleR = Math.floor(r < 0 ? r * 32768 : r * 32767);

      buffer.writeInt16LE(sampleL, offset);
      buffer.writeInt16LE(sampleR, offset + 2);
      offset += 4;
    }

    return buffer;
  }
}

// ============================================================================
// 🎼 SOUND DESIGN IMPLEMENTATION FOR THE 29 SOUND EFFECTS
// ============================================================================

const soundGenerators = {
  // 1. PLAYER WAITING (2.5s)
  '01_player_waiting.wav': () => {
    const t = new AudioTrack(2.6);
    // Soft sub-drone & environmental pink noise
    t.addImpact({ time: 0.1, duration: 1.2, startFreq: 60, endFreq: 45, volume: 0.35 });
    t.addImpact({ time: 1.3, duration: 1.2, startFreq: 60, endFreq: 45, volume: 0.3 });
    t.addWindSweep({ time: 0.0, duration: 2.6, centerFreqStart: 350, centerFreqEnd: 550, volume: 0.18 });

    // Ambient arpeggio: F#3, C#4, F#4, G#4
    const notes = [
      { t: 0.2, f: 185.00 }, // F#3
      { t: 0.6, f: 277.18 }, // C#4
      { t: 1.0, f: 369.99 }, // F#4
      { t: 1.4, f: 415.30 }, // G#4
      { t: 1.8, f: 554.37 }  // C#5
    ];
    notes.forEach(n => {
      t.addTone({ time: n.t, duration: 0.7, freq: n.f, type: 'triangle', volume: 0.25, decay: 0.5, octaveSparkle: 0.2, pan: (n.t - 1) * 0.4 });
    });

    t.applyReverb({ mix: 0.35, decay: 2.2 });
    return t;
  },

  // 2. PLAYER JOINING (1.2s)
  '02_player_joining.wav': () => {
    const t = new AudioTrack(1.25);
    // Digital radar scan sweep
    t.addPitchSweep({ time: 0.05, duration: 0.35, startFreq: 350, endFreq: 1400, type: 'sine', volume: 0.3, panStart: -0.6, panEnd: 0.2 });
    // Ascending synth triad: A4, C#5, E5
    t.addTone({ time: 0.3, duration: 0.35, freq: 440.00, type: 'triangle', volume: 0.35, decay: 0.25, pan: -0.2 });
    t.addTone({ time: 0.42, duration: 0.35, freq: 554.37, type: 'triangle', volume: 0.38, decay: 0.25, pan: 0.1 });
    t.addTone({ time: 0.55, duration: 0.55, freq: 659.25, type: 'triangle', volume: 0.42, decay: 0.4, octaveSparkle: 0.3, pan: 0.3 });
    // Bright confirmation chime
    t.addFMTone({ time: 0.56, duration: 0.55, carrierFreq: 1318.5, modRatio: 2.0, modIndex: 1.2, volume: 0.3, pan: 0.2 });
    t.applyReverb({ mix: 0.22, decay: 1.4 });
    return t;
  },

  // 3. PLAYER JOINED (0.9s)
  '03_player_joined.wav': () => {
    const t = new AudioTrack(0.95);
    // Punchy sub-thump
    t.addImpact({ time: 0.02, duration: 0.4, startFreq: 110, endFreq: 40, volume: 0.55 });
    // Positive 3-note electronic tone (D5 -> F#5 -> A5)
    t.addTone({ time: 0.05, duration: 0.22, freq: 587.33, type: 'sine', volume: 0.4, decay: 0.15, pan: -0.3 });
    t.addTone({ time: 0.14, duration: 0.22, freq: 739.99, type: 'sine', volume: 0.42, decay: 0.15, pan: 0.0 });
    t.addTone({ time: 0.23, duration: 0.65, freq: 880.00, type: 'triangle', volume: 0.5, decay: 0.45, octaveSparkle: 0.4, pan: 0.3 });
    // Crystalline overtone
    t.addFMTone({ time: 0.24, duration: 0.65, carrierFreq: 1760, modRatio: 2.76, modIndex: 0.8, volume: 0.25, decay: 0.35 });
    t.applyReverb({ mix: 0.25, decay: 1.5 });
    return t;
  },

  // 4. GAME START (2.5s)
  '04_game_start.wav': () => {
    const t = new AudioTrack(2.5);
    // Deep futuristic pulse
    t.addImpact({ time: 0.02, duration: 0.8, startFreq: 90, endFreq: 32, volume: 0.6 });
    // Rapid energy build telemetry burst
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].forEach((tm, idx) => {
      t.addClick({ time: tm, freq: 800 + idx * 160, duration: 0.03, volume: 0.2 + idx * 0.03, pan: (idx % 2 === 0 ? -0.4 : 0.4) });
    });
    // Rising energy sweep
    t.addPitchSweep({ time: 0.4, duration: 0.7, startFreq: 110, endFreq: 660, type: 'saw', volume: 0.45, panStart: -0.5, panEnd: 0.5 });
    // Powerful clean impact
    const impTime = 1.1;
    t.addImpact({ time: impTime, duration: 1.3, startFreq: 150, endFreq: 26, volume: 0.95 });
    // Bright electronic finish chord (E Major: E4, G#4, B4, E5)
    [329.63, 415.30, 493.88, 659.25].forEach((f, i) => {
      t.addTone({ time: impTime + 0.02, duration: 1.3, freq: f, type: 'triangle', volume: 0.32, decay: 0.8, octaveSparkle: 0.2, pan: (i - 1.5) * 0.3 });
    });
    t.addFMTone({ time: impTime + 0.03, duration: 1.2, carrierFreq: 1975.5, modRatio: 2.0, modIndex: 1.0, volume: 0.28 });
    t.applyReverb({ mix: 0.3, decay: 2.0 });
    return t;
  },

  // 5. COUNTDOWN 3 (0.7s)
  '05_countdown_3.wav': () => {
    const t = new AudioTrack(0.75);
    // Deep electronic impact at G2 (98Hz)
    t.addImpact({ time: 0.01, duration: 0.55, startFreq: 180, endFreq: 98, volume: 0.85, pan: -0.2 });
    t.addTone({ time: 0.02, duration: 0.35, freq: 196.00, type: 'triangle', volume: 0.4, decay: 0.2, pan: -0.2 });
    t.addClick({ time: 0.01, freq: 1200, duration: 0.025, volume: 0.35, pan: -0.2 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  // 6. COUNTDOWN 2 (0.7s)
  '06_countdown_2.wav': () => {
    const t = new AudioTrack(0.75);
    // Higher-pitched impact at C3 (130.8Hz)
    t.addImpact({ time: 0.01, duration: 0.55, startFreq: 220, endFreq: 130.8, volume: 0.88, pan: 0.0 });
    t.addTone({ time: 0.02, duration: 0.35, freq: 261.63, type: 'triangle', volume: 0.42, decay: 0.2, pan: 0.0 });
    t.addClick({ time: 0.01, freq: 1500, duration: 0.025, volume: 0.4, pan: 0.0 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  // 7. COUNTDOWN 1 (0.8s)
  '07_countdown_1.wav': () => {
    const t = new AudioTrack(0.85);
    // Strong rising tension + bright impact at D3 (146.8Hz)
    t.addPitchSweep({ time: 0.0, duration: 0.25, startFreq: 220, endFreq: 587, type: 'saw', volume: 0.35, panStart: -0.4, panEnd: 0.4 });
    t.addImpact({ time: 0.25, duration: 0.55, startFreq: 260, endFreq: 146.8, volume: 0.9, pan: 0.2 });
    t.addTone({ time: 0.26, duration: 0.45, freq: 587.33, type: 'triangle', volume: 0.45, decay: 0.25, octaveSparkle: 0.3, pan: 0.2 });
    t.addFMTone({ time: 0.27, duration: 0.4, carrierFreq: 1760, modRatio: 2.0, modIndex: 0.8, volume: 0.3, pan: 0.2 });
    t.applyReverb({ mix: 0.25, decay: 1.2 });
    return t;
  },

  // 8. GO (1.0s)
  '08_go.wav': () => {
    const t = new AudioTrack(1.1);
    // Fast riser into massive esports impact
    t.addPitchSweep({ time: 0.0, duration: 0.22, startFreq: 150, endFreq: 880, type: 'saw', volume: 0.45, panStart: -0.7, panEnd: 0.7 });
    const impTime = 0.22;
    t.addImpact({ time: impTime, duration: 0.85, startFreq: 160, endFreq: 26, volume: 1.0 });
    // Power chords: F#5 (740Hz), C#6 (1108Hz), F#6 (1480Hz)
    [739.99, 1108.73, 1479.98].forEach((f, i) => {
      t.addTone({ time: impTime + 0.01, duration: 0.8, freq: f, type: 'triangle', volume: 0.35, decay: 0.5, octaveSparkle: 0.3, pan: (i - 1) * 0.4 });
    });
    // Shimmering white burst
    t.addClick({ time: impTime, freq: 2400, duration: 0.06, volume: 0.45 });
    t.applyReverb({ mix: 0.28, decay: 1.6 });
    return t;
  },

  // 9. TIME WARNING (1.5s)
  '09_time_warning.wav': () => {
    const t = new AudioTrack(1.55);
    // Rapid futuristic pulses accelerating
    const times = [0.05, 0.35, 0.6, 0.82, 1.0, 1.15, 1.28, 1.39, 1.48];
    times.forEach((tm, idx) => {
      const freq = 880 + (idx / times.length) * 350;
      t.addTone({ time: tm, duration: 0.08, freq: freq, type: 'sine', volume: 0.35 + idx * 0.02, decay: 0.05, pan: (idx % 2 === 0 ? -0.3 : 0.3) });
      t.addClick({ time: tm, freq: freq * 1.5, duration: 0.02, volume: 0.25 });
    });
    return t;
  },

  // 10. TIME UP / OUT OF TIME (1.5s)
  '10_time_up.wav': () => {
    const t = new AudioTrack(1.55);
    // Sharp warning pulse
    t.addClick({ time: 0.02, freq: 1400, duration: 0.05, volume: 0.5 });
    // Descending electronic tone (E5 -> C4 -> A3)
    t.addPitchSweep({ time: 0.08, duration: 0.45, startFreq: 659.25, endFreq: 220, type: 'triangle', volume: 0.4, panStart: 0.3, panEnd: -0.3 });
    // Deep final impact at 0.4s
    t.addImpact({ time: 0.4, duration: 1.1, startFreq: 130, endFreq: 26, volume: 0.9 });
    t.applyReverb({ mix: 0.25, decay: 1.5 });
    return t;
  },

  // 11. ANSWER LOCKED (0.6s)
  '11_answer_locked.wav': () => {
    const t = new AudioTrack(0.65);
    // Dual digital lock click
    t.addClick({ time: 0.02, freq: 1600, duration: 0.02, volume: 0.45, pan: -0.2 });
    t.addClick({ time: 0.06, freq: 2200, duration: 0.025, volume: 0.5, pan: 0.2 });
    // Confirmation sub-pulse
    t.addImpact({ time: 0.08, duration: 0.45, startFreq: 95, endFreq: 40, volume: 0.55 });
    // Clean confirmation ping
    t.addTone({ time: 0.08, duration: 0.35, freq: 1046.50, type: 'sine', volume: 0.3, decay: 0.15 });
    t.applyReverb({ mix: 0.18, decay: 0.8 });
    return t;
  },

  // 12. CORRECT ANSWER (1.2s)
  '12_correct_answer.wav': () => {
    const t = new AudioTrack(1.25);
    // Sub-pulse foundation
    t.addImpact({ time: 0.02, duration: 0.6, startFreq: 100, endFreq: 38, volume: 0.45 });
    // Bright ascending 3-note synth melody: F#5 (740Hz), A#5 (932Hz), C#6 (1108Hz)
    t.addTone({ time: 0.05, duration: 0.35, freq: 739.99, type: 'triangle', volume: 0.35, decay: 0.2, pan: -0.3 });
    t.addTone({ time: 0.16, duration: 0.35, freq: 932.33, type: 'triangle', volume: 0.38, decay: 0.2, pan: 0.0 });
    t.addTone({ time: 0.28, duration: 0.85, freq: 1108.73, type: 'triangle', volume: 0.45, decay: 0.6, octaveSparkle: 0.4, pan: 0.3 });
    // High crystalline sparkle
    t.addFMTone({ time: 0.30, duration: 0.8, carrierFreq: 2217.46, modRatio: 2.0, modIndex: 0.9, volume: 0.25, pan: 0.2 });
    t.applyReverb({ mix: 0.28, decay: 1.6 });
    return t;
  },

  // 13. WRONG ANSWER (0.9s)
  '13_wrong_answer.wav': () => {
    const t = new AudioTrack(0.95);
    // Dignified low descending tone (C4 -> F3)
    t.addPitchSweep({ time: 0.02, duration: 0.45, startFreq: 261.63, endFreq: 174.61, type: 'triangle', volume: 0.42, panStart: 0.2, panEnd: -0.2 });
    // Damped sub-drop
    t.addImpact({ time: 0.08, duration: 0.55, startFreq: 85, endFreq: 35, volume: 0.5 });
    t.applyReverb({ mix: 0.2, decay: 1.0 });
    return t;
  },

  // 14. LEADERBOARD RANK UP (1.8s)
  '14_leaderboard_rank_up.wav': () => {
    const t = new AudioTrack(1.85);
    // Rapid ascending electronic arpeggio (C5, E5, G5, C6)
    const notes = [
      { tm: 0.05, f: 523.25, p: -0.4 },
      { tm: 0.15, f: 659.25, p: -0.2 },
      { tm: 0.25, f: 783.99, p: 0.1 },
      { tm: 0.35, f: 1046.50, p: 0.4 }
    ];
    notes.forEach(n => {
      t.addTone({ time: n.tm, duration: 0.35, freq: n.f, type: 'triangle', volume: 0.35, decay: 0.2, octaveSparkle: 0.25, pan: n.p });
    });
    // Energetic impact
    t.addImpact({ time: 0.4, duration: 1.1, startFreq: 140, endFreq: 30, volume: 0.85 });
    t.addFMTone({ time: 0.42, duration: 1.1, carrierFreq: 2093, modRatio: 2.0, modIndex: 1.0, volume: 0.3 });
    t.applyReverb({ mix: 0.3, decay: 1.8 });
    return t;
  },

  // 15. LEADERBOARD REVEAL (2.5s)
  '15_leaderboard_reveal.wav': () => {
    const t = new AudioTrack(2.55);
    // Digital wide sweep & rising tension
    t.addPitchSweep({ time: 0.05, duration: 0.85, startFreq: 300, endFreq: 1800, type: 'saw', volume: 0.35, panStart: -0.7, panEnd: 0.7 });
    // Reveal impact at 0.9s
    const impTime = 0.9;
    t.addImpact({ time: impTime, duration: 1.4, startFreq: 150, endFreq: 28, volume: 0.95 });
    // Rich triumphant chord: A4 (440), C#5 (554), E5 (659), A5 (880)
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      t.addTone({ time: impTime + 0.02, duration: 1.3, freq: f, type: 'triangle', volume: 0.3, decay: 0.9, octaveSparkle: 0.3, pan: (i - 1.5) * 0.35 });
    });
    t.addFMTone({ time: impTime + 0.04, duration: 1.2, carrierFreq: 1760, modRatio: 2.76, modIndex: 0.8, volume: 0.28 });
    t.applyReverb({ mix: 0.32, decay: 2.0 });
    return t;
  },

  // 16. TOP 3 REVEAL (3.0s)
  '16_top_3_reveal.wav': () => {
    const t = new AudioTrack(3.1);
    // Subtle environmental atmosphere & low earth drone
    t.addImpact({ time: 0.05, duration: 1.5, startFreq: 55, endFreq: 38, volume: 0.4 });
    t.addWindSweep({ time: 0.0, duration: 2.5, centerFreqStart: 300, centerFreqEnd: 700, volume: 0.15 });

    // Three rhythmic pulses (3rd, 2nd, 1st)
    t.addImpact({ time: 0.6, duration: 0.4, startFreq: 110, endFreq: 55, volume: 0.45, pan: -0.4 });
    t.addClick({ time: 0.6, freq: 880, duration: 0.04, volume: 0.3, pan: -0.4 });

    t.addImpact({ time: 1.1, duration: 0.4, startFreq: 125, endFreq: 60, volume: 0.55, pan: 0.0 });
    t.addClick({ time: 1.1, freq: 1108, duration: 0.04, volume: 0.35, pan: 0.0 });

    t.addImpact({ time: 1.6, duration: 0.4, startFreq: 140, endFreq: 65, volume: 0.65, pan: 0.4 });
    t.addClick({ time: 1.6, freq: 1318, duration: 0.04, volume: 0.4, pan: 0.4 });

    // Championship reveal impact at 2.0s
    t.addImpact({ time: 2.0, duration: 1.1, startFreq: 160, endFreq: 26, volume: 1.0 });
    // Bright chord: A4, C#5, E5, G#5, B5 (Maj9)
    [440, 554.37, 659.25, 830.61, 987.77].forEach((f, i) => {
      t.addTone({ time: 2.02, duration: 1.0, freq: f, type: 'triangle', volume: 0.28, decay: 0.8, octaveSparkle: 0.2, pan: (i - 2) * 0.3 });
    });
    t.applyReverb({ mix: 0.35, decay: 2.2 });
    return t;
  },

  // 17. THIRD PLACE (2.0s)
  '17_third_place.wav': () => {
    const t = new AudioTrack(2.1);
    // Bronze achievement: F3 -> A3 -> C4 -> F4
    const notes = [
      { tm: 0.1, f: 174.61 },
      { tm: 0.35, f: 220.00 },
      { tm: 0.6, f: 261.63 },
      { tm: 0.85, f: 349.23 }
    ];
    notes.forEach((n, i) => {
      t.addTone({ time: n.tm, duration: 0.8, freq: n.f, type: 'triangle', volume: 0.35, decay: 0.6, octaveSparkle: 0.2, pan: (i - 1.5) * 0.3 });
    });
    t.addImpact({ time: 0.85, duration: 1.1, startFreq: 120, endFreq: 40, volume: 0.75 });
    t.applyReverb({ mix: 0.28, decay: 1.8 });
    return t;
  },

  // 18. SECOND PLACE (2.5s)
  '18_second_place.wav': () => {
    const t = new AudioTrack(2.55);
    // Silver achievement fanfare: G3 -> B3 -> D4 -> G4 -> B4
    t.addPitchSweep({ time: 0.05, duration: 0.4, startFreq: 200, endFreq: 600, type: 'saw', volume: 0.3 });
    const notes = [
      { tm: 0.2, f: 196.00 },
      { tm: 0.4, f: 246.94 },
      { tm: 0.6, f: 293.66 },
      { tm: 0.8, f: 392.00 },
      { tm: 1.0, f: 493.88 }
    ];
    notes.forEach((n, i) => {
      t.addTone({ time: n.tm, duration: 0.9, freq: n.f, type: 'triangle', volume: 0.38, decay: 0.7, octaveSparkle: 0.25, pan: (i - 2) * 0.3 });
    });
    t.addImpact({ time: 1.0, duration: 1.4, startFreq: 135, endFreq: 32, volume: 0.85 });
    t.addFMTone({ time: 1.02, duration: 1.2, carrierFreq: 1567.98, modRatio: 2.0, modIndex: 1.0, volume: 0.28 });
    t.applyReverb({ mix: 0.3, decay: 2.0 });
    return t;
  },

  // 19. SDG CHAMPION (4.5s) - THE BIGGEST SOUND
  '19_sdg_champion.wav': () => {
    const t = new AudioTrack(4.6);
    // 1. Initial deep sub impact
    t.addImpact({ time: 0.02, duration: 1.5, startFreq: 160, endFreq: 24, volume: 1.0 });
    // 2. Earth atmosphere wind sweep
    t.addWindSweep({ time: 0.05, duration: 3.8, centerFreqStart: 250, centerFreqEnd: 1200, volume: 0.25 });
    // 3. Futuristic energy rise (0.4s -> 1.5s)
    t.addPitchSweep({ time: 0.4, duration: 1.1, startFreq: 80, endFreq: 880, type: 'saw', volume: 0.5, panStart: -0.7, panEnd: 0.7 });

    // 4. Heroic victory chord at 1.55s
    const chordTime = 1.55;
    t.addImpact({ time: chordTime, duration: 2.8, startFreq: 180, endFreq: 22, volume: 1.0 });
    // E-Major / A-Major Ninth Harmonic Chord
    const chord = [
      { f: 220.00, v: 0.4 }, // A3
      { f: 277.18, v: 0.38 }, // C#4
      { f: 329.63, v: 0.38 }, // E4
      { f: 415.30, v: 0.35 }, // G#4
      { f: 493.88, v: 0.32 }, // B4
      { f: 659.25, v: 0.3 },  // E5
      { f: 880.00, v: 0.28 }  // A5
    ];
    chord.forEach((n, i) => {
      t.addTone({ time: chordTime + 0.02, duration: 2.9, freq: n.f, type: 'triangle', volume: n.v, decay: 2.2, octaveSparkle: 0.25, pan: (i - 3) * 0.25 });
    });

    // 5. Digital sparkle particle cascade
    [1.6, 1.75, 1.9, 2.1, 2.3, 2.5].forEach((tm, i) => {
      t.addFMTone({ time: tm, duration: 0.8, carrierFreq: 1760 + i * 330, modRatio: 2.76, modIndex: 0.7, volume: 0.22, pan: (i % 2 === 0 ? -0.5 : 0.5) });
    });

    t.applyReverb({ mix: 0.4, decay: 3.2 });
    return t;
  },

  // 20. SDG MISSION COMPLETE (3.5s)
  '20_sdg_mission_complete.wav': () => {
    const t = new AudioTrack(3.6);
    // Electronic pulse
    t.addImpact({ time: 0.02, duration: 0.7, startFreq: 110, endFreq: 45, volume: 0.6 });
    // Organic Earth texture: water droplets & wind
    t.addWaterDrop({ time: 0.3, baseFreq: 880, volume: 0.4, pan: -0.3 });
    t.addWaterDrop({ time: 0.5, baseFreq: 1100, volume: 0.35, pan: 0.3 });
    t.addWindSweep({ time: 0.2, duration: 2.8, centerFreqStart: 400, centerFreqEnd: 900, volume: 0.2 });

    // Uplifting chord at 0.9s: D Major Add9 (D4, F#4, A4, E5)
    const chordTime = 0.9;
    [293.66, 369.99, 440.00, 659.25].forEach((f, i) => {
      t.addTone({ time: chordTime, duration: 2.4, freq: f, type: 'triangle', volume: 0.35, decay: 1.8, octaveSparkle: 0.3, pan: (i - 1.5) * 0.35 });
    });
    // Clean final impact
    t.addImpact({ time: chordTime, duration: 1.8, startFreq: 130, endFreq: 30, volume: 0.85 });
    t.applyReverb({ mix: 0.35, decay: 2.4 });
    return t;
  },

  // 21. PLAYER ELIMINATED (1.2s)
  '21_player_eliminated.wav': () => {
    const t = new AudioTrack(1.25);
    // Subtle descending digital tone (G4 -> Eb4 -> C4)
    t.addPitchSweep({ time: 0.02, duration: 0.5, startFreq: 392.00, endFreq: 261.63, type: 'triangle', volume: 0.4, panStart: 0.3, panEnd: -0.3 });
    // Low damped impact
    t.addImpact({ time: 0.1, duration: 0.7, startFreq: 75, endFreq: 28, volume: 0.55 });
    t.applyReverb({ mix: 0.2, decay: 1.1 });
    return t;
  },

  // 22. POWER-UP / ACHIEVEMENT (1.5s)
  '22_powerup_achievement.wav': () => {
    const t = new AudioTrack(1.55);
    // Energetic ascending fast synth run: C5, D5, E5, G5, A5, C6
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    notes.forEach((f, i) => {
      t.addTone({ time: 0.04 + i * 0.06, duration: 0.3, freq: f, type: 'triangle', volume: 0.35, decay: 0.18, octaveSparkle: 0.3, pan: (i - 2.5) * 0.25 });
    });
    // Bright confirmation chord at 0.45s
    t.addImpact({ time: 0.45, duration: 1.0, startFreq: 120, endFreq: 35, volume: 0.75 });
    t.addFMTone({ time: 0.46, duration: 0.9, carrierFreq: 2093, modRatio: 2.0, modIndex: 1.0, volume: 0.35 });
    t.applyReverb({ mix: 0.28, decay: 1.6 });
    return t;
  },

  // 23. BUTTON HOVER (0.15s)
  '23_button_hover.wav': () => {
    const t = new AudioTrack(0.18);
    // Extremely subtle futuristic UI tick
    t.addClick({ time: 0.01, freq: 2400, duration: 0.018, volume: 0.32 });
    return t;
  },

  // 24. BUTTON CLICK (0.25s)
  '24_button_click.wav': () => {
    const t = new AudioTrack(0.28);
    // Premium tactile digital click: 1800Hz transient click + 110Hz micro-thump
    t.addClick({ time: 0.005, freq: 1900, duration: 0.025, volume: 0.55 });
    t.addImpact({ time: 0.01, duration: 0.15, startFreq: 120, endFreq: 45, volume: 0.5 });
    return t;
  },

  // 25. MENU OPEN (0.5s)
  '25_menu_open.wav': () => {
    const t = new AudioTrack(0.55);
    // Smooth futuristic whoosh + electronic activation
    t.addPitchSweep({ time: 0.01, duration: 0.28, startFreq: 250, endFreq: 1600, type: 'sine', volume: 0.35, panStart: -0.4, panEnd: 0.4 });
    t.addTone({ time: 0.18, duration: 0.32, freq: 1174.66, type: 'triangle', volume: 0.3, decay: 0.2 });
    t.applyReverb({ mix: 0.18, decay: 0.8 });
    return t;
  },

  // 26. MENU CLOSE (0.4s)
  '26_menu_close.wav': () => {
    const t = new AudioTrack(0.45);
    // Short reverse whoosh + soft digital click
    t.addPitchSweep({ time: 0.01, duration: 0.22, startFreq: 1600, endFreq: 250, type: 'sine', volume: 0.32, panStart: 0.4, panEnd: -0.4 });
    t.addClick({ time: 0.2, freq: 1400, duration: 0.025, volume: 0.4 });
    return t;
  },

  // 27. FINAL QUESTION (3.0s)
  '27_final_question.wav': () => {
    const t = new AudioTrack(3.1);
    // Deep slow pulse at 0.0s and 1.0s
    t.addImpact({ time: 0.05, duration: 1.2, startFreq: 80, endFreq: 26, volume: 0.85 });
    t.addImpact({ time: 1.2, duration: 1.4, startFreq: 90, endFreq: 26, volume: 0.95 });

    // Increasing electronic tension rising synth
    t.addPitchSweep({ time: 0.5, duration: 2.2, startFreq: 110, endFreq: 587, type: 'saw', volume: 0.45, panStart: -0.6, panEnd: 0.6, cutoffStart: 200, cutoffEnd: 3200 });
    t.applyReverb({ mix: 0.35, decay: 2.2 });
    return t;
  },

  // 28. FINAL ANSWER LOCK (1.5s)
  '28_final_answer_lock.wav': () => {
    const t = new AudioTrack(1.55);
    // Strong lock confirmation
    t.addClick({ time: 0.02, freq: 1600, duration: 0.03, volume: 0.6, pan: -0.2 });
    t.addClick({ time: 0.06, freq: 2400, duration: 0.03, volume: 0.65, pan: 0.2 });
    t.addImpact({ time: 0.08, duration: 0.25, startFreq: 120, endFreq: 50, volume: 0.6 });

    // Short suspense silence (0.2s -> 0.45s)

    // Suspense impact at 0.45s
    t.addImpact({ time: 0.45, duration: 1.0, startFreq: 110, endFreq: 24, volume: 0.95 });
    t.addTone({ time: 0.46, duration: 0.9, freq: 220, type: 'triangle', volume: 0.35, decay: 0.7 });
    t.applyReverb({ mix: 0.32, decay: 1.8 });
    return t;
  },

  // 29. EVENT FINISH (4.0s)
  '29_event_finish.wav': () => {
    const t = new AudioTrack(4.1);
    // Electronic energy fading into peaceful environmental biosphere
    t.addImpact({ time: 0.05, duration: 1.8, startFreq: 130, endFreq: 28, volume: 0.85 });
    // Sustained warm chord (G Major Add9)
    [196.00, 246.94, 293.66, 392.00, 440.00].forEach((f, i) => {
      t.addTone({ time: 0.08, duration: 2.5, freq: f, type: 'triangle', volume: 0.3, decay: 1.8, octaveSparkle: 0.2, pan: (i - 2) * 0.3 });
    });

    // Fades into peaceful wind and gentle water droplets
    t.addWindSweep({ time: 1.0, duration: 3.0, centerFreqStart: 500, centerFreqEnd: 300, volume: 0.28 });
    t.addWaterDrop({ time: 1.8, baseFreq: 920, volume: 0.35, pan: -0.4 });
    t.addWaterDrop({ time: 2.4, baseFreq: 1150, volume: 0.3, pan: 0.4 });
    t.addWaterDrop({ time: 3.0, baseFreq: 840, volume: 0.25, pan: 0.1 });

    t.applyReverb({ mix: 0.38, decay: 2.8 });
    return t;
  }
};

// ============================================================================
// 🚀 RUN GENERATOR
// ============================================================================

console.log('===================================================');
console.log('🎵 Generating 29 Original SDGVERSE Sound Effects...');
console.log(`📁 Target Directory: ${OUTPUT_DIR}`);
console.log('===================================================');

const generatedFiles = [];

for (const [filename, generator] of Object.entries(soundGenerators)) {
  const track = generator();
  const wavBuffer = track.toWavBuffer();
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, wavBuffer);

  const durationSec = (track.length / SAMPLE_RATE).toFixed(2);
  const sizeKb = (wavBuffer.length / 1024).toFixed(1);
  console.log(`✅ Generated: ${filename.padEnd(30)} [${durationSec}s | ${sizeKb} KB]`);

  generatedFiles.push({
    filename,
    durationSec,
    sizeKb,
    path: filePath
  });
}

console.log('===================================================');
console.log(`🎉 SUCCESS: All ${generatedFiles.length} WAV sound effects generated cleanly!`);
console.log('===================================================');
