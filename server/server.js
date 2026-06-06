const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};

const WORDS = [
  "Apple", "Tiger", "Laptop", "Football", "Pizza",
  "Elephant", "Train", "School", "Banana", "Car",
  "House", "Doctor", "River", "Bottle", "Computer",
  "Camera", "Phone", "Sun", "Moon", "Chair",
];

app.get("/", (req, res) => {
  res.send("DrawDle Server Running");
});

function getRandomWords() {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

function startTurn(roomName) {
  const room = rooms[roomName];
  if (!room) return;
  if (room.players.length < 2) return;

  const maxTurns = room.players.length * room.maxRounds;
  room.totalTurns++;

  console.log(`Turn ${room.totalTurns}/${maxTurns}`);

  // Game finished
  if (room.totalTurns > maxTurns) {
    console.log("GAME OVER");
    endGame(roomName);
    return;
  }

  // Calculate current round
  room.round = Math.floor((room.totalTurns - 1) / room.players.length) + 1;

  io.to(roomName).emit("round-update", {
    round: room.round,
    maxRounds: room.maxRounds,
  });

  // Select next drawer
  room.currentDrawerIndex =
    (room.currentDrawerIndex + 1) % room.players.length;

  const drawer = room.players[room.currentDrawerIndex];
  room.currentDrawer = drawer.id;

  console.log(`Drawer: ${drawer.name}`);

  // Reset previous word
  room.currentWord = "";

  // Send 3 word choices to drawer
  io.to(drawer.id).emit("word-options", getRandomWords());

  // Notify room
  io.to(roomName).emit("new-drawer", drawer.name);

  // Clear board for new turn
  io.to(roomName).emit("clear-canvas");
}

function revealLetter(roomName) {
  const room = rooms[roomName];
  if (!room || !room.currentWord) return;

  const word = room.currentWord;
  const hint = room.currentHint.split(" ");

  for (let i = 0; i < word.length; i++) {
    if (hint[i] === "_") {
      hint[i] = word[i];
      break;
    }
  }

  room.currentHint = hint.join(" ");

  // Send updated hint only to guessers (exclude drawer)
  io.to(roomName).except(room.currentDrawer).emit("word-hint", room.currentHint);
}

function startRound(roomName) {
  const room = rooms[roomName];
  if (!room) return;

  room.timeLeft = 60;
  io.to(roomName).emit("timer-update", room.timeLeft);

  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(roomName).emit("timer-update", room.timeLeft);

    if (room.timeLeft % 15 === 0 && room.timeLeft > 0) {
      revealLetter(roomName);
    }

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      io.to(roomName).emit("round-ended", room.currentWord);
      io.to(roomName).emit("clear-canvas");

      setTimeout(() => {
        startTurn(roomName);
      }, 3000);
    }
  }, 1000);
}

function endGame(roomName) {
  const room = rooms[roomName];
  if (!room) return;

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  const leaderboard = [...room.players].sort((a, b) => b.score - a.score);

  if (leaderboard.length === 0) {
    io.to(roomName).emit("game-over", { winner: null, leaderboard: [] });
    delete rooms[roomName];
    return;
  }

  const winner = leaderboard[0];

  io.to(roomName).emit("game-over", { winner, leaderboard });

  console.log("GAME OVER");
  console.log("Winner:", winner.name);

  // Remove room after 10 seconds
  setTimeout(() => {
    delete rooms[roomName];
  }, 10000);
}

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("create-room", ({ roomName, playerName }) => {
    socket.join(roomName);

    rooms[roomName] = {
      players: [{ id: socket.id, name: playerName, score: 0 }],
      hostId: socket.id,
      currentDrawerIndex: -1,
      currentDrawer: "",
      currentWord: "",
      currentHint: "",
      timer: null,
      timeLeft: 60,
      round: 1,
      maxRounds: 3,
      totalTurns: 0,
    };

    socket.emit("room-created", roomName);
    io.to(roomName).emit("room-players", rooms[roomName].players);
  });

  socket.on("join-room", ({ roomName, playerName }) => {
    socket.join(roomName);
    if (!rooms[roomName]) return;

    rooms[roomName].players.push({ id: socket.id, name: playerName, score: 0 });

    io.to(roomName).emit("player-joined", playerName);
    io.to(roomName).emit("room-players", rooms[roomName].players);
  });

  socket.on("start-game", (roomName) => {
    const room = rooms[roomName];
    if (!room) return;
    if (socket.id !== room.hostId) return;

    startTurn(roomName);
  });

  socket.on("word-selected", ({ roomName, word }) => {
    const room = rooms[roomName];
    if (!room) return;

    room.currentWord = word;
    room.currentHint = word.split("").map(() => "_").join(" ");

    // Send hint only to guessers, not the drawer
    socket.to(roomName).emit("word-hint", room.currentHint);

    // Tell the drawer what word they picked
    socket.emit("word-hint", `Your word: ${word}`);
    io.to(roomName).emit("game-message", "Round Started!");
    io.to(roomName).emit("clear-canvas");

    startRound(roomName);
  });

  socket.on("draw", (data) => {
    const room = rooms[data.roomName];
    if (!room) return;
    if (socket.id !== room.currentDrawer) return;

    socket.to(data.roomName).emit("drawing", data);
  });

  socket.on("chat-message", ({ roomName, playerName, message }) => {
    const room = rooms[roomName];
    if (!room) return;

    // Prevent drawer from sending chat messages
    if (socket.id === room.currentDrawer) return;

    if (
      room.currentWord &&
      message.toLowerCase() === room.currentWord.toLowerCase()
    ) {
      const player = room.players.find((p) => p.id === socket.id);

      if (player && socket.id !== room.currentDrawer) {
        player.score += 10 + room.timeLeft;

        io.to(roomName).emit("correct-guess", player.name);
        io.to(roomName).emit("room-players", room.players);

        clearInterval(room.timer);
        io.to(roomName).emit("clear-canvas");

        setTimeout(() => {
          startTurn(roomName);
        }, 3000);
      }

      return;
    }

    io.to(roomName).emit("chat-message", `${playerName}: ${message}`);
  });

  socket.on("end-game", (roomName) => {
    const room = rooms[roomName];
    if (!room) return;
    if (socket.id !== room.hostId) return;

    endGame(roomName);
  });

  socket.on("clear-canvas", (roomName) => {
    io.to(roomName).emit("clear-canvas");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    for (const roomName in rooms) {
      rooms[roomName].players = rooms[roomName].players.filter(
        (player) => player.id !== socket.id
      );

      io.to(roomName).emit("room-players", rooms[roomName].players);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});