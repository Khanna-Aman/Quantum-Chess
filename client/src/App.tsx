import { useEffect, useRef, useState } from 'react';
import { Chessboard } from './components/Chessboard';
import { GameEndScreen } from './components/GameEndScreen';
import { Lobby } from './components/Lobby';
import { MoveNotation } from './components/MoveNotation';
import { RematchModal } from './components/RematchModal';
import { RulesModal } from './components/RulesModal/RulesModal';
import { ToastContainer } from './components/Toast';
import { useChessGame } from './hooks/useChessGame';
import { useToast } from './hooks/useToast';
import './App.css';

// Server URL - use environment variable or default to localhost
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

function App() {
  // Toast notifications
  const { toasts, removeToast, success, error: showError, warning, info } = useToast();

  const {
    gameState,
    playerColor,
    connectionState,
    roomId,
    error,
    isMyTurn,
    isConnected,
    isGameOver: gameOver,
    quantumMode,
    lastCollapse,
    splitMode,
    splitFrom,
    splitTo1,
    rematchRequested,
    rematchReceived,
    createRoom,
    joinRoom,
    executeMove,
    disconnect,
    toggleSplitMode,
    handleSplitSelection,
    toggleQuantumMode,
    resign,
    requestRematch,
    acceptRematch,
    declineRematch
  } = useChessGame({ serverUrl: SERVER_URL });

  // Track if we've shown the connected message
  const hasShownConnectedRef = useRef(false);

  // Move navigation state (null = live view)
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number | null>(null);

  // Resign confirmation state
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  // Rules modal state
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Game end modal dismissed state
  const [gameEndDismissed, setGameEndDismissed] = useState(false);

  // Show toast notifications for state changes
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Show collapse notification as toast
  useEffect(() => {
    if (lastCollapse) {
      const emoji = lastCollapse.wasCapture ? '💥' : '👻';
      const result = lastCollapse.wasCapture ? 'Captured!' : 'Escaped!';
      const msg = `${emoji} ${lastCollapse.pieceId} → ${lastCollapse.collapsedTo} (${Math.round(lastCollapse.probability * 100)}%) ${result}`;
      if (lastCollapse.wasCapture) {
        success(msg, 4000);
      } else {
        warning(msg, 4000);
      }
    }
  }, [lastCollapse, success, warning]);

  useEffect(() => {
    // Only show "Connected" once per session
    if (isConnected && gameState && !hasShownConnectedRef.current) {
      hasShownConnectedRef.current = true;
      success('Connected! Game started.', 3000);
    }
    // Reset when disconnected
    if (!isConnected) {
      hasShownConnectedRef.current = false;
    }
  }, [isConnected, gameState, success]);

  useEffect(() => {
    if (connectionState === 'connecting') {
      info('Connecting to peer...', 3000);
    }
  }, [connectionState, info]);

  // Show game end notifications
  useEffect(() => {
    if (gameState?.gameStatus === 'white_wins') {
      if (playerColor === 'white') {
        success('🎉 Victory! You won!', 0);
      } else {
        warning('Game Over - White wins', 0);
      }
    } else if (gameState?.gameStatus === 'black_wins') {
      if (playerColor === 'black') {
        success('🎉 Victory! You won!', 0);
      } else {
        warning('Game Over - Black wins', 0);
      }
    }
  }, [gameState?.gameStatus, playerColor, success, warning]);

  // Show lobby if not in a game
  if (!gameState || !isConnected) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <Lobby
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onCancel={roomId ? disconnect : undefined}
          roomId={roomId}
          isConnecting={connectionState === 'connecting'}
          isConnected={isConnected}
          error={error}
        />
      </>
    );
  }

  // Show game
  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="game-container">
        <div className="game-info">
          <div className="player-info">
            Playing as: <strong>{playerColor}</strong>
            {quantumMode && <span className="quantum-badge">⚛️ Quantum</span>}
          </div>
          <div className="turn-info">
            {gameOver
              ? `Game Over: ${gameState.gameStatus.replace('_', ' ')}`
              : isMyTurn ? "🎯 Your turn" : "⏳ Opponent's turn"
            }
          </div>
          {gameState.chess.isCheck() && !gameOver && (
            <div className="check-warning">⚠️ Check!</div>
          )}

        </div>

        <div className="board-and-notation">
          <Chessboard
            gameState={gameState}
            playerColor={playerColor}
            isMyTurn={isMyTurn}
            onMove={executeMove}
            splitMode={splitMode}
            splitFrom={splitFrom}
            splitTo1={splitTo1}
            onSplitSelection={handleSplitSelection}
          />

          <MoveNotation
            gameState={gameState}
            viewingMoveIndex={viewingMoveIndex}
            onNavigate={setViewingMoveIndex}
            isGameOver={gameOver}
          />
        </div>

        <div className="game-controls">
          <div className="move-count">Move: {gameState.turnNumber}</div>

          {/* Quantum controls */}
          {quantumMode && isMyTurn && !gameOver && (
            <button
              className={`split-btn ${splitMode ? 'active' : ''}`}
              onClick={toggleSplitMode}
            >
              {splitMode ? '❌ Cancel Split' : '⚛️ Split Move'}
            </button>
          )}

          {/* Resign button */}
          {!gameOver && (
            <button
              className="resign-btn"
              onClick={() => setShowResignConfirm(true)}
            >
              🏳️ Resign
            </button>
          )}
        </div>

        {/* Resign confirmation popup */}
        {showResignConfirm && (
          <div className="resign-overlay">
            <div className="resign-popup">
              <h3>🏳️ Resign Game?</h3>
              <p>Are you sure you want to resign? This will give your opponent the win.</p>
              <div className="resign-buttons">
                <button
                  className="resign-confirm"
                  onClick={() => {
                    resign();
                    setShowResignConfirm(false);
                  }}
                >
                  Yes, Resign
                </button>
                <button
                  className="resign-cancel"
                  onClick={() => setShowResignConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quantum quick tips */}
        {quantumMode && (
          <div className="quantum-instructions">
            <strong>⚛️ Quick Tips:</strong>
            <ul>
              <li><strong>Split:</strong> Put a piece in two places at once (50/50)</li>
              <li><strong>Capture:</strong> Superposition pieces collapse randomly - they might escape!</li>
              <li><strong>Limit:</strong> Max {gameState.maxSuperpositions} pieces in superposition per player</li>
            </ul>
          </div>
        )}

        {/* Help button */}
        <button className="help-btn" onClick={() => setShowRulesModal(true)}>
          ?
        </button>

        {/* Rules modal */}
        <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

        {/* Game End modal */}
        {gameOver && !gameEndDismissed && (
          <GameEndScreen
            gameState={gameState}
            playerColor={playerColor}
            onOk={() => setGameEndDismissed(true)}
            onRematch={requestRematch}
            rematchRequested={rematchRequested}
          />
        )}

        {/* Rematch Request modal - shows when opponent requests rematch */}
        {rematchReceived && (
          <RematchModal
            onAccept={() => {
              acceptRematch();
              setGameEndDismissed(false);
            }}
            onDecline={declineRematch}
          />
        )}
      </div>
    </>
  );
}

export default App;
