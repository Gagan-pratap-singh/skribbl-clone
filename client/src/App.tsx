import { io } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

const socket = io("http://localhost:3001");

type Player = {
  id: string;
  name: string;
  score: number;
};

type DrawData = {
  roomName?: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  brushSize: number;
};

function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [timeLeft, setTimeLeft] = useState(60);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentDrawer, setCurrentDrawer] = useState("");
  const [wordChoices, setWordChoices] = useState<string[]>([]);

  const [wordHint, setWordHint] = useState("");
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [isHost, setIsHost] = useState(false);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [eraser, setEraser] = useState(false);

  const [winner, setWinner] = useState("");
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    socket.on("room-created", (room: string) => {
      setCurrentRoom(room);
      setIsHost(true);
      setMessages((prev) => [...prev, `Room Created: ${room}`]);
    });

    socket.on("player-joined", (name: string) => {
      setMessages((prev) => [...prev, `${name} joined the room`]);
    });

    socket.on("room-players", (playerList: Player[]) => {
      setPlayers(playerList);
    });

    socket.on("chat-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("word-hint", (hint: string) => {
      setWordHint(hint);
    });

    socket.on("round-update", (data: { round: number; maxRounds: number }) => {
      setRound(data.round);
      setMaxRounds(data.maxRounds);
    });

    socket.on("word-options", (words: string[]) => {
      setWordChoices(words);
    });

    socket.on("new-drawer", (drawerName: string) => {
      setCurrentDrawer(drawerName);
      setIsDrawer(drawerName === playerName);
      setWordHint("");
      setMessages((prev) => [...prev, `${drawerName} is drawing`]);
    });

    socket.on("timer-update", (time: number) => {
      setTimeLeft(time);
    });

    socket.on("correct-guess", (name: string) => {
      setMessages((prev) => [...prev, `🎉 ${name} guessed correctly!`]);
    });

    // FIX: Removed duplicate "game-over" listener; kept only one
    socket.on("game-over", ({ winner, leaderboard }: { winner: Player; leaderboard: Player[] }) => {
      setWinner(winner.name);
      setLeaderboard(leaderboard);
    });

    socket.on("round-ended", (word: string) => {
      setMessages((prev) => [...prev, `Round ended. Word was: ${word}`]);
    });

    socket.on("clear-canvas", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on("drawing", (data: DrawData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineWidth = data.brushSize || 4;
      ctx.strokeStyle = data.color || "#000000";
      ctx.beginPath();
      ctx.moveTo(data.x0, data.y0);
      ctx.lineTo(data.x1, data.y1);
      ctx.stroke();
    });

    // FIX: Removed JSX accidentally placed inside the cleanup return
    return () => {
      socket.removeAllListeners();
    };
  }, [playerName]);

  // ================= CANVAS =================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent) => {
      if (!isDrawer) return;
      drawing = true;
      lastX = e.offsetX;
      lastY = e.offsetY;
    };

    const draw = (e: MouseEvent) => {
      if (!drawing || !isDrawer) return;

      const x = e.offsetX;
      const y = e.offsetY;
      const activeColor = eraser ? "#FFFFFF" : color;

      ctx.lineWidth = brushSize;
      ctx.strokeStyle = activeColor;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();

      socket.emit("draw", {
        roomName: currentRoom,
        x0: lastX,
        y0: lastY,
        x1: x,
        y1: y,
        color: activeColor,
        brushSize,
      });

      lastX = x;
      lastY = y;
    };

    const stopDrawing = () => {
      drawing = false;
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
    };
  }, [currentRoom, isDrawer, color, brushSize, eraser]);

  const createRoom = () => {
    if (!roomName || !playerName) return; 
    socket.emit("create-room", { roomName, playerName });
  };

  const joinRoom = () => {
    if (!roomName || !playerName) return;
    socket.emit("join-room", { roomName, playerName });
    setCurrentRoom(roomName);
  };

  const startGame = () => {
    if (!currentRoom) return;
    socket.emit("start-game", currentRoom);
  };

  const selectWord = (word: string) => {
    socket.emit("word-selected", { roomName: currentRoom, word });
    setWordChoices([]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("chat-message", { roomName: currentRoom, playerName, message });
    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎨 DrawDle</h1>

      <input
        type="text"
        placeholder="Player Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Room Name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      <button onClick={createRoom}>Create Room</button>
      <button onClick={joinRoom}>Join Room</button>
      {isHost && <button onClick={startGame}>Start Game</button>}

      <hr />

      <h3>Room: {currentRoom}</h3>
      <h3>Round: {round}/{maxRounds}</h3>
      <h3>Drawer: {currentDrawer}</h3>
      <h3>⏳ Time Left: {timeLeft}</h3>
      {wordHint && <h2>Word: {wordHint}</h2>}

      {wordChoices.length > 0 && (
        <div>
          <h3>Select Word</h3>
          {wordChoices.map((word) => (
            <button key={word} onClick={() => selectWord(word)}>
              {word}
            </button>
          ))}
        </div>
      )}

      <hr />

      {/* FIX: Winner screen was accidentally placed in useEffect cleanup; moved here to JSX */}
      {winner && (
        <div>
          <h1>🏆 Winner: {winner}</h1>
          <h2>Final Leaderboard</h2>
          <ul>
            {leaderboard.map((player) => (
              <li key={player.id}>
                {player.name} - {player.score}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2>Players</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name} - Score: {player.score}
          </li>
        ))}
      </ul>

      <hr />

      {isDrawer && (
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <label>
            Color:{" "}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>

          <label>
            Brush:{" "}
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <span> {brushSize}px</span>
          </label>

          <button onClick={() => setEraser(!eraser)}>
            {eraser ? "✏️ Drawing" : "🧹 Eraser"}
          </button>

          <button onClick={() => socket.emit("clear-canvas", currentRoom)}>
            🗑️ Clear Canvas
          </button>
        </div>
      )}

      {isHost && currentRoom && (
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => socket.emit("end-game", currentRoom)}>
            🚩 End Game
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ border: "2px solid black", background: "white" }}
      />

      <hr />

      <h2>Chat</h2>

      <div
        style={{
          border: "1px solid gray",
          height: "200px",
          overflowY: "auto",
          padding: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>

      <br />

      <input
        type="text"
        placeholder="Type Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage();
        }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;