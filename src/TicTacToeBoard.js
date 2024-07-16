//src/TicTacToeBoard.js
import React from 'react';
import { extend } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

extend({ Line_: Line });

const TicTacToeBoard = ({ face, board, position, rotation, onCellDoubleClick, winningCells }) => {
  const renderCell = (cell, idx) => {
    const isWinningCell = winningCells.includes(idx);
    return (
      <group key={idx} position={getCellPosition(idx)}>
        <mesh
          userData={{ face, cell: idx }}
          onDoubleClick={(e) => {
            onCellDoubleClick(face, idx);
            e.stopPropagation();
          }}
        >
          <boxGeometry args={[1, 1, 0.1]} />
          <meshBasicMaterial color={isWinningCell ? 'lightgreen' : cell ? (cell === 'X' ? 'red' : 'blue') : 'white'} />
        </mesh>
      </group>
    );
  };

  const renderCellBorders = () => {
    const lines = [];
    const lineMaterial = new THREE.LineBasicMaterial({ color: 'black' });
    const halfSize = 1.5;

    // Create vertical lines
    for (let i = -1; i <= 1; i++) {
      lines.push(
        <line key={`v-${i}`} position={[0, 0, 0.06]}>
          <bufferGeometry>
            <bufferAttribute
              attachObject={['attributes', 'position']}
              array={new Float32Array([i, -halfSize, 0, i, halfSize, 0])}
              itemSize={3}
              count={2}
            />
          </bufferGeometry>
          <primitive attach="material" object={lineMaterial} />
        </line>
      );
    }

    // Create horizontal lines
    for (let j = -1; j <= 1; j++) {
      lines.push(
        <line key={`h-${j}`} position={[0, 0, 0.06]}>
          <bufferGeometry>
            <bufferAttribute
              attachObject={['attributes', 'position']}
              array={new Float32Array([-halfSize, j, 0, halfSize, j, 0])}
              itemSize={3}
              count={2}
            />
          </bufferGeometry>
          <primitive attach="material" object={lineMaterial} />
        </line>
      );
    }

    return lines;
  };

  return (
    <group position={position} rotation={rotation}>
      {board.map((cell, idx) => renderCell(cell, idx))}
      {renderCellBorders()}
    </group>
  );
};

const getCellPosition = (idx) => {
  const x = (idx % 3) - 1;
  const y = 1 - Math.floor(idx / 3);
  return [x * 1, y * 1, 0];
};

export default TicTacToeBoard;
