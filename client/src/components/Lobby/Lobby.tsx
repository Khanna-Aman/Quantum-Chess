import { useState, useEffect, lazy, Suspense } from 'react';
import './Lobby.css';
import { RulesModal } from '../RulesModal/RulesModal';
import { QuantumTitle } from '../QuantumTitle';
import { ParticleField } from '../ParticleField';
import { OpenGames } from '../OpenGames';

// Lazy load the 3D animation to reduce initial bundle size
const QuantumAnimation = lazy(() =>
  import('../QuantumAnimation').then(m => ({ default: m.QuantumAnimation }))
);

// Time control presets: [minutes, increment in seconds]
export interface TimeControl {
  minutes: number;
  increment: number;
}

export const TIME_CONTROL_PRESETS: { label: string; value: TimeControl }[] = [
  { label: '3+0', value: { minutes: 3, increment: 0 } },
  { label: '3+2', value: { minutes: 3, increment: 2 } },
  { label: '5+0', value: { minutes: 5, increment: 0 } },
  { label: '10+0', value: { minutes: 10, increment: 0 } },
  { label: '15+10', value: { minutes: 15, increment: 10 } },
  { label: 'Custom', value: { minutes: -1, increment: -1 } }, // Sentinel for custom
];

interface LobbyProps {
  onCreateRoom: (maxSuperpositions: number, isPublic: boolean, timeControl: TimeControl) => Promise<void>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onCancel?: () => void;
  roomId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  serverUrl: string;
}

