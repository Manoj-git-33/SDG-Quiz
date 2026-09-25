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

// Enable Socket.IO with permissive CORS for local network and online
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const DATA_FILE = path.join(__dirname, process.env.DATA_FILE || 'results.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json());

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

  io.to(pin).emit('timer-tick', { timeLeft: game.timeLeft, totalTime: game.timePerQuestion });

  game.timerInterval = setInterval(() => {
    game.timeLeft -= 1;
    io.to(pin).emit('timer-tick', { timeLeft: game.timeLeft, totalTime: game.timePerQuestion });

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
    explanation: currentQ.explanation || '',
    optionCounts: optionCounts,
    answeredCount: answeredCount,
    totalPlayers: totalPlayers,
    fastestPlayer: fastestCorrect ? {
      name: fastestCorrect.playerName,
      timeTakenSec: fastestCorrect.timeTakenSec.toFixed(2)
    } : null
  });

  Object.keys(game.players).forEach(pSocketId => {
    const player = game.players[pSocketId];
    const ans = qAnswers[pSocketId];

    io.to(pSocketId).emit('question-result', {
      answered: !!ans,
      isCorrect: ans ? ans.isCorrect : false,
      correctAnswer: currentQ.correctAnswer,
      correctAnswerText: currentQ.options[currentQ.correctAnswer],
      pointsEarned: ans ? ans.pointsEarned : 0,
      totalScore: player.score,
      timeTakenSec: ans ? ans.timeTakenSec.toFixed(2) : null
    });
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

  // 2. Player joins game
  socket.on('player-join-game', (data) => {
    const pin = (data.pin || '').toString().trim();
    const name = (data.name || '').trim();
    const roll = (data.roll || '').trim();

    const game = games[pin];
    if (!game) {
      return socket.emit('join-error', { message: 'Invalid Game PIN. Please check and try again!' });
    }

    if (game.state !== 'LOBBY') {
      return socket.emit('join-error', { message: 'Game has already started!' });
    }

    const existingName = Object.values(game.players).find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingName) {
      return socket.emit('join-error', { message: 'Name already taken in this room. Pick another name!' });
    }

    game.players[socket.id] = {
      id: socket.id,
      name: name,
      roll: roll,
      score: 0,
      totalCorrect: 0
    };

    socket.join(pin);
    socket.emit('player-joined-success', {
      pin: pin,
      name: name,
      message: 'Successfully joined game lobby!'
    });

    const playerList = Object.values(game.players).map(p => ({ id: p.id, name: p.name, roll: p.roll }));
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
    if (game.players[playerId]) {
      io.to(playerId).emit('kicked-from-game', { message: 'You were removed from the lobby by the host.' });
      delete game.players[playerId];

      const playerList = Object.values(game.players).map(p => ({ id: p.id, name: p.name, roll: p.roll }));
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

    game.state = 'QUESTION';
    game.currentQuestionIndex = 0;
    sendQuestion(data.pin);
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

    io.to(game.hostSocketId).emit('new-question', {
      questionIndex: qIndex,
      totalQuestions: game.questions.length,
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      timeLimit: game.timePerQuestion
    });

    io.to(pin).emit('question-started', {
      questionIndex: qIndex,
      totalQuestions: game.questions.length,
      optionsCount: q.options.length,
      options: q.options,
      timeLimit: game.timePerQuestion
    });

    startQuestionTimer(pin);
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
    const player = game.players[socket.id];
    if (!player) return;

    const qIndex = game.currentQuestionIndex;
    if (!game.answers[qIndex]) game.answers[qIndex] = {};

    if (game.answers[qIndex][socket.id]) return;

    const currentQ = normalizeQuestion(game.questions[qIndex]);
    const timeTakenSec = Math.max(0.1, (Date.now() - game.questionStartTime) / 1000);
    const isCorrect = (optionIndex === currentQ.correctAnswer);

    let pointsEarned = 0;
    if (isCorrect) {
      const speedFactor = Math.max(0.5, 1 - (timeTakenSec / game.timePerQuestion));
      pointsEarned = Math.round(1000 * speedFactor);
      player.score += pointsEarned;
      player.totalCorrect += 1;
    }

    game.answers[qIndex][socket.id] = {
      socketId: socket.id,
      playerName: player.name,
      optionIndex: optionIndex,
      isCorrect: isCorrect,
      timeTakenSec: timeTakenSec,
      pointsEarned: pointsEarned
    };

    socket.emit('answer-accepted', {
      optionIndex: optionIndex,
      pointsEarned: pointsEarned
    });

    const answeredCount = Object.keys(game.answers[qIndex]).length;
    const totalPlayers = Object.keys(game.players).length;

    io.to(game.hostSocketId).emit('response-count-update', {
      answeredCount: answeredCount,
      totalPlayers: totalPlayers
    });

    if (answeredCount >= totalPlayers) {
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
        score: p.score,
        totalCorrect: p.totalCorrect
      }));

    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    io.to(game.hostSocketId).emit('leaderboard-data', {
      leaderboard: sortedPlayers.slice(0, 5),
      fullLeaderboard: sortedPlayers,
      isLastQuestion: isLastQuestion
    });

    io.to(data.pin).emit('player-leaderboard-update', {
      leaderboard: sortedPlayers.slice(0, 5),
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
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        const playerList = Object.values(game.players).map(p => ({ id: p.id, name: p.name, roll: p.roll }));
        io.to(game.hostSocketId).emit('player-list-update', {
          players: playerList,
          count: playerList.length
        });
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
