const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const os = require('os');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Production and Local CORS Configuration
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
const configuredOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
  : [];

function isOriginAllowed(origin) {
  if (!origin) return true; // Mobile apps, curl, server-to-server
  if (configuredOrigins.length === 0 || configuredOrigins.includes('*')) return true;
  if (configuredOrigins.includes(origin)) return true;
  // Always permit local development / Wi-Fi testing IP addresses
  if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
}

// Enable Socket.IO with production & local CORS support
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';
const DATA_FILE = path.join(__dirname, process.env.DATA_FILE || 'results.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json());

// Root serves Index Landing Page
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Serve static files both at root / and /public/ route
app.use(express.static(PUBLIC_DIR));
app.use('/public', express.static(PUBLIC_DIR));

// Helper: Get local network IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Helper: Normalize question options (e.g. for True/False questions)
function normalizeQuestion(q) {
  if (!q) return q;
  const copy = { ...q };
  if (!copy.options || !Array.isArray(copy.options) || copy.options.length === 0) {
    if (copy.type === 'tf' || copy.type === 'truefalse') {
      copy.options = ["True", "False"];
    } else {
      copy.options = ["Option A", "Option B", "Option C", "Option D"];
    }
  }
  return copy;
}

// Helper: Scan all question JSON files in public folder
async function getAllQuestionSets() {
  const allSets = {};
  const filenames = ['questions.json', 'general.json'];

  for (const file of filenames) {
    const filePath = path.join(PUBLIC_DIR, file);
    try {
      if (await fs.pathExists(filePath)) {
        const data = await fs.readJson(filePath);
        Object.keys(data).forEach(key => {
          const item = data[key];
          if (item) {
            let qList = [];
            if (Array.isArray(item.mcq)) {
              qList = qList.concat(item.mcq);
            }
            if (Array.isArray(item.tf)) {
              qList = qList.concat(item.tf);
            }
            if (Array.isArray(item)) {
              qList = qList.concat(item);
            }

            // Normalize all questions in list
            qList = qList.map(q => normalizeQuestion(q));

            allSets[key] = {
              key: key,
              name: item.name || key,
              count: qList.length,
              questions: qList,
              source: file
            };
          }
        });
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }
  return allSets;
}

// Endpoint to list available quiz question sets
app.get('/api/question-sets', async (req, res) => {
  try {
    const setsObj = await getAllQuestionSets();
    const setsList = Object.values(setsObj).map(s => ({
      key: s.key,
      name: s.name,
      count: s.count,
      source: s.source
    }));
    res.json(setsList);
  } catch (err) {
    console.error('Error fetching question sets:', err);
    res.status(500).json({ error: 'Failed to load question sets' });
  }
});

// Endpoint for complete student list & admin dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const historical = await fs.readJson(DATA_FILE).catch(() => []);
    
    // Active live room info & connected students
    const activeRooms = Object.values(games).map(g => ({
      pin: g.pin,
      state: g.state,
      setKey: g.setKey,
      totalQuestions: g.questions.length,
      currentQuestionIndex: g.currentQuestionIndex,
      playersCount: Object.keys(g.players).length,
      players: Object.values(g.players).map(p => ({
        id: p.id,
        name: p.name,
        roll: p.roll,
        character: p.character || { name: 'Alok', avatar: '/avatars/alok.jpg', color: '#00d2ff' },
        score: p.score,
        totalCorrect: p.totalCorrect
      }))
    }));

    res.json({
      activeRooms: activeRooms,
      historical: historical
    });
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Submit student quiz result (legacy API)
app.post('/api/submit', async (req, res) => {
  try {
    const result = req.body;
    const existing = await fs.readJson(DATA_FILE).catch(() => []);
    existing.push(result);
    await fs.writeJson(DATA_FILE, existing, { spaces: 2 });
    res.status(201).json({ message: 'Result saved successfully' });
  } catch (err) {
    console.error('Error saving result:', err);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// Get all quiz results (admin panel)
app.get('/api/results', async (req, res) => {
  try {
    const data = await fs.readJson(DATA_FILE).catch(() => []);
    const grouped = { round1: [], round2: [], round3: [] };

    data.forEach(entry => {
      const round = (entry.round || '').toLowerCase();
      if (round.includes("mcq")) {
        grouped.round1.push(entry);
      } else if (round.includes("debug")) {
        grouped.round2.push(entry);
      } else if (round.includes("code")) {
        grouped.round3.push(entry);
      } else {
        grouped.round1.push(entry);
      }
    });

    res.json(grouped);
  } catch (err) {
    console.error('Error reading results:', err);
    res.status(500).json({ error: 'Failed to read results' });
  }
});

// Delete result by roll number
app.delete('/api/results/:roll', async (req, res) => {
  const rollToDelete = req.params.roll;
  try {
    const data = await fs.readJson(DATA_FILE).catch(() => []);
    const updated = data.filter(entry => entry.roll !== rollToDelete);
    await fs.writeJson(DATA_FILE, updated, { spaces: 2 });
    res.json({ message: `Result for roll ${rollToDelete} deleted successfully` });
  } catch (err) {
    console.error("❌ Error deleting result:", err);
    res.status(500).json({ error: "Failed to delete result" });
  }
});

// ==========================================
// 🚀 KAHOOT LIVE MULTIPLAYER SOCKET.IO LOGIC
// ==========================================

const games = {}; // Key: 4-digit PIN

function generatePin() {
  let pin;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (games[pin]);
  return pin;
}

function stopTimer(game) {
  if (game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = null;
  }
}

function startQuestionTimer(pin) {
  const game = games[pin];
  if (!game) return;

  stopTimer(game);
  game.timeLeft = game.timePerQuestion || 20;
  game.questionStartTime = Date.now();
  game.questionDuration = game.timeLeft * 1000;
  game.questionEndTime = game.questionStartTime + game.questionDuration;

  io.to(pin).emit('timer-tick', {
    timeLeft: game.timeLeft,
    totalTime: game.timePerQuestion,
    questionStartTime: game.questionStartTime,
    questionEndTime: game.questionEndTime
  });

  game.timerInterval = setInterval(() => {
    game.timeLeft -= 1;
    io.to(pin).emit('timer-tick', {
      timeLeft: game.timeLeft,
      totalTime: game.timePerQuestion,
      questionStartTime: game.questionStartTime,
      questionEndTime: game.questionEndTime
    });

    if (game.timeLeft <= 0) {
      endQuestion(pin);
    }
  }, 1000);
}

function endQuestion(pin) {
  const game = games[pin];
  if (!game || game.state !== 'QUESTION') return;

  stopTimer(game);
  game.state = 'RESULT';

  const currentQIndex = game.currentQuestionIndex;
  const currentQ = normalizeQuestion(game.questions[currentQIndex]);
  const qAnswers = game.answers[currentQIndex] || {};

  const optionCounts = currentQ.options.map(() => 0);
  let fastestCorrect = null;

  Object.values(qAnswers).forEach(ans => {
    if (ans.optionIndex >= 0 && ans.optionIndex < currentQ.options.length) {
      optionCounts[ans.optionIndex] += 1;
    }

    if (ans.isCorrect) {
      if (!fastestCorrect || ans.timeTakenSec < fastestCorrect.timeTakenSec) {
        fastestCorrect = ans;
      }
    }
  });

  const totalPlayers = Object.keys(game.players).length;
  const answeredCount = Object.keys(qAnswers).length;

  io.to(game.hostSocketId).emit('question-result', {
    questionIndex: currentQIndex,
    totalQuestions: game.questions.length,
    questionText: currentQ.question,
    options: currentQ.options,
    correctAnswer: currentQ.correctAnswer,
    correctAnswerText: currentQ.options[currentQ.correctAnswer],
    explanation: currentQ.explanation || '',
    optionCounts: optionCounts,
    answeredCount: answeredCount,
    totalPlayers: totalPlayers,
    fastestPlayer: fastestCorrect ? {
      name: fastestCorrect.playerName,
      timeTakenSec: fastestCorrect.timeTakenSec.toFixed(2)
    } : null
  });

  // Authoritative Individual Results for Every Player (3 distinct states: CORRECT / WRONG / TIMEOUT)
  Object.values(game.players).forEach(player => {
    const ans = qAnswers[player.id];
    let resultType = 'TIMEOUT';
    let isCorrect = false;
    let timedOut = true;
    let pointsEarned = 0;
    let selectedOptionIndex = null;
    let selectedAnswerText = null;

    if (ans) {
      timedOut = false;
      selectedOptionIndex = ans.optionIndex;
      selectedAnswerText = (ans.optionIndex >= 0 && currentQ.options[ans.optionIndex]) ? currentQ.options[ans.optionIndex] : null;
      if (ans.isCorrect) {
        resultType = 'CORRECT';
        isCorrect = true;
        pointsEarned = ans.pointsEarned || 500;
      } else {
        resultType = 'WRONG';
        isCorrect = false;
        pointsEarned = 0;
      }
    } else {
      resultType = 'TIMEOUT';
      isCorrect = false;
      timedOut = true;
      pointsEarned = 0;
      selectedOptionIndex = null;
      selectedAnswerText = null;
    }

    const targetSocketId = player.socketId || player.id;
    if (targetSocketId) {
      io.to(targetSocketId).emit('question-result', {
        playerId: player.id,
        playerName: player.name,
        resultType: resultType, // 'CORRECT' | 'WRONG' | 'TIMEOUT'
        isCorrect: isCorrect,
        timedOut: timedOut,
        selectedOptionIndex: selectedOptionIndex,
        selectedAnswerText: selectedAnswerText,
        correctAnswer: currentQ.correctAnswer,
        correctAnswerText: currentQ.options[currentQ.correctAnswer],
        explanation: currentQ.explanation || '',
        pointsEarned: pointsEarned,
        totalScore: player.score,
        timeTakenSec: ans ? ans.timeTakenSec.toFixed(2) : null
      });
    }
  });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

io.on('connection', (socket) => {
  // 1. Host creates game
  socket.on('host-create-game', async (data) => {
    try {
      const setKey = data.setKey || 'JAVA23A';
      const allSets = await getAllQuestionSets();

      let questions = [];
      if (allSets[setKey] && allSets[setKey].questions) {
        questions = [...allSets[setKey].questions];
      } else {
        const firstKey = Object.keys(allSets)[0];
        questions = firstKey && allSets[firstKey] ? [...allSets[firstKey].questions] : [];
      }

      questions = questions.map(q => normalizeQuestion(q));

      if (data.shuffleQuestions) {
        questions = shuffleArray(questions);
      }

      if (data.limitQuestions && data.limitQuestions > 0 && data.limitQuestions < questions.length) {
        questions = questions.slice(0, data.limitQuestions);
      }

      const pin = generatePin();
      games[pin] = {
        pin: pin,
        hostSocketId: socket.id,
        setKey: setKey,
        questions: questions,
        currentQuestionIndex: 0,
        timePerQuestion: parseInt(data.timePerQuestion, 10) || 20,
        state: 'LOBBY',
        players: {},
        answers: {},
        questionStartTime: 0,
        timerInterval: null
      };

      socket.join(pin);
      socket.emit('game-created', {
        pin: pin,
        totalQuestions: questions.length,
        setName: allSets[setKey] ? allSets[setKey].name : setKey
      });
    } catch (err) {
      console.error("Error creating game:", err);
      socket.emit('error-msg', { message: 'Failed to create game room' });
    }
  });

const FF_CHARACTERS_LIST = [
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

function getCharacterData(charId, index = 0) {
  let found = FF_CHARACTERS_LIST.find(c => c.id === (charId || '').toLowerCase());
  if (!found) {
    found = FF_CHARACTERS_LIST[index % FF_CHARACTERS_LIST.length];
  }
  const avatarPathOnDisk = path.join(PUBLIC_DIR, found.avatar.replace(/^\//, ''));
  if (!fs.existsSync(avatarPathOnDisk)) {
    const pngPath = avatarPathOnDisk.replace(/\.jpg$/, '.png');
    if (fs.existsSync(pngPath)) {
      return { ...found, avatar: found.avatar.replace(/\.jpg$/, '.png') };
    }
    return { ...found, avatar: '/avatars/alok.jpg' };
  }
  return found;
}

  // 2. Player joins game (with session recovery support)
  socket.on('player-join-game', (data) => {
    const pin = (data.pin || '').toString().trim();
    const name = (data.name || '').trim();
    const roll = (data.roll || '').trim();
    const charId = (data.characterId || '').trim();
    const playerId = (data.playerId || '').trim() || socket.id;

    const game = games[pin];
    if (!game) {
      return socket.emit('join-error', { message: 'Invalid Game PIN. Please check and try again!' });
    }

    // Check if player is reconnecting with existing session (by playerId or matching name)
    let existingPlayer = game.players[playerId];
    if (!existingPlayer && name) {
      existingPlayer = Object.values(game.players).find(p => p.name.toLowerCase() === name.toLowerCase());
    }

    if (existingPlayer) {
      // Re-bind to current socket connection
      existingPlayer.socketId = socket.id;
      existingPlayer.connected = true;
      if (roll) existingPlayer.roll = roll;
      socket.join(pin);

      socket.emit('player-joined-success', {
        pin: pin,
        playerId: existingPlayer.id,
        name: existingPlayer.name,
        roll: existingPlayer.roll,
        character: existingPlayer.character,
        score: existingPlayer.score,
        totalCorrect: existingPlayer.totalCorrect,
        isReconnect: true,
        message: 'Reconnected to game session!'
      });

      // If reconnected during active question, immediately push current question state
      if (game.state === 'QUESTION' && game.questions[game.currentQuestionIndex]) {
        const q = normalizeQuestion(game.questions[game.currentQuestionIndex]);
        const qIndex = game.currentQuestionIndex;
        const qAnswers = game.answers[qIndex] || {};
        const hasAnswered = !!(qAnswers[existingPlayer.id] || qAnswers[socket.id]);

        socket.emit('question-started', {
          questionIndex: qIndex,
          totalQuestions: game.questions.length,
          questionText: q.question,
          optionsCount: q.options.length,
          options: q.options,
          timeLimit: game.timePerQuestion,
          questionStartTime: game.questionStartTime,
          questionEndTime: game.questionEndTime,
          hasAnswered: hasAnswered,
          sdg: q.sdg || null
        });

        if (hasAnswered) {
          const ans = qAnswers[existingPlayer.id] || qAnswers[socket.id];
          socket.emit('answer-accepted', {
            optionIndex: ans.optionIndex,
            selectedAnswerText: q.options[ans.optionIndex],
            pointsEarned: ans.pointsEarned,
            totalScore: existingPlayer.score
          });
        }
      }

      const playerList = Object.values(game.players).map(p => ({
        id: p.id,
        name: p.name,
        roll: p.roll,
        character: p.character
      }));
      io.to(game.hostSocketId).emit('player-list-update', {
        players: playerList,
        count: playerList.length
      });
      return;
    }

    if (game.state !== 'LOBBY') {
      return socket.emit('join-error', { message: 'Game has already started!' });
    }

    const nameTaken = Object.values(game.players).find(p => p.name.toLowerCase() === name.toLowerCase());
    if (nameTaken) {
      return socket.emit('join-error', { message: 'Name already taken in this room. Pick another name!' });
    }

    const currentCount = Object.keys(game.players).length;
    const charData = getCharacterData(charId, currentCount);

    const newPlayer = {
      id: playerId,
      socketId: socket.id,
      name: name,
      roll: roll,
      character: charData,
      score: 0,
      totalCorrect: 0,
      connected: true
    };
    game.players[playerId] = newPlayer;

    socket.join(pin);
    socket.emit('player-joined-success', {
      pin: pin,
      playerId: playerId,
      name: name,
      roll: roll,
      character: charData,
      score: 0,
      totalCorrect: 0,
      message: 'Successfully joined game lobby!'
    });

    const playerList = Object.values(game.players).map(p => ({
      id: p.id,
      name: p.name,
      roll: p.roll,
      character: p.character
    }));
    io.to(game.hostSocketId).emit('player-list-update', {
      players: playerList,
      count: playerList.length
    });
  });

  // Host Kicks Player from Lobby
  socket.on('host-kick-player', (data) => {
    const game = games[data.pin];
    if (!game || game.hostSocketId !== socket.id) return;

    const playerId = data.playerId;
    const targetPlayer = game.players[playerId] || Object.values(game.players).find(p => p.id === playerId || p.socketId === playerId);
    if (targetPlayer) {
      const sockId = targetPlayer.socketId || targetPlayer.id;
      io.to(sockId).emit('kicked-from-game', { message: 'You were removed from the lobby by the host.' });
      delete game.players[targetPlayer.id];

      const playerList = Object.values(game.players).map(p => ({
        id: p.id,
        name: p.name,
        roll: p.roll,
        character: p.character
      }));
      io.to(game.hostSocketId).emit('player-list-update', {
        players: playerList,
        count: playerList.length
      });
    }
  });

  // 3. Host starts game
  socket.on('host-start-game', (data) => {
    const game = games[data.pin];
    if (!game || game.hostSocketId !== socket.id) return;

    if (Object.keys(game.players).length === 0) {
      return socket.emit('error-msg', { message: 'Cannot start game without players in lobby!' });
    }

    if (game.state === 'STARTING') return;
    game.state = 'STARTING';

    io.to(data.pin).emit('game-starting-countdown', { count: 3 });

    setTimeout(() => {
      if (game.state === 'STARTING') {
        game.state = 'QUESTION';
        game.currentQuestionIndex = 0;
        sendQuestion(data.pin);
      }
    }, 3000);
  });

  function sendQuestion(pin) {
    const game = games[pin];
    if (!game) return;

    game.state = 'QUESTION';
    const qIndex = game.currentQuestionIndex;
    const q = normalizeQuestion(game.questions[qIndex]);
    game.questions[qIndex] = q;

    if (!game.answers[qIndex]) {
      game.answers[qIndex] = {};
    }

    startQuestionTimer(pin);

    io.to(game.hostSocketId).emit('new-question', {
      questionIndex: qIndex,
      totalQuestions: game.questions.length,
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      timeLimit: game.timePerQuestion,
      questionStartTime: game.questionStartTime,
      questionEndTime: game.questionEndTime,
      sdg: q.sdg || null
    });

    // Authoritative immediately-delivered question event to all players with no artificial delay
    io.to(pin).emit('question-started', {
      questionIndex: qIndex,
      totalQuestions: game.questions.length,
      questionText: q.question,
      optionsCount: q.options.length,
      options: q.options,
      timeLimit: game.timePerQuestion,
      questionStartTime: game.questionStartTime,
      questionEndTime: game.questionEndTime,
      sdg: q.sdg || null
    });
  }

  socket.on('host-skip-timer', (data) => {
    const game = games[data.pin];
    if (!game || game.hostSocketId !== socket.id) return;
    if (game.state === 'QUESTION') {
      endQuestion(data.pin);
    }
  });

  // 4. Player submits answer
  socket.on('player-submit-answer', (data) => {
    const pin = data.pin;
    const optionIndex = parseInt(data.optionIndex, 10);
    const game = games[pin];

    if (!game || game.state !== 'QUESTION') return;

    // Look up player by socket.id or provided persistent playerId
    const player = Object.values(game.players).find(p => p.socketId === socket.id || (data.playerId && p.id === data.playerId));
    if (!player) return;

    const qIndex = game.currentQuestionIndex;
    if (!game.answers[qIndex]) game.answers[qIndex] = {};

    const pKey = player.id;
    if (game.answers[qIndex][pKey]) return; // Single-submission lock

    // Server authoritative deadline check (750ms network tolerance grace)
    const now = Date.now();
    if (game.questionEndTime && now > game.questionEndTime + 750) {
      return socket.emit('answer-rejected', { reason: 'TIMEOUT', message: 'Time limit expired!' });
    }

    const currentQ = normalizeQuestion(game.questions[qIndex]);
    const timeTakenSec = Math.max(0.1, (now - game.questionStartTime) / 1000);
    const isCorrect = (optionIndex === currentQ.correctAnswer);

    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = 500;
      player.score += pointsEarned;
      player.totalCorrect += 1;
    }

    game.answers[qIndex][pKey] = {
      playerId: player.id,
      socketId: socket.id,
      playerName: player.name,
      optionIndex: optionIndex,
      isCorrect: isCorrect,
      timeTakenSec: timeTakenSec,
      pointsEarned: pointsEarned
    };

    socket.emit('answer-accepted', {
      optionIndex: optionIndex,
      selectedAnswerText: currentQ.options[optionIndex],
      pointsEarned: pointsEarned,
      totalScore: player.score
    });

    const activePlayers = Object.values(game.players).filter(p => p.connected !== false);
    const answeredCount = Object.keys(game.answers[qIndex]).length;
    const totalPlayers = Object.keys(game.players).length;

    io.to(game.hostSocketId).emit('response-count-update', {
      answeredCount: answeredCount,
      totalPlayers: totalPlayers
    });

    // When all active players have submitted, immediately conclude question
    if (activePlayers.length > 0 && answeredCount >= activePlayers.length) {
      endQuestion(pin);
    }
  });

  // 5. Host views leaderboard
  socket.on('host-show-leaderboard', (data) => {
    const game = games[data.pin];
    if (!game || game.hostSocketId !== socket.id) return;

    game.state = 'LEADERBOARD';

    const sortedPlayers = Object.values(game.players)
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        roll: p.roll,
        character: p.character,
        score: p.score,
        totalCorrect: p.totalCorrect
      }));

    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    io.to(game.hostSocketId).emit('leaderboard-data', {
      leaderboard: sortedPlayers,
      fullLeaderboard: sortedPlayers,
      isLastQuestion: isLastQuestion
    });

    io.to(data.pin).emit('player-leaderboard-update', {
      leaderboard: sortedPlayers,
      isLastQuestion: isLastQuestion
    });
  });

  // 6. Host triggers Next Question
  socket.on('host-next-question', (data) => {
    const game = games[data.pin];
    if (!game || game.hostSocketId !== socket.id) return;

    game.currentQuestionIndex += 1;

    if (game.currentQuestionIndex < game.questions.length) {
      sendQuestion(data.pin);
    } else {
      game.state = 'ENDED';
      const sortedPlayers = Object.values(game.players)
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({
          rank: idx + 1,
          name: p.name,
          roll: p.roll,
          character: p.character,
          score: p.score,
          totalCorrect: p.totalCorrect
        }));

      saveLiveGameResults(game, sortedPlayers);

      io.to(data.pin).emit('game-over', {
        podium: sortedPlayers.slice(0, 3),
        allScores: sortedPlayers
      });
    }
  });

  socket.on('disconnect', () => {
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      const player = Object.values(game.players).find(p => p.socketId === socket.id);
      if (player) {
        if (game.state === 'LOBBY') {
          delete game.players[player.id];
          const playerList = Object.values(game.players).map(p => ({
            id: p.id,
            name: p.name,
            roll: p.roll,
            character: p.character
          }));
          io.to(game.hostSocketId).emit('player-list-update', {
            players: playerList,
            count: playerList.length
          });
        } else {
          // Keep student session & score alive during active quiz for reconnect
          player.connected = false;
        }
      }
    });
  });
});

async function saveLiveGameResults(game, sortedPlayers) {
  try {
    const existing = await fs.readJson(DATA_FILE).catch(() => []);
    const gameRecord = {
      round: `Live-Kahoot-${game.setKey}`,
      pin: game.pin,
      date: new Date().toISOString(),
      totalQuestions: game.questions.length,
      playersCount: sortedPlayers.length,
      topScorer: sortedPlayers[0] ? sortedPlayers[0].name : 'N/A',
      results: sortedPlayers
    };
    existing.push(gameRecord);
    await fs.writeJson(DATA_FILE, existing, { spaces: 2 });
  } catch (err) {
    console.error("Error saving live game results:", err);
  }
}

server.listen(port, host, () => {
  const localIp = getLocalIp();
  console.log(`===================================================`);
  console.log(`🚀 Kahoot Live Quiz Server Running!`);
  console.log(``);
  console.log(`🖥️  Host Big Screen View (Computer/TV):`);
  console.log(`    👉 http://localhost:${port}/host.html`);
  console.log(``);
  console.log(`📱 Player Mobile View (Phones on Wi-Fi):`);
  console.log(`    👉 http://${localIp}:${port}/player.html`);
  console.log(`    👉 http://localhost:${port}/player.html`);
  console.log(`===================================================`);
});
