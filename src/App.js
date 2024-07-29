import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TicTacToeBoard from './TicTacToeBoard';
import RaycasterHandler from './RaycasterHandler';
import bombIcon from './bomb.png'; // Make sure the path to the bomb image is correct
import GameModeModal from './GameModeModal'; // Import the new modal component

const MAX_DEPTH = 12; // Increase the depth limit

const App = () => {
  const initialState = Array(6).fill().map(() => Array(9).fill(null));
  const [gameState, setGameState] = useState(initialState);
  const [currentPlayer, setCurrentPlayer] = useState(null); // Start with no player
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [bombUsed, setBombUsed] = useState({ X: false, O: false });
  const [bombMode, setBombMode] = useState(false);
  const [bombCells, setBombCells] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [gameMode, setGameMode] = useState(null); // Set default game mode to null
  const [modalOpen, setModalOpen] = useState(true); // Add state to control modal visibility
  const [aiMovePending, setAiMovePending] = useState(false); // Flag to trigger AI move immediately
  const [bombPending, setBombPending] = useState(false); // Flag to trigger bomb usage

  const handleModalClose = (mode) => {
    console.log('Game mode selected:', mode);
    setGameMode(mode);
    setModalOpen(false);
    if (mode === 'single') {
      setCurrentPlayer('O'); // AI starts in single player mode
      setAiMovePending(true); // Trigger AI move if it's the computer's turn
    } else {
      setCurrentPlayer('X'); // Player X starts in multiplayer mode
    }
  };

  useEffect(() => {
    console.log('useEffect triggered', { gameMode, currentPlayer, winner });
    if (aiMovePending && currentPlayer === 'O') {
      console.log('AI is making a move');
      const bombDecision = shouldUseBomb(gameState);
      if (bombDecision.useBomb) {
        alert("AI wants to use the bomb!");
        setBombPending(true);
      } else {
        const [bestFace, bestCell] = findBestMove(gameState);
        console.log('Best move found by AI:', { bestFace, bestCell });
        setTimeout(() => handleCellClick(bestFace, bestCell), 500); // Small delay to simulate thinking
        setAiMovePending(false); // Reset the flag after AI makes its move
      }
    }
  }, [aiMovePending, currentPlayer, gameState]);

  useEffect(() => {
    if (bombPending) {
      const bombDecision = shouldUseBomb(gameState);
      handleBombUsage(bombDecision.bombCells);
      setBombPending(false);
      setAiMovePending(false);
      setCurrentPlayer('X'); // Switch back to player's turn after AI uses bomb
    }
  }, [bombPending]);

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
      if (currentPlayer === 'X' && gameMode === 'single') {
        setCurrentPlayer('O');
        setTimeout(() => setAiMovePending(true), 500); // Trigger AI move after a delay
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }
  };

  const shouldUseBomb = (gameState) => {
    if (bombUsed['O']) return { useBomb: false, bombCells: [] };

    let playerSequences = 0;
    let almostCompleteSequence = false;
    let completedSequences = [];
    let bombCells = [];

    for (let face = 0; face < 6; face++) {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
      ];

      for (let line of lines) {
        const values = line.map(idx => gameState[face][idx]);
        const XCount = values.filter(v => v === 'X').length;
        const nullCount = values.filter(v => v === null).length;

        if (XCount === 3) {
          playerSequences++;
          completedSequences.push(line.map(idx => ({ face, cell: idx })));
        }

        if (XCount === 2 && nullCount === 1) {
          almostCompleteSequence = true;
        }
      }
    }

    if (playerSequences >= 2 && almostCompleteSequence) {
      bombCells = completedSequences[0]; // Select one of the completed sequences
      return { useBomb: true, bombCells };
    }
    return { useBomb: false, bombCells: [] };
  };

  const handleBombUsage = (bombCells) => {
    let cellsToBomb = [...bombCells];
    bombCells.forEach(({ face, cell }) => {
      const adjacentCells = getAdjacentCells(face, cell);
      cellsToBomb = cellsToBomb.concat(adjacentCells.map(([adjFace, adjCell]) => ({ face: adjFace, cell: adjCell })));
    });

    let newGameState = gameState.map((board, faceIdx) => {
      if (cellsToBomb.some(c => c.face === faceIdx)) {
        const newBoard = [...board];
        cellsToBomb.filter(c => c.face === faceIdx).forEach(({ cell }) => {
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

    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    if (nextPlayer === 'O' && gameMode === 'single') {
      setTimeout(() => setAiMovePending(true), 500); // Trigger AI move after a delay
    }
  };

  const findBestMove = (gameState) => {
    let bestMove = [-1, -1];
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      bestMove = findBestMoveAtDepth(gameState, depth);
    }
    return bestMove;
  };

  const findBestMoveAtDepth = (gameState, maxDepth) => {
    let bestVal = -Infinity;
    let bestMove = [-1, -1];
    const moves = getAllPossibleMoves(gameState);

    for (let [face, cell] of moves) {
      gameState[face][cell] = 'O';
      let moveVal = minimax(gameState, 0, false, -Infinity, Infinity, maxDepth);
      gameState[face][cell] = null;
      if (moveVal > bestVal) {
        bestMove = [face, cell];
        bestVal = moveVal;
      }
    }
    return bestMove;
  };

  const getAllPossibleMoves = (gameState) => {
    const moves = [];
    for (let face = 0; face < 6; face++) {
      for (let cell = 0; cell < 9; cell++) {
        if (gameState[face][cell] === null) {
          moves.push([face, cell]);
        }
      }
    }
    // Move ordering: center, corners, edges
    const scoreCell = (cell) => {
      if (cell === 4) return 3; // Center
      if ([0, 2, 6, 8].includes(cell)) return 2; // Corners
      return 1; // Edges
    };
    moves.sort((a, b) => scoreCell(b[1]) - scoreCell(a[1]));
    return moves;
  };

  const transpositionTable = new Map();

  const minimax = (gameState, depth, isMaximizing, alpha, beta, maxDepth) => {
    const stateKey = JSON.stringify(gameState);
    if (transpositionTable.has(stateKey)) return transpositionTable.get(stateKey);

    const { winningPlayer } = checkCubeWin(gameState);
    if (winningPlayer === 'O') return 100 - depth;
    if (winningPlayer === 'X') return depth - 100;
    if (!isMovesLeft(gameState)) return 0;
    if (depth >= maxDepth) return evaluateBoard(gameState, depth);

    const moves = getAllPossibleMoves(gameState);

    let best;
    if (isMaximizing) {
      best = -Infinity;
      for (let [face, cell] of moves) {
        gameState[face][cell] = 'O';
        best = Math.max(best, minimax(gameState, depth + 1, false, 
                                      alpha, beta, maxDepth));
        gameState[face][cell] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break; // Prune remaining branches
      }
    } else {
      best = Infinity;
      for (let [face, cell] of moves) {
        gameState[face][cell] = 'X';
        best = Math.min(best, minimax(gameState, depth + 1, true, 
                                      alpha, beta, maxDepth));
        gameState[face][cell] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break; // Prune remaining branches
      }
    }

    transpositionTable.set(stateKey, best);
    return best;
  };

  const evaluateBoard = (gameState, depth) => {
    let score = 0;
    const { winningPlayer } = checkCubeWin(gameState);
    if (winningPlayer === 'O') return 100 - depth;
    if (winningPlayer === 'X') return depth - 100;

    // Additional heuristic: count potential winning lines for both players
    for (let face = 0; face < 6; face++) {
      const lines = checkFaceWin(gameState[face]);
      lines.forEach(line => {
        const values = line.map(idx => gameState[face][idx]);
        const OCount = values.filter(v => v === 'O').length;
        const XCount = values.filter(v => v === 'X').length;

        // Reward AI for lines that are closer to completion
        if (OCount > 0 && XCount === 0) score += Math.pow(10, OCount);
        if (XCount > 0 && OCount === 0) score -= Math.pow(10, XCount);

        // Strongly penalize potential opponent wins
        if (XCount === 2 && OCount === 0) score -= 1000; // Increase penalty for potential opponent wins
        if (XCount === 1 && OCount === 0) score -= 10; // Small penalty for potential opponent wins
      });
    }

    // Check for imminent wins and prioritize blocking them
    for (let face = 0; face < 6; face++) {
      for (let cell = 0; cell < 9; cell++) {
        if (gameState[face][cell] === null) {
          gameState[face][cell] = 'X';
          if (checkCubeWin(gameState).winningPlayer === 'X') {
            score -= 10000; // Large negative score to prioritize blocking
          }
          gameState[face][cell] = null;
        }
      }
    }

    // Prioritize corners, middle edges, and center cells
    const cornerCells = [0, 2, 6, 8];
    const middleEdgeCells = [1, 3, 5, 7];
    const centerCell = [4];

    for (let face = 0; face < 6; face++) {
      cornerCells.forEach(cell => {
        if (gameState[face][cell] === 'O') score += 5;
        if (gameState[face][cell] === 'X') score -= 5;
      });
      middleEdgeCells.forEach(cell => {
        if (gameState[face][cell] === 'O') score += 3;
        if (gameState[face][cell] === 'X') score -= 3;
      });
      centerCell.forEach(cell => {
        if (gameState[face][cell] === 'O') score += 1;
        if (gameState[face][cell] === 'X') score -= 1;
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

    if (newBombCells.length === 3) {
      if (isValidTriple(newBombCells)) {
        explodeBomb(newHighlightedCells);
        handleBombUsage(newBombCells); // Handle the bomb usage immediately after selection
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

    if (currentPlayer === 'X' && gameMode === 'single') {
      setTimeout(() => setAiMovePending(true), 500); // Trigger AI move after a delay
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
    setCurrentPlayer(null); // Reset the game with no player
    setWinner(null);
    setWinningCells([]);
    setBombUsed({ X: false, O: false });
    setBombMode(false);
    setBombCells([]);
    setHighlightedCells([]);
    setModalOpen(true); // Open the modal when resetting the game
    setAiMovePending(false); // Reset AI move pending flag
  };

  const getCurrentPlayerText = () => {
    if (currentPlayer === 'X') return "Purple's turn";
    if (currentPlayer === 'O') return "Green's turn";
    return null;
  };

  return (
    <>
      <GameModeModal
        open={modalOpen}
        handleClose={handleModalClose}
        setGameMode={setGameMode}
      />
      <div style={{ position: 'absolute', top: '1%', left: '50%', transform: 'translateX(-50%)' }}>
        <button onClick={resetGame} style={{ backgroundColor: '#ff64ab', fontSize: '1rem', padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', color:'white', fontWeight:'bold'  }}>
          Reset Game
        </button>
      </div>
      {winner && <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: '6rem', color: '#6bc9ff', fontWeight:'bold'}}>Player {winner} wins!</div>}
      {!winner && currentPlayer && (
        <div style={{ backgroundColor: '#ffba46',position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', fontSize: '2.8rem', borderRadius: '20px',padding: '8px 17px',color: 'white', fontWeight:'bold', fontFamily:'calibri' }}>
          {getCurrentPlayerText()}
        </div>
      )}
      <div style={{ position: 'absolute', top: '10%', left: '10%', cursor: 'pointer', zIndex: 1, textAlign: 'center' }}>
        <div style={{color:'#9a8eff', fontSize: '1.5em', fontWeight:'bold'}}>Purple's Bomb</div>
        {bombUsed['X'] ? null : <img src={bombIcon} alt="Bomb Icon X" style={{ width: 50, height: 50 }} onClick={() => { if (currentPlayer === 'X') handleBombClick(); }} />}
      </div>
      <div style={{ position: 'absolute', top: '10%', right: '10%', cursor: 'pointer', zIndex: 1, textAlign: 'center' }}>
        <div style={{color:'#00ffc1', fontSize: '1.5em', fontWeight:'bold'}}>Green's Bomb</div>
        {bombUsed['O'] ? null : <img src={bombIcon} alt="Bomb Icon O" style={{ width: 50, height: 50 }} onClick={() => { if (currentPlayer === 'O') handleBombClick(); }} />}
      </div>
      <Canvas style={{ height: '100vh', marginTop:'5em' }}>
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
