/**
 * Chess Game Hook - Uses chess.js for proper rule validation
 * WITH QUANTUM MECHANICS SUPPORT
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Square, PieceSymbol } from 'chess.js';
import {
  createGame,
  makeMove,
  makeSplitMove,
  isGameOver,
  setQuantumMode as setEngineQuantumMode,
  type QuantumGameState,
  type Player,
  type CollapseResult
} from '../engine/ChessEngine';
import { WebRTCConnection, type ConnectionState } from '../networking';

export interface GameMessage {
  type: 'move' | 'split' | 'sync_request' | 'sync_response' | 'fen' | 'resign' | 'rematch_request' | 'rematch_accept' | 'rematch_decline';
  from?: string;
  to?: string;
  to2?: string; // For split moves
  promotion?: string;
  collapseSeed?: number;
  fen?: string;
  gameState?: string;
  color?: 'white' | 'black'; // For resign message
}

interface UseChessGameOptions {
  serverUrl: string;
}

export function useChessGame({ serverUrl }: UseChessGameOptions) {
  const [gameState, setGameState] = useState<QuantumGameState | null>(null);
  const [playerColor, setPlayerColor] = useState<Player>('white');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCollapse, setLastCollapse] = useState<CollapseResult | null>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitFrom, setSplitFrom] = useState<Square | null>(null);
  const [splitTo1, setSplitTo1] = useState<Square | null>(null);

  // Rematch state
  const [rematchRequested, setRematchRequested] = useState(false); // We sent a request
  const [rematchReceived, setRematchReceived] = useState(false);   // We received a request

  const connectionRef = useRef<WebRTCConnection | null>(null);

  // Handle incoming P2P messages
  const handleMessage = useCallback((data: unknown) => {
    const message = data as GameMessage;
    console.log('[Game] Received:', message.type);

    switch (message.type) {
      case 'move':
        if (message.from && message.to) {
          // Get current state to compute result outside of setState
          setGameState(prev => {
            if (!prev) return prev;
            const result = makeMove(
              prev,
              message.from as Square,
              message.to as Square,
              message.promotion as PieceSymbol | undefined,
              message.collapseSeed
            );
            if (!result.success) {
              console.error('[Game] Invalid move from peer:', result.error);
              return prev;
            }
            // Set collapse result outside setState to avoid batching issues
            if (result.collapseResult) {
              setTimeout(() => setLastCollapse(result.collapseResult!), 0);
            }
            return result.newState;
          });
        }
        break;

      case 'split':
        if (message.from && message.to && message.to2) {
          setGameState(prev => {
            if (!prev) return prev;
            const result = makeSplitMove(
              prev,
              message.from as Square,
              message.to as Square,
              message.to2 as Square
            );
            if (!result.success) {
              console.error('[Game] Invalid split from peer:', result.error);
              return prev;
            }
            return result.newState;
          });
        }
        break;

      case 'fen':
        setGameState(prev => {
          if (!prev) return prev;
          if (prev.chess.fen() !== message.fen) {
            console.warn('[Game] FEN mismatch (expected with quantum moves)');
          }
          return prev;
        });
        break;

      case 'resign':
        // Opponent resigned - mark game over with their color
        setGameState(prev => {
          if (!prev) return prev;
          const winnerStatus = message.color === 'white' ? 'black_wins' : 'white_wins';
          return {
            ...prev,
            gameStatus: winnerStatus as typeof prev.gameStatus,
            result: winnerStatus,
            resultReason: 'resignation'
          };
        });
        break;

      case 'rematch_request':
        // Opponent wants a rematch
        console.log('[Game] Rematch request received');
        setRematchReceived(true);
        break;

      case 'rematch_accept':
        // Opponent accepted our rematch request - start new game
        console.log('[Game] Rematch accepted!');
        setRematchRequested(false);
        setRematchReceived(false);
        // Reset game state with swapped colors
        setPlayerColor(prev => prev === 'white' ? 'black' : 'white');
        setGameState(createGame(true, maxSuperpositionsRef.current));
        break;

      case 'rematch_decline':
        // Opponent declined our rematch request
        console.log('[Game] Rematch declined');
        setRematchRequested(false);
        break;
    }
  }, []);

  // Track maxSuperpositions setting
  const maxSuperpositionsRef = useRef(2);

  // Handle game seed (create initial game with quantum mode ON)
  const handleGameSeed = useCallback((_seed: number) => {
    console.log('[Game] Starting new QUANTUM game with maxSuperpositions:', maxSuperpositionsRef.current);
    setGameState(createGame(true, maxSuperpositionsRef.current)); // Quantum mode enabled!
  }, []);

  // Create a new room
  const createRoom = useCallback(async (maxSuperpositions: number = 2) => {
    try {
      maxSuperpositionsRef.current = maxSuperpositions;
      setError(null);
      const response = await fetch(`${serverUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: Date.now(), maxSuperpositions })
      });

      if (!response.ok) throw new Error('Failed to create room');

      const data = await response.json();
      setRoomId(data.room_id);
      setPlayerColor(data.player_color as Player);

      connectionRef.current = new WebRTCConnection({
        onStateChange: setConnectionState,
        onMessage: handleMessage,
        onGameSeed: handleGameSeed
      });

      await connectionRef.current.connect(serverUrl, data.room_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  }, [serverUrl, handleMessage, handleGameSeed]);

  // Join an existing room
  const joinRoom = useCallback(async (targetRoomId: string) => {
    try {
      setError(null);
      const response = await fetch(`${serverUrl}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: targetRoomId, seed: Date.now() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to join room');
      }

      const data = await response.json();
      setRoomId(data.room_id);
      setPlayerColor(data.player_color as Player);
      // Get maxSuperpositions from room data (default 2)
      const maxSup = data.max_superpositions ?? 2;
      maxSuperpositionsRef.current = maxSup;
      setGameState(createGame(true, maxSup));

      connectionRef.current = new WebRTCConnection({
        onStateChange: setConnectionState,
        onMessage: handleMessage,
        onGameSeed: handleGameSeed
      });

      await connectionRef.current.connect(serverUrl, data.room_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  }, [serverUrl, handleMessage, handleGameSeed]);

  // Execute a classical move
  const executeMove = useCallback((from: Square, to: Square, promotion?: string): boolean => {
    if (!gameState) return false;

    // Generate a seed for collapse (for P2P determinism)
    const collapseSeed = Math.floor(Math.random() * 0x7FFFFFFF);

    const result = makeMove(gameState, from, to, promotion as PieceSymbol | undefined, collapseSeed);
    if (!result.success) {
      console.error('[Game] Invalid move:', result.error);
      return false;
    }

    if (result.collapseResult) {
      setLastCollapse(result.collapseResult);
    }

    setGameState(result.newState);

    // Send move to peer with collapse seed
    connectionRef.current?.send({ type: 'move', from, to, promotion, collapseSeed });
    connectionRef.current?.send({ type: 'fen', fen: result.newState.chess.fen() });

    // Reset split mode
    setSplitMode(false);
    setSplitFrom(null);
    setSplitTo1(null);

    return true;
  }, [gameState]);

  // Execute a QUANTUM SPLIT move
  const executeSplitMove = useCallback((from: Square, to1: Square, to2: Square): boolean => {
    if (!gameState) return false;

    const result = makeSplitMove(gameState, from, to1, to2);
    if (!result.success) {
      console.error('[Game] Invalid split move:', result.error);
      setError(result.error || 'Invalid split move');
      return false;
    }

    setGameState(result.newState);

    // Send split to peer
    connectionRef.current?.send({ type: 'split', from, to: to1, to2 });

    // Reset split mode
    setSplitMode(false);
    setSplitFrom(null);
    setSplitTo1(null);

    return true;
  }, [gameState]);

  // Toggle split mode
  const toggleSplitMode = useCallback(() => {
    setSplitMode(prev => !prev);
    setSplitFrom(null);
    setSplitTo1(null);
  }, []);

  // Handle split mode selection
  const handleSplitSelection = useCallback((square: Square): 'from' | 'to1' | 'complete' | 'cancelled' => {
    if (!splitFrom) {
      setSplitFrom(square);
      return 'from';
    } else if (!splitTo1) {
      setSplitTo1(square);
      return 'to1';
    } else {
      // Third click completes the split
      const success = executeSplitMove(splitFrom, splitTo1, square);
      if (success) {
        return 'complete';
      } else {
        setSplitMode(false);
        setSplitFrom(null);
        setSplitTo1(null);
        return 'cancelled';
      }
    }
  }, [splitFrom, splitTo1, executeSplitMove]);

  // Toggle quantum mode
  const toggleQuantumMode = useCallback(() => {
    if (!gameState) return;
    setGameState(setEngineQuantumMode(gameState, !gameState.quantumMode));
  }, [gameState]);

  // Resign the game
  const resign = useCallback(() => {
    if (!gameState || !connectionRef.current) return;

    // Send resign message to opponent
    connectionRef.current.send({
      type: 'resign',
      color: playerColor
    });

    // Update local game state - must update gameStatus for isGameOver to work
    const winnerStatus = playerColor === 'white' ? 'black_wins' : 'white_wins';
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        gameStatus: winnerStatus as typeof prev.gameStatus,
        result: winnerStatus,
        resultReason: 'resignation'
      };
    });
  }, [gameState, playerColor]);

  // Disconnect
  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    setConnectionState('disconnected');
    setRoomId(null);
    setGameState(null);
    setSplitMode(false);
    setSplitFrom(null);
    setSplitTo1(null);
    setRematchRequested(false);
    setRematchReceived(false);
  }, []);

  // Request a rematch
  const requestRematch = useCallback(() => {
    if (!connectionRef.current) return;
    console.log('[Game] Sending rematch request');
    connectionRef.current.send({ type: 'rematch_request' });
    setRematchRequested(true);
  }, []);

  // Accept a rematch request
  const acceptRematch = useCallback(() => {
    if (!connectionRef.current) return;
    console.log('[Game] Accepting rematch');
    connectionRef.current.send({ type: 'rematch_accept' });
    setRematchReceived(false);
    setRematchRequested(false);
    // Reset game state with swapped colors
    setPlayerColor(prev => prev === 'white' ? 'black' : 'white');
    setGameState(createGame(true, maxSuperpositionsRef.current));
  }, []);

  // Decline a rematch request
  const declineRematch = useCallback(() => {
    if (!connectionRef.current) return;
    console.log('[Game] Declining rematch');
    connectionRef.current.send({ type: 'rematch_decline' });
    setRematchReceived(false);
  }, []);

  useEffect(() => {
    return () => { connectionRef.current?.disconnect(); };
  }, []);

  return {
    // State
    gameState, playerColor, connectionState, roomId, error,
    isMyTurn: gameState?.currentPlayer === playerColor,
    isConnected: connectionState === 'connected',
    isGameOver: gameState ? isGameOver(gameState) : false,
    quantumMode: gameState?.quantumMode ?? false,
    lastCollapse,

    // Split mode state
    splitMode,
    splitFrom,
    splitTo1,

    // Rematch state
    rematchRequested,
    rematchReceived,

    // Actions
    createRoom, joinRoom, executeMove, executeSplitMove, disconnect,
    toggleSplitMode, handleSplitSelection, toggleQuantumMode, resign,
    requestRematch, acceptRematch, declineRematch
  };
}

