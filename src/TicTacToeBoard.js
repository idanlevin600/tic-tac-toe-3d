import React from 'react';
import { extend } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

extend({ Line_: Line });

const TicTacToeBoard = ({ face, board, position, rotation, onCellClick }) => {
  const renderCell = (cell, idx) => (
    <mesh
      key={idx}
      position={getCellPosition(idx)}
      onClick={() => onCellClick(face, idx)}
    >
      <boxGeometry args={[0.3, 0.3, 0.1]} />
      <meshBasicMaterial color={cell ? (cell === 'X' ? 'red' : 'blue') : 'white'} />
    </mesh>
  );

  return (
    <group position={position} rotation={rotation}>
      {renderGridLines()}
      {board.map((cell, idx) => renderCell(cell, idx))}
    </group>
  );
};

const getCellPosition = (idx) => {
  const x = (idx % 3) - 1;
  const y = 1 - Math.floor(idx / 3);
  return [x * 0.5, y * 0.5, 0];
};

const renderGridLines = () => {
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const positions = i < 2
      ? [-1.5, (i * 1.5) - 1.5, 0, 1.5, (i * 1.5) - 1.5, 0]
      : [(i % 2) * 3 - 1.5, -1.5, 0, (i % 2) * 3 - 1.5, 1.5, 0];
    lines.push(
      <line key={i} position={[0, 0, 0]}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attachObject={['attributes', 'position']}
            array={new Float32Array(positions)}
            itemSize={3}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="black" />
      </line>
    );
  }
  return lines;
};

export default TicTacToeBoard;
