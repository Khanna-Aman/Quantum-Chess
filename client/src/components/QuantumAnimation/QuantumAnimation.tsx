/**
 * Quantum Chess 3D Animation - Full Page Background
 * Floating chess pieces with quantum effects
 */

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { QuantumChessScene } from './QuantumChessScene';
import './QuantumAnimation.css';

export function QuantumAnimation() {
  return (
    <div className="quantum-animation-container">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        dpr={[1, 1.5]} // Limit DPR for performance
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={['#1a1a2e', 5, 25]} />
          <QuantumChessScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

