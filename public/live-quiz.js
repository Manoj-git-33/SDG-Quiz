// ==========================================
// 🚀 KAHOOT LIVE MULTIPLAYER CLIENT JS
// ==========================================

// Safe Low-Network Resilience Socket.IO initialization
let socket = null;
try {
  if (typeof io !== 'undefined') {
    const socketUrl = (typeof window.getQuizSocketUrl === 'function') ? window.getQuizSocketUrl() : undefined;
    socket = io(socketUrl, {
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

// Free Fire Battle Royale Loot Item Option Themes (Distinct Shapes: Shield, Diamond, Circle, Square)
const OPTION_THEMES = [
  {
    color: '#d60029',
    gradient: 'linear-gradient(135deg, #ff1a40 0%, #990018 100%)',
    glow: 'rgba(255, 26, 64, 0.65)',
    name: 'GLOO WALL',
    iconSvg: `<div class="mockup-icon-slot shape-shield-badge" title="Red Shield Gloo Wall 🛡️"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8.5v7M8.5 12h7" stroke-width="2.5"/></svg></div>`,
    shape: '🛡️',
    label: 'Red Gloo Wall Shield'
  },
  {
    color: '#005bb5',
    gradient: 'linear-gradient(135deg, #00abff 0%, #004b99 100%)',
    glow: 'rgba(0, 171, 255, 0.65)',
    name: 'MEDKIT',
    iconSvg: `<div class="mockup-icon-slot shape-diamond-badge" title="Blue Diamond Medkit 💊"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="15" rx="3.5"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 9.5v8M8.5 13.5h7" stroke-width="2.5"/></svg></div>`,
    shape: '💊',
    label: 'Blue Medkit Briefcase'
  },
  {
    color: '#9e7b00',
    gradient: 'linear-gradient(135deg, #ffe600 0%, #856700 100%)',
    glow: 'rgba(255, 230, 0, 0.65)',
    name: 'AIRDROP',
    iconSvg: `<div class="mockup-icon-slot shape-circle-badge" title="Yellow Circle Airdrop Crate 📦"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8L12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg></div>`,
    shape: '📦',
    label: 'Yellow Airdrop Crate'
  },
  {
    color: '#007a22',
    gradient: 'linear-gradient(135deg, #00e640 0%, #006618 100%)',
    glow: 'rgba(0, 230, 64, 0.65)',
    name: 'HELMET',
    iconSvg: `<div class="mockup-icon-slot shape-square-badge" title="Green Square Tactical Helmet 🪖"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13c0-4.97 4.03-9 9-9s9 4.03 9 9v2H3v-2z"/><path d="M2 15h20v2.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V15z"/><path d="M7 15v-1.5M17 15v-1.5"/></svg></div>`,
    shape: '🪖',
    label: 'Green Tactical Helmet'
  }
];

// Free Fire Characters Catalog (52 Characters)
const FF_CHARACTERS = [
  { id: 'alok', name: 'Alok', title: 'Drop The Beat', avatar: '/avatars/alok.jpg', color: '#00d2ff' },
  { id: 'chrono', name: 'Chrono', title: 'Time Shield', avatar: '/avatars/chrono.jpg', color: '#3b82f6' },
  { id: 'kelly', name: 'Kelly', title: 'Swift Dash', avatar: '/avatars/kelly.jpg', color: '#ffe600' },
  { id: 'hayato', name: 'Hayato', title: 'Bushido Samurai', avatar: '/avatars/hayato.jpg', color: '#ff007f' },
  { id: 'moco', name: 'Moco', title: "Hacker's Eye", avatar: '/avatars/moco.jpg', color: '#a855f7' },
  { id: 'skyler', name: 'Skyler', title: 'Riptide Rhythm', avatar: '/avatars/skyler.jpg', color: '#00ff88' },
  { id: 'wukong', name: 'Wukong', title: 'Camouflage', avatar: '/avatars/wukong.jpg', color: '#eab308' },
  { id: 'maxim', name: 'Maxim', title: 'Glutton Speed', avatar: '/avatars/maxim.jpg', color: '#f97316' },
  { id: 'k', name: 'K', title: 'Master of All', avatar: '/avatars/k.jpg', color: '#ec4899' },
  { id: 'dimitri', name: 'Dimitri', title: 'Healing Pulse', avatar: '/avatars/dimitri.jpg', color: '#10b981' },
  { id: 'a124', name: 'A124', title: 'Thrill of Battle', avatar: '/avatars/a124.jpg', color: '#38bdf8' },
  { id: 'alvaro', name: 'Alvaro', title: 'Artillery Blow', avatar: '/avatars/alvaro.jpg', color: '#ef4444' },
  { id: 'caroline', name: 'Caroline', title: 'Agility Speed', avatar: '/avatars/caroline.jpg', color: '#f472b6' },
  { id: 'clu', name: 'Clu', title: 'Tracing Steps', avatar: '/avatars/clu.jpg', color: '#fbbf24' },
  { id: 'dasha', name: 'Dasha', title: 'Partying On', avatar: '/avatars/dasha.jpg', color: '#c084fc' },
  { id: 'homer', name: 'Homer', title: 'Senses Shock', avatar: '/avatars/homer.jpg', color: '#94a3b8' },
  { id: 'ignis', name: 'Ignis', title: 'Flame Barrier', avatar: '/avatars/ignis.jpg', color: '#f97316' },
  { id: 'iris', name: 'Iris', title: 'Gloo Wall Mark', avatar: '/avatars/iris.jpg', color: '#38bdf8' },
  { id: 'jai', name: 'Jai', title: 'Raging Reload', avatar: '/avatars/jai.jpg', color: '#3b82f6' },
  { id: 'joseph', name: 'Joseph', title: 'Nutty Movement', avatar: '/avatars/joseph.jpg', color: '#a855f7' },
  { id: 'kairos', name: 'Kairos', title: 'Defense Break', avatar: '/avatars/kairos.jpg', color: '#6366f1' },
  { id: 'kapella', name: 'Kapella', title: 'Healing Song', avatar: '/avatars/kapella.jpg', color: '#ec4899' },
  { id: 'kassie', name: 'Kassie', title: 'Electro Pulse', avatar: '/avatars/kassie.jpg', color: '#00ff88' },
  { id: 'kenta', name: 'Kenta', title: 'Swordsman Shield', avatar: '/avatars/kenta.jpg', color: '#38bdf8' },
  { id: 'kla', name: 'Kla', title: 'Muay Thai Fist', avatar: '/avatars/kla.jpg', color: '#b45309' },
  { id: 'koda', name: 'Koda', title: 'Wild Tracker', avatar: '/avatars/koda.jpg', color: '#eab308' },
  { id: 'laura', name: 'Laura', title: 'Sharp Shooter', avatar: '/avatars/laura.jpg', color: '#00d2ff' },
  { id: 'leon', name: 'Leon', title: 'Buzzer Beater', avatar: '/avatars/leon.jpg', color: '#f59e0b' },
  { id: 'lila', name: 'Lila', title: 'Gloo Wall Trap', avatar: '/avatars/lila.jpg', color: '#a855f7' },
  { id: 'luna', name: 'Luna', title: 'Fight or Flight', avatar: '/avatars/luna.jpg', color: '#f472b6' },
  { id: 'maro', name: 'Maro', title: 'Falcon Fervor', avatar: '/avatars/maro.jpg', color: '#f97316' },
  { id: 'misha', name: 'Misha', title: 'Afterburner Driver', avatar: '/avatars/misha.jpg', color: '#eab308' },
  { id: 'mose', name: 'Mose', title: 'Stealth Shadow', avatar: '/avatars/mose.jpg', color: '#64748b' },
  { id: 'nero', name: 'Nero', title: 'Phantom Strike', avatar: '/avatars/nero.jpg', color: '#ef4444' },
  { id: 'nikita', name: 'Nikita', title: 'Firearms Expert', avatar: '/avatars/nikita.jpg', color: '#38bdf8' },
  { id: 'notora', name: 'Notora', title: "Racer's Blessing", avatar: '/avatars/notora.jpg', color: '#a855f7' },
  { id: 'olivia', name: 'Olivia', title: 'Healing Touch', avatar: '/avatars/olivia.jpg', color: '#10b981' },
  { id: 'orion', name: 'Orion', title: 'Crimson Energy', avatar: '/avatars/orion.jpg', color: '#dc2626' },
  { id: 'oscar', name: 'Oscar', title: 'Tactical Recon', avatar: '/avatars/oscar.jpg', color: '#6366f1' },
  { id: 'otho', name: 'Otho', title: 'Memory Mist', avatar: '/avatars/otho.jpg', color: '#3b82f6' },
  { id: 'paloma', name: 'Paloma', title: 'Arms Dealer', avatar: '/avatars/paloma.jpg', color: '#be123c' },
  { id: 'rafael', name: 'Rafael', title: 'Dead Silent', avatar: '/avatars/rafael.jpg', color: '#334155' },
  { id: 'ray', name: 'Ray', title: 'Solar Flare', avatar: '/avatars/ray.jpg', color: '#ffe600' },
  { id: 'rin', name: 'Rin', title: 'Vanguard Shield', avatar: '/avatars/rin.jpg', color: '#00ff88' },
  { id: 'ryden', name: 'Ryden', title: 'Spider Trap', avatar: '/avatars/ryden.jpg', color: '#84cc16' },
  { id: 'santino', name: 'Santino', title: 'Shape Splitter', avatar: '/avatars/santino.jpg', color: '#f43f5e' },
  { id: 'shani', name: 'Shani', title: 'Gear Recycle', avatar: '/avatars/shani.jpg', color: '#38bdf8' },
  { id: 'shirou', name: 'Shirou', title: 'Damage Delivered', avatar: '/avatars/shirou.jpg', color: '#f97316' },
  { id: 'steffie', name: 'Steffie', title: 'Painted Refuge', avatar: '/avatars/steffie.jpg', color: '#ec4899' },
  { id: 'suzy', name: 'Suzy', title: 'Bounty Hunter', avatar: '/avatars/suzy.jpg', color: '#eab308' },
  { id: 'tatsuya', name: 'Tatsuya', title: 'Rebel Rush', avatar: '/avatars/tatsuya.jpg', color: '#00d2ff' },
  { id: 'xayne', name: 'Xayne', title: 'Extreme Encounter', avatar: '/avatars/xayne.jpg', color: '#f43f5e' }
];

// Audio FX Generator (Integrated with centralized window.AudioManager)
const SoundFX = {
  get muted() {
    return window.AudioManager ? window.AudioManager.muted : false;
  },
  set muted(val) {
    if (window.AudioManager) window.AudioManager.muted = val;
  },

  init() {
    if (window.AudioManager) window.AudioManager.setupAutoplayUnlock();
  },

  join() {},
  tick() {},
  correct() {
    if (window.AudioManager) window.AudioManager.correctAnswer();
  },
  cracker() {
    if (window.AudioManager) window.AudioManager.correctAnswer();
  },
  wrong() {
    if (window.AudioManager) window.AudioManager.wrongAnswer();
  },
  fastest() {},
  victory() {},
  gameStart() {
    if (window.AudioManager) window.AudioManager.hostStartGame();
  },
  timeUp() {
    if (window.AudioManager) window.AudioManager.timeUp();
  },
  answerLocked() {},
  leaderboard() {},
  createRoom() {}
};

// 🎉 FIRECRACKERS & FALLING PAPER CELEBRATION ANIMATION FOR CORRECT ANSWERS
function triggerCorrectCelebration(customCanvasId = 'confettiCanvas') {
  const phoneContainer = document.querySelector('.player-phone-container');
  const targetParent = phoneContainer || document.body;

  let canvas = document.getElementById(customCanvasId);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = customCanvasId;
    targetParent.appendChild(canvas);
  } else if (canvas.parentElement !== targetParent) {
    targetParent.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');

  if (phoneContainer) {
    canvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999; border-radius:inherit;';
    canvas.width = phoneContainer.clientWidth || 410;
    canvas.height = phoneContainer.clientHeight || 800;
  } else {
    canvas.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:99999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  const particles = [];
  const colors = ['#ffe600', '#00ff66', '#00d2ff', '#ff1a40', '#ff007f', '#a855f7', '#ffffff', '#ffaa00'];

  // 1. FALLING PAPER STRIPS & CONFETTI (120 fluttering paper ribbons inside phone container)
  for (let i = 0; i < 120; i++) {
    particles.push({
      type: 'paper',
      x: Math.random() * canvas.width,
      y: (Math.random() * -canvas.height * 0.8) - 15, // Rain down inside container top
      w: Math.random() * 11 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 2,
      vx: Math.random() * 1.6 - 0.8,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.12,
      wobble: Math.random() * 10
    });
  }

  // 2. FIREWORK CRACKERS (3 Burst Explosions bounded inside container)
  const burstPoints = [
    { x: canvas.width * 0.25, y: canvas.height * 0.35 },
    { x: canvas.width * 0.5,  y: canvas.height * 0.25 },
    { x: canvas.width * 0.75, y: canvas.height * 0.35 }
  ];

  burstPoints.forEach(bp => {
    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7.5 + 2;
      particles.push({
        type: 'cracker',
        x: bp.x,
        y: bp.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.022 + 0.015,
        gravity: 0.15
      });
    }
  });

  const startTime = Date.now();
  const maxDuration = 4000; // 4s animation

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      if (p.type === 'paper') {
        p.y += p.vy;
        p.wobble += 0.05;
        p.x += Math.sin(p.wobble) * 2 + p.vx;
        p.angle += p.vAngle;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else if (p.type === 'cracker') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    });

    if (elapsed < maxDuration && particles.some(p => (p.type === 'paper' && p.y < canvas.height + 30) || (p.type === 'cracker' && p.alpha > 0))) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  render();
}

function triggerConfetti() {
  triggerCorrectCelebration('confettiCanvas');
}

// ==========================================
// 🖥️ HOST BIG SCREEN CONTROLLER LOGIC
// ==========================================
function showHostStage(stageId) {
  console.log('🔄 Switching host stage to:', stageId);
  if (stageId !== 'hostSetupStage') {
    document.body.classList.add('room-created-active');
  } else {
    document.body.classList.remove('room-created-active');
  }
  const hostStages = [
    'hostSetupStage',
    'hostLobbyStage',
    'hostQuestionStage',
    'hostResultStage',
    'hostLeaderboardStage',
    'hostGameOverStage'
  ];

  hostStages.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stageId) {
        el.style.setProperty('display', 'block', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('z-index', '100', 'important');
      } else {
        el.style.setProperty('display', 'none', 'important');
      }
    }
  });

  const container = document.querySelector('.host-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

window.HostApp = {
  pin: null,
  currentQuestion: null,

  init() {
    this.loadQuestionSets();
    this.bindSocketEvents();
    if (window.AudioManager) {
      window.AudioManager.startLobbyMusic();
    }
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
    SoundFX.init();
    if (window.AudioManager) {
      window.AudioManager.setupAutoplayUnlock();
      window.AudioManager.startLobbyMusic();
    }

    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    if (!socket) {
      alert('Unable to connect to game server. Please start the server by running "npm start" or double-clicking "start-quiz.bat"!');
      return;
    }

    this.bindSocketEvents();

    const setKey = document.getElementById('setSelect')?.value || 'JAVA23A';
    const timeLimit = parseInt(document.getElementById('timeSelect')?.value || '20', 10);
    const limitQuestions = parseInt(document.getElementById('limitSelect')?.value || '0', 10);
    const shuffle = document.getElementById('shuffleQuestionsToggle')?.checked || false;

    socket.emit('host-create-game', {
      setKey: setKey,
      timePerQuestion: timeLimit,
      limitQuestions: limitQuestions,
      shuffleQuestions: shuffle
    });
  },

  startGame() {
    if (!this.pin || !socket) return;
    if (window.AudioManager) {
      window.AudioManager.hostStartGame();
    }
    socket.emit('host-start-game', { pin: this.pin });
  },

  skipTimer() {
    if (!this.pin || !socket) return;
    if (window.AudioManager) {
      window.AudioManager.timeUp();
    }
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
    let isMuted;
    if (window.AudioManager) {
      isMuted = window.AudioManager.toggleMute();
    } else {
      SoundFX.muted = !SoundFX.muted;
      isMuted = SoundFX.muted;
    }
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.innerHTML = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
    const lobbyLabel = document.getElementById('lobbyMusicLabel');
    if (lobbyLabel) lobbyLabel.innerHTML = isMuted ? 'Muted 🔇' : 'Active 🔊';
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  },

  toggleDashboardModal(show) {
    const modal = document.getElementById('hostDashboardModal');
    if (!modal) return;
    if (show) {
      modal.classList.add('active');
      modal.style.setProperty('display', 'flex', 'important');
      this.updateDashboardModalData();
      if (this._dashboardTimer) clearInterval(this._dashboardTimer);
      this._dashboardTimer = setInterval(() => this.updateDashboardModalData(), 2000);
    } else {
      modal.classList.remove('active');
      modal.style.setProperty('display', 'none', 'important');
      if (this._dashboardTimer) clearInterval(this._dashboardTimer);
    }
  },

  async updateDashboardModalData(forceRefresh = false) {
    const body = document.getElementById('hostDashboardModalBody');
    if (!body) return;

    if (forceRefresh) {
      body.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <div class="cyan-text font-bold" style="font-size: 1.3rem;"><i class="fa-solid fa-spinner fa-spin"></i> Refreshing All Student Data...</div>
        </div>
      `;
    }

    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) return;
      const data = await res.json();
      const activeRooms = data.activeRooms || [];
      const historical = data.historical || [];

      let players = [];

      // 1. Gather current live room players from HostApp memory
      if (Array.isArray(this.players) && this.players.length > 0) {
        this.players.forEach(p => players.push(p));
      }

      // 2. Gather live connected players from active rooms API response
      activeRooms.forEach(r => {
        if (Array.isArray(r.players)) {
          r.players.forEach(p => {
            if (!players.some(existing => (existing.id && existing.id === p.id) || (existing.name === p.name && existing.roll === p.roll))) {
              players.push(p);
            }
          });
        }
      });

      // 3. Fallback to historical student records if no active room players
      if (players.length === 0) {
        historical.forEach(rec => {
          if (Array.isArray(rec.results)) {
            rec.results.forEach(p => players.push(p));
          } else if (rec.name) {
            players.push({
              name: rec.name,
              roll: rec.roll || 'N/A',
              score: rec.score || rec.totalScore || 0,
              character: { name: 'Alok', avatar: '/avatars/alok.jpg', color: '#00d2ff' }
            });
          }
        });
      }

      players.sort((a, b) => (b.score || 0) - (a.score || 0));
      const medals = ['🥇', '🥈', '🥉'];

      body.innerHTML = `
        <div class="modal-stats-grid margin-bottom">
          <div class="stat-pill-box pill-cyan" style="padding: 0.8rem 1rem;">
            <div class="stat-text-wrapper">
              <div class="stat-label-sub">Connected Live Students</div>
              <div class="stat-value-cyan" style="font-size: 1.6rem;">${players.length}</div>
            </div>
          </div>
          <div class="stat-pill-box pill-gold" style="padding: 0.8rem 1rem;">
            <div class="stat-text-wrapper">
              <div class="stat-label-sub">Current Top Leader</div>
              <div class="stat-value-gold" style="font-size: 1.4rem;">${players[0] ? `${players[0].name} (${players[0].score || 0} pts)` : 'None'}</div>
            </div>
          </div>
        </div>

        <!-- EXCEL SPREADSHEET TOOLBAR -->
        <div class="excel-toolbar-bar">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <h4 class="cyan-text" style="margin: 0; font-size: 1.1rem;"><i class="fa-solid fa-file-excel"></i> Student Excel Record Sheet</h4>
            <span class="control-pill-gaming" style="font-size: 0.75rem; padding: 2px 8px;">${players.length} Total Row(s)</span>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <div style="position: relative;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #00d2ff; font-size: 0.85rem;"></i>
              <input type="text" id="excelModalSearch" class="excel-search-input" placeholder="Filter name, roll or char..." oninput="HostApp.filterExcelTable(this.value)">
            </div>
            <button class="btn-refresh-gaming" onclick="HostApp.updateDashboardModalData(true)" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">
              <i class="fa-solid fa-rotate"></i> Refresh 🔄
            </button>
          </div>
        </div>

        <!-- EXCEL SPREADSHEET TABLE -->
        <div class="excel-table-container">
          <table class="excel-table">
            <thead>
              <tr>
                <th style="width: 70px; text-align: center;">Rank</th>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Character</th>
                <th>Total Score</th>
                <th>Accuracy</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody id="excelTableBody">
              ${players.map((p, idx) => {
                const medal = medals[idx] || `#${idx + 1}`;
                const char = (p.character && typeof p.character === 'object') ? p.character : { name: 'Alok', avatar: '/avatars/alok.jpg', color: '#00d2ff' };
                const charName = String(char.name || 'Alok');
                const rowClass = idx === 0 ? 'row-rank-1' : '';
                const scoreColor = idx === 0 ? 'text-yellow' : (idx === 1 ? 'text-cyan' : (idx === 2 ? 'text-bronze' : 'text-white'));

                return `
                  <tr class="${rowClass}" data-search="${escapeHtml((p.name || '') + ' ' + (p.roll || '') + ' ' + charName).toLowerCase()}">
                    <td style="text-align: center;"><strong style="font-size: 1.05rem;">${medal}</strong></td>
                    <td style="font-weight: 700; color: #ffffff;">
                      <img src="${char.avatar || '/avatars/alok.jpg'}" class="table-avatar-img" alt="" onerror="this.src='/avatars/alok.jpg'">
                      ${escapeHtml(p.name || 'Student')}
                    </td>
                    <td><span style="font-family: monospace; font-size: 0.95rem; color: #cbd5e1;">${escapeHtml(p.roll || '-')}</span></td>
                    <td><span class="char-sub-tag" style="margin: 0;">${escapeHtml(charName)}</span></td>
                    <td><strong class="${scoreColor}" style="font-size: 1.1rem;">${p.score || 0} pts</strong></td>
                    <td>${p.totalCorrect !== undefined ? `${p.totalCorrect} Correct` : '-'}</td>
                    <td style="text-align: center;">
                      <span class="control-pill-gaming" style="font-size: 0.75rem; background: rgba(0, 230, 64, 0.15); border-color: #00e640; color: #00ff88;">
                        ● CONNECTED
                      </span>
                    </td>
                  </tr>
                `;
              }).join('') || `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
                    No student records found right now. Click Refresh 🔄 to update.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      console.warn('Failed to update dashboard modal:', err);
      body.innerHTML = `<p class="subtitle-gaming">Error loading live data. Please try refreshing.</p>`;
    }
  },

  filterExcelTable(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#excelTableBody tr');
    rows.forEach(row => {
      const searchData = row.dataset.search || '';
      if (!q || searchData.includes(q)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  },

  bindSocketEvents() {
    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    if (!socket) return;

    socket.off('game-created');
    socket.on('game-created', (data) => {
      console.log('🎮 game-created event received:', data);
      this.pin = data.pin;
      const pinDisplay = document.getElementById('hostPinDisplay');
      if (pinDisplay) pinDisplay.textContent = data.pin;

      showHostStage('hostLobbyStage');
      if (window.AudioManager) {
        window.AudioManager.startLobbyMusic();
      }
    });

    socket.off('error-msg');
    socket.on('error-msg', (data) => {
      alert(data.message || 'Game room error');
    });

    socket.on('player-list-update', (data) => {
      if (window.AudioManager && this._prevPlayerCount !== undefined && data.count > this._prevPlayerCount) {
        window.AudioManager.playerJoin();
      }
      this._prevPlayerCount = data.count;

      const listEl = document.getElementById('playerList');
      const countEl = document.getElementById('playerCount');
      if (countEl) countEl.textContent = data.count;

      if (listEl) {
        listEl.innerHTML = data.players.map(p => {
          const char = p.character || { name: 'Alok', avatar: '/avatars/alok.jpg', color: '#00d2ff' };
          return `
            <div class="gaming-player-card animated-pop" onclick="HostApp.kickPlayer('${p.id}')" title="Click to Remove ${escapeHtml(p.name)}" style="--char-color: ${char.color}">
              <div class="char-avatar-wrapper">
                <img src="${char.avatar}" alt="${escapeHtml(char.name)}" class="char-avatar-img" onerror="this.src='/avatars/alok.jpg'">
                <span class="char-badge-tag">${escapeHtml(char.name.toUpperCase())}</span>
              </div>
              <div class="player-info-block">
                <span class="player-name-text">${escapeHtml(p.name)}</span>
                ${p.roll ? `<span class="player-roll-text">${escapeHtml(p.roll)}</span>` : ''}
              </div>
              <button class="kick-btn-gaming" title="Remove Player">✕</button>
            </div>
          `;
        }).join('');
      }

      const startBtn = document.getElementById('startBtn');
      if (startBtn) {
        startBtn.disabled = data.count === 0;
      }
    });

    socket.on('game-starting-countdown', (data) => {
      triggerGameStartCountdown(data.count || 3);
    });

    socket.on('new-question', (data) => {
      const overlay = document.getElementById('gameStartCountdownOverlay');
      if (overlay) overlay.style.display = 'none';
      if (window.AudioManager) {
        window.AudioManager.stopBGM(0);
      }
      showHostStage('hostQuestionStage');
      this.currentQuestion = data;
      const qCurr = document.getElementById('qCurrNum');
      const qTotal = document.getElementById('qTotalNum');
      if (qCurr && qTotal) {
        qCurr.textContent = data.questionIndex + 1;
        qTotal.textContent = data.totalQuestions;
      } else {
        const qDisp = document.getElementById('qIndexDisplay');
        if (qDisp) {
          qDisp.innerHTML = `
            <div class="hud-badge-inner">
              <div class="hud-sub-text">Question ${data.questionIndex + 1} of</div>
              <div id="qTotalNum" class="hud-main-text">${data.totalQuestions}</div>
            </div>
          `;
        }
      }
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
          <div class="mockup-card-outer card-theme-${idx}" style="--card-grad: ${theme.gradient}; --card-glow: ${theme.glow}">
            <div class="mockup-card-inner">
              ${theme.iconSvg}
              <span class="mockup-card-text">${escapeHtml(optText)}</span>
              <div class="mockup-corner-stripes">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    });

    socket.on('timer-tick', (data) => {
      const timerEl = document.getElementById('timerNum');
      if (timerEl) {
        timerEl.textContent = data.timeLeft;
        if (data.timeLeft <= 5 && data.timeLeft > 0) {
          timerEl.classList.add('pulse-red');
          if (window.AudioManager) {
            window.AudioManager.timeUp();
          }
        } else if (data.timeLeft <= 0) {
          timerEl.classList.remove('pulse-red');
          if (window.AudioManager) {
            window.AudioManager.timeUp();
          }
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
      showHostStage('hostResultStage');
      if (window.AudioManager) {
        window.AudioManager.stopBGM(0);
      }

      const rawQText = data.questionText || '';
      const formattedQText = escapeHtml(rawQText).replace(/\b(not|never|except|false|incorrect)\b/gi, '<span class="yellow-highlight">$1</span>');
      document.getElementById('resQuestionText').innerHTML = formattedQText;

      const expBox = document.getElementById('resExplanationBox');
      const expText = document.getElementById('resExplanation');
      const explanationStr = data.explanation || (data.questionIndex === 0 ? "Compilation is a process, not an OOP concept. The core OOP concepts are encapsulation, inheritance, polymorphism, and abstraction." : "");
      
      if (expBox && expText) {
        if (explanationStr) {
          expText.textContent = explanationStr;
          expBox.style.display = 'block';
        } else {
          expBox.style.display = 'none';
        }
      }

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

        const barHeightStyle = votes > 0 ? `height: ${Math.max(35, Math.round(percent * 1.35))}px;` : 'height: 18px;';

        return `
          <div class="poll-column ${isCorrect ? 'is-correct-column' : ''}">
            <span class="poll-vote-number">${votes}</span>
            <div class="poll-bar-track">
              <div class="poll-bar-fill card-theme-${idx}" style="${barHeightStyle} --card-grad: ${theme.gradient}; --card-glow: ${theme.glow};"></div>
            </div>
            <div class="poll-icon-row">
              <div class="poll-icon-slot">
                ${theme.iconSvg}
              </div>
              ${isCorrect ? '<span class="poll-checkmark-badge" title="Correct Answer"><i class="fa-solid fa-check"></i></span>' : ''}
            </div>
          </div>
        `;
      }).join('');

      const fastestBox = document.getElementById('fastestPlayerBox');
      if (fastestBox) {
        if (data.fastestPlayer) {
          fastestBox.style.display = 'flex';
          fastestBox.innerHTML = `
            <div class="fastest-bolt-icon">⚡</div>
            <div class="fastest-text-block">
              <span class="fastest-label-top">FASTEST CORRECT ANSWER</span>
              <span class="fastest-player-name">${escapeHtml(data.fastestPlayer.name)} in ${data.fastestPlayer.timeTakenSec} seconds!</span>
            </div>
            <div class="fastest-crown-icon">👑</div>
          `;
        } else {
          fastestBox.style.display = 'none';
        }
      }
    });

    socket.on('leaderboard-data', (data) => {
      showHostStage('hostLeaderboardStage');

      if (window.AudioManager) {
        window.AudioManager.leaderboardOpen();
      }

      const nextBtn = document.getElementById('nextQBtn');
      if (data.isLastQuestion) {
        nextBtn.textContent = 'Finish Quiz & View Podium 🏆';
      } else {
        nextBtn.textContent = 'Next Question ➔';
      }

      const boardEl = document.getElementById('leaderboardList');
      if (!boardEl) return;

      if (!this._prevRanks) this._prevRanks = {};

      const leaderboardList = data.leaderboard || [];
      const medals = ['🥇', '🥈', '🥉'];
      const currentRanks = {};

      // -------------------------------------------------------------
      // PHASE 1: Render cards at OLD positions with FADE & APPEAR entry
      // -------------------------------------------------------------
      let initialDisplayOrder = [...leaderboardList];
      if (Object.keys(this._prevRanks).length > 0) {
        initialDisplayOrder.sort((a, b) => {
          const rankA = this._prevRanks[a.id || a.name] !== undefined ? this._prevRanks[a.id || a.name] : a.rank;
          const rankB = this._prevRanks[b.id || b.name] !== undefined ? this._prevRanks[b.id || b.name] : b.rank;
          return rankA - rankB;
        });
      }

      boardEl.innerHTML = initialDisplayOrder.map((player, idx) => {
        const playerKey = String(player.id || player.name);
        const prevRank = this._prevRanks[playerKey];
        currentRanks[playerKey] = player.rank;

        const displayRank = (prevRank !== undefined) ? prevRank : player.rank;
        const medal = medals[displayRank - 1] || `#${displayRank}`;
        const char = player.character || { avatar: '/avatars/alok.jpg', color: '#00d2ff', name: 'Alok' };

        return `
          <div class="leaderboard-row rank-${displayRank} leaderboard-card-fade-in" 
               id="lbCard_${escapeHtml(playerKey)}" 
               data-player-key="${escapeHtml(playerKey)}" 
               style="--char-color: ${char.color}; animation-delay: ${idx * 0.18}s;">
            <div class="rank-badge" id="lbMedal_${escapeHtml(playerKey)}">${medal}</div>
            <img src="${char.avatar}" class="leaderboard-avatar-img" alt="${char.name}" onerror="this.src='/avatars/alok.jpg'">
            <div class="player-name">
              ${escapeHtml(player.name)} 
              <span class="char-sub-tag">${escapeHtml(char.name)}</span>
              ${player.roll ? `<small>(${escapeHtml(player.roll)})</small>` : ''}
              <span id="lbBadge_${escapeHtml(playerKey)}"></span>
            </div>
            <div class="player-score" id="lbScore_${escapeHtml(playerKey)}">${player.score} pts</div>
          </div>
        `;
      }).join('');

      const oldRanksMap = { ...this._prevRanks };
      this._prevRanks = currentRanks;

      // -------------------------------------------------------------
      // PHASE 2: Trigger RANK-WISE MOVEMENTS after cards appear (~1150ms)
      // -------------------------------------------------------------
      setTimeout(() => {
        // Record old top bounding rect for each player card
        const oldTopMap = new Map();
        Array.from(boardEl.children).forEach(child => {
          const key = child.dataset.playerKey;
          if (key) {
            oldTopMap.set(key, child.getBoundingClientRect().top);
          }
        });

        // Re-order DOM elements into NEW rank order & update badges/glows
        leaderboardList.forEach(player => {
          const playerKey = String(player.id || player.name);
          const cardEl = document.getElementById(`lbCard_${playerKey}`);
          const prevRank = oldRanksMap[playerKey];

          if (cardEl) {
            boardEl.appendChild(cardEl);

            const medalEl = document.getElementById(`lbMedal_${playerKey}`);
            if (medalEl) {
              const medal = medals[player.rank - 1] || `#${player.rank}`;
              medalEl.innerHTML = medal;
            }

            const badgeEl = document.getElementById(`lbBadge_${playerKey}`);
            cardEl.classList.remove('rank-up-glow', 'rank-down-glow', 'leaderboard-card-fade-in');

            if (prevRank !== undefined) {
              if (player.rank < prevRank) {
                const diff = prevRank - player.rank;
                if (badgeEl) badgeEl.innerHTML = `<span class="rank-change-badge rank-up-badge"><i class="fa-solid fa-arrow-up"></i> +${diff} ${diff === 1 ? 'Rank' : 'Ranks'}!</span>`;
                cardEl.classList.add('rank-up-glow');
              } else if (player.rank > prevRank) {
                const diff = player.rank - prevRank;
                if (badgeEl) badgeEl.innerHTML = `<span class="rank-change-badge rank-down-badge"><i class="fa-solid fa-arrow-down"></i> -${diff}</span>`;
                cardEl.classList.add('rank-down-glow');
              } else {
                if (badgeEl) badgeEl.innerHTML = `<span class="rank-change-badge rank-same-badge">● Same</span>`;
              }
            }
          }
        });

        // Apply FLIP Y-axis glide transition to animate cards sliding up/down
        Array.from(boardEl.children).forEach(newEl => {
          const key = newEl.dataset.playerKey;
          const oldTop = oldTopMap.get(key);
          if (oldTop !== undefined) {
            const newTop = newEl.getBoundingClientRect().top;
            const deltaY = oldTop - newTop;

            if (Math.abs(deltaY) > 1) {
              newEl.style.transition = 'none';
              newEl.style.transform = `translateY(${deltaY}px)`;

              requestAnimationFrame(() => {
                newEl.offsetHeight; // Force reflow
                newEl.style.transition = 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';
                newEl.style.transform = 'translateY(0)';
              });
            }
          }
        });
      }, 1150);
    });

    socket.on('game-over', (data) => {
      if (window.AudioManager) {
        window.AudioManager.playVictoryMusic();
      }
      triggerConfetti();

      showHostStage('hostGameOverStage');

      const podiumEl = document.getElementById('podiumContainer');
      const top3 = data.podium || [];

      const p1 = top3[0] ? top3[0].name : '-';
      const s1 = top3[0] ? top3[0].score : 0;
      const c1 = top3[0]?.character || { avatar: '/avatars/alok.jpg', name: 'Alok' };

      const p2 = top3[1] ? top3[1].name : '-';
      const s2 = top3[1] ? top3[1].score : 0;
      const c2 = top3[1]?.character || { avatar: '/avatars/alok.jpg', name: 'Kelly' };

      const p3 = top3[2] ? top3[2].name : '-';
      const s3 = top3[2] ? top3[2].score : 0;
      const c3 = top3[2]?.character || { avatar: '/avatars/alok.jpg', name: 'Hayato' };

      podiumEl.innerHTML = `
        <!-- RANK 2 (SILVER - LEFT) -->
        <div class="podium-step-gaming step-2-booyah">
          <div class="podium-avatar-halo ring-silver">
            <span class="avatar-crown-icon crown-silver">👑</span>
            ${top3[1] ? `<img src="${c2.avatar}" class="podium-avatar-img-booyah" alt="${escapeHtml(c2.name)}" onerror="this.src='/avatars/alok.jpg'">` : `<div class="default-avatar-placeholder"><i class="fa-solid fa-user"></i></div>`}
          </div>
          <div class="rank-hex-badge hex-silver">2</div>
          <div class="podium-player-name">${escapeHtml(p2)}${top3[1] ? ` (${escapeHtml(c2.name)})` : ''}</div>
          <div class="podium-score-pill pill-silver">${s2} pts</div>
          <div class="podium-3d-block block-silver">
            <div class="podium-cap-bevel cap-silver"></div>
            <div class="podium-block-content">
              <div class="podium-giant-rank text-silver">2</div>
              <div class="podium-block-title badge-silver">RUNNER UP</div>
            </div>
            <div class="podium-side-beam beam-silver left"></div>
            <div class="podium-side-beam beam-silver right"></div>
          </div>
        </div>

        <!-- RANK 1 (GOLD - CENTER) -->
        <div class="podium-step-gaming step-1-booyah">
          <div class="podium-avatar-halo ring-gold">
            <span class="avatar-crown-icon crown-gold">👑</span>
            ${top3[0] ? `<img src="${c1.avatar}" class="podium-avatar-img-booyah" alt="${escapeHtml(c1.name)}" onerror="this.src='/avatars/alok.jpg'">` : `<div class="default-avatar-placeholder"><i class="fa-solid fa-user"></i></div>`}
          </div>
          <div class="rank-hex-badge hex-gold">1</div>
          <div class="podium-player-name">${escapeHtml(p1)}${top3[0] ? ` (${escapeHtml(c1.name)})` : ''}</div>
          <div class="podium-score-pill pill-gold">${s1} pts</div>
          <div class="podium-3d-block block-gold">
            <div class="podium-cap-bevel cap-gold"></div>
            <div class="podium-block-content">
              <div class="podium-giant-rank text-gold">1</div>
              <div class="podium-block-title badge-gold">🏆 CHAMPION</div>
            </div>
            <div class="podium-side-beam beam-gold left"></div>
            <div class="podium-side-beam beam-gold right"></div>
          </div>
        </div>

        <!-- RANK 3 (BRONZE - RIGHT) -->
        <div class="podium-step-gaming step-3-booyah">
          <div class="podium-avatar-halo ring-bronze">
            <span class="avatar-crown-icon crown-bronze">👑</span>
            ${top3[2] ? `<img src="${c3.avatar}" class="podium-avatar-img-booyah" alt="${escapeHtml(c3.name)}" onerror="this.src='/avatars/alok.jpg'">` : `<div class="default-avatar-placeholder"><i class="fa-solid fa-user"></i></div>`}
          </div>
          <div class="rank-hex-badge hex-bronze">3</div>
          <div class="podium-player-name">${escapeHtml(p3)}${top3[2] ? ` (${escapeHtml(c3.name)})` : ''}</div>
          <div class="podium-score-pill pill-bronze">${s3} pts</div>
          <div class="podium-3d-block block-bronze">
            <div class="podium-cap-bevel cap-bronze"></div>
            <div class="podium-block-content">
              <div class="podium-giant-rank text-bronze">3</div>
              <div class="podium-block-title badge-bronze">3RD PLACE</div>
            </div>
            <div class="podium-side-beam beam-bronze left"></div>
            <div class="podium-side-beam beam-bronze right"></div>
          </div>
        </div>
      `;

      const tbody = document.getElementById('fullScoreboardBody');
      if (tbody) {
        const top3Scores = (data.allScores || []).slice(0, 3);
        tbody.innerHTML = top3Scores.map(p => {
          const char = p.character || { avatar: '/avatars/alok.jpg', name: 'Alok' };
          let hexClass = 'hex-table-default';
          let rowClass = 'table-row-booyah';
          let scoreClass = 'text-white';
          if (p.rank === 1) {
            hexClass = 'hex-gold';
            rowClass = 'table-row-booyah row-gold-booyah';
            scoreClass = 'text-yellow';
          } else if (p.rank === 2) {
            hexClass = 'hex-silver';
            scoreClass = 'text-cyan';
          } else if (p.rank === 3) {
            hexClass = 'hex-bronze';
            scoreClass = 'text-bronze';
          }

          return `
            <tr class="${rowClass}">
              <td><div class="table-hex-badge ${hexClass}">${p.rank}</div></td>
              <td class="scoreboard-player-cell">
                <img src="${char.avatar}" class="table-avatar-img" alt="" onerror="this.src='/avatars/alok.jpg'">
                <span class="player-name-text">${escapeHtml(p.name)} ${char.name ? `<small class="char-sub-tag">(${escapeHtml(char.name)})</small>` : ''}</span>
              </td>
              <td>${escapeHtml(p.roll || '-')}</td>
              <td><strong class="score-val ${scoreClass}">${p.score} pts</strong></td>
              <td>${p.totalCorrect !== undefined ? `${p.totalCorrect} Correct` : '-'}</td>
            </tr>
          `;
        }).join('');
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
  roll: null,
  selectedChar: 'alok',
  questionEndTime: 0,
  _timerInterval: null,
  _currentOptions: [],
  _playerEventsBound: false,

  getPlayerId() {
    let id = sessionStorage.getItem('sdg_quiz_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('sdg_quiz_player_id', id);
    }
    return id;
  },

  init() {
    this.getPlayerId();
    this.renderCharacterPicker();
    this.bindSocketEvents();

    // Check for existing session in sessionStorage to prefill or restore
    const savedPin = sessionStorage.getItem('sdg_quiz_pin');
    const savedName = sessionStorage.getItem('sdg_quiz_name');
    const savedRoll = sessionStorage.getItem('sdg_quiz_roll');
    const savedChar = sessionStorage.getItem('sdg_quiz_char');

    if (savedPin) {
      const pinInput = document.getElementById('playerPinInput');
      if (pinInput) pinInput.value = savedPin;
    }
    if (savedName) {
      const nameInput = document.getElementById('playerNameInput');
      if (nameInput) nameInput.value = savedName;
    }
    if (savedRoll) {
      const rollInput = document.getElementById('playerRollInput');
      if (rollInput) rollInput.value = savedRoll;
    }
    if (savedChar) {
      this.selectCharacter(savedChar);
    }

    if (window.AudioManager) {
      window.AudioManager.startLobbyMusic();
    }
  },

  updateHud(data = {}) {
    const hud = document.getElementById('playerLiveHud');
    if (hud) hud.style.display = 'flex';

    if (data.name) {
      const nameEl = document.getElementById('hudPlayerName');
      if (nameEl) nameEl.textContent = data.name;
    }
    if (data.character && data.character.avatar) {
      const avEl = document.getElementById('hudPlayerAvatar');
      if (avEl) {
        avEl.src = data.character.avatar;
        avEl.onerror = () => { avEl.src = '/avatars/alok.jpg'; };
      }
    }
    if (data.score !== undefined && data.score !== null) {
      const scEl = document.getElementById('hudPlayerScore');
      if (scEl) scEl.textContent = data.score;
    }
    if (data.connected !== undefined) {
      const statusPill = document.getElementById('playerHudStatusPill');
      const textEl = document.getElementById('hudConnectionText');
      if (statusPill && textEl) {
        if (data.connected) {
          statusPill.className = 'hud-item hud-connection online';
          textEl.textContent = 'CONNECTED';
        } else {
          statusPill.className = 'hud-item hud-connection reconnecting';
          textEl.textContent = 'RECONNECTING...';
        }
      }
    }
  },

  toggleSound() {
    if (window.AudioManager) {
      const isMuted = window.AudioManager.toggleMute();
      const btn = document.getElementById('playerSoundToggle');
      if (btn) btn.innerHTML = isMuted ? '🔇 Sound Off' : '🔊 Sound On';
    }
  },

  renderCharacterPicker() {
    const picker = document.getElementById('characterPicker');
    if (!picker) return;

    picker.innerHTML = `
      <div class="char-picker-search-bar">
        <i class="fa-solid fa-magnifying-glass char-search-icon"></i>
        <input type="text" id="charSearchInput" class="gaming-input-search-sm" placeholder="Search character (e.g. Alok, Kelly, Chrono)..." oninput="PlayerApp.filterCharacters(this.value)">
      </div>
      <div id="charGridList" class="ff-char-grid-scroll">
        ${FF_CHARACTERS.map((char, index) => `
          <div class="ff-char-card ${index === 0 ? 'selected' : ''}" onclick="PlayerApp.selectCharacter('${char.id}')" data-char="${char.id}" data-name="${char.name.toLowerCase()}" style="--char-color: ${char.color}">
            <img src="${char.avatar}" alt="${char.name}" class="char-card-img" onerror="this.src='/avatars/alok.jpg'">
            <span class="char-card-name">${escapeHtml(char.name)}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  filterCharacters(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#charGridList .ff-char-card').forEach(el => {
      const name = el.dataset.name || '';
      if (!q || name.includes(q)) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  },

  selectCharacter(charId) {
    this.selectedChar = charId;
    document.querySelectorAll('.ff-char-card').forEach(el => {
      if (el.dataset.char === charId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    const input = document.getElementById('selectedCharInput');
    if (input) input.value = charId;
    sessionStorage.setItem('sdg_quiz_char', charId);
  },

  joinGame() {
    const pin = document.getElementById('playerPinInput')?.value.trim();
    const name = document.getElementById('playerNameInput')?.value.trim();
    const roll = document.getElementById('playerRollInput')?.value.trim() || '';
    const charId = document.getElementById('selectedCharInput')?.value || this.selectedChar || 'alok';

    if (!pin || !name) {
      return alert('Please enter both Game PIN and your Name!');
    }

    SoundFX.init();
    if (window.AudioManager) {
      window.AudioManager.setupAutoplayUnlock();
      window.AudioManager.playerJoin();
      window.AudioManager.startLobbyMusic();
    }

    this.pin = pin;
    this.name = name;
    this.roll = roll;

    sessionStorage.setItem('sdg_quiz_pin', pin);
    sessionStorage.setItem('sdg_quiz_name', name);
    sessionStorage.setItem('sdg_quiz_roll', roll);
    sessionStorage.setItem('sdg_quiz_char', charId);

    if (!socket && typeof io !== 'undefined') {
      const socketUrl = (typeof window.getQuizSocketUrl === 'function') ? window.getQuizSocketUrl() : undefined;
      try {
        socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 30,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 3000,
          timeout: 10000
        });
      } catch (e) {}
    }
    
    this.bindSocketEvents();

    if (socket) {
      socket.emit('player-join-game', {
        pin: pin,
        name: name,
        roll: roll,
        characterId: charId,
        playerId: this.getPlayerId()
      });
    }
  },

  submitAnswer(optionIndex) {
    if (!this.pin || !socket) return;

    // Instant Lockout: Disable all option buttons immediately to prevent duplicate submissions
    const btns = document.querySelectorAll('.player-opt-btn');
    btns.forEach(b => {
      b.disabled = true;
      b.classList.add('disabled-btn');
    });

    const selectedBtn = document.getElementById(`pOptBtn_${optionIndex}`);
    if (selectedBtn) {
      selectedBtn.classList.add('selected-btn');
    }

    // Display optimistic lock card with selected answer
    const selText = this._currentOptions[optionIndex] || `Option ${optionIndex + 1}`;
    const choiceEl = document.getElementById('playerLockedChoice');
    if (choiceEl) choiceEl.textContent = selText;

    const optContainer = document.getElementById('playerOptionsContainer');
    if (optContainer) optContainer.style.display = 'none';

    const lockBox = document.getElementById('playerAnsweredLock');
    if (lockBox) lockBox.style.display = 'block';

    socket.emit('player-submit-answer', {
      pin: this.pin,
      playerId: this.getPlayerId(),
      optionIndex: optionIndex
    });
  },

  startSyncedTimer(durationSec, endTimeMs) {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    this.questionEndTime = endTimeMs || (Date.now() + durationSec * 1000);

    const tick = () => {
      const remainingMs = this.questionEndTime - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
      const countdownEl = document.getElementById('playerTimerCountdown');
      const syncBadge = document.querySelector('.player-timer-sync-badge');

      if (countdownEl) {
        countdownEl.textContent = secondsLeft;
      }

      if (syncBadge) {
        if (secondsLeft <= 5) {
          syncBadge.classList.add('urgent-warning');
        } else {
          syncBadge.classList.remove('urgent-warning');
        }
      }

      if (secondsLeft <= 0) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
        // Lock answer buttons if user hasn't submitted yet
        const btns = document.querySelectorAll('.player-opt-btn');
        btns.forEach(b => {
          b.disabled = true;
          b.classList.add('disabled-btn');
        });
      }
    };

    tick();
    this._timerInterval = setInterval(tick, 200);
  },

  bindSocketEvents() {
    if (!socket && typeof io !== 'undefined') {
      const socketUrl = (typeof window.getQuizSocketUrl === 'function') ? window.getQuizSocketUrl() : undefined;
      try {
        socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 30,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 3000,
          timeout: 10000
        });
      } catch (e) {}
    }
    if (!socket || this._playerEventsBound) return;
    this._playerEventsBound = true;

    // Resilient Connection Handling
    socket.on('disconnect', (reason) => {
      console.warn('Player disconnected from server:', reason);
      this.updateHud({ connected: false });
    });

    socket.on('connect', () => {
      console.log('Player connected to server!');
      this.updateHud({ connected: true });

      // Auto-reconnect session if player was already in an active room
      if (this.pin && this.name) {
        const charId = document.getElementById('selectedCharInput')?.value || this.selectedChar || 'alok';
        socket.emit('player-join-game', {
          pin: this.pin,
          name: this.name,
          roll: this.roll || '',
          characterId: charId,
          playerId: this.getPlayerId()
        });
      }
    });

    socket.on('join-error', (data) => {
      alert(data.message || 'Unable to join game. Check PIN and try again.');
    });

    socket.on('kicked-from-game', (data) => {
      alert(data.message || 'You were removed from the lobby by the host.');
      sessionStorage.removeItem('sdg_quiz_pin');
      window.location.reload();
    });

    socket.on('player-joined-success', (data) => {
      document.body.classList.add('room-created-active');
      const phoneCont = document.querySelector('.player-phone-container');
      if (phoneCont) phoneCont.classList.add('room-created-active');

      document.getElementById('playerJoinStage').style.display = 'none';
      document.getElementById('playerLobbyStage').style.display = 'block';
      document.getElementById('connectedName').textContent = data.name;

      if (window.AudioManager) {
        window.AudioManager.startLobbyMusic();
      }

      const char = data.character || { name: 'Alok', avatar: '/avatars/alok.jpg', color: '#00d2ff', title: 'Drop The Beat' };
      const charDisplay = document.getElementById('playerAvatarDisplay');
      if (charDisplay) {
        charDisplay.innerHTML = `
          <div class="lobby-avatar-badge" style="--char-color: ${char.color}">
            <img src="${char.avatar}" alt="${char.name}" class="lobby-avatar-img" onerror="this.src='/avatars/alok.jpg'">
            <div class="lobby-char-title">${escapeHtml(char.name.toUpperCase())}</div>
          </div>
        `;
      }
      const charNameEl = document.getElementById('connectedCharName');
      if (charNameEl) charNameEl.textContent = `Free Fire Profile: ${char.name} (${char.title || ''})`;

      // Update Top HUD
      this.updateHud({
        name: data.name,
        character: char,
        score: data.score || 0,
        connected: true
      });
    });

    // Authoritative Immediately-Delivered Question Event (No Artificial Delay)
    socket.on('question-started', (data) => {
      const overlay = document.getElementById('gameStartCountdownOverlay');
      if (overlay) overlay.style.display = 'none';
      if (window.AudioManager) {
        window.AudioManager.stopBGM(0);
      }

      document.getElementById('playerLobbyStage').style.display = 'none';
      document.getElementById('playerResultStage').style.display = 'none';
      document.getElementById('playerLeaderboardStage').style.display = 'none';
      document.getElementById('playerQuestionStage').style.display = 'block';

      // Update question header HUD
      const qIndexEl = document.getElementById('playerQIndex');
      if (qIndexEl) {
        const qNum = (data.questionIndex !== undefined) ? (data.questionIndex + 1) : 1;
        const total = data.totalQuestions || '';
        qIndexEl.textContent = total ? `QUESTION ${qNum} / ${total}` : `QUESTION ${qNum}`;
      }

      // Update question prompt text and SDG tag
      const qPromptEl = document.getElementById('playerQuestionText');
      if (qPromptEl) {
        qPromptEl.textContent = data.questionText || `Question ${(data.questionIndex || 0) + 1}`;
      }
      const sdgTagEl = document.getElementById('playerQuestionSdgTag');
      if (sdgTagEl) {
        sdgTagEl.textContent = data.sdg ? `⚡ SDG: ${data.sdg}` : '⚡ SDG MULTIPLAYER LIVE';
      }

      // Cache options
      const options = (data.options && Array.isArray(data.options) && data.options.length > 0)
        ? data.options
        : ['True', 'False'];
      this._currentOptions = options;

      const buttonsContainer = document.getElementById('playerOptionsContainer');
      const lockBox = document.getElementById('playerAnsweredLock');

      if (data.hasAnswered) {
        // If reconnecting and already answered
        buttonsContainer.style.display = 'none';
        lockBox.style.display = 'block';
      } else {
        lockBox.style.display = 'none';
        buttonsContainer.style.display = 'grid';

        // Render option buttons with Free Fire themes and large touch targets (min 44px)
        buttonsContainer.innerHTML = options.map((optText, idx) => {
          const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
          return `
            <button id="pOptBtn_${idx}" class="mockup-card-outer card-theme-${idx} player-opt-btn" style="--card-grad: ${theme.gradient}; --card-glow: ${theme.glow}" onclick="PlayerApp.submitAnswer(${idx})">
              <div class="mockup-card-inner">
                ${theme.iconSvg}
                <span class="mockup-card-text">${escapeHtml(optText)}</span>
                <div class="mockup-corner-stripes">
                  <span></span><span></span><span></span><span></span>
                </div>
              </div>
            </button>
          `;
        }).join('');
      }

      // Synchronize with server authoritative countdown deadline
      const durationSec = data.timeLimit || 20;
      const endTimeMs = data.questionEndTime || (Date.now() + durationSec * 1000);
      this.startSyncedTimer(durationSec, endTimeMs);
    });

    socket.on('timer-tick', (data) => {
      if (data.questionEndTime) {
        this.questionEndTime = data.questionEndTime;
      }
      if (data.timeLeft <= 5) {
        if (window.AudioManager) {
          window.AudioManager.timeUp();
        }
      }
    });

    socket.on('answer-accepted', (data) => {
      const optContainer = document.getElementById('playerOptionsContainer');
      if (optContainer) optContainer.style.display = 'none';

      const lockBox = document.getElementById('playerAnsweredLock');
      if (lockBox) lockBox.style.display = 'block';

      if (data && data.selectedAnswerText) {
        const choiceEl = document.getElementById('playerLockedChoice');
        if (choiceEl) choiceEl.textContent = data.selectedAnswerText;
      }
      if (data && data.totalScore !== undefined) {
        this.updateHud({ score: data.totalScore });
      }
    });

    socket.on('answer-rejected', (data) => {
      const optContainer = document.getElementById('playerOptionsContainer');
      if (optContainer) {
        const btns = optContainer.querySelectorAll('.player-opt-btn');
        btns.forEach(b => { b.disabled = true; b.classList.add('disabled-btn'); });
      }
      console.warn('Answer rejected by server:', data);
    });

    // 🎯 3-STATE AUTHORITATIVE RESULT HANDLER (CORRECT / WRONG / TIMEOUT)
    socket.on('question-result', (data) => {
      if (this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }

      if (window.AudioManager) {
        window.AudioManager.stopBGM(0);
      }

      document.getElementById('playerQuestionStage').style.display = 'none';
      document.getElementById('playerResultStage').style.display = 'block';

      const statusBox = document.getElementById('playerFeedbackBox');
      const resultType = data.resultType || (data.isCorrect ? 'CORRECT' : (data.timedOut ? 'TIMEOUT' : 'WRONG'));
      const timeSec = (data.timeTakenSec !== undefined && data.timeTakenSec !== null) ? data.timeTakenSec : '0.00';
      const points = data.pointsEarned || 0;
      const totalScore = (data.totalScore !== undefined && data.totalScore !== null) ? data.totalScore : 0;
      const yourAnswer = data.selectedAnswerText || (data.selectedOptionIndex !== null && this._currentOptions[data.selectedOptionIndex]) || null;
      const correctAnswer = data.correctAnswerText || 'See Host Big Screen';

      // Update live HUD score
      this.updateHud({ score: totalScore });

      // STATE 1: CORRECT ANSWER
      if (resultType === 'CORRECT') {
        if (window.AudioManager) {
          window.AudioManager.correctAnswer();
        }
        triggerCorrectCelebration('playerConfettiCanvas');
        statusBox.className = 'result-mockup-card result-correct-theme';
        statusBox.innerHTML = `
          <div class="result-crown-emblem emblem-correct">
            <div class="emblem-center-circle">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>
          
          <h1 class="result-title-correct">CORRECT!</h1>
          
          <div class="points-brush-banner">
            <span class="points-text">+${points} POINTS</span>
          </div>

          ${yourAnswer ? `
            <div class="submitted-answer-preview correct-answer-tag">
              <span class="preview-label">Your Answer:</span>
              <strong class="preview-val">${escapeHtml(yourAnswer)}</strong>
            </div>
          ` : ''}

          <div class="result-stats-row">
            <div class="stat-pill-box pill-cyan">
              <div class="stat-icon-wrapper cyan-icon-bg">
                <i class="fa-solid fa-stopwatch"></i>
              </div>
              <div class="stat-text-wrapper">
                <div class="stat-label-sub">Answered in</div>
                <div class="stat-value-cyan">${timeSec}s</div>
              </div>
            </div>

            <div class="stat-pill-box pill-gold">
              <div class="stat-icon-wrapper gold-icon-bg">
                <i class="fa-solid fa-trophy"></i>
              </div>
              <div class="stat-text-wrapper">
                <div class="stat-label-sub">Total Score</div>
                <div class="stat-value-gold">${totalScore} pts</div>
              </div>
            </div>
          </div>
        `;
      } 
      // STATE 2: WRONG ANSWER
      else if (resultType === 'WRONG') {
        if (window.AudioManager) {
          window.AudioManager.wrongAnswer();
        }
        statusBox.className = 'result-mockup-card result-wrong-theme';
        statusBox.innerHTML = `
          <div class="result-crown-emblem emblem-wrong">
            <div class="emblem-center-circle-wrong">
              <i class="fa-solid fa-xmark"></i>
            </div>
          </div>
          
          <h1 class="result-title-wrong">WRONG ANSWER</h1>

          <div class="points-brush-banner zero-points-banner">
            <span class="points-text">+0 POINTS</span>
          </div>
          
          ${yourAnswer ? `
            <div class="submitted-answer-preview wrong-answer-tag">
              <span class="preview-label">Your Answer:</span>
              <strong class="preview-val">${escapeHtml(yourAnswer)}</strong>
            </div>
          ` : ''}

          <div class="correct-answer-banner">
            <span class="correct-answer-label"><i class="fa-solid fa-circle-check"></i> Correct Answer:</span>
            <strong class="correct-answer-val">${escapeHtml(correctAnswer)}</strong>
          </div>

          <div class="result-stats-row margin-top-sm">
            <div class="stat-pill-box pill-cyan">
              <div class="stat-icon-wrapper cyan-icon-bg">
                <i class="fa-solid fa-stopwatch"></i>
              </div>
              <div class="stat-text-wrapper">
                <div class="stat-label-sub">Answered in</div>
                <div class="stat-value-cyan">${timeSec}s</div>
              </div>
            </div>

            <div class="stat-pill-box pill-gold">
              <div class="stat-icon-wrapper gold-icon-bg">
                <i class="fa-solid fa-trophy"></i>
              </div>
              <div class="stat-text-wrapper">
                <div class="stat-label-sub">Total Score</div>
                <div class="stat-value-gold">${totalScore} pts</div>
              </div>
            </div>
          </div>
        `;
      } 
      // STATE 3: TIME OUT
      else {
        if (window.AudioManager) {
          window.AudioManager.timeUp();
        }
        statusBox.className = 'result-mockup-card result-timeout-theme';
        statusBox.innerHTML = `
          <div class="result-crown-emblem emblem-timeout">
            <div class="emblem-center-circle-timeout">
              <i class="fa-solid fa-hourglass-end"></i>
            </div>
          </div>
          
          <h1 class="result-title-timeout">TIME OUT</h1>

          <div class="points-brush-banner timeout-points-banner">
            <span class="points-text">+0 POINTS</span>
          </div>

          <div class="timeout-notice-banner">
            <span class="timeout-notice-text">You did not submit an answer before the deadline.</span>
          </div>

          <div class="correct-answer-banner timeout-correct-box">
            <span class="correct-answer-label"><i class="fa-solid fa-circle-check"></i> Correct Answer:</span>
            <strong class="correct-answer-val">${escapeHtml(correctAnswer)}</strong>
          </div>

          <div class="result-stats-row margin-top-sm">
            <div class="stat-pill-box pill-cyan">
              <div class="stat-icon-wrapper cyan-icon-bg">
                <i class="fa-solid fa-clock"></i>
              </div>
              <div class="stat-text-wrapper">
                <div class="stat-label-sub">Status</div>
                <div class="stat-value-cyan">Time Out</div>
              </div>
            </div>

            <div class="stat-pill-box pill-gold">
              <div class="stat-icon-wrapper gold-icon-bg">
                <i class="fa-solid fa-trophy"></i>
              </div>
              <div class="stat-text-wrapper">
                <div class="stat-label-sub">Total Score</div>
                <div class="stat-value-gold">${totalScore} pts</div>
              </div>
            </div>
          </div>
        `;
      }
    });

    socket.on('game-starting-countdown', (data) => {
      triggerGameStartCountdown(data.count || 3);
    });

    socket.on('player-leaderboard-update', () => {
      if (window.AudioManager) {
        window.AudioManager.leaderboardOpen();
      }
      document.getElementById('playerResultStage').style.display = 'none';
      document.getElementById('playerLeaderboardStage').style.display = 'block';
    });

    socket.on('game-over', (data) => {
      if (window.AudioManager) {
        window.AudioManager.playVictoryMusic();
      }
      document.getElementById('playerLeaderboardStage').style.display = 'none';
      document.getElementById('playerGameOverStage').style.display = 'block';
      
      const myName = (this.name || '').toLowerCase();
      const myRankObj = (data.allScores || []).find(p => p.name.toLowerCase() === myName);
      if (myRankObj) {
        document.getElementById('finalRankDisplay').textContent = `Rank #${myRankObj.rank}`;
        document.getElementById('finalScoreDisplay').textContent = `${myRankObj.score} pts (${myRankObj.totalCorrect} correct)`;
        this.updateHud({ score: myRankObj.score });
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

function triggerGameStartCountdown(seconds = 3) {
  let count = seconds;
  let overlay = document.getElementById('gameStartCountdownOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'gameStartCountdownOverlay';
    overlay.className = 'game-start-countdown-overlay';
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
  if (window.AudioManager) {
    window.AudioManager.hostStartGame();
  }

  function tick() {
    if (count > 0) {
      overlay.innerHTML = `
        <div class="countdown-pop-box">
          <div class="countdown-sub-title">⚡ GAME STARTING IN ⚡</div>
          <div class="countdown-number-giant">${count}</div>
          <div class="countdown-sub-text">GET READY!</div>
        </div>
      `;
      count--;
      setTimeout(tick, 1000);
    } else {
      overlay.innerHTML = `
        <div class="countdown-pop-box">
          <div class="countdown-sub-title">🔥 GET READY! 🔥</div>
          <div class="countdown-number-giant text-ready">GO!</div>
        </div>
      `;
      setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
      }, 700);
    }
  }

  tick();
}
