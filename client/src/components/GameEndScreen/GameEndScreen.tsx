import type { QuantumGameState, Player } from '../../engine/ChessEngine';
import './GameEndScreen.css';

interface GameEndScreenProps {
  gameState: QuantumGameState;
  playerColor: Player;
  onOk: () => void;
  onRematch: () => void;
  rematchRequested: boolean;
}

export function GameEndScreen({
  gameState,
  playerColor,
  onOk,
  onRematch,
  rematchRequested
}: GameEndScreenProps) {
  const isWinner =
    (gameState.gameStatus === 'white_wins' && playerColor === 'white') ||
    (gameState.gameStatus === 'black_wins' && playerColor === 'black');

  const isDraw = gameState.gameStatus?.startsWith('draw');

  const getTitle = () => {
    if (isDraw) return '🤝 Draw!';
    if (isWinner) return '🎉 Victory!';
    return '😔 Defeat';
  };

  const getSubtitle = () => {
    // Check for resignation
    if (gameState.resultReason === 'resignation') {
      return gameState.gameStatus === 'white_wins'
        ? 'Black resigned'
        : 'White resigned';
    }
    switch (gameState.gameStatus) {
      case 'white_wins': return 'White wins by checkmate!';
      case 'black_wins': return 'Black wins by checkmate!';
      case 'draw_stalemate': return 'Game ended in stalemate';
      case 'draw_50_move': return 'Draw by 50-move rule';
      case 'draw_agreement': return 'Draw by agreement';
      case 'draw_repetition': return 'Draw by threefold repetition';
      case 'draw_insufficient': return 'Draw by insufficient material';
      default: return '';
    }
  };

  // Count pieces
  const piecesArray = Array.from(gameState.pieces.values());
  const whitePieces = piecesArray.filter(p => p.owner === 'white').length;
  const blackPieces = piecesArray.filter(p => p.owner === 'black').length;

  // Count quantum moves (split)
  const quantumMoves = gameState.moveHistory.filter(
    m => m.type === 'split'
  ).length;

  return (
    <div className="game-end-overlay">
      <div className={`game-end-modal ${isWinner ? 'winner' : isDraw ? 'draw' : 'loser'}`}>
        <h1 className="end-title">{getTitle()}</h1>
        <p className="end-subtitle">{getSubtitle()}</p>

        <div className="game-stats">
          <h3>📊 Game Summary</h3>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-value">{gameState.turnNumber}</span>
              <span className="stat-label">Turns</span>
            </div>
            <div className="stat">
              <span className="stat-value">{gameState.moveHistory.length}</span>
              <span className="stat-label">Moves</span>
            </div>
            <div className="stat">
              <span className="stat-value">{quantumMoves}</span>
              <span className="stat-label">Quantum Splits</span>
            </div>
            <div className="stat">
              <span className="stat-value">{16 - whitePieces}/{16 - blackPieces}</span>
              <span className="stat-label">Captured</span>
            </div>
          </div>
        </div>

        <div className="end-actions">
          <button className="action-btn ok-btn" onClick={onOk}>
            ✓ OK
          </button>
          <button
            className={`action-btn rematch-btn ${rematchRequested ? 'pending' : ''}`}
            onClick={onRematch}
            disabled={rematchRequested}
          >
            {rematchRequested ? '⏳ Waiting...' : '🔄 Rematch'}
          </button>
        </div>
      </div>
    </div>
  );
}

