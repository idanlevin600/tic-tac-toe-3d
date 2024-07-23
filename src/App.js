import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TicTacToeBoard from './TicTacToeBoard';
import RaycasterHandler from './RaycasterHandler';
import bombIcon from './bomb.png'; // Make sure the path to the bomb image is correct
import GameModeModal from './GameModeModal'; // Import the new modal component

const MAX_DEPTH = 4; // Limit the depth of the Minimax algorithm

const App = () => {
  const initialState = Array(6).fill().map(() => Array(9).fill(null));
  const [gameState, setGameState] = useState(initialState);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [bombUsed, setBombUsed] = useState({ X: false, O: false });
  const [bombMode, setBombMode] = useState(false);
  const [bombCells, setBombCells] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [gameMode, setGameMode] = useState(null); // Add state for game mode
  const [modalOpen, setModalOpen] = useState(true); // Add state to control modal visibility

  const handleModalClose = (mode) => {
    console.log('Game mode selected:', mode);
    setGameMode(mode);
    setModalOpen(false);
    if (mode === 'single') {
      // AI makes the first move
      const [bestFace, bestCell] = findBestMove(initialState);
      handleCellClick(bestFace, bestCell);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered', { gameMode, currentPlayer, winner });
    if (gameMode === 'single' && currentPlayer === 'X' && !winner) {
      console.log('AI is making a move');
      const [bestFace, bestCell] = findBestMove(gameState);
      console.log('Best move found by AI:', { bestFace, bestCell });
      setTimeout(() => handleCellClick(bestFace, bestCell), 500); // Small delay to simulate thinking
    }
  }, [gameState, currentPlayer, gameMode, winner]);

  const handleCellClick = (face, cell) => {
    if (bombMode) {
      handleBombCellSelection(face, cell);
      return;
    }

    console.log('handleCellClick triggered', { face, cell, currentPlayer });
    if (winner || gameState[face][cell] !== null) return;

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
      console.log('Winner found:', winningPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // Optimized Minimax Algorithm with Alpha-Beta Pruning and Depth Limiting
  const findBestMove = (gameState) => {
    let bestVal = -Infinity;
    let bestMove = [-1, -1];

    for (let face = 0; face < 6; face++) {
      for (let cell = 0; cell < 9; cell++) {
        if (gameState[face][cell] === null) {
          gameState[face][cell] = 'X';
          let moveVal = minimax(gameState, 0, false, -Infinity, Infinity);
          gameState[face][cell] = null;
          if (moveVal > bestVal) {
            bestMove = [face, cell];
            bestVal = moveVal;
          }
        }
      }
    }
    console.log('findBestMove result:', { bestMove });
    return bestMove;
  };

  const minimax = (gameState, depth, isMaximizing, alpha, beta) => {
    const { winningPlayer } = checkCubeWin(gameState);
    if (winningPlayer === 'X') return 100 - depth;
    if (winningPlayer === 'O') return depth - 100;
    if (!isMovesLeft(gameState)) return 0;
    if (depth >= MAX_DEPTH) return evaluateBoard(gameState);

    if (isMaximizing) {
      let best = -Infinity;
      for (let face = 0; face < 6; face++) {
        for (let cell = 0; cell < 9; cell++) {
          if (gameState[face][cell] === null) {
            gameState[face][cell] = 'X';
            best = Math.max(best, minimax(gameState, depth + 1, false, alpha, beta));
            gameState[face][cell] = null;
            alpha = Math.max(alpha, best);
            if (beta <= alpha) return best;
          }
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let face = 0; face < 6; face++) {
        for (let cell = 0; cell < 9; cell++) {
          if (gameState[face][cell] === null) {
            gameState[face][cell] = 'O';
            best = Math.min(best, minimax(gameState, depth + 1, true, alpha, beta));
            gameState[face][cell] = null;
            beta = Math.min(beta, best);
            if (beta <= alpha) return best;
          }
        }
      }
      return best;
    }
  };

  const evaluateBoard = (gameState) => {
    let score = 0;
    const { winningPlayer } = checkCubeWin(gameState);
    if (winningPlayer === 'X') score += 100;
    if (winningPlayer === 'O') score -= 100;
  
    // Additional heuristic: count potential winning lines for both players
    for (let face = 0; face < 6; face++) {
      const lines = checkFaceWin(gameState[face]);
      lines.forEach(line => {
        const values = line.map(idx => gameState[face][idx]);
        const XCount = values.filter(v => v === 'X').length;
        const OCount = values.filter(v => v === 'O').length;
  
        // Reward AI for lines that are closer to completion
        if (XCount > 0 && OCount === 0) score += Math.pow(10, XCount);
        if (OCount > 0 && XCount === 0) score -= Math.pow(10, OCount);
        
        // Strongly penalize potential opponent wins
        if (OCount === 2 && XCount === 0) score -= 50;
      });
    }
  
    // Prioritize corners, middle edges, and center cells
    const cornerCells = [0, 2, 6, 8];
    const middleEdgeCells = [1, 3, 5, 7];
    const centerCell = [4];
  
    for (let face = 0; face < 6; face++) {
      cornerCells.forEach(cell => {
        if (gameState[face][cell] === 'X') score += 5;
        if (gameState[face][cell] === 'O') score -= 5;
      });
      middleEdgeCells.forEach(cell => {
        if (gameState[face][cell] === 'X') score += 3;
        if (gameState[face][cell] === 'O') score -= 3;
      });
      centerCell.forEach(cell => {
        if (gameState[face][cell] === 'X') score += 1;
        if (gameState[face][cell] === 'O') score -= 1;
      });
    }
  
    return score;
  };
  

  const isMovesLeft = (gameState) => {
    for (let face = 0; face < 6; face++) {
      for (let cell = 0; cell < 9; cell++) {
        if (gameState[face][cell] === null) return true;
      }
    }
    return false;
  };

  const handleBombClick = () => {
    if (bombUsed[currentPlayer] || winner) return;
    console.log(`${currentPlayer} is entering bomb mode`);
    setBombMode(true);
  };

  const handleBombCellSelection = (face, cell) => {
    if (bombCells.length >= 3) {
      setBombMode(false);
      setBombCells([]);
      setHighlightedCells([]);
      return;
    }

    const newBombCells = [...bombCells, { face, cell }];
    const newHighlightedCells = [...highlightedCells, { face, cell }];

    if (isCornerCell(face, cell)) {
      const adjacentCells = getAdjacentCells(face, cell);
      adjacentCells.forEach(([adjFace, adjCell]) => {
        newHighlightedCells.push({ face: adjFace, cell: adjCell });
      });
    }

    setBombCells(newBombCells);
    setHighlightedCells(newHighlightedCells);
    console.log(`Selected cells for bombing: ${JSON.stringify(newBombCells)}`);

    if (newBombCells.length === 3) {
      if (isValidTriple(newBombCells)) {
        explodeBomb(newHighlightedCells);
      } else {
        alert("Invalid triple selection. Please select a valid triple.");
        setBombCells([]);
        setHighlightedCells([]);
      }
    }
  };

  const isValidTriple = (cells) => {
    if (cells.length !== 3) return false;
    const faces = cells.map(c => c.face);
    const positions = cells.map(c => c.cell);
    const uniqueFaces = new Set(faces);
    if (uniqueFaces.size !== 1) return false;
    const face = faces[0];
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]  // Diagonals
    ];
    return lines.some(line => line.every(pos => positions.includes(pos)));
  };

  const explodeBomb = (cells) => {
    let newGameState = gameState.map((board, faceIdx) => {
      if (cells.some(c => c.face === faceIdx)) {
        const newBoard = [...board];
        cells.filter(c => c.face === faceIdx).forEach(({ cell }) => {
          newBoard[cell] = null;
        });
        return newBoard;
      }
      return board;
    });

    setGameState(newGameState);
    setBombUsed({ ...bombUsed, [currentPlayer]: true });
    setBombMode(false);
    setBombCells([]);
    setHighlightedCells([]);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
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
    setBombUsed({ X: false, O: false });
    setBombMode(false);
    setBombCells([]);
    setHighlightedCells([]);
    setModalOpen(true); // Open the modal when resetting the game
  };

  return (
    <>
      <GameModeModal
        open={modalOpen}
        handleClose={handleModalClose}
        setGameMode={setGameMode}
      />
      <button onClick={resetGame}>Reset Game</button>
      {winner && <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', fontSize: '2rem', color: 'red' }}>Player {winner} wins!</div>}
      <div style={{ position: 'absolute', top: '10%', right: '10%', cursor: 'pointer', zIndex: 1 }}>
        {bombUsed['X'] ? null : <img src={bombIcon} alt="Bomb Icon X" style={{ width: 50, height: 50 }} onClick={() => { if (currentPlayer === 'X') handleBombClick(); }} />}
      </div>
      <div style={{ position: 'absolute', top: '10%', right: '20%', cursor: 'pointer', zIndex: 1 }}>
        {bombUsed['O'] ? null : <img src={bombIcon} alt="Bomb Icon O" style={{ width: 50, height: 50 }} onClick={() => { if (currentPlayer === 'O') handleBombClick(); }} />}
      </div>
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
              onCellClick={handleCellClick}
              winningCells={winningCells.filter(cell => cell.face === idx).map(cell => cell.cell)}
              bombMode={bombMode}
              bombCells={bombCells}
              highlightedCells={highlightedCells}
            />
          ))}
        </group>
        <OrbitControls />
        <RaycasterHandler onCellClick={handleCellClick} />
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