export function Lobby({
  onCreateRoom,
  onJoinRoom,
  onCancel,
  roomId,
  isConnecting,
  isConnected,
  error,
  serverUrl
}: LobbyProps) {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [maxSuperpositions, setMaxSuperpositions] = useState(2);
  const [isPublic, setIsPublic] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Time control state
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(2); // Default to 5+0
  const [customMinutes, setCustomMinutes] = useState(10);
  const [customIncrement, setCustomIncrement] = useState(5);

  const isCustomTime = selectedPresetIndex === TIME_CONTROL_PRESETS.length - 1;
  const currentTimeControl: TimeControl = isCustomTime
    ? { minutes: customMinutes, increment: customIncrement }
    : TIME_CONTROL_PRESETS[selectedPresetIndex].value;

  // Check server health on mount and periodically
  useEffect(() => {
    let isMounted = true;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${serverUrl}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (isMounted && response.ok) {
          setServerStatus('online');
        }
      } catch {
        if (isMounted) {
          setServerStatus('offline');
          // Retry every 5 seconds if offline
          retryTimeout = setTimeout(checkHealth, 5000);
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [serverUrl]);

  const handleCreateRoom = async () => {
    setShowCreateModal(false);
    await onCreateRoom(maxSuperpositions, isPublic, currentTimeControl);
  };

  const handleJoinRoom = async () => {
    if (joinRoomId.trim()) {
      await onJoinRoom(joinRoomId.trim().toUpperCase());
    }
  };

  const copyRoomId = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Waiting for opponent
  if (roomId && !isConnected) {
    return (
      <div className="lobby" role="main" aria-label="Waiting for opponent">
        <div className="lobby-card waiting">
          <h1>⚛️ Quantum Chess</h1>
          <div className="waiting-section" aria-live="polite">
            <div className="spinner" role="status" aria-label="Loading" />
            <h2>Waiting for opponent...</h2>
            <p>Share this room code with your friend:</p>
            <div className="room-code-display">
              <code aria-label={`Room code: ${roomId}`}>{roomId}</code>
              <button
                onClick={copyRoomId}
                className="copy-btn"
                aria-label={copied ? 'Room code copied to clipboard' : 'Copy room code to clipboard'}
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p className="hint">
              Your friend should enter this code to join the game
            </p>
            {onCancel && (
              <button onClick={onCancel} className="back-btn" aria-label="Go back to home screen">
                ← Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby" role="main" aria-label="Quantum Chess Lobby">
      {/* 3D Quantum Animation Background - Lazy loaded */}
      <Suspense fallback={null}>
        <QuantumAnimation />
      </Suspense>

      {/* Interactive Particle Field */}
      <ParticleField particleCount={60} />

      <div className="lobby-card-wrapper">
        {/* Help button positioned outside the card */}
        <button
          className="help-btn-card"
          onClick={() => setShowRules(true)}
          title="Game Rules"
          aria-label="Open game rules"
        >
          ?
        </button>

        <div className="lobby-card">
          {/* Main interactive area - hover triggers quantum collapse */}
          <div
            className="lobby-main-area"
            onMouseEnter={() => setIsCardHovered(true)}
            onMouseLeave={() => setIsCardHovered(false)}
          >
            <QuantumTitle isObserved={isCardHovered} />
            <p className="subtitle">
              A peer-to-peer quantum chess game where pieces exist in superposition
            </p>

            {/* Server Status Indicator */}
            <div
              className={`server-status ${serverStatus}`}
              role="status"
              aria-live="polite"
              aria-label={`Server status: ${serverStatus === 'checking' ? 'connecting' : serverStatus}`}
            >
              <span className="status-dot" aria-hidden="true" />
              <span className="status-text">
                {serverStatus === 'checking' && 'Connecting to server...'}
                {serverStatus === 'offline' && 'Server is starting up — please wait a moment...'}
                {serverStatus === 'online' && 'Server connected'}
              </span>
            </div>

            {error && (
              <div className="error-message" role="alert" aria-live="assertive">
                ⚠️ {error}
              </div>
            )}

            <div className="lobby-actions" role="group" aria-label="Game options">
              {/* Create Game Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={isConnecting || serverStatus !== 'online'}
                className="primary-btn create-game-btn"
                aria-label="Create a new game"
              >
                🎮 Create Game
              </button>

              {/* Join with Code */}
              <div className="join-section">
                <div className="join-form" role="search">
                  <input
                    type="text"
                    placeholder="Enter room code"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    maxLength={8}
                    disabled={isConnecting}
                    aria-label="Room code"
                    autoComplete="off"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={isConnecting || !joinRoomId.trim() || serverStatus !== 'online'}
                    className="secondary-btn"
                    aria-label="Join game room"
                  >
                    {isConnecting ? 'Joining...' : '🚀 Join'}
                  </button>
                </div>
              </div>

              {/* Open Games Lobby */}
              <OpenGames
                serverUrl={serverUrl}
                onJoinGame={onJoinRoom}
                isConnecting={isConnecting}
                serverStatus={serverStatus}
              />
            </div>
          </div>

          <footer className="lobby-footer" aria-labelledby="how-to-play-heading">
            <h3 id="how-to-play-heading">🎯 How to Play</h3>
            <ul>
              <li><strong>Split moves</strong> put pieces in superposition (50% at two squares)</li>
              <li><strong>Captures</strong> on superposition pieces collapse them randomly</li>
              <li>If collapse favors you, <strong>capture succeeds</strong>; otherwise, the piece <strong>escapes!</strong></li>
              <li><strong>Checkmate the King to win!</strong> Standard chess win conditions apply.</li>
            </ul>
          </footer>
        </div>
      </div> {/* End lobby-card-wrapper */}

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-game-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)} aria-label="Close">
              ✕
            </button>
            <h2>⚛️ Create Game</h2>
            <p className="modal-subtitle">Configure your quantum chess match</p>

            <div className="modal-setting">
              <label htmlFor="modal-maxSuperpositions">Max Superpositions</label>
              <p className="setting-hint">Pieces each player can keep in superposition</p>
              <div className="superposition-slider">
                <input
                  type="range"
                  id="modal-maxSuperpositions"
                  min={1}
                  max={7}
                  value={maxSuperpositions}
                  onChange={(e) => setMaxSuperpositions(parseInt(e.target.value))}
                />
                <span className="slider-value">{maxSuperpositions}</span>
              </div>
            </div>

            <div className="modal-setting">
              <label>Time Control</label>
              <p className="setting-hint">Choose time per player + increment per move</p>
              <div className="time-control-presets">
                {TIME_CONTROL_PRESETS.map((preset, index) => (
                  <button
                    key={preset.label}
                    className={`time-preset-btn ${selectedPresetIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedPresetIndex(index)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {isCustomTime && (
                <div className="custom-time-inputs">
                  <div className="time-input-group">
                    <label htmlFor="custom-minutes">Minutes</label>
                    <input
                      type="number"
                      id="custom-minutes"
                      min={1}
                      max={180}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
                    />
                  </div>
                  <span className="time-separator">+</span>
                  <div className="time-input-group">
                    <label htmlFor="custom-increment">Increment (sec)</label>
                    <input
                      type="number"
                      id="custom-increment"
                      min={0}
                      max={60}
                      value={customIncrement}
                      onChange={(e) => setCustomIncrement(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-setting">
              <label>Game Visibility</label>
              <div className="visibility-toggle">
                <button
                  className={`toggle-btn ${isPublic ? 'active' : ''}`}
                  onClick={() => setIsPublic(true)}
                >
                  🌐 Public
                </button>
                <button
                  className={`toggle-btn ${!isPublic ? 'active' : ''}`}
                  onClick={() => setIsPublic(false)}
                >
                  🔒 Private
                </button>
              </div>
              <p className="setting-hint">
                {isPublic ? 'Anyone can see and join from the lobby' : 'Only people with the code can join'}
              </p>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={isConnecting}
              className="primary-btn modal-create-btn"
            >
              {isConnecting ? 'Creating...' : '🎮 Create Game'}
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

