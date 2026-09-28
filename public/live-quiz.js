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
  cracker() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300 + Math.random() * 900, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.08);
        }, i * 65);
      }
    } catch (e) {}
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

  SoundFX.cracker();

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

  async updateDashboardModalData() {
    const body = document.getElementById('hostDashboardModalBody');
    if (!body) return;

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

      // 2. Fallback to historical student records if no active room players
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
              <div class="stat-label-sub">Connected Players</div>
              <div class="stat-value-cyan" style="font-size: 1.6rem;">${players.length}</div>
            </div>
          </div>
          <div class="stat-pill-box pill-gold" style="padding: 0.8rem 1rem;">
            <div class="stat-text-wrapper">
              <div class="stat-label-sub">Current Top Leader</div>
              <div class="stat-value-gold" style="font-size: 1.4rem;">${players[0] ? `${players[0].name} (${players[0].score} pts)` : 'None'}</div>
            </div>
          </div>
        </div>

        <h4 class="cyan-text margin-top-sm"><i class="fa-solid fa-ranking-star"></i> All Player Rankings (Sorted by Highest Points)</h4>
        <div class="player-grid margin-top-sm">
          ${players.map((p, idx) => {
            const medal = medals[idx] || `#${idx + 1}`;
            const char = (p.character && typeof p.character === 'object') ? p.character : { name: 'Alok', avatar: '/avatars/alok.jpg', color: '#00d2ff' };
            const charName = String(char.name || 'Alok');
            return `
              <div class="gaming-player-card" style="--char-color: ${char.color || '#00d2ff'}">
                <div class="char-avatar-wrapper">
                  <img src="${char.avatar || '/avatars/alok.jpg'}" alt="${escapeHtml(charName)}" class="char-avatar-img" onerror="this.src='/avatars/alok.jpg'">
                  <span class="char-badge-tag">${medal} ${escapeHtml(charName.toUpperCase())}</span>
                </div>
                <div class="player-info-block">
                  <span class="player-name-text">${escapeHtml(p.name || 'Student')}</span>
                  <span class="player-roll-text">${p.roll ? `Roll: ${escapeHtml(p.roll)} | ` : ''}Points: <strong class="yellow-text" style="font-size: 1.1rem;">${p.score || 0} pts</strong></span>
                </div>
              </div>
            `;
          }).join('') || '<p class="subtitle-gaming">No student records found right now.</p>'}
        </div>
      `;
    } catch (err) {
      console.warn('Failed to update dashboard modal:', err);
      body.innerHTML = `<p class="subtitle-gaming">Error loading live data. Please try refreshing.</p>`;
    }
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
    });

    socket.off('error-msg');
    socket.on('error-msg', (data) => {
      alert(data.message || 'Game room error');
    });

    socket.on('player-list-update', (data) => {
      SoundFX.join();
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

    socket.on('new-question', (data) => {
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
      showHostStage('hostResultStage');

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
          SoundFX.fastest();
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
        const char = player.character || { avatar: '/avatars/alok.jpg', color: '#00d2ff', name: 'Alok' };
        return `
          <div class="leaderboard-row rank-${player.rank} animated-slide-up" style="--char-color: ${char.color}">
            <div class="rank-badge">${medal}</div>
            <img src="${char.avatar}" class="leaderboard-avatar-img" alt="${char.name}" onerror="this.src='/avatars/alok.jpg'">
            <div class="player-name">
              ${escapeHtml(player.name)} 
              <span class="char-sub-tag">${escapeHtml(char.name)}</span>
              ${player.roll ? `<small>(${escapeHtml(player.roll)})</small>` : ''}
            </div>
            <div class="player-score">${player.score} pts</div>
          </div>
        `;
      }).join('');
    });

    socket.on('game-over', (data) => {
      SoundFX.victory();
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
        <div class="podium-step step-2">
          ${top3[1] ? `<img src="${c2.avatar}" class="podium-avatar-img" alt="${c2.name}" onerror="this.src='/avatars/alok.jpg'">` : ''}
          <div class="podium-rank">2nd</div>
          <div class="podium-name">${escapeHtml(p2)}</div>
          <div class="podium-score">${s2} pts</div>
          <div class="podium-block"></div>
        </div>
        <div class="podium-step step-1">
          <div class="podium-crown">👑</div>
          ${top3[0] ? `<img src="${c1.avatar}" class="podium-avatar-img" alt="${c1.name}" onerror="this.src='/avatars/alok.jpg'">` : ''}
          <div class="podium-rank">1st</div>
          <div class="podium-name">${escapeHtml(p1)}</div>
          <div class="podium-score">${s1} pts</div>
          <div class="podium-block"></div>
        </div>
        <div class="podium-step step-3">
          ${top3[2] ? `<img src="${c3.avatar}" class="podium-avatar-img" alt="${c3.name}" onerror="this.src='/avatars/alok.jpg'">` : ''}
          <div class="podium-rank">3rd</div>
          <div class="podium-name">${escapeHtml(p3)}</div>
          <div class="podium-score">${s3} pts</div>
          <div class="podium-block"></div>
        </div>
      `;

      const tbody = document.getElementById('fullScoreboardBody');
      if (tbody) {
        tbody.innerHTML = (data.allScores || []).map(p => {
          const char = p.character || { avatar: '/avatars/alok.jpg', name: 'Alok' };
          return `
            <tr>
              <td><strong>#${p.rank}</strong></td>
              <td class="scoreboard-player-cell">
                <img src="${char.avatar}" class="table-avatar-img" alt="" onerror="this.src='/avatars/alok.jpg'">
                <span>${escapeHtml(p.name)} (${escapeHtml(char.name)})</span>
              </td>
              <td>${escapeHtml(p.roll || 'N/A')}</td>
              <td><strong>${p.score}</strong> pts</td>
              <td>${p.totalCorrect} Correct</td>
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
  selectedChar: 'alok',

  init() {
    this.renderCharacterPicker();
    this.bindSocketEvents();
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
  },

  joinGame() {
    const pin = document.getElementById('playerPinInput')?.value.trim();
    const name = document.getElementById('playerNameInput')?.value.trim();
    const roll = document.getElementById('playerRollInput')?.value.trim();
    const charId = document.getElementById('selectedCharInput')?.value || this.selectedChar || 'alok';

    if (!pin || !name) {
      return alert('Please enter both Game PIN and your Name!');
    }

    SoundFX.init();
    this.pin = pin;
    this.name = name;

    if (!socket && typeof io !== 'undefined') {
      try { socket = io(); } catch (e) {}
    }
    
    this.bindSocketEvents();

    if (socket) {
      socket.emit('player-join-game', { pin, name, roll, characterId: charId });
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
    if (!socket || this._playerEventsBound) return;
    this._playerEventsBound = true;

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
        const charId = document.getElementById('selectedCharInput')?.value || this.selectedChar || 'alok';
        socket.emit('player-join-game', { pin: this.pin, name: this.name, characterId: charId });
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
      document.body.classList.add('room-created-active');
      const phoneCont = document.querySelector('.player-phone-container');
      if (phoneCont) phoneCont.classList.add('room-created-active');
      document.getElementById('playerJoinStage').style.display = 'none';
      document.getElementById('playerLobbyStage').style.display = 'block';
      document.getElementById('connectedName').textContent = data.name;

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
    });

    socket.on('answer-accepted', () => {
      document.getElementById('playerOptionsContainer').style.display = 'none';
      document.getElementById('playerAnsweredLock').style.display = 'block';
    });

    socket.on('question-result', (data) => {
      document.getElementById('playerQuestionStage').style.display = 'none';
      document.getElementById('playerResultStage').style.display = 'block';

      const statusBox = document.getElementById('playerFeedbackBox');
      const isCorrect = data.isCorrect;
      const timeSec = (data.timeTakenSec !== undefined && data.timeTakenSec !== null) ? data.timeTakenSec : '0.00';
      const points = data.pointsEarned || 0;
      const totalScore = data.totalScore || 0;

      if (isCorrect) {
        SoundFX.correct();
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
            <span class="points-text">+${points} pts</span>
          </div>

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
      } else {
        SoundFX.wrong();
        statusBox.className = 'result-mockup-card result-wrong-theme';
        statusBox.innerHTML = `
          <div class="result-crown-emblem emblem-wrong">
            <div class="emblem-center-circle-wrong">
              <i class="fa-solid fa-xmark"></i>
            </div>
          </div>
          
          <h1 class="result-title-wrong">INCORRECT!</h1>
          
          <div class="correct-answer-banner">
            <span class="correct-answer-label">Correct Answer:</span>
            <strong class="correct-answer-val">${escapeHtml(data.correctAnswerText || 'See Big Screen')}</strong>
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
