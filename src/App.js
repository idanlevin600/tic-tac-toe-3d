import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TicTacToeBoard from './TicTacToeBoard';

const App = () => {
  const initialState = Array(6).fill().map(() => Array(9).fill(null));
  const [gameState, setGameState] = useState(initialState);
  const [currentPlayer, setCurrentPlayer] = useState('X');

  const handleCellClick = (face, cell) => {
    if (gameState[face][cell] !== null) return;

    console.log(`Cell clicked: Face ${face}, Cell ${cell}`);

    let newGameState = gameState.map((board, idx) => {
      if (idx === face) {
        const newBoard = [...board];
        newBoard[cell] = currentPlayer;
        return newBoard;
      }
      return board;
    });

    if (isCornerCell(face, cell)) {
      const adjacentCells = getAdjacentCells(face, cell);
      adjacentCells.forEach(([adjFace, adjCell]) => {
        newGameState = newGameState.map((board, idx) => {
          if (idx === adjFace) {
            const newBoard = [...board];
            newBoard[adjCell] = currentPlayer;
            return newBoard;
          }
          return board;
        });
      });
    }

    setGameState(newGameState);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');

    // Check for win or draw
    checkWin(newGameState);
  };

  const isCornerCell = (face, cell) => {
    // Define corner cells for each face
    const corners = {
      0: [0, 1 ,2 ,3 ,5 ,6 ,7 , 8],
      1: [0, 1 ,2 ,3 ,5 ,6 ,7 , 8],
      2: [0, 1 ,2 ,3 ,5 ,6 ,7 , 8],
      3: [0, 1 ,2 ,3 ,5 ,6 ,7 , 8],
      4: [0, 1 ,2 ,3 ,5 ,6 ,7 , 8],
      5: [0, 1 ,2 ,3 ,5 ,6 ,7 , 8],
    };
    return corners[face].includes(cell);
  };

  const getAdjacentCells = (face, cell) => {
    // Define adjacent cells for each corner cell
    const adjacentMap = {
      '0-0': [[4, 6], [3, 2]],
      '0-2': [[4, 8], [2, 0]],
      '0-5': [[2, 3]],
      '0-7': [[5, 1]],
      '0-6': [[5, 0], [3, 8]],
      '0-8': [[5, 2], [2, 6]],
      '1-0': [[2, 2], [4, 2]],
      '1-2': [[4, 0], [3, 0]],
      '1-6': [[2, 8], [5, 8]],
      '1-8': [[5, 6], [3, 6]],
      '2-0': [[4, 8], [0, 2]],
      '2-2': [[1, 0], [4, 2]],
      '2-6': [[5, 2], [0, 8]],
      '2-8': [[1, 6], [5, 8]],
      '3-0': [[4, 0], [1, 2]],
      '3-2': [[0, 0], [4, 6]],
      '3-6': [[5, 6], [1, 8]],
      '3-8': [[0, 6], [5, 0]],
      '4-0': [[0, 6], [1, 2]],
      '4-2': [[2, 2], [1, 0]],
      '4-6': [[0, 0], [3, 2]],
      '4-8': [[0, 2], [2, 0]],
      '5-0': [[0, 6], [3, 8]],
      '5-2': [[2, 6], [0, 8]],
      '5-6': [[1, 8], [3, 6]],
      '5-8': [[2, 8], [1, 6]],
    };
    return adjacentMap[`${face}-${cell}`] || [];
  };

  const checkWin = (gameState) => {
    // Add your win checking logic here
  };

  const resetGame = () => {
    setGameState(initialState);
    setCurrentPlayer('X');
  };

  return (
    <>
      <button onClick={resetGame}>Reset Game</button>
      <Canvas style={{ height: '100vh' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
          {gameState.map((board, idx) => (
            <TicTacToeBoard
              key={idx}
              face={idx}
              board={board}
              position={getBoardPosition(idx)}
              rotation={getBoardRotation(idx)}
              onCellClick={handleCellClick}
            />
          ))}
        </mesh>
        <OrbitControls />
      </Canvas>
    </>
  );
};

const getBoardPosition = (idx) => {
  const positions = [
    [0, 0, 0.51], [0, 0, -0.51],
    [0.51, 0, 0], [-0.51, 0, 0],
    [0, 0.51, 0], [0, -0.51, 0],
  ];
  return positions[idx];
};

const getBoardRotation = (idx) => {
  const rotations = [
    [0, 0, 0], [0, Math.PI, 0],
    [0, Math.PI / 2, 0], [0, -Math.PI / 2, 0],
    [-Math.PI / 2, 0, 0], [Math.PI / 2, 0, 0],
  ];
  return rotations[idx];
};

export default App;
