# 🌐 SDGVERSE — Sound Identity & Master Audio Architecture
**College-Level Sustainable Development Goals Competition Audio Identity**

---

## 1. Executive Summary & Design Vision

**SDGVERSE** is an elite collegiate esports-style competition where students race against the clock to solve complex global challenges across the 17 UN Sustainable Development Goals.

### The Sonic Ethos: *"Humanity Has Entered a Mission to Solve the Future"*
* **Aesthetic**: Futuristic + Environmental + Cinematic + Intelligent + Competitive.
* **Tone**: Serious, inspiring, scientific, and prestigious.
* **Strict Restraints**:
  * ❌ **NO cartoon / childish sound effects**.
  * ❌ **NO cheap 8-bit arcade bleeps**.
  * ❌ **NO excessive explosion tropes**.
  * ❌ **NO casual mobile-game jingles**.
  * ✅ **YES**: Pristine physical acoustics, dual-oscillator sub-bass, organic nature textures (wind, water, biology), and crystalline glass/plasma harmonics.

---

## 2. Core Acoustic Palette & Frequency Allocation

```
Frequency Range     Primary Element                      Emotional Rationale
────────────────────────────────────────────────────────────────────────────────────────────
Sub-Bass (20–60Hz)  Tectonic rumbles, sub-drop booms     Planetary scale & solemn weight
Low-Mid (80–300Hz)  Cardiac lub-dub, warm synth chassis   Human biological foundation
Mids (400–1.5kHz)   Bandpass pink noise, liquid sweeps   Environmental nature textures
High-Mid (2–5kHz)   Telemetry scans, resonant clicks     Futuristic mission control UI
Brilliance (6–14kHz)Crystalline partials, air reverb     Intellectual clarity & optimism
```

---

## 3. The Signature Sound Motif: *"Planet Pulse"*

The recognizable acoustic motif uniting every stage of the tournament.

$$\text{Earth Hum} \longrightarrow \text{Heartbeat} \longrightarrow \text{Digital Pulse} \longrightarrow \text{Water Drop} \longrightarrow \text{Synth Rise} \longrightarrow \text{Cinematic Impact}$$

### Technical Breakdown:
1. **Low Earth Hum (0.0s – 0.6s)**: 55Hz pure sine with 90Hz lowpass filter, establishing planetary mass.
2. **Heartbeat (0.5s – 0.9s)**: Dual bi-phasic sine impulse (65Hz $\rightarrow$ 52Hz) representing humanity.
3. **Digital Pulse (0.9s – 1.2s)**: High C6/E6 (1046Hz / 1318Hz) telemetry beeps representing scientific intervention.
4. **Water Drop (1.25s – 1.5s)**: FM modulated downward pitch sweep (880Hz $\rightarrow$ 1930Hz $\rightarrow$ 960Hz) for nature.
5. **Synth Rise (1.5s – 2.4s)**: 24dB resonant sawtooth sweep (110Hz $\rightarrow$ 440Hz, filter cutoff climbing to 2.6kHz).
6. **Cinematic Impact (2.45s)**: Exponential sub-bass drop (120Hz $\rightarrow$ 26Hz) layered with high 1760Hz crystalline shimmer.

