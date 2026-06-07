# 🎨 DrawDle - Real-Time Multiplayer Skribbl.io Clone

A real-time multiplayer drawing and guessing game inspired by Skribbl.io. Players can create or join rooms, draw selected words, guess drawings in real time, earn points, and compete on a live leaderboard.

---

# 🚀 Live Demo

### Frontend
https://draw-dle-lime.vercel.app/

### Backend
https://drawdle.onrender.com

### GitHub Repository
https://github.com/Gagan-pratap-singh/Draw-Dle

---

# 📖 Project Overview

DrawDle is a multiplayer Pictionary-style game where players take turns drawing and guessing words. The application uses Socket.IO to provide real-time communication between all connected players.

### How It Works

- Players create or join a room.
- One player becomes the drawer.
- The drawer selects a word from multiple options.
- Other players try to guess the word through chat.
- Correct guesses earn points.
- Drawing turns rotate among players.
- The player with the highest score wins the game.

---

# ✨ Features

## 🎯 Lobby System

- Create private game rooms
- Join existing rooms
- Real-time player list updates
- Host-controlled game start

## 🎨 Drawing Board

- HTML5 Canvas based drawing board
- Real-time drawing synchronization
- Clear canvas functionality
- Live drawing updates across all connected clients

## 🎮 Multiplayer Gameplay

- Turn-based drawing system
- Automatic drawer rotation
- Multiple rounds support
- Real-time room synchronization

## 🔤 Word Selection

- Random word generation
- Three-word choice system
- Secret word visible only to the drawer
- Hidden word for guessers

## 💡 Hint System

- Automatic letter reveals
- Progressive hints during gameplay
- Improved guessing experience

## 💬 Chat & Guessing

- Real-time chat system
- Instant message updates
- Correct answer detection
- Drawer restricted from guessing

## 🏆 Scoring System

- Time-based scoring
- Live scoreboard updates
- Automatic leaderboard generation
- Winner determination

## ⏱ Game Management

- Countdown timer
- Automatic round transitions
- Game-over screen
- Winner announcement

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Socket.IO Client
- HTML5 Canvas API
- CSS

## Backend

- Node.js
- Express.js
- Socket.IO

## Deployment

- Vercel (Frontend Hosting)
- Render (Backend Hosting)
- GitHub (Version Control)

---

# 🏗 Project Structure

```text
Draw-Dle/

├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
│
├── .gitignore
├── package-lock.json
└── README.md
```

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/Gagan-pratap-singh/Draw-Dle.git
cd Draw-Dle
```

---

## 2. Backend Setup

Navigate to backend folder:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Start server:

```bash
node server.js
```

Backend runs on:

```text
http://localhost:3001
```

---

## 3. Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# 🔌 Socket.IO Events

## Client → Server

```text
create-room
join-room
start-game
word-selected
draw
chat-message
clear-canvas
end-game
```

## Server → Client

```text
room-created
player-joined
room-players
word-options
new-drawer
word-hint
drawing
timer-update
correct-guess
round-ended
game-over
```

---

# 🎯 Scoring Logic

Players receive points for correct guesses based on remaining time.

```text
Score = 10 + Remaining Time
```

Example:

```text
Correct Guess at 40 seconds left

Score = 10 + 40
Score = 50 Points
```

This rewards faster guesses and encourages competitive gameplay.

---

# 🎮 Game Flow

### Step 1
Create or Join Room

### Step 2
Host Starts Game

### Step 3
Drawer Receives Three Random Word Choices

### Step 4
Drawer Selects a Word

### Step 5
Drawing Begins

### Step 6
Guessers Receive Hints

### Step 7
Players Guess Through Chat

### Step 8
Correct Guess Awards Points

### Step 9
Next Drawer Selected

### Step 10
Rounds Continue Until Completion

### Step 11
Winner Announced

---

# 🌐 Deployment

## Frontend Deployment

Hosted on Vercel:

https://draw-dle-lime.vercel.app/

### Technologies Used

- Vercel
- React
- TypeScript
- Vite

---

## Backend Deployment

Hosted on Render:

https://drawdle.onrender.com

### Technologies Used

- Node.js
- Express
- Socket.IO

---

# 🔒 Game Rules

- Minimum 2 players required.
- Only the selected drawer can draw.
- Drawer cannot guess the word.
- Guessers must type the correct word in chat.
- Correct guesses earn points.
- Game ends after all rounds are completed.
- Highest scoring player wins.

---

# 🚀 Future Improvements

- User Authentication
- Public Room Matchmaking
- Friend Invite Links
- Spectator Mode
- Mobile Optimization
- Drawing Colors
- Brush Size Selection
- Eraser Tool
- Sound Effects
- Database Integration
- Persistent User Profiles
- Global Leaderboards

---

# 👨‍💻 Author

## Gagan Pratap Singh

GitHub:
https://github.com/Gagan-pratap-singh

Project:
DrawDle – Real-Time Multiplayer Skribbl.io Clone

---

# 📌 Assignment Information

This project was developed as part of the Web3Task Pvt. Ltd. Full Stack Developer Internship Technical Assessment.

---

# 📄 License

This project is intended for educational, learning, and evaluation purposes only.
