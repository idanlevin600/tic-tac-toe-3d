//src/App.js
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TicTacToeBoard from './TicTacToeBoard';
import RaycasterHandler from './RaycasterHandler';

const App = () => {
  const initialState = Array(6).fill().map(() => Array(9).fill(null));
  const [gameState, setGameState] = useState(initialState);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);

  const handleCellDoubleClick = (face, cell) => {
    if (gameState[face][cell] !== null || winner) return;

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

    const { winningPlayer, winningCells } = checkCubeWin(newGameState);
    if (winningPlayer) {
      setWinner(winningPlayer);
      setWinningCells(winningCells);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const checkFaceWin = (board) => {
    const lines = [
      // Rows
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      // Columns
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      // Diagonals
      [0, 4, 8], [2, 4, 6]
    ];

    const triples = [];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        triples.push(line);
      }
    }
    return triples;
  };

  const checkCubeWin = (gameState) => {
    let triplesX = 0;
    let triplesO = 0;
    let winningCellsX = [];
    let winningCellsO = [];

    for (let face = 0; face < 6; face++) {
      const triples = checkFaceWin(gameState[face]);
      triples.forEach(line => {
        if (gameState[face][line[0]] === 'X') {
          triplesX++;
          winningCellsX.push(...line.map(cell => ({ face, cell })));
        } else if (gameState[face][line[0]] === 'O') {
          triplesO++;
          winningCellsO.push(...line.map(cell => ({ face, cell })));
        }
      });
    }

    if (triplesX >= 3) {
      return { winningPlayer: 'X', winningCells: winningCellsX };
    }
    if (triplesO >= 3) {
      return { winningPlayer: 'O', winningCells: winningCellsO };
    }

    return { winningPlayer: null, winningCells: [] };
  };

  const isCornerCell = (face, cell) => {
    const corners = {
      0: [0, 1, 2, 3, 5, 6, 7, 8],
      1: [0, 1, 2, 3, 5, 6, 7, 8],
      2: [0, 1, 2, 3, 5, 6, 7, 8],
      3: [0, 1, 2, 3, 5, 6, 7, 8],
      4: [0, 1, 2, 3, 5, 6, 7, 8],
      5: [0, 1, 2, 3, 5, 6, 7, 8],
    };
    return corners[face].includes(cell);
  };

  const getAdjacentCells = (face, cell) => {
    const adjacentMap = {
      '0-0': [[4, 6], [3, 2]],
      '0-1': [[4, 7]],
      '0-2': [[4, 8], [2, 0]],
      '0-3': [[3, 5]],
      '0-5': [[2, 3]],
      '0-6': [[5, 0], [3, 8]],
      '0-7': [[5, 1]],
      '0-8': [[5, 2], [2, 6]],
      '1-0': [[2, 2], [4, 2]],
      '1-1': [[4, 1]],
      '1-2': [[4, 0], [3, 0]],
      '1-3': [[2, 5]],
      '1-5': [[3, 3]],
      '1-6': [[2, 8], [5, 8]],
      '1-7': [[5, 7]],
      '1-8': [[5, 6], [3, 6]],
      '2-0': [[4, 8], [0, 2]],
      '2-1': [[4, 5]],
      '2-2': [[1, 0], [4, 2]],
      '2-3': [[0, 5]],
      '2-5': [[1, 3]],
      '2-6': [[5, 2], [0, 8]],
      '2-7': [[5, 5]],
      '2-8': [[1, 6], [5, 8]],
      '3-0': [[4, 0], [1, 2]],
      '3-1': [[4, 3]],
      '3-2': [[0, 0], [4, 6]],
      '3-3': [[1, 5]],
      '3-5': [[0, 3]],
      '3-6': [[5, 6], [1, 8]],
      '3-7': [[5, 3]],
      '3-8': [[0, 6], [5, 0]],
      '4-0': [[3, 0], [1, 2]],
      '4-1': [[1, 1]],
      '4-2': [[2, 2], [1, 0]],
      '4-3': [[3, 1]],
      '4-5': [[2, 1]],
      '4-6': [[0, 0], [3, 2]],
      '4-7': [[0, 1]],
      '4-8': [[0, 2], [2, 0]],
      '5-0': [[0, 6], [3, 8]],
      '5-1': [[0, 7]],
      '5-2': [[2, 6], [0, 8]],
      '5-3': [[3, 7]],
      '5-5': [[2, 7]],
      '5-6': [[1, 8], [3, 6]],
      '5-7': [[1, 7]],
      '5-8': [[2, 8], [1, 6]],
    };
    return adjacentMap[`${face}-${cell}`] || [];
  };

  const resetGame = () => {
    setGameState(initialState);
    setCurrentPlayer('X');
    setWinner(null);
    setWinningCells([]);
  };

  return (
    <>
      <button onClick={resetGame}>Reset Game</button>
      {winner && <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: '2rem', color: 'red' }}>Player {winner} wins!</div>}
      <Canvas style={{ height: '100vh' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <group>
          {gameState.map((board, idx) => (
            <TicTacToeBoard
              key={idx}
              face={idx}
              board={board}
              position={getBoardPosition(idx)}
              rotation={getBoardRotation(idx)}
              onCellDoubleClick={handleCellDoubleClick}
              winningCells={winningCells.filter(cell => cell.face === idx).map(cell => cell.cell)}
            />
          ))}
        </group>
        <OrbitControls />
        <RaycasterHandler onCellDoubleClick={handleCellDoubleClick} />
      </Canvas>
    </>
  );
};

const getBoardPosition = (idx) => {
  const positions = [
    [0, 0, 1.5], [0, 0, -1.5],
    [1.5, 0, 0], [-1.5, 0, 0],
    [0, 1.5, 0], [0, -1.5, 0],
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