### Grand Winner Finale Expansion:
* **Earth Ambience** $\rightarrow$ **Dual Slow Heartbeats** $\rightarrow$ **3 Ascending Pulses (A5-C#6-E6)** $\rightarrow$ **Massive Dual-Sawtooth Rise** $\rightarrow$ **Dramatic 250ms Silence Gate** $\rightarrow$ **Final Tectonic Impact** $\rightarrow$ **Sustained E-Major/A-Major Ninth Harmonic Air Chord** ($\sim$4.0s decay).

---

## 4. Comprehensive Game Event Audio Cues

### A. Mission Progression & Opening
* **Atmospheric Opening (`playOpening()`)**:
  * 45Hz sub-drone with resonant pink-noise wind sweep, organic heartbeat, rising sawtooth ramp, deep impact, and high G6/C6 reveal chime.
* **Game Activation (`playGameStart()`)**:
  * 2.2s power boot: quad-tone telemetry scan burst $\rightarrow$ rising bandpass energy surge (80Hz to 600Hz) $\rightarrow$ portal impact.
* **Round Complete / Level Transition (`playRoundComplete()`)**:
  * Ascending E3 $\rightarrow$ E5 glide $\rightarrow$ layered confirmation pulses $\rightarrow$ clean E-Major Add9 harmonic chord.

### B. In-Game Interactive Cues
* **Question Reveal (`playQuestionReveal()`)**:
  * 0.6s clean telemetry scan (350Hz $\rightarrow$ 1400Hz) $\rightarrow$ 1760Hz crystal ping $\rightarrow$ subtle sub-stabilization thud.
* **Answer Selected (`playAnswerSelect()`)**:
  * Tactile 1600Hz micro-click + damped sub-pulse. Provides crisp phone haptic feel.
* **Correct Answer (`playCorrect()`)**:
  * Intelligent achievement cue: ascending F# Major triad (F#5, A#5, C#6) + high 2217Hz crystalline glass overtone + soft sub-bass support.
* **Incorrect Answer (`playWrong()`)**:
  * Dignified failure: smooth descending minor tone (C4 $\rightarrow$ F3) through a 200Hz warm lowpass filter + damped sub-bass drop. **Zero harsh buzzers**.

### C. Futuristic Timer System
* **Normal Time (> 10s)**:
  * Discreet 720Hz pulse every second.
* **10 Seconds Remaining**:
  * Intensified 880Hz pulse layered with subtle sub-impact, alerting players without panic.
* **5 Seconds Remaining**:
  * Fast 1.4x biological cardiac pulse + 1174Hz (D6) warning accent.
* **Time Up (`playTimeUp()`)**:
  * Sudden acoustic gate $\rightarrow$ deep cinematic impact $\rightarrow$ 659Hz downward digital shutdown glide.

### D. SDG Thematic Signatures (Nature + Technology)
* **SDG 6 (Clean Water)**: Multi-stage liquid droplet with cascading resonant 440Hz liquid synth wave.
* **SDG 7 (Clean Energy)**: 60Hz $\rightarrow$ 2.4kHz ionized power surge hum with electrical micro-sparks.
* **SDG 3 (Good Health)**: Human cardiac rhythm transitioning into clean diagnostic medical telemetry chime.
* **SDG 4 (Quality Education)**: 5-note neural synapse ripple blooming into dual crystalline glass chimes (G6/C7).
* **SDG 11 (Sustainable Cities)**: Ambient urban triangle drone with stereophonic grid traffic pulses.
* **SDG 13 (Climate Action)**: Resonant planetary wind vortex layered onto a 35Hz tectonic sub-rumble.

---

## 5. Technical Implementation & Architecture

The entire sound system is delivered via **`sdgverse-audio.js`**:
* **Zero External Audio Files**: No missing `.mp3` or `.wav` network requests. 100% procedurally synthesized in real-time.
* **Sample Rate**: Native 44.1kHz / 48kHz / 96kHz browser context.
* **Broadcast Limiter & Dynamics Compressor**: Threshold -18dB, 6:1 ratio, 3ms attack to protect venue PA systems.
* **Convolution Reverb Simulation**: Procedural 2.4s algorithmic impulse response buffer modeling planetary spatial diffusion.
* **Live Interactive Suite**: Available at `/sound-identity.html` with real-time spectrum analyzer and oscilloscope.

---

## 6. Original 29-WAV Sound Effect Pack (48kHz Stereo)

All 29 individual sound effects have been synthesized from first mathematical principles using custom DSP (oscillators, FM synthesis, resonant biquad filtering, pink noise atmospheric modeling, and soft-clip limiter mastering) into high-fidelity 48,000 Hz 16-bit Stereo PCM WAV files in `/public/audio/`.

An interactive player and downloader is available at **`/sound-pack.html`**.

### Sound Effect Manifest:

| # | File Name | Category | Duration | Sonic Description |
| :-: | :--- | :--- | :-: | :--- |
| **01** | `01_player_waiting.wav` | Lobby | 2.60s | Ambient loop: 50Hz sub-pulse, digital telemetry, gentle wind |
| **02** | `02_player_joining.wav` | Lobby | 1.25s | Radar scan (350Hz–1400Hz) $\rightarrow$ ascending synth triad (A4-C#5-E5) |
| **03** | `03_player_joined.wav` | Lobby | 0.95s | Punchy positive 3-note electronic tone (D5 $\rightarrow$ F#5 $\rightarrow$ A5) + sub-thump |
| **04** | `04_game_start.wav` | Launch | 2.50s | Deep pulse $\rightarrow$ rapid energy charge $\rightarrow$ powerful esports impact $\rightarrow$ E-Major finish |
| **05** | `05_countdown_3.wav` | Countdown | 0.75s | Deep electronic impact tuned to G2 (98Hz) |
| **06** | `06_countdown_2.wav` | Countdown | 0.75s | Higher-pitched electronic impact tuned to C3 (130.8Hz) |
| **07** | `07_countdown_1.wav` | Countdown | 0.85s | Rising tension sweep $\rightarrow$ bright impact at D3 (146.8Hz) |
| **08** | `08_go.wav` | Launch | 1.10s | Fast riser $\rightarrow$ huge clean esports sub-impact + stereo energy burst |
| **09** | `09_time_warning.wav` | Timer | 1.55s | Rapid futuristic pulses accelerating in speed (urgent "Hurry up!") |
| **10** | `10_time_up.wav` | Timer | 1.55s | Warning pulse $\rightarrow$ descending electronic glide $\rightarrow$ deep final impact |
| **11** | `11_answer_locked.wav` | Gameplay | 0.65s | Digital micro-ratchet lock clicks + confirmation sub-pulse |
| **12** | `12_correct_answer.wav` | Gameplay | 1.25s | Ascending F# Major triad + sub-impact + crystalline sparkle cascade |
| **13** | `13_wrong_answer.wav` | Gameplay | 0.95s | Smooth low electronic error tone (C4 $\rightarrow$ F3) + damped sub-drop |
| **14** | `14_leaderboard_rank_up.wav` | Ranking | 1.85s | Rapid ascending arpeggio (C5-E5-G5-C6) + energetic impact |
| **15** | `15_leaderboard_reveal.wav` | Ranking | 2.55s | Wide sweep $\rightarrow$ rising tension $\rightarrow$ esports scoreboard reveal impact |
| **16** | `16_top_3_reveal.wav` | Podium | 3.10s | Tension build $\rightarrow$ 3 rhythmic pulses (3rd, 2nd, 1st) $\rightarrow$ championship reveal |
| **17** | `17_third_place.wav` | Podium | 2.10s | Elegant bronze achievement fanfare (F3-A3-C4-F4) with warm sub-bass |
| **18** | `18_second_place.wav` | Podium | 2.55s | Energetic silver achievement fanfare with rising sweep & shimmer |
| **19** | `19_sdg_champion.wav` | Victory | 4.60s | **THE BIGGEST SOUND**: Massive sub-impact $\rightarrow$ energy rise $\rightarrow$ victory Maj9 chord $\rightarrow$ sparkles $\rightarrow$ Earth atmosphere $\rightarrow$ heroic sustain |
| **20** | `20_sdg_mission_complete.wav` | Victory | 3.60s | Electronic pulse $\rightarrow$ organic water & wind $\rightarrow$ uplifting chord $\rightarrow$ clean impact |
| **21** | `21_player_eliminated.wav` | Gameplay | 1.25s | Subtle competitive elimination: descending tone + low damped impact |
| **22** | `22_powerup_achievement.wav` | Reward | 1.55s | Energetic 6-note ascending fast synth run + digital particles |
| **23** | `23_button_hover.wav` | UI | 0.18s | Extremely subtle futuristic UI tick (2400Hz micro-pulse) |
| **24** | `24_button_click.wav` | UI | 0.28s | Premium tactile digital click (1900Hz click + 110Hz micro-thump) |
| **25** | `25_menu_open.wav` | UI | 0.55s | Smooth futuristic whoosh + electronic activation chime |
| **26** | `26_menu_close.wav` | UI | 0.45s | Reverse whoosh + soft tactile digital close click |
| **27** | `27_final_question.wav` | Climax | 3.10s | Deep slow sub-pulse $\rightarrow$ increasing electronic tension $\rightarrow$ rising detuned saw |
| **28** | `28_final_answer_lock.wav` | Climax | 1.55s | Strong lock confirmation $\rightarrow$ suspense silence $\rightarrow$ dark suspense impact |
| **29** | `29_event_finish.wav` | Ceremony | 4.10s | Electronic energy fades into peaceful biosphere atmosphere (wind/water) |

