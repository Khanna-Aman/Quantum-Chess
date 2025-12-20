/**
 * Full-screen Floating Chess Pieces Animation
 * Ambient particles and chess pieces drifting across the screen
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Floating piece configuration
interface FloatingPiece {
  id: number;
  type: 'queen' | 'knight' | 'rook' | 'bishop' | 'pawn';
  color: 'white' | 'black';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  scale: number;
  opacity: number;
  isQuantum: boolean;
  quantumPhase: number;
}

const PIECE_COUNT = 12;
const BOUNDS = { x: 15, y: 8, z: 10 };

export function QuantumChessScene() {
  // Generate floating pieces
  const pieces = useMemo<FloatingPiece[]>(() => {
    const types: FloatingPiece['type'][] = ['queen', 'knight', 'rook', 'bishop', 'pawn'];
    const colors: FloatingPiece['color'][] = ['white', 'black'];

    return Array.from({ length: PIECE_COUNT }, (_, i) => ({
      id: i,
      type: types[Math.floor(Math.random() * types.length)]!,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * BOUNDS.x * 2,
        (Math.random() - 0.5) * BOUNDS.y * 2,
        (Math.random() - 0.5) * BOUNDS.z - 5
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.1
      ),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.3
      ),
      scale: 0.4 + Math.random() * 0.6,
      opacity: 0.3 + Math.random() * 0.4,
      isQuantum: Math.random() > 0.6,
      quantumPhase: Math.random() * Math.PI * 2,
    }));
  }, []);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />
      <pointLight position={[-5, 5, 0]} intensity={0.3} color="#667eea" />
      <pointLight position={[5, -5, 0]} intensity={0.2} color="#f093fb" />

      {/* Floating particles background */}
      <FloatingParticles />

      {/* Floating chess pieces */}
      {pieces.map((piece) => (
        <FloatingChessPiece key={piece.id} piece={piece} />
      ))}
    </>
  );
}

// Individual floating piece with animation
function FloatingChessPiece({ piece }: { piece: FloatingPiece }) {
  const meshRef = useRef<THREE.Group>(null);
  const ghostRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update position with wrapping
    piece.position.add(piece.velocity.clone().multiplyScalar(delta));

    // Wrap around bounds
    if (piece.position.x > BOUNDS.x) piece.position.x = -BOUNDS.x;
    if (piece.position.x < -BOUNDS.x) piece.position.x = BOUNDS.x;
    if (piece.position.y > BOUNDS.y) piece.position.y = -BOUNDS.y;
    if (piece.position.y < -BOUNDS.y) piece.position.y = BOUNDS.y;

    meshRef.current.position.copy(piece.position);
    meshRef.current.rotation.x += piece.rotationSpeed.x * delta;
    meshRef.current.rotation.y += piece.rotationSpeed.y * delta;

    // Quantum shimmer effect
    if (piece.isQuantum && ghostRef.current) {
      const shimmer = Math.sin(state.clock.elapsedTime * 3 + piece.quantumPhase) * 0.5 + 0.5;
      ghostRef.current.position.x = Math.sin(state.clock.elapsedTime * 2 + piece.quantumPhase) * 0.3;
      ghostRef.current.position.y = Math.cos(state.clock.elapsedTime * 2 + piece.quantumPhase) * 0.2;
      (ghostRef.current.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: piece.color === 'white' ? '#f5f5f5' : '#333',
        transparent: true,
        opacity: shimmer * 0.3,
      });
    }
  });

  const baseColor = piece.color === 'white' ? '#f5f5f5' : '#1a1a1a';

  return (
    <group ref={meshRef} scale={piece.scale}>
      {/* Main piece */}
      <PieceGeometry type={piece.type} color={baseColor} opacity={piece.opacity} />

      {/* Quantum ghost duplicate */}
      {piece.isQuantum && (
        <group ref={ghostRef}>
          <PieceGeometry type={piece.type} color="#667eea" opacity={0.2} />
        </group>
      )}

      {/* Quantum glow */}
      {piece.isQuantum && (
        <mesh>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#667eea" transparent opacity={0.1} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// Simple piece geometry based on type
function PieceGeometry({ type, color, opacity }: { type: string; color: string; opacity: number }) {
  const mat = <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.3} />;

  switch (type) {
    case 'queen':
      return (
        <group>
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.25, 0.35, 0.4, 16]} />{mat}</mesh>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.15, 0.25, 0.4, 16]} />{mat}</mesh>
          <mesh position={[0, 1, 0]}><sphereGeometry args={[0.15, 16, 16]} />{mat}</mesh>
          <mesh position={[0, 1.15, 0]}><coneGeometry args={[0.06, 0.12, 8]} /><meshStandardMaterial color="#ffd700" transparent opacity={opacity} /></mesh>
        </group>
      );
    case 'knight':
      return (
        <group>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.25, 0.3, 0.3, 16]} />{mat}</mesh>
          <mesh position={[0.05, 0.5, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.12, 0.18, 0.3, 16]} />{mat}</mesh>
          <mesh position={[0.12, 0.75, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.18, 0.28, 0.15]} />{mat}</mesh>
        </group>
      );
    case 'rook':
      return (
        <group>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.3, 0.35, 0.4, 16]} />{mat}</mesh>
          <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.22, 0.28, 0.3, 16]} />{mat}</mesh>
          <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.35, 0.15, 0.35]} />{mat}</mesh>
        </group>
      );
    case 'bishop':
      return (
        <group>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.25, 0.3, 0.3, 16]} />{mat}</mesh>
          <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.2, 16, 16]} />{mat}</mesh>
          <mesh position={[0, 0.8, 0]}><coneGeometry args={[0.12, 0.25, 16]} />{mat}</mesh>
        </group>
      );
    default: // pawn
      return (
        <group>
          <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.2, 0.25, 0.2, 16]} />{mat}</mesh>
          <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.12, 0.18, 0.2, 16]} />{mat}</mesh>
          <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.12, 16, 16]} />{mat}</mesh>
        </group>
      );
  }
}

// Background floating particles
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;

      // Purple/blue gradient colors
      const t = Math.random();
      col[i * 3] = 0.4 + t * 0.3;     // R
      col[i * 3 + 1] = 0.3 + t * 0.2; // G
      col[i * 3 + 2] = 0.9;           // B
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

