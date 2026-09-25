// ==========================================
// 🚀 KAHOOT LIVE MULTIPLAYER CLIENT JS
// ==========================================

// Safe Low-Network Resilience Socket.IO initialization
let socket = null;
try {
  if (typeof io !== 'undefined') {
    socket = io({
      transports: ['websocket', 'polling'], // Auto-fallback to HTTP polling on weak 2G/3G/4G
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 10000
    });
  }
} catch (e) {
  console.warn('Socket initialization deferred:', e);
}

// Kahoot Option Themes
const OPTION_THEMES = [
  { color: '#e21b3c', shape: '▲', label: 'Red Triangle' },
  { color: '#1368ce', shape: '◆', label: 'Blue Diamond' },
  { color: '#d89e00', shape: '●', label: 'Yellow Circle' },
  { color: '#26890c', shape: '■', label: 'Green Square' }
];

// Audio FX Generator (Synthesized AudioContext - zero external mp3 files needed)
const SoundFX = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },

  playTone(freq, duration, type = 'sine') {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },

  join() { this.playTone(587.33, 0.15); }, // D5
  tick() { this.playTone(800, 0.05, 'square'); },
  correct() {
    this.playTone(523.25, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.2), 200); // G5
  },
  wrong() {
    this.playTone(300, 0.15, 'sawtooth');
    setTimeout(() => this.playTone(220, 0.3, 'sawtooth'), 150);
  },
  fastest() {
    this.playTone(880, 0.1, 'triangle');
    setTimeout(() => this.playTone(1174.66, 0.3, 'triangle'), 120);
  },
  victory() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.25, 'triangle'), i * 150);
    });
  }
};

// Simple Confetti Animation for Winner Podium
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#f43f5e', '#3b82f6', '#eab308', '#10b981', '#a855f7', '#ec4899'];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (pieces.some(p => p.y < canvas.height)) {
      requestAnimationFrame(render);
    }
  }

  render();
}

