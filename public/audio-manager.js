/**
 * =====================================================================
 * 🎮 SDG QUIZ BATTLE ROYALE AUDIO MANAGER
 * =====================================================================
 * Dedicated audio engine containing ONLY the requested sounds:
 * 1. Lobby & Question Background Music: /audio/music/free_fire.mp3
 * 2. Start Quiz / Let's Play Sound:    /audio/game/game_start.mp3
 * 3. Timeout Sound:                     /audio/game/time_up.mp3
 *
 * All other extra sounds (beeps, ticks, clicks, reveals, chimes)
 * are completely disabled to keep the audio clean and focused.
 * =====================================================================
 */

class AudioManagerClass {
  constructor() {
    this.masterVolume = 1.0;
    this.musicVolume = 0.45;
    this.sfxVolume = 0.90;
    this.muted = false;

    // BGM Channel State
    this.bgmAudio = null;
    this.bgmCurrentUrl = null;
    this.isBgmPlaying = false;
    this.bgmFadeInterval = null;
    this.pendingBgmUrl = null;

    // Autoplay unlock state
    this.isUnlocked = false;

    this.SOUNDS = {
      LOBBY_BGM: '/audio/music/free_fire.mp3',
      GAME_START: '/audio/game/game_start.mp3',
      TIME_UP: '/audio/game/time_up.mp3',
      VICTORY_BGM: '/audio/music/victory.mp3',
      CORRECT_ANSWER: '/audio/game/correct_answer.mp3',
      WRONG_ANSWER: '/audio/game/wrong_answer.mp3'
    };
    this.correctAudio = null;

    this.loadPreferences();
    this.setupAutoplayUnlock();
  }

  loadPreferences() {
    try {
      const savedMusic = localStorage.getItem('sdg_music_volume');
      const savedMute = localStorage.getItem('sdg_audio_muted');
      if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
      if (savedMute !== null) this.muted = savedMute === 'true';
    } catch (e) {}
  }

  savePreferences() {
    try {
      localStorage.setItem('sdg_music_volume', this.musicVolume.toString());
      localStorage.setItem('sdg_audio_muted', this.muted.toString());
    } catch (e) {}
  }

  setupAutoplayUnlock() {
    const unlockHandler = () => {
      this.isUnlocked = true;
      if (this.pendingBgmUrl && !this.isBgmPlaying) {
        const url = this.pendingBgmUrl;
        this.pendingBgmUrl = null;
        this.playBGM(url);
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  // =========================================================================
  // 🎵 BACKGROUND MUSIC (free_fire.mp3)
  // =========================================================================

  playBGM(url = this.SOUNDS.LOBBY_BGM, loop = true, fadeInDuration = 800) {
    if (this.isBgmPlaying && this.bgmCurrentUrl === url && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    if (this.bgmAudio) {
      if (this.bgmFadeInterval) clearInterval(this.bgmFadeInterval);
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch (e) {}
    }

    this.bgmCurrentUrl = url;
    this.bgmAudio = new Audio(url);
    this.bgmAudio.loop = loop;
    const targetVolume = this.muted ? 0 : Math.max(0, Math.min(1, this.masterVolume * this.musicVolume));

    if (fadeInDuration > 0 && !this.muted) {
      this.bgmAudio.volume = 0;
    } else {
      this.bgmAudio.volume = targetVolume;
    }

    const playPromise = this.bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isBgmPlaying = true;
          this.pendingBgmUrl = null;

          if (fadeInDuration > 0 && !this.muted) {
            let stepTime = 50;
            let totalSteps = Math.max(1, Math.floor(fadeInDuration / stepTime));
            let stepVolume = targetVolume / totalSteps;
            let currentStep = 0;

            if (this.bgmFadeInterval) clearInterval(this.bgmFadeInterval);
            this.bgmFadeInterval = setInterval(() => {
              currentStep++;
              if (this.bgmAudio) {
                this.bgmAudio.volume = Math.min(targetVolume, currentStep * stepVolume);
              }
              if (currentStep >= totalSteps) {
                clearInterval(this.bgmFadeInterval);
                this.bgmFadeInterval = null;
                if (this.bgmAudio) this.bgmAudio.volume = targetVolume;
              }
            }, stepTime);
          }
        })
        .catch(err => {
          this.pendingBgmUrl = url;
          this.isBgmPlaying = false;
        });
    }
  }

  stopBGM(fadeDuration = 0) {
    this.pendingBgmUrl = null;
    if (!this.bgmAudio || !this.isBgmPlaying) {
      this.isBgmPlaying = false;
      return;
    }

    if (this.bgmFadeInterval) clearInterval(this.bgmFadeInterval);

    if (fadeDuration <= 0 || this.bgmAudio.paused) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch (e) {}
      this.isBgmPlaying = false;
      this.bgmCurrentUrl = null;
      return;
    }

    const startVol = this.bgmAudio.volume;
    const stepTime = 50;
    const totalSteps = Math.max(1, Math.floor(fadeDuration / stepTime));
    const stepVolume = startVol / totalSteps;
    let currentStep = 0;

    this.bgmFadeInterval = setInterval(() => {
      currentStep++;
      if (this.bgmAudio) {
        this.bgmAudio.volume = Math.max(0, startVol - (currentStep * stepVolume));
      }
      if (currentStep >= totalSteps) {
        clearInterval(this.bgmFadeInterval);
        this.bgmFadeInterval = null;
        if (this.bgmAudio) {
          try {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
          } catch (e) {}
        }
        this.isBgmPlaying = false;
        this.bgmCurrentUrl = null;
      }
    }, stepTime);
  }

