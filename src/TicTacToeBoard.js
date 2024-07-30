import React, { useState } from "react";
import { extend } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

extend({ Line_: Line });

const getAdjacentCells = (face, cell) => {
  const adjacentMap = {
    "0-0": [
      [4, 6],
      [3, 2],
    ],
    "0-1": [[4, 7]],
    "0-2": [
      [4, 8],
      [2, 0],
    ],
    "0-3": [[3, 5]],
    "0-5": [[2, 3]],
    "0-6": [
      [5, 0],
      [3, 8],
    ],
    "0-7": [[5, 1]],
    "0-8": [
      [5, 2],
      [2, 6],
    ],
    "1-0": [
      [2, 2],
      [4, 2],
    ],
    "1-1": [[4, 1]],
    "1-2": [
      [4, 0],
      [3, 0],
    ],
    "1-3": [[2, 5]],
    "1-5": [[3, 3]],
    "1-6": [
      [2, 8],
      [5, 8],
    ],
    "1-7": [[5, 7]],
    "1-8": [
      [5, 6],
      [3, 6],
    ],
    "2-0": [
      [4, 8],
      [0, 2],
    ],
    "2-1": [[4, 5]],
    "2-2": [
      [1, 0],
      [4, 2],
    ],
    "2-3": [[0, 5]],
    "2-5": [[1, 3]],
    "2-6": [
      [5, 2],
      [0, 8],
    ],
    "2-7": [[5, 5]],
    "2-8": [
      [1, 6],
      [5, 8],
    ],
    "3-0": [
      [4, 0],
      [1, 2],
    ],
    "3-1": [[4, 3]],
    "3-2": [
      [0, 0],
      [4, 6],
    ],
    "3-3": [[1, 5]],
    "3-5": [[0, 3]],
    "3-6": [
      [5, 6],
      [1, 8],
    ],
    "3-7": [[5, 3]],
    "3-8": [
      [0, 6],
      [5, 0],
    ],
    "4-0": [
      [3, 0],
      [1, 2],
    ],
    "4-1": [[1, 1]],
    "4-2": [
      [2, 2],
      [1, 0],
    ],
    "4-3": [[3, 1]],
    "4-5": [[2, 1]],
    "4-6": [
      [0, 0],
      [3, 2],
    ],
    "4-7": [[0, 1]],
    "4-8": [
      [0, 2],
      [2, 0],
    ],
    "5-0": [
      [0, 6],
      [3, 8],
    ],
    "5-1": [[0, 7]],
    "5-2": [
      [2, 6],
      [0, 8],
    ],
    "5-3": [[3, 7]],
    "5-5": [[2, 7]],
    "5-6": [
      [1, 8],
      [3, 6],
    ],
    "5-7": [[1, 7]],
    "5-8": [
      [2, 8],
      [1, 6],
    ],
  };
  return adjacentMap[`${face}-${cell}`] || [];
};

const TicTacToeBoard = ({
  face,
  board,
  position,
  rotation,
  onCellClick,
  winningCells,
  bombMode,
  bombCells,
  highlightedCells,
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredFace, setHoveredFace] = useState(null);

  const renderCell = (cell, idx) => {
    const isWinningCell = winningCells.includes(idx);
    const isSelectedForBomb = bombCells.some(
      (bc) => bc.face === face && bc.cell === idx
    );
    const isHighlightedCell = highlightedCells.some(
      (hc) => hc.face === face && hc.cell === idx
    );

    const isHovered = hoveredFace === face && hoveredCell === idx;
    const adjacentCells =
      hoveredFace !== null && hoveredCell !== null
        ? getAdjacentCells(hoveredFace, hoveredCell)
        : [];
    const isAdjacentHovered = adjacentCells.some(
      ([adjFace, adjCell]) => adjFace === face && adjCell === idx
    );

    return (
      <group key={idx} position={getCellPosition(idx)}>
        <mesh
          userData={{ face, cell: idx }}
          onPointerOver={(e) => {
            setHoveredCell(idx);
            setHoveredFace(face);
            e.stopPropagation();
          }}
          onPointerOut={(e) => {
            setHoveredCell(null);
            setHoveredFace(null);
            e.stopPropagation();
          }}
          onDoubleClick={(e) => {
            // Change this line
            onCellClick(face, idx);
            e.stopPropagation();
          }}
        >
          <boxGeometry args={[1, 1, 0.1]} />
          <meshBasicMaterial
            color={
              (isHovered || isAdjacentHovered) && cell === null
                ? "#8c8a89"
                : isSelectedForBomb || isHighlightedCell
                ? "#ff64ab"
                : isWinningCell
                ? "#40ff00"
                : cell
                ? cell === "X"
                  ? "#9a8eff"
                  : "#00ffc1"
                : "white"
            }
          />
        </mesh>
      </group>
    );
  };

  const renderCellBorders = () => {
    const lines = [];
    const lineMaterial = new THREE.LineBasicMaterial({ color: "black" });
    const halfSize = 1.5;

    // Create vertical lines
    for (let i = -1; i <= 1; i++) {
      lines.push(
        <line key={`v-${i}`} position={[0, 0, 0.06]}>
          <bufferGeometry>
            <bufferAttribute
              attachObject={["attributes", "position"]}
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
              attachObject={["attributes", "position"]}
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