// ==========================================
// 🖥️ HOST BIG SCREEN CONTROLLER LOGIC
// ==========================================
window.HostApp = {
  pin: null,
  currentQuestion: null,

  init() {
    this.loadQuestionSets();
    this.bindSocketEvents();
  },

  async loadQuestionSets() {
    const setSelect = document.getElementById('setSelect');
    if (!setSelect) return;

    let sets = [];
    try {
      const res = await fetch('/api/question-sets');
      if (res.ok) {
        sets = await res.json();
      }
    } catch (err) {
      console.warn('API fetch /api/question-sets failed, trying static JSON files...', err);
    }

    // Fallback 1: Direct fetch static questions.json and general.json
    if (!Array.isArray(sets) || sets.length === 0) {
      try {
        const files = ['questions.json', 'general.json'];
        for (const file of files) {
          const res = await fetch('/' + file).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            Object.keys(data).forEach(key => {
              const item = data[key];
              if (item) {
                const qList = item.mcq || (Array.isArray(item) ? item : []);
                sets.push({
                  key: key,
                  name: item.name || key,
                  count: qList.length
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Static JSON fetch failed', err);
      }
    }

    // Fallback 2: Hardcoded safety options if all fetches failed
    if (!Array.isArray(sets) || sets.length === 0) {
      sets = [
        { key: 'JAVA23A', name: 'Set A (Java OOP)', count: 20 },
        { key: 'JAVA23B', name: 'Set B (Java Advanced)', count: 10 },
        { key: 'GKINDIA1', name: 'India General Knowledge Set 1', count: 3 }
      ];
    }

    setSelect.innerHTML = sets.map(s => 
      `<option value="${s.key}">${escapeHtml(s.name)} (${s.count} Questions)</option>`
    ).join('');
  },

  createGame() {
    const setKey = document.getElementById('setSelect')?.value || 'JAVA23A';
    const timeLimit = parseInt(document.getElementById('timeSelect')?.value || '20', 10);
    const limitQuestions = parseInt(document.getElementById('limitSelect')?.value || '0', 10);
    const shuffle = document.getElementById('shuffleQuestionsToggle')?.checked || false;

    SoundFX.init();
    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    if (!socket) {
      alert('Unable to connect to game server. Please start the server by running "npm start" or double-clicking "start-quiz.bat"!');
      return;
    }

    socket.emit('host-create-game', {
      setKey: setKey,
      timePerQuestion: timeLimit,
      limitQuestions: limitQuestions,
      shuffleQuestions: shuffle
    });
  },

  startGame() {
    if (!this.pin || !socket) return;
    socket.emit('host-start-game', { pin: this.pin });
  },

  skipTimer() {
    if (!this.pin || !socket) return;
    socket.emit('host-skip-timer', { pin: this.pin });
  },

  kickPlayer(playerId) {
    if (!this.pin || !playerId || !socket) return;
    if (confirm('Are you sure you want to kick this player from the lobby?')) {
      socket.emit('host-kick-player', { pin: this.pin, playerId: playerId });
    }
  },

  nextQuestion() {
    if (!this.pin || !socket) return;
    socket.emit('host-next-question', { pin: this.pin });
  },

  showLeaderboard() {
    if (!this.pin || !socket) return;
    socket.emit('host-show-leaderboard', { pin: this.pin });
  },

  toggleSound() {
    SoundFX.muted = !SoundFX.muted;
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.innerHTML = SoundFX.muted ? '🔇 Sound Off' : '🔊 Sound On';
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  },

  bindSocketEvents() {
    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    if (!socket) return;

    socket.on('game-created', (data) => {
      this.pin = data.pin;
      document.getElementById('hostPinDisplay').textContent = data.pin;
      document.getElementById('hostSetupStage').style.display = 'none';
      document.getElementById('hostLobbyStage').style.display = 'block';
    });

    socket.on('player-list-update', (data) => {
      SoundFX.join();
      const listEl = document.getElementById('playerList');
      const countEl = document.getElementById('playerCount');
      if (countEl) countEl.textContent = data.count;

      if (listEl) {
        listEl.innerHTML = data.players.map(p => 
          `<div class="player-badge animated-pop" onclick="HostApp.kickPlayer('${p.id}')" title="Click to Kick">
            <span>👤</span> ${escapeHtml(p.name)} <span class="kick-x">✕</span>
          </div>`
        ).join('');
      }

      const startBtn = document.getElementById('startBtn');
      if (startBtn) {
        startBtn.disabled = data.count === 0;
      }
    });

    socket.on('new-question', (data) => {
      this.currentQuestion = data;
      document.getElementById('hostLobbyStage').style.display = 'none';
      document.getElementById('hostResultStage').style.display = 'none';
      document.getElementById('hostLeaderboardStage').style.display = 'none';
      document.getElementById('hostQuestionStage').style.display = 'block';

      document.getElementById('qIndexDisplay').textContent = `Question ${data.questionIndex + 1} of ${data.totalQuestions}`;
      document.getElementById('questionText').textContent = data.questionText;
      document.getElementById('timerNum').textContent = data.timeLimit;
      document.getElementById('answeredCount').textContent = '0';
      document.getElementById('totalPlayersCount').textContent = '-';

      const opts = (data.options && Array.isArray(data.options) && data.options.length > 0)
        ? data.options
        : ["True", "False"];

      const optionsGrid = document.getElementById('hostOptionsGrid');
      optionsGrid.innerHTML = opts.map((optText, idx) => {
        const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
        return `
          <div class="host-option-box" style="background-color: ${theme.color}">
            <span class="shape-icon">${theme.shape}</span>
            <span class="option-text">${escapeHtml(optText)}</span>
          </div>
        `;
      }).join('');
    });

    socket.on('timer-tick', (data) => {
      const timerEl = document.getElementById('timerNum');
      if (timerEl) {
        timerEl.textContent = data.timeLeft;
        if (data.timeLeft <= 5 && data.timeLeft > 0) {
          SoundFX.tick();
          timerEl.classList.add('pulse-red');
        } else {
          timerEl.classList.remove('pulse-red');
        }
      }
    });

    socket.on('response-count-update', (data) => {
      document.getElementById('answeredCount').textContent = data.answeredCount;
      document.getElementById('totalPlayersCount').textContent = data.totalPlayers;
    });

    socket.on('question-result', (data) => {
      document.getElementById('hostQuestionStage').style.display = 'none';
      document.getElementById('hostResultStage').style.display = 'block';

      document.getElementById('resQuestionText').textContent = data.questionText;
      document.getElementById('resExplanation').textContent = data.explanation || '';

      const opts = (data.options && Array.isArray(data.options) && data.options.length > 0)
        ? data.options
        : ["True", "False"];

      const optionCounts = data.optionCounts || opts.map(() => 0);
      const maxVotes = Math.max(...optionCounts, 1);
      const chartEl = document.getElementById('barChartContainer');

      chartEl.innerHTML = opts.map((optText, idx) => {
        const votes = optionCounts[idx] || 0;
        const percent = Math.round((votes / maxVotes) * 100);
        const isCorrect = (idx === data.correctAnswer);
        const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];

        return `
          <div class="chart-column ${isCorrect ? 'is-correct-col' : ''}">
            <div class="chart-bar-wrapper">
              <span class="vote-count">${votes}</span>
              <div class="chart-bar ${isCorrect ? 'correct-bar' : ''}" style="height: ${percent}%; background-color: ${theme.color}"></div>
            </div>
            <div class="chart-label">
              <span class="shape-icon">${theme.shape}</span>
              ${isCorrect ? '<span class="checkmark-badge">✓</span>' : ''}
            </div>
          </div>
        `;
      }).join('');

      const fastestBox = document.getElementById('fastestPlayerBox');
      if (data.fastestPlayer) {
        SoundFX.fastest();
        fastestBox.style.display = 'flex';
        fastestBox.innerHTML = `
          <div class="lightning-icon">⚡</div>
          <div class="fastest-details">
            <span class="fastest-title">FASTEST CORRECT ANSWER</span>
            <span class="fastest-name">${escapeHtml(data.fastestPlayer.name)} in ${data.fastestPlayer.timeTakenSec} seconds!</span>
          </div>
        `;
      } else {
        fastestBox.style.display = 'none';
      }
    });

    socket.on('leaderboard-data', (data) => {
      document.getElementById('hostResultStage').style.display = 'none';
      document.getElementById('hostLeaderboardStage').style.display = 'block';

      const nextBtn = document.getElementById('nextQBtn');
      if (data.isLastQuestion) {
        nextBtn.textContent = 'Finish Quiz & View Podium 🏆';
      } else {
        nextBtn.textContent = 'Next Question ➔';
      }

      const boardEl = document.getElementById('leaderboardList');
      boardEl.innerHTML = data.leaderboard.map((player) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[player.rank - 1] || `#${player.rank}`;
        return `
          <div class="leaderboard-row rank-${player.rank} animated-slide-up">
            <div class="rank-badge">${medal}</div>
            <div class="player-name">${escapeHtml(player.name)} ${player.roll ? `<small>(${escapeHtml(player.roll)})</small>` : ''}</div>
            <div class="player-score">${player.score} pts</div>
          </div>
        `;
      }).join('');
    });

    socket.on('game-over', (data) => {
      SoundFX.victory();
      triggerConfetti();

      document.getElementById('hostLeaderboardStage').style.display = 'none';
      document.getElementById('hostGameOverStage').style.display = 'block';

      const podiumEl = document.getElementById('podiumContainer');
      const top3 = data.podium || [];

      const p1 = top3[0] ? top3[0].name : '-';
      const s1 = top3[0] ? top3[0].score : 0;
      const p2 = top3[1] ? top3[1].name : '-';
      const s2 = top3[1] ? top3[1].score : 0;
      const p3 = top3[2] ? top3[2].name : '-';
      const s3 = top3[2] ? top3[2].score : 0;

      podiumEl.innerHTML = `
        <div class="podium-step step-2">
          <div class="podium-rank">2nd</div>
          <div class="podium-name">${escapeHtml(p2)}</div>
          <div class="podium-score">${s2} pts</div>
          <div class="podium-block"></div>
        </div>
        <div class="podium-step step-1">
          <div class="podium-crown">👑</div>
          <div class="podium-rank">1st</div>
          <div class="podium-name">${escapeHtml(p1)}</div>
          <div class="podium-score">${s1} pts</div>
          <div class="podium-block"></div>
        </div>
        <div class="podium-step step-3">
          <div class="podium-rank">3rd</div>
          <div class="podium-name">${escapeHtml(p3)}</div>
          <div class="podium-score">${s3} pts</div>
          <div class="podium-block"></div>
        </div>
      `;

      const tbody = document.getElementById('fullScoreboardBody');
      if (tbody) {
        tbody.innerHTML = (data.allScores || []).map(p => `
          <tr>
            <td><strong>#${p.rank}</strong></td>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.roll || 'N/A')}</td>
            <td><strong>${p.score}</strong> pts</td>
            <td>${p.totalCorrect} Correct</td>
          </tr>
        `).join('');
      }
    });
  }
};

// ==========================================
// 📱 MOBILE PLAYER CONTROLLER LOGIC
// ==========================================
window.PlayerApp = {
  pin: null,
  name: null,

  init() {
    this.bindSocketEvents();
  },

  joinGame() {
    const pin = document.getElementById('playerPinInput')?.value.trim();
    const name = document.getElementById('playerNameInput')?.value.trim();
    const roll = document.getElementById('playerRollInput')?.value.trim();

    if (!pin || !name) {
      return alert('Please enter both Game PIN and your Name!');
    }

    SoundFX.init();
    this.pin = pin;
    this.name = name;

    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    if (socket) {
      socket.emit('player-join-game', { pin, name, roll });
    }
  },

  submitAnswer(optionIndex) {
    if (!this.pin || !socket) return;

    // Optimistic UI: Immediately lock buttons & show submitting status
    const btns = document.querySelectorAll('.player-opt-btn');
    btns.forEach(b => b.disabled = true);

    const selectedBtn = document.getElementById(`pOptBtn_${optionIndex}`);
    if (selectedBtn) selectedBtn.classList.add('selected-btn');

    socket.emit('player-submit-answer', {
      pin: this.pin,
      optionIndex: optionIndex
    });
  },

  bindSocketEvents() {
    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    if (!socket) return;

    // Low-network auto-reconnect logic
    socket.on('disconnect', (reason) => {
      console.warn('Player disconnected from network:', reason);
      const badge = document.querySelector('.connected-badge');
      if (badge) {
        badge.className = 'connected-badge disconnected-badge';
        badge.innerHTML = '<span class="pulse-dot red-dot"></span> RECONNECTING...';
      }
    });

    socket.on('connect', () => {
      console.log('Player connected to network!');
      const badge = document.querySelector('.connected-badge');
      if (badge) {
        badge.className = 'connected-badge';
        badge.innerHTML = '<span class="pulse-dot"></span> CONNECTED';
      }
      if (this.pin && this.name) {
        socket.emit('player-join-game', { pin: this.pin, name: this.name });
      }
    });

    socket.on('join-error', (data) => {
      alert(data.message);
    });

    socket.on('kicked-from-game', (data) => {
      alert(data.message);
      window.location.reload();
    });

    socket.on('player-joined-success', (data) => {
      document.getElementById('playerJoinStage').style.display = 'none';
      document.getElementById('playerLobbyStage').style.display = 'block';
      document.getElementById('connectedName').textContent = data.name;
    });

    socket.on('question-started', (data) => {
      document.getElementById('playerLobbyStage').style.display = 'none';
      document.getElementById('playerResultStage').style.display = 'none';
      document.getElementById('playerLeaderboardStage').style.display = 'none';
      document.getElementById('playerQuestionStage').style.display = 'block';

      document.getElementById('playerQIndex').textContent = `Question ${data.questionIndex + 1}`;
      document.getElementById('playerAnsweredLock').style.display = 'none';

      const buttonsContainer = document.getElementById('playerOptionsContainer');
      buttonsContainer.style.display = 'grid';

      const options = (data.options && Array.isArray(data.options) && data.options.length > 0)
        ? data.options
        : ['True', 'False'];

      buttonsContainer.innerHTML = options.map((optText, idx) => {
        const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
        return `
          <button id="pOptBtn_${idx}" class="player-opt-btn" style="background-color: ${theme.color}" onclick="PlayerApp.submitAnswer(${idx})">
            <span class="shape-icon">${theme.shape}</span>
            <span class="btn-text">${escapeHtml(optText)}</span>
          </button>
        `;
      }).join('');
    });

    socket.on('answer-accepted', () => {
      document.getElementById('playerOptionsContainer').style.display = 'none';
      document.getElementById('playerAnsweredLock').style.display = 'block';
    });

    socket.on('question-result', (data) => {
      document.getElementById('playerQuestionStage').style.display = 'none';
      document.getElementById('playerResultStage').style.display = 'block';

      const statusBox = document.getElementById('playerFeedbackBox');
      if (data.isCorrect) {
        SoundFX.correct();
        statusBox.className = 'feedback-card correct-card';
        statusBox.innerHTML = `
          <div class="feedback-icon">🎉 Correct!</div>
          <div class="feedback-points">+${data.pointsEarned} pts</div>
          <div class="feedback-sub">Answered in ${data.timeTakenSec}s</div>
        `;
      } else {
        SoundFX.wrong();
        statusBox.className = 'feedback-card wrong-card';
        statusBox.innerHTML = `
          <div class="feedback-icon">❌ Incorrect</div>
          <div class="feedback-sub">Correct Answer: <strong>${escapeHtml(data.correctAnswerText)}</strong></div>
        `;
      }
      document.getElementById('playerTotalScore').textContent = data.totalScore;
    });

    socket.on('player-leaderboard-update', () => {
      document.getElementById('playerResultStage').style.display = 'none';
      document.getElementById('playerLeaderboardStage').style.display = 'block';
    });

    socket.on('game-over', (data) => {
      document.getElementById('playerLeaderboardStage').style.display = 'none';
      document.getElementById('playerGameOverStage').style.display = 'block';
      
      const myRankObj = data.allScores.find(p => p.name.toLowerCase() === (this.name || '').toLowerCase());
      if (myRankObj) {
        document.getElementById('finalRankDisplay').textContent = `Rank #${myRankObj.rank}`;
        document.getElementById('finalScoreDisplay').textContent = `${myRankObj.score} pts (${myRankObj.totalCorrect} correct)`;
      }
    });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