  // =========================================================================
  // ⚡ SOUND EFFECT PLAYER (ONLY ALLOWED SFX)
  // =========================================================================

  playSFX(url, volumeScale = 1.0) {
    if (this.muted) return;
    try {
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume * volumeScale));
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  // =========================================================================
  // 🎯 ACTIVE GAME SOUND TRIGGERS
  // =========================================================================

  // 1. Lobby Music
  startLobbyMusic() {
    this.stopTimeoutAudio();
    this.stopCorrectAudio();
    this.playBGM(this.SOUNDS.LOBBY_BGM, true, 800);
  }

  // 2. Start Quiz / Let's Play Sound
  hostStartGame() {
    this.stopTimeoutAudio();
    this.stopCorrectAudio();
    this.playSFX(this.SOUNDS.GAME_START, 1.0);
    this.stopBGM(500);
  }

  // 3. Timing Out BGM (plays across 5 - 4 - 3 - 2 - 1 - 0)
  timeUp() {
    this.stopBGM(0);
    if (this.timeoutAudio && !this.timeoutAudio.paused) {
      return; // Already smoothly playing the 5-4-3-2-1-0 countdown audio
    }
    if (this.muted) return;
    try {
      this.timeoutAudio = new Audio(this.SOUNDS.TIME_UP);
      this.timeoutAudio.volume = Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume * 1.0));
      const p = this.timeoutAudio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  stopTimeoutAudio() {
    if (this.timeoutAudio) {
      try {
        this.timeoutAudio.pause();
        this.timeoutAudio.currentTime = 0;
      } catch (e) {}
      this.timeoutAudio = null;
    }
  }

  // 4. Winning / Victory Stage Background Music
  playVictoryMusic() {
    this.stopTimeoutAudio();
    this.stopCorrectAudio();
    this.playBGM(this.SOUNDS.VICTORY_BGM, true, 500);
  }

  // 5. Correct Answer Sound (Applause / Cheering)
  correctAnswer() {
    this.stopTimeoutAudio();
    this.stopCorrectAudio();
    if (this.muted) return;
    try {
      this.correctAudio = new Audio(this.SOUNDS.CORRECT_ANSWER);
      this.correctAudio.volume = Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume * 1.0));
      const p = this.correctAudio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  stopCorrectAudio() {
    if (this.correctAudio) {
      try {
        this.correctAudio.pause();
        this.correctAudio.currentTime = 0;
      } catch (e) {}
      this.correctAudio = null;
    }
  }

  // 6. Wrong Answer Sound
  wrongAnswer() {
    this.stopTimeoutAudio();
    this.stopCorrectAudio();
    if (this.muted) return;
    try {
      const audio = new Audio(this.SOUNDS.WRONG_ANSWER);
      audio.volume = Math.max(0, Math.min(1, this.masterVolume * this.sfxVolume * 1.0));
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  // =========================================================================
  // 🔇 DISABLED / EXTRA SOUND NO-OPS (PREVENTS ANY UNNECESSARY NOISE)
  // =========================================================================
  playerJoin() {}
  playerLeave() {}
  playerCount() {}
  roomFull() {}
  buttonClick() {}
  buttonHover() {}
  menuOpen() {}
  menuClose() {}
  countdown() {}
  questionReveal() {}
  answerSelect() {}
  timeWarning() {}
  leaderboardOpen() {}
  rankUp() {}
  rankDown() {}
  victory() {
    this.playVictoryMusic();
  }
  gameComplete() {
    this.playVictoryMusic();
  }

  // =========================================================================
  // 🎚️ CONTROLS & MUTE
  // =========================================================================

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmAudio && !this.muted) {
      this.bgmAudio.volume = this.masterVolume * this.musicVolume;
    }
    this.savePreferences();
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmAudio && !this.muted) {
      this.bgmAudio.volume = this.masterVolume * this.musicVolume;
    }
    this.savePreferences();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.muted ? 0 : (this.masterVolume * this.musicVolume);
    }
    this.savePreferences();
    return this.muted;
  }
}

// Global Singleton
window.AudioManager = new AudioManagerClass();
