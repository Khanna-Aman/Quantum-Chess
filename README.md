<div align="center">

# ♟️⚛️ Quantum Chess

### *Where Schrödinger meets Kasparov*

**Split pieces into superposition. Collapse probabilities on capture. Outsmart your opponent in two realities at once.**

[![Play Now](https://img.shields.io/badge/▶%20PLAY%20NOW-00C853?style=for-the-badge&logo=googlechrome&logoColor=white)]([https://qc-game.vercel.app](https://quantum-chess-game.vercel.app/))
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=flat&logo=webrtc&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)

---

*"God does not play dice with the universe... but we do play dice with chess."*

</div>

> ⚠️ **First time playing?** The backend runs on a free tier and may take **30-60 seconds to wake up** on the first connection. If you see "Failed to fetch", just wait a moment and try again — it will work once the server spins up!

---

## 🎲 The Quantum Twist

| Classical Chess | Quantum Chess |
|-----------------|---------------|
| Pieces occupy one square | Pieces exist in **superposition** across multiple squares |
| Captures are certain | Captures trigger **measurement** — piece collapses based on probability |
| What you see is what you get | Reality is uncertain until observed 👀 |

---

## 🎮 Features

- **Quantum Mechanics**: Pieces can exist in superposition across multiple squares
- **Split Moves**: Any piece (except Kings and Pawns) can split into two positions simultaneously (50% probability each)
- **Measurement/Collapse**: Capturing triggers quantum measurement — piece might be there, or it might escape!
- **P2P Multiplayer**: Direct peer-to-peer connection via WebRTC (no game server)
- **Deterministic RNG**: Seeded random number generator ensures both peers see identical results
- **State Verification**: Hash-based state verification prevents desync
- **Animations**: Smooth move animations and quantum collapse effects
- **Game Persistence**: Auto-save and restore games from localStorage
- **Export/Import**: Save and load games as JSON files

## 🏗️ Architecture

```
Quantum_chess/
├── src/engine/           # Core game engine (shared between peers)
│   ├── types.ts          # Type definitions
│   ├── rng.ts            # Seeded RNG (Mulberry32)
│   ├── board.ts          # Board state management
│   ├── moveValidation.ts # Chess movement rules
│   ├── legalMoves.ts     # Legal move generation
│   ├── moveExecution.ts  # Apply moves to state
│   ├── collapse.ts       # Quantum collapse logic
│   └── hash.ts           # State hashing for sync
├── client/               # React frontend
│   ├── src/components/   # UI components
│   ├── src/hooks/        # React hooks
│   └── src/networking/   # WebRTC connection
└── server/               # FastAPI signaling server
    └── main.py
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+

### Installation

```bash
# Clone the repository
git clone https://github.com/khanna-aman/Quantum-Chess.git
cd Quantum-Chess

# Install engine dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && pip install -r requirements.txt && cd ..
```

### Running Locally

**Terminal 1 - Signaling Server:**
```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - React Client:**
```bash
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

### How to Play

1. **Player 1**: Click "Create Room" → Share the 6-character room code
2. **Player 2**: Enter the room code → Click "Join"
3. **Play**: Click pieces to see valid moves, click destination to move

#### Move Types
- 🟢 **Green dots**: Classical moves
- 🟣 **Purple**: Quantum split targets (creates superposition)
- **% badges**: Show probability of piece being at that position

## 🧪 Running Tests

```bash
# Run engine tests
npm test

# Watch mode
npm run test:watch
```

## 🔧 Configuration

### Environment Variables

Create `client/.env` for production:
```env
VITE_SERVER_URL=https://your-signaling-server.com
```

## 📦 Deployment

### Client (GitHub Pages / Cloudflare Pages)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Signaling Server (Render / Fly.io)
The FastAPI server only handles WebSocket signaling for WebRTC connection setup.
Once peers connect, all game data flows directly P2P.

## 🎯 Quantum Chess Rules

### Superposition
- Pieces can exist in multiple positions simultaneously
- Each position has an associated probability (must sum to 1.0)

### Split Moves
- Any piece (except Kings and Pawns) can perform "split" moves
- Click "Split Move", select a piece, then choose two valid destinations
- The piece enters superposition at both squares (50% probability each)
- **Splits cannot capture** — both destination squares must be empty

### Measurement (Collapse)
- Capturing a piece in superposition triggers quantum measurement
- The piece randomly collapses to one of its positions based on probability
- If it collapses where you're attacking → **capture succeeds!**
- If it collapses elsewhere → **the piece escapes!** (your piece still moves to the target square)
- Uses seeded RNG for deterministic results across both players

### Win Condition
- **Checkmate the opponent's King to win** — standard chess win conditions apply!
- Draws: Stalemate, threefold repetition, 50-move rule, insufficient material
- Resignation is also supported
- **Kings and Pawns cannot split** — only Queen, Rook, Bishop, Knight can enter superposition

## 🔒 Security & Fair Play

- **Move Validation**: Both peers validate all moves independently
- **Deterministic Seeds**: RNG seeds exchanged before collapse
- **State Hashing**: Each move includes state hash for verification
- **Limitations**: P2P architecture means a malicious client could cheat

## 📄 License

MIT License — fork it, break it, make it weirder.

## 🤝 Contributing

PRs welcome! Some wild ideas:
- 🔗 **Quantum Entanglement** — Link two pieces so measuring one affects the other
- 👁️ **Spectator Mode** — Watch live games
- 🤖 **Quantum AI** — Minimax that thinks in probabilities
- 🎬 **Game Replays** — Rewatch your quantum victories

---

<div align="center">

**Built with ❤️ and uncertainty**

TypeScript • React • WebRTC • FastAPI • chess.js

⭐ Star this repo if quantum mechanics broke your brain (in a good way)

</div>

