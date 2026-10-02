import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { sounds } from '../../utils/audio';

type StoneColor = 'B' | 'W';
type BoardSize = 9 | 13 | 19;
type GameMode = 'pve' | 'pvp' | 'eve';
type AIDifficulty = 'easy' | 'normal' | 'hard';

interface MoveRecord {
  moveNumber: number;
  color: StoneColor;
  x: number;
  y: number;
  notation: string;
  isPass: boolean;
  capturesByThisMove: number;
}

interface GoStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  blackWins: number;
  whiteWins: number;
  totalCaptures: number;
}

const COORD_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

interface GoGameProps {
  onEarnCoins?: (amount: number, reason: string) => void;
}

export const GoGame: React.FC<GoGameProps> = ({ onEarnCoins }) => {
  // Navigation & Screen State
  const [screen, setScreen] = useState<'menu' | 'play' | 'gameover' | 'review' | 'tutorial' | 'settings'>('menu');

  // Game Settings
  const [boardSize, setBoardSize] = useState<BoardSize>(9);
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal');
  const [playerColor, setPlayerColor] = useState<StoneColor>('B');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [showLastMoveIndicator, setShowLastMoveIndicator] = useState<boolean>(true);

  // Board & Game State
  const [board, setBoard] = useState<(StoneColor | null)[][]>(() => createEmptyBoard(9));
  const [turn, setTurn] = useState<StoneColor>('B');
  const [captures, setCaptures] = useState<{ B: number; W: number }>({ B: 0, W: 0 });
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [boardHistory, setBoardHistory] = useState<string[]>([]);
  const [consecutivePasses, setConsecutivePasses] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{ x: number; y: number; color: StoneColor } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Bắt đầu ván cờ. Quân Đen đi trước!');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Hover preview coordinate
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Review index
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [reviewBoard, setReviewBoard] = useState<(StoneColor | null)[][]>(() => createEmptyBoard(9));

  // Final Scoring Result
  const [scoringResult, setScoringResult] = useState<{
    blackTerritory: number;
    blackCaptures: number;
    blackTotal: number;
    whiteTerritory: number;
    whiteCaptures: number;
    whiteKomi: number;
    whiteTotal: number;
    winner: StoneColor | 'Draw';
    territoryMap: (StoneColor | null)[][];
  } | null>(null);

  // Statistics
  const [stats, setStats] = useState<GoStats>(() => {
    try {
      const saved = localStorage.getItem('nhi_go_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      blackWins: 0,
      whiteWins: 0,
      totalCaptures: 0
    };
  });

  const saveStats = (newStats: GoStats) => {
    setStats(newStats);
    try {
      localStorage.setItem('nhi_go_stats', JSON.stringify(newStats));
    } catch {}
  };

  // Helper: Create empty grid
  function createEmptyBoard(size: BoardSize): (StoneColor | null)[][] {
    return Array.from({ length: size }, () => Array(size).fill(null));
  }

  // Get Star Points (Hoshi) for the board
  const starPoints = useMemo(() => {
    if (boardSize === 9) {
      return [
        { x: 2, y: 2 }, { x: 6, y: 2 },
        { x: 4, y: 4 },
        { x: 2, y: 6 }, { x: 6, y: 6 }
      ];
    }
    if (boardSize === 13) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 },
        { x: 6, y: 6 },
        { x: 3, y: 9 }, { x: 9, y: 9 }
      ];
    }
    if (boardSize === 19) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
        { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
      ];
    }
    return [];
  }, [boardSize]);

  // Convert board coordinate to Go notation (e.g. x=3, y=3 -> D4)
  const toNotation = useCallback((x: number, y: number, size: BoardSize): string => {
    const colLetter = COORD_LETTERS[x] || '?';
    const rowNum = size - y;
    return `${colLetter}${rowNum}`;
  }, []);

  // Board string representation for Ko rule check
  const serializeBoard = (b: (StoneColor | null)[][]): string => {
    return b.map(row => row.map(cell => cell || '.').join('')).join('');
  };

  // Sound play wrapper
  const playSoundEffect = useCallback((type: 'place' | 'capture' | 'pass' | 'illegal' | 'win') => {
    if (!soundEnabled) return;
    try {
      if (type === 'place') sounds.playClick();
      else if (type === 'capture') sounds.playCoin();
      else if (type === 'pass') sounds.playGateOpen();
      else if (type === 'illegal') sounds.playUnlock();
      else if (type === 'win') sounds.playUnlock();
    } catch {}
  }, [soundEnabled]);

  // Find all connected stones in a group & count liberties
  const getGroupAndLiberties = useCallback((
    b: (StoneColor | null)[][],
    startX: number,
    startY: number
  ): { group: { x: number; y: number }[]; liberties: Set<string> } => {
    const color = b[startY][startX];
    if (!color) return { group: [], liberties: new Set() };

    const size = b.length;
    const visited = new Set<string>();
    const group: { x: number; y: number }[] = [];
    const liberties = new Set<string>();
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      group.push({ x, y });

      for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const neighbor = b[ny][nx];
          if (neighbor === null) {
            liberties.add(`${nx},${ny}`);
          } else if (neighbor === color && !visited.has(`${nx},${ny}`)) {
            visited.add(`${nx},${ny}`);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    return { group, liberties };
  }, []);

  // Validate Move Logic (Checking Liberties, Suicide, and Ko)
  const evaluateMove = useCallback((
    currentBoard: (StoneColor | null)[][],
    x: number,
    y: number,
    color: StoneColor,
    history: string[]
  ): {
    isValid: boolean;
    reason?: 'occupied' | 'suicide' | 'ko';
    newBoard?: (StoneColor | null)[][];
    capturedStones?: { x: number; y: number }[];
  } => {
    const size = currentBoard.length;
    if (x < 0 || x >= size || y < 0 || y >= size) {
      return { isValid: false, reason: 'occupied' };
    }
    if (currentBoard[y][x] !== null) {
      return { isValid: false, reason: 'occupied' };
    }

    // 1. Place stone temporarily
    const tempBoard = currentBoard.map(row => [...row]);
    tempBoard[y][x] = color;

    const opponentColor: StoneColor = color === 'B' ? 'W' : 'B';
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    const capturedStones: { x: number; y: number }[] = [];
    const processedOpponentGroups = new Set<string>();

    // 2. Check adjacent opponent groups for captures
    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (tempBoard[ny][nx] === opponentColor) {
          const key = `${nx},${ny}`;
          if (!processedOpponentGroups.has(key)) {
            const { group, liberties } = getGroupAndLiberties(tempBoard, nx, ny);
            group.forEach(st => processedOpponentGroups.add(`${st.x},${st.y}`));
            if (liberties.size === 0) {
              capturedStones.push(...group);
            }
          }
        }
      }
    }

    // Remove captured stones from tempBoard
    capturedStones.forEach(st => {
      tempBoard[st.y][st.x] = null;
    });

    // 3. Check liberties of newly placed player's group
    const { liberties: ownLiberties } = getGroupAndLiberties(tempBoard, x, y);
    if (ownLiberties.size === 0) {
      return { isValid: false, reason: 'suicide' };
    }

    // 4. Ko Rule Check
    const newBoardStr = serializeBoard(tempBoard);
    if (history.length >= 2 && history[history.length - 2] === newBoardStr && capturedStones.length === 1) {
      return { isValid: false, reason: 'ko' };
    }

    return {
      isValid: true,
      newBoard: tempBoard,
      capturedStones
    };
  }, [getGroupAndLiberties]);

  // Territory Flood-fill Calculation
  const calculateTerritoryAndScore = useCallback((currentBoard: (StoneColor | null)[][], blackCaps: number, whiteCaps: number) => {
    const size = currentBoard.length;
    const visited = new Set<string>();
    const territoryMap: (StoneColor | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

    let blackTerritory = 0;
    let whiteTerritory = 0;

    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (currentBoard[y][x] === null && !visited.has(`${x},${y}`)) {
          // Found an unvisited empty region
          const region: { x: number; y: number }[] = [];
          const borderingColors = new Set<StoneColor>();
          const queue: { x: number; y: number }[] = [{ x, y }];
          visited.add(`${x},${y}`);

          while (queue.length > 0) {
            const curr = queue.shift()!;
            region.push(curr);

            for (const { dx, dy } of directions) {
              const nx = curr.x + dx;
              const ny = curr.y + dy;
              if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                const neighbor = currentBoard[ny][nx];
                if (neighbor === null) {
                  if (!visited.has(`${nx},${ny}`)) {
                    visited.add(`${nx},${ny}`);
                    queue.push({ x: nx, y: ny });
                  }
                } else {
                  borderingColors.add(neighbor);
                }
              }
            }
          }

          if (borderingColors.size === 1) {
            const owner = Array.from(borderingColors)[0];
            region.forEach(pt => {
              territoryMap[pt.y][pt.x] = owner;
            });
            if (owner === 'B') blackTerritory += region.length;
            if (owner === 'W') whiteTerritory += region.length;
          }
        }
      }
    }

    const whiteKomi = 6.5;
    const blackTotal = blackTerritory + blackCaps;
    const whiteTotal = whiteTerritory + whiteCaps + whiteKomi;
    const winner: StoneColor | 'Draw' = blackTotal > whiteTotal ? 'B' : whiteTotal > blackTotal ? 'W' : 'Draw';

    return {
      blackTerritory,
      blackCaptures: blackCaps,
      blackTotal,
      whiteTerritory,
      whiteCaptures: whiteCaps,
      whiteKomi,
      whiteTotal,
      winner,
      territoryMap
    };
  }, []);

  // Finish game and show Game Over screen
  const finishGame = useCallback((finalBoard: (StoneColor | null)[][], currentCaps: { B: number; W: number }) => {
    const res = calculateTerritoryAndScore(finalBoard, currentCaps.B, currentCaps.W);
    setScoringResult(res);
    setScreen('gameover');
    playSoundEffect('win');

    // Update Statistics
    const isPlayerWin = (gameMode === 'pve' && res.winner === playerColor);
    const isPlayerLoss = (gameMode === 'pve' && res.winner !== playerColor && res.winner !== 'Draw');

    const updatedStats: GoStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + (isPlayerWin ? 1 : 0),
      gamesLost: stats.gamesLost + (isPlayerLoss ? 1 : 0),
      blackWins: stats.blackWins + (res.winner === 'B' ? 1 : 0),
      whiteWins: stats.whiteWins + (res.winner === 'W' ? 1 : 0),
      totalCaptures: stats.totalCaptures + currentCaps.B + currentCaps.W
    };
    saveStats(updatedStats);

    // Coin award for beating AI
    if (isPlayerWin && onEarnCoins) {
      const reward = boardSize === 19 ? 15 : boardSize === 13 ? 10 : 6;
      onEarnCoins(reward, `Chiến thắng cờ vây trước AI độ khó ${aiDifficulty.toUpperCase()} (+${reward} xu)`);
    }
  }, [boardSize, calculateTerritoryAndScore, gameMode, playerColor, stats, onEarnCoins, aiDifficulty, playSoundEffect]);

  // Execute a Stone Move
  const makeMove = useCallback((x: number, y: number): boolean => {
    const evalResult = evaluateMove(board, x, y, turn, boardHistory);
    if (!evalResult.isValid) {
      if (evalResult.reason === 'ko') {
        setStatusMessage('Nước đi không hợp lệ: Quy tắc Cướp (Ko).');
        playSoundEffect('illegal');
      } else if (evalResult.reason === 'suicide') {
        setStatusMessage('Nước đi không hợp lệ: Tự sát (Suicide).');
        playSoundEffect('illegal');
      } else {
        playSoundEffect('illegal');
      }
      return false;
    }

    const newB = evalResult.newBoard!;
    const capsCount = evalResult.capturedStones?.length || 0;
    const newCaps = {
      ...captures,
      [turn]: captures[turn] + capsCount
    };

    setBoard(newB);
    setCaptures(newCaps);
    setConsecutivePasses(0);
    setLastMove({ x, y, color: turn });

    const notation = toNotation(x, y, boardSize);
    const newMoveRecord: MoveRecord = {
      moveNumber: moveHistory.length + 1,
      color: turn,
      x,
      y,
      notation,
      isPass: false,
      capturesByThisMove: capsCount
    };

    setMoveHistory(prev => [...prev, newMoveRecord]);
    setBoardHistory(prev => [...prev, serializeBoard(newB)]);

    if (capsCount > 0) {
      playSoundEffect('capture');
      setStatusMessage(`${turn === 'B' ? 'Đen' : 'Trắng'} hạ quân tại ${notation}, bắt sống ${capsCount} quân đối thủ!`);
    } else {
      playSoundEffect('place');
      setStatusMessage(`${turn === 'B' ? 'Đen' : 'Trắng'} đi tại ${notation}.`);
    }

    setTurn(turn === 'B' ? 'W' : 'B');
    return true;
  }, [board, turn, boardHistory, evaluateMove, captures, toNotation, boardSize, moveHistory.length, playSoundEffect]);

  // Handle Pass Move
  const handlePass = useCallback(() => {
    playSoundEffect('pass');
    const newPassCount = consecutivePasses + 1;
    setConsecutivePasses(newPassCount);

    const newMoveRecord: MoveRecord = {
      moveNumber: moveHistory.length + 1,
      color: turn,
      x: -1,
      y: -1,
      notation: 'Bỏ lượt',
      isPass: true,
      capturesByThisMove: 0
    };
    setMoveHistory(prev => [...prev, newMoveRecord]);
    setBoardHistory(prev => [...prev, serializeBoard(board)]);

    if (newPassCount >= 2) {
      setStatusMessage('Cả 2 bên đều bỏ lượt liên tiếp. Ván cờ kết thúc!');
      finishGame(board, captures);
    } else {
      setStatusMessage(`${turn === 'B' ? 'Đen' : 'Trắng'} đã bỏ lượt. Đến lượt ${turn === 'B' ? 'Trắng' : 'Đen'}!`);
      setTurn(turn === 'B' ? 'W' : 'B');
    }
  }, [consecutivePasses, moveHistory.length, turn, board, playSoundEffect, finishGame, captures]);

  // AI Decision Engine
  const getAiMove = useCallback((
    currentBoard: (StoneColor | null)[][],
    currentTurnColor: StoneColor,
    diff: AIDifficulty,
    hist: string[]
  ): { x: number; y: number } | 'pass' => {
    const size = currentBoard.length;
    const legalMoves: { x: number; y: number; caps: number; ownLiberties: number }[] = [];

    // Find all legal moves
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (currentBoard[y][x] === null) {
          const evalRes = evaluateMove(currentBoard, x, y, currentTurnColor, hist);
          if (evalRes.isValid && evalRes.newBoard) {
            const { liberties } = getGroupAndLiberties(evalRes.newBoard, x, y);
            legalMoves.push({
              x,
              y,
              caps: evalRes.capturedStones?.length || 0,
              ownLiberties: liberties.size
            });
          }
        }
      }
    }

    if (legalMoves.length === 0) return 'pass';

    // EASY AI: Random legal move, occasional pass
    if (diff === 'easy') {
      if (Math.random() < 0.05 && moveHistory.length > 15) return 'pass';
      const pick = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return { x: pick.x, y: pick.y };
    }

    // NORMAL AI: Prioritize captures, avoid self-atari, play on star points early
    if (diff === 'normal') {
      // 1. Capture stones if possible
      const captureMoves = legalMoves.filter(m => m.caps > 0).sort((a, b) => b.caps - a.caps);
      if (captureMoves.length > 0 && Math.random() < 0.85) {
        return { x: captureMoves[0].x, y: captureMoves[0].y };
      }

      // 2. Safe moves (avoid 1-liberty traps unless early)
      const safeMoves = legalMoves.filter(m => m.ownLiberties >= 2);
      const candidates = safeMoves.length > 0 ? safeMoves : legalMoves;

      // 3. Prefer star points early
      if (moveHistory.length < 8) {
        for (const sp of starPoints) {
          if (candidates.some(c => c.x === sp.x && c.y === sp.y)) {
            return { x: sp.x, y: sp.y };
          }
        }
      }

      // 4. Center or 3rd/4th line preference
      candidates.sort((a, b) => {
        const distA = Math.abs(a.x - (size - 1) / 2) + Math.abs(a.y - (size - 1) / 2);
        const distB = Math.abs(b.x - (size - 1) / 2) + Math.abs(b.y - (size - 1) / 2);
        return distA - distB;
      });

      const topCandidates = candidates.slice(0, Math.min(4, candidates.length));
      const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      return { x: chosen.x, y: chosen.y };
    }

    // HARD AI: Comprehensive strategic scoring
    let bestScore = -99999;
    let bestMove = legalMoves[0];

    const opponentColor = currentTurnColor === 'B' ? 'W' : 'B';

    for (const move of legalMoves) {
      let score = 0;

      // Reward captures heavily
      score += move.caps * 25;

      // Reward group liberties
      if (move.ownLiberties === 1) score -= 30; // severe atari penalty
      else if (move.ownLiberties === 2) score += 4;
      else if (move.ownLiberties >= 3) score += 10;

      // Check if move saves an existing friendly stone in atari
      const neighbors = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ];
      for (const { dx, dy } of neighbors) {
        const nx = move.x + dx;
        const ny = move.y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (currentBoard[ny][nx] === currentTurnColor) {
            const { liberties } = getGroupAndLiberties(currentBoard, nx, ny);
            if (liberties.size === 1) score += 20; // Saves group in atari!
          } else if (currentBoard[ny][nx] === opponentColor) {
            const { liberties } = getGroupAndLiberties(currentBoard, nx, ny);
            if (liberties.size === 2) score += 8; // Pressures opponent group
          }
        }
      }

      // Star point bonus in opening
      if (moveHistory.length < 12) {
        if (starPoints.some(sp => sp.x === move.x && sp.y === move.y)) {
          score += 15;
        }
        // Prefer 3rd and 4th lines
        const edgeDistX = Math.min(move.x, size - 1 - move.x);
        const edgeDistY = Math.min(move.y, size - 1 - move.y);
        if ((edgeDistX === 2 || edgeDistX === 3) && (edgeDistY === 2 || edgeDistY === 3)) {
          score += 8;
        }
      }

      // Random small jitter to prevent deterministic loops
      score += Math.random() * 2;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // AI passes if board is congested and no positive-value moves exist
    if (bestScore < -15 && moveHistory.length > 25) {
      return 'pass';
    }

    return { x: bestMove.x, y: bestMove.y };
  }, [evaluateMove, getGroupAndLiberties, moveHistory.length, starPoints]);

  // AI Turn Trigger Hook
  useEffect(() => {
    if (screen !== 'play') return;

    const isCurrentTurnAi =
      (gameMode === 'pve' && turn !== playerColor) ||
      (gameMode === 'eve');

    if (!isCurrentTurnAi) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const decision = getAiMove(board, turn, aiDifficulty, boardHistory);
      if (decision === 'pass') {
        handlePass();
      } else {
        makeMove(decision.x, decision.y);
      }
      setIsAiThinking(false);
    }, gameMode === 'eve' ? 500 : 650);

    return () => clearTimeout(timer);
  }, [turn, screen, gameMode, playerColor, board, aiDifficulty, boardHistory, getAiMove, handlePass, makeMove]);

  // Start a new game
  const handleStartGame = (mode: GameMode = gameMode, size: BoardSize = boardSize) => {
    setGameMode(mode);
    setBoardSize(size);
    setBoard(createEmptyBoard(size));
    setTurn('B');
    setCaptures({ B: 0, W: 0 });
    setMoveHistory([]);
    setBoardHistory([serializeBoard(createEmptyBoard(size))]);
    setConsecutivePasses(0);
    setLastMove(null);
    setScoringResult(null);
    setStatusMessage('Ván cờ bắt đầu. Đen đi trước!');
    setScreen('play');
    sounds.playCoin();
  };

  // Undo Move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;
    if (gameMode === 'pve' && isAiThinking) return;

    // In AI mode, undo 2 moves so it's player's turn again
    const stepsToUndo = (gameMode === 'pve' && moveHistory.length >= 2) ? 2 : 1;

    const newMoveHistory = moveHistory.slice(0, moveHistory.length - stepsToUndo);
    const newBoard = createEmptyBoard(boardSize);
    let newBlackCaps = 0;
    let newWhiteCaps = 0;
    const newBoardHist: string[] = [serializeBoard(createEmptyBoard(boardSize))];

    // Replay moves from start
    let currentT: StoneColor = 'B';
    let lastM: { x: number; y: number; color: StoneColor } | null = null;

    newMoveHistory.forEach(m => {
      if (!m.isPass) {
        const evalRes = evaluateMove(newBoard, m.x, m.y, m.color, newBoardHist);
        if (evalRes.isValid && evalRes.newBoard) {
          for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
              newBoard[r][c] = evalRes.newBoard[r][c];
            }
          }
          if (m.color === 'B') newBlackCaps += evalRes.capturedStones?.length || 0;
          else newWhiteCaps += evalRes.capturedStones?.length || 0;
          lastM = { x: m.x, y: m.y, color: m.color };
        }
      }
      newBoardHist.push(serializeBoard(newBoard));
      currentT = currentT === 'B' ? 'W' : 'B';
    });

    setBoard(newBoard);
    setCaptures({ B: newBlackCaps, W: newWhiteCaps });
    setMoveHistory(newMoveHistory);
    setBoardHistory(newBoardHist);
    setTurn(currentT);
    setLastMove(lastM);
    setConsecutivePasses(0);
    setStatusMessage(`Đã đi lại nước cờ (Undo ${stepsToUndo} nước).`);
    sounds.playClick();
  };

  // Enter Game Review Mode
  const startReview = () => {
    setReviewIndex(moveHistory.length);
    setReviewBoard(board);
    setScreen('review');
  };

  // Step through review
  const setReviewStep = (step: number) => {
    const clamped = Math.max(0, Math.min(step, moveHistory.length));
    setReviewIndex(clamped);

    // Replay to clamped step
    const tempB = createEmptyBoard(boardSize);
    const hist: string[] = [serializeBoard(tempB)];

    for (let i = 0; i < clamped; i++) {
      const m = moveHistory[i];
      if (!m.isPass) {
        const evalRes = evaluateMove(tempB, m.x, m.y, m.color, hist);
        if (evalRes.isValid && evalRes.newBoard) {
          for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
              tempB[r][c] = evalRes.newBoard[r][c];
            }
          }
        }
      }
      hist.push(serializeBoard(tempB));
    }
    setReviewBoard(tempB);
    sounds.playClick();
  };

  // Calculate grid rendering dimensions
  const cellSize = boardSize === 19 ? 22 : boardSize === 13 ? 30 : 40;
  const padding = 28;
  const boardPixelSize = (boardSize - 1) * cellSize + padding * 2;

  return (
    <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-black text-stone-100 rounded-3xl p-3 sm:p-6 shadow-2xl border-2 border-amber-800/40 relative">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-900/40 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-950 flex items-center justify-center text-xl shadow-md border border-amber-500/30">
            ⚪⚫
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-amber-200 tracking-wide">
              Kỳ Đạo Cờ Vây (Weiqi / Go)
            </h2>
            <p className="text-[11px] text-amber-300/70">
              Trò chơi trí tuệ cổ điển • Chuẩn quy tắc bao vây & chiếm đất
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200 text-xs border border-white/10 cursor-pointer"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setScreen('tutorial')}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-500/40 cursor-pointer flex items-center gap-1"
          >
            <span>📜</span> <span className="hidden sm:inline">Luật Chơi</span>
          </button>
          {screen !== 'menu' && (
            <button
              onClick={() => setScreen('menu')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold cursor-pointer"
            >
              Menu
            </button>
          )}
        </div>
      </div>

      {/* ================= SCREEN 1: MAIN MENU ================= */}
      {screen === 'menu' && (
        <div className="max-w-md mx-auto py-6 space-y-6 text-center animate-[fadeIn_0.2s_ease-out]">
          <div className="relative inline-block py-2">
            <span className="text-6xl drop-shadow-[0_4px_16px_rgba(245,158,11,0.4)]">碁</span>
            <h1 className="text-3xl font-serif font-black tracking-widest text-amber-300 mt-2">
              CỜ VÂY ĐỈNH CAO
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Khí • Bắt Quân • Cướp Ko • Tính Đất Komi 6.5
            </p>
          </div>

          {/* Configuration Grid */}
          <div className="bg-stone-900/80 p-4 rounded-2xl border border-amber-900/50 space-y-3.5 text-left text-xs">
            {/* Board Size */}
            <div>
              <label className="font-bold text-amber-200 block mb-1">
                Kích thước bàn cờ:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([9, 13, 19] as BoardSize[]).map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      sounds.playClick();
                      setBoardSize(size);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      boardSize === size
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {size} × {size} {size === 9 ? '(Chuẩn)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty */}
            <div>
              <label className="font-bold text-amber-200 block mb-1">
                Độ khó AI:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'normal', 'hard'] as AIDifficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      sounds.playClick();
                      setAiDifficulty(diff);
                    }}
                    className={`py-2 rounded-xl font-bold border capitalize transition-all cursor-pointer ${
                      aiDifficulty === diff
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {diff === 'easy' ? 'Dễ' : diff === 'normal' ? 'Vừa' : 'Khó'}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Color in PVE */}
            <div>
              <label className="font-bold text-amber-200 block mb-1">
                Quân cờ của bạn:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setPlayerColor('B');
                  }}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    playerColor === 'B'
                      ? 'bg-black text-amber-300 border-amber-500 shadow-md'
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-stone-400 inline-block" />
                  <span>Quân Đen (Đi trước)</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setPlayerColor('W');
                  }}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    playerColor === 'W'
                      ? 'bg-stone-200 text-stone-900 border-amber-500 shadow-md'
                      : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-stone-300 inline-block" />
                  <span>Quân Trắng (Komi 6.5)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleStartGame('pve')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-2xl shadow-xl border border-amber-400/40 text-sm cursor-pointer flex items-center justify-center gap-2 transform active:scale-98 transition-all"
            >
              <span>⚔️</span> Chơi Với AI ({aiDifficulty.toUpperCase()} - {boardSize}x{boardSize})
            </button>

            <button
              onClick={() => handleStartGame('pvp')}
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-2xl border border-stone-600 text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>👥</span> Hai Người Cùng Thiết Bị (Pass & Play)
            </button>

            <button
              onClick={() => handleStartGame('eve')}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-400 font-bold rounded-2xl border border-stone-700 text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🤖</span> AI vs AI (Tự Động Trình Diễn)
            </button>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-stone-400 border-t border-stone-800">
            <div>
              <p className="text-amber-300 font-bold text-base">{stats.gamesPlayed}</p>
              <p>Trận đã chơi</p>
            </div>
            <div>
              <p className="text-emerald-400 font-bold text-base">{stats.gamesWon}</p>
              <p>Thắng ({stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}%)</p>
            </div>
            <div>
              <p className="text-rose-400 font-bold text-base">{stats.totalCaptures}</p>
              <p>Quân bắt được</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCREEN 2: GAMEPLAY PLAYING ================= */}
      {screen === 'play' && (
        <div className="flex flex-col lg:flex-row gap-5 items-center lg:items-start justify-center animate-[fadeIn_0.2s_ease-out]">
          
          {/* LEFT: Authentic Wooden Board */}
          <div className="flex flex-col items-center">
            {/* Status Announcement Banner */}
            <div className="w-full max-w-sm sm:max-w-md mb-2.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-amber-600/40 text-center text-xs">
              <span className="font-bold text-amber-300">{statusMessage}</span>
              {isAiThinking && (
                <span className="ml-2 inline-block text-amber-400 animate-pulse font-semibold">
                  (AI đang suy nghĩ...)
                </span>
              )}
            </div>

            {/* Board Container */}
            <div
              className="relative p-2 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-4 border-amber-950 overflow-hidden select-none"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #eab308 0%, #ca8a04 40%, #a16207 80%, #713f12 100%)',
                boxShadow: 'inset 0 0 40px rgba(69, 26, 3, 0.6), 0 10px 40px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Subtle Wood Grain Pattern Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 6px)'
                }}
              />

              <svg
                width={boardPixelSize}
                height={boardPixelSize}
                className="relative block cursor-crosshair touch-manipulation"
                onMouseLeave={() => setHoverCoord(null)}
              >
                {/* 1. Grid Lines */}
                {Array.from({ length: boardSize }).map((_, i) => {
                  const coord = padding + i * cellSize;
                  return (
                    <g key={`lines-${i}`}>
                      {/* Horizontal line */}
                      <line
                        x1={padding}
                        y1={coord}
                        x2={padding + (boardSize - 1) * cellSize}
                        y2={coord}
                        stroke="#451a03"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                      {/* Vertical line */}
                      <line
                        x1={coord}
                        y1={padding}
                        x2={coord}
                        y2={padding + (boardSize - 1) * cellSize}
                        stroke="#451a03"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </g>
                  );
                })}

                {/* 2. Star Points (Hoshi) */}
                {starPoints.map((sp, idx) => (
                  <circle
                    key={`star-${idx}`}
                    cx={padding + sp.x * cellSize}
                    cy={padding + sp.y * cellSize}
                    r={boardSize === 19 ? 2.5 : 3.5}
                    fill="#3b1502"
                  />
                ))}

                {/* 3. Coordinate Labels */}
                {showCoordinates && (
                  <g className="text-[10px] font-mono fill-amber-950/80 font-bold select-none pointer-events-none">
                    {/* Top & Bottom Column Letters */}
                    {Array.from({ length: boardSize }).map((_, col) => {
                      const cx = padding + col * cellSize;
                      return (
                        <g key={`col-label-${col}`}>
                          <text x={cx} y={padding - 12} textAnchor="middle">
                            {COORD_LETTERS[col]}
                          </text>
                          <text x={cx} y={boardPixelSize - padding + 18} textAnchor="middle">
                            {COORD_LETTERS[col]}
                          </text>
                        </g>
                      );
                    })}
                    {/* Left & Right Row Numbers */}
                    {Array.from({ length: boardSize }).map((_, row) => {
                      const cy = padding + row * cellSize + 3.5;
                      const rowNum = boardSize - row;
                      return (
                        <g key={`row-label-${row}`}>
                          <text x={padding - 14} y={cy} textAnchor="middle">
                            {rowNum}
                          </text>
                          <text x={boardPixelSize - padding + 14} y={cy} textAnchor="middle">
                            {rowNum}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 4. Clickable Intersection Hitboxes */}
                {Array.from({ length: boardSize }).map((_, row) =>
                  Array.from({ length: boardSize }).map((_, col) => {
                    const cx = padding + col * cellSize;
                    const cy = padding + row * cellSize;
                    return (
                      <rect
                        key={`hitbox-${col}-${row}`}
                        x={cx - cellSize / 2}
                        y={cy - cellSize / 2}
                        width={cellSize}
                        height={cellSize}
                        fill="transparent"
                        onMouseEnter={() => setHoverCoord({ x: col, y: row })}
                        onClick={() => {
                          if (isAiThinking) return;
                          if (gameMode === 'pve' && turn !== playerColor) return;
                          makeMove(col, row);
                        }}
                      />
                    );
                  })
                )}

                {/* 5. Hover Preview Stone */}
                {hoverCoord && board[hoverCoord.y]?.[hoverCoord.x] === null && !isAiThinking && (
                  <g pointerEvents="none">
                    <circle
                      cx={padding + hoverCoord.x * cellSize}
                      cy={padding + hoverCoord.y * cellSize}
                      r={cellSize * 0.44}
                      fill={turn === 'B' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)'}
                      stroke={turn === 'B' ? '#ffffff' : '#000000'}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </g>
                )}

                {/* 6. Placed Stones */}
                {board.map((rowArr, row) =>
                  rowArr.map((stone, col) => {
                    if (!stone) return null;
                    const cx = padding + col * cellSize;
                    const cy = padding + row * cellSize;
                    const stoneRadius = cellSize * 0.45;
                    const isLast = lastMove?.x === col && lastMove?.y === row;

                    return (
                      <g key={`stone-${col}-${row}`} className="animate-[scaleIn_0.15s_ease-out]">
                        {/* Stone Shadow */}
                        <circle
                          cx={cx + 1.8}
                          cy={cy + 2.5}
                          r={stoneRadius}
                          fill="rgba(0,0,0,0.4)"
                        />
                        {/* Stone Body */}
                        {stone === 'B' ? (
                          <>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={stoneRadius}
                              fill="url(#blackStoneGrad)"
                            />
                            {/* Subtle 3D Highlight */}
                            <ellipse
                              cx={cx - stoneRadius * 0.3}
                              cy={cy - stoneRadius * 0.35}
                              rx={stoneRadius * 0.35}
                              ry={stoneRadius * 0.2}
                              fill="rgba(255,255,255,0.22)"
                            />
                          </>
                        ) : (
                          <>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={stoneRadius}
                              fill="url(#whiteStoneGrad)"
                              stroke="#d1d5db"
                              strokeWidth="0.5"
                            />
                            {/* Subtle 3D Highlight */}
                            <ellipse
                              cx={cx - stoneRadius * 0.28}
                              cy={cy - stoneRadius * 0.35}
                              rx={stoneRadius * 0.38}
                              ry={stoneRadius * 0.22}
                              fill="rgba(255,255,255,0.85)"
                            />
                          </>
                        )}

                        {/* Last Move Ring / Dot */}
                        {showLastMoveIndicator && isLast && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={stoneRadius * 0.25}
                            fill={stone === 'B' ? '#ef4444' : '#ef4444'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        )}
                      </g>
                    );
                  })
                )}

                {/* SVG Radial Gradients for 3D Stones */}
                <defs>
                  <radialGradient id="blackStoneGrad" cx="35%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="60%" stopColor="#111827" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                  <radialGradient id="whiteStoneGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="70%" stopColor="#f3f4f6" />
                    <stop offset="100%" stopColor="#d1d5db" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* RIGHT: Game Information & Controls */}
          <div className="w-full max-w-sm space-y-4">
            
            {/* Player Cards (Black vs White) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Black Card */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  turn === 'B'
                    ? 'bg-stone-900 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : 'bg-stone-950/60 border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-black border border-stone-500 shadow-sm" />
                  <span className="font-bold text-xs text-amber-200">
                    QUÂN ĐEN {gameMode === 'pve' && playerColor === 'B' ? '(Bạn)' : ''}
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 space-y-0.5">
                  <p>Bắt quân: <strong className="text-amber-400">{captures.B}</strong></p>
                  <p className="text-[10px] text-stone-400">Đi trước</p>
                </div>
                {turn === 'B' && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 animate-pulse">
                    ĐANG ĐẾN LƯỢT
                  </span>
                )}
              </div>

              {/* White Card */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  turn === 'W'
                    ? 'bg-stone-900 border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
                    : 'bg-stone-950/60 border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-white border border-stone-300 shadow-sm" />
                  <span className="font-bold text-xs text-amber-200">
                    QUÂN TRẮNG {gameMode === 'pve' && playerColor === 'W' ? '(Bạn)' : ''}
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 space-y-0.5">
                  <p>Bắt quân: <strong className="text-amber-400">{captures.W}</strong></p>
                  <p className="text-[10px] text-stone-400">Komi: <strong>6.5 mục</strong></p>
                </div>
                {turn === 'W' && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 animate-pulse">
                    ĐANG ĐẾN LƯỢT
                  </span>
                )}
              </div>
            </div>

            {/* In-game Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePass}
                disabled={isAiThinking}
                className="py-2.5 px-3 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>✋</span> Bỏ Lượt (Pass)
              </button>

              <button
                onClick={handleUndo}
                disabled={moveHistory.length === 0 || isAiThinking}
                className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <span>↩️</span> Đi Lại (Undo)
              </button>
            </div>

            {/* Quick Game Controls */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800">
              <button
                onClick={() => setShowCoordinates(prev => !prev)}
                className="text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showCoordinates ? 'Ẩn tọa độ' : 'Hiện tọa độ'}
              </button>
              <button
                onClick={() => setShowLastMoveIndicator(prev => !prev)}
                className="text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showLastMoveIndicator ? 'Ẩn dấu chấm' : 'Hiện dấu chấm'}
              </button>
              <button
                onClick={() => finishGame(board, captures)}
                className="text-rose-400 hover:text-rose-300 cursor-pointer font-bold"
              >
                Đầu Hàng / Tính Điểm
              </button>
            </div>

            {/* Move History Panel */}
            <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-xs flex flex-col h-44">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-800 font-bold text-stone-400 text-[11px]">
                <span>LỊCH SỬ NƯỚC ĐI</span>
                <span>Tổng: {moveHistory.length} nước</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 pt-1 font-mono text-[11px]">
                {moveHistory.length === 0 ? (
                  <p className="text-stone-500 italic py-4 text-center">Chưa có nước đi nào</p>
                ) : (
                  moveHistory.map(m => (
                    <div
                      key={m.moveNumber}
                      className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-white/5"
                    >
                      <span className="text-stone-500">#{m.moveNumber}</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full inline-block ${m.color === 'B' ? 'bg-black border border-stone-500' : 'bg-white'}`} />
                        <span>{m.color === 'B' ? 'Đen' : 'Trắng'}</span>
                      </span>
                      <span className="font-bold text-amber-200">{m.notation}</span>
                      <span className="text-[10px] text-stone-400">
                        {m.capturesByThisMove > 0 ? `+${m.capturesByThisMove} bắt` : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= SCREEN 3: GAME OVER & SCORING ================= */}
      {screen === 'gameover' && scoringResult && (
        <div className="max-w-md mx-auto py-4 space-y-4 text-center animate-[fadeIn_0.2s_ease-out]">
          <div className="p-4 rounded-3xl bg-stone-900 border-2 border-amber-500 shadow-2xl space-y-3">
            <span className="text-4xl">🏆</span>
            <h2 className="text-2xl font-serif font-black text-amber-300">
              VÁN CỜ KẾT THÚC
            </h2>
            <div className="text-lg font-bold text-white">
              {scoringResult.winner === 'B' ? (
                <span className="text-amber-300">QUÂN ĐEN CHIẾN THẮNG! 🌹</span>
              ) : scoringResult.winner === 'W' ? (
                <span className="text-stone-100">QUÂN TRẮNG CHIẾN THẮNG! ✨</span>
              ) : (
                <span className="text-stone-300">HÒA CỜ!</span>
              )}
            </div>

            {/* Detailed Scoring Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-left text-xs pt-2 border-t border-stone-800">
              {/* Black Score */}
              <div className="p-3 bg-black/60 rounded-xl border border-stone-700">
                <div className="flex items-center gap-1.5 font-bold text-amber-200 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-stone-500" />
                  <span>ĐEN</span>
                </div>
                <div className="space-y-0.5 text-stone-300 text-[11px]">
                  <p>Đất (Territory): <strong>{scoringResult.blackTerritory}</strong></p>
                  <p>Bắt quân: <strong>{scoringResult.blackCaptures}</strong></p>
                  <div className="pt-1 mt-1 border-t border-stone-700 font-bold text-amber-300 text-sm">
                    Tổng: {scoringResult.blackTotal} mục
                  </div>
                </div>
              </div>

              {/* White Score */}
              <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-700">
                <div className="flex items-center gap-1.5 font-bold text-stone-200 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-stone-400" />
                  <span>TRẮNG</span>
                </div>
                <div className="space-y-0.5 text-stone-300 text-[11px]">
                  <p>Đất (Territory): <strong>{scoringResult.whiteTerritory}</strong></p>
                  <p>Bắt quân: <strong>{scoringResult.whiteCaptures}</strong></p>
                  <p>Komi mục dâng: <strong>+{scoringResult.whiteKomi}</strong></p>
                  <div className="pt-1 mt-1 border-t border-stone-700 font-bold text-stone-100 text-sm">
                    Tổng: {scoringResult.whiteTotal} mục
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleStartGame(gameMode, boardSize)}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg cursor-pointer text-xs"
              >
                🔄 Chơi Ván Mới
              </button>

              <button
                onClick={startReview}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold rounded-xl border border-stone-700 cursor-pointer text-xs"
              >
                🔍 Xem Lại Ván Cờ (Review)
              </button>

              <button
                onClick={() => setScreen('menu')}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Về Menu Chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCREEN 4: GAME REVIEW ================= */}
      {screen === 'review' && (
        <div className="max-w-md mx-auto py-2 space-y-3 text-center animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between text-xs text-amber-200 pb-2 border-b border-stone-800">
            <span className="font-bold">🔍 XEM LẠI VÁN CỜ</span>
            <span>Nước {reviewIndex} / {moveHistory.length}</span>
          </div>

          {/* Mini Review Board */}
          <div className="flex justify-center">
            <div
              className="relative p-2 rounded-2xl shadow-xl border-4 border-amber-950 overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #eab308 0%, #ca8a04 40%, #a16207 80%, #713f12 100%)'
              }}
            >
              <svg width={boardPixelSize} height={boardPixelSize}>
                {Array.from({ length: boardSize }).map((_, i) => (
                  <g key={`rev-lines-${i}`}>
                    <line
                      x1={padding}
                      y1={padding + i * cellSize}
                      x2={padding + (boardSize - 1) * cellSize}
                      y2={padding + i * cellSize}
                      stroke="#451a03"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={padding + i * cellSize}
                      y1={padding}
                      x2={padding + i * cellSize}
                      y2={padding + (boardSize - 1) * cellSize}
                      stroke="#451a03"
                      strokeWidth="1.5"
                    />
                  </g>
                ))}

                {reviewBoard.map((rowArr, row) =>
                  rowArr.map((stone, col) => {
                    if (!stone) return null;
                    const cx = padding + col * cellSize;
                    const cy = padding + row * cellSize;
                    return (
                      <circle
                        key={`rev-st-${col}-${row}`}
                        cx={cx}
                        cy={cy}
                        r={cellSize * 0.44}
                        fill={stone === 'B' ? '#111827' : '#f9fafb'}
                        stroke={stone === 'W' ? '#d1d5db' : '#374151'}
                        strokeWidth="1"
                      />
                    );
                  })
                )}
              </svg>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setReviewStep(0)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs rounded-xl font-bold"
            >
              ⏮️ Đầu
            </button>
            <button
              onClick={() => setReviewStep(reviewIndex - 1)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs rounded-xl font-bold"
            >
              ◀ Nước trước
            </button>
            <button
              onClick={() => setReviewStep(reviewIndex + 1)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs rounded-xl font-bold"
            >
              Nước sau ▶
            </button>
            <button
              onClick={() => setReviewStep(moveHistory.length)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-xs rounded-xl font-bold"
            >
              Cuối ⏭️
            </button>
          </div>

          <button
            onClick={() => setScreen('menu')}
            className="w-full py-2 bg-white/10 hover:bg-white/20 text-stone-200 text-xs rounded-xl font-bold"
          >
            Về Menu Chính
          </button>
        </div>
      )}

      {/* ================= SCREEN 5: TUTORIAL ================= */}
      {screen === 'tutorial' && (
        <div className="max-w-lg mx-auto py-2 space-y-4 text-left animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-1.5">
              <span>📜</span> Hướng Dẫn Luật Chơi Cờ Vây (Go Rules)
            </h3>
            <button
              onClick={() => setScreen('menu')}
              className="text-stone-400 hover:text-white text-xs cursor-pointer font-bold"
            >
              ✕ Đóng
            </button>
          </div>

          <div className="space-y-3 text-xs text-stone-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
            <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
              <h4 className="font-bold text-amber-200 mb-1">1. Đặt quân tại giao điểm (Intersections)</h4>
              <p>Quân cờ được đặt trên các giao điểm của đường kẻ, không đặt vào giữa ô vuông. Quân Đen luôn đi trước.</p>
            </div>

            <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
              <h4 className="font-bold text-amber-200 mb-1">2. Khí (Liberties) & Bắt quân</h4>
              <p>Khí là các giao điểm trống liền kề theo chiều ngang và dọc (không tính đường chéo). Các quân cùng màu đứng cạnh nhau sẽ kết nối thành một đám quân và dùng chung khí. Khi một đám quân hết sạch khí (0 khí), chúng sẽ bị bao vây bắt sống và đưa ra khỏi bàn cờ.</p>
            </div>

            <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
              <h4 className="font-bold text-amber-200 mb-1">3. Cấm Tự Sát (Suicide Rule)</h4>
              <p>Bạn không được đặt quân vào nơi khiến đám quân của mình có 0 khí, TRỪ PHI nước đi đó đồng thời triệt tiêu khí và bắt sống quân đối thủ (tạo ra khí mới).</p>
            </div>

            <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
              <h4 className="font-bold text-amber-200 mb-1">4. Quy Tắc Cướp (Ko Rule)</h4>
              <p>Không được lặp lại ngay lập tức trạng thái bàn cờ của nước đi vừa xong để tránh ván cờ bị lặp vô tận. Bạn phải đi một nước ở chỗ khác trước khi được quyền ăn lại.</p>
            </div>

            <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800">
              <h4 className="font-bold text-amber-200 mb-1">5. Bỏ Lượt (Pass) & Tính Điểm (Komi)</h4>
              <p>Khi hai người chơi liên tiếp bỏ lượt, ván cờ kết thúc. Điểm của mỗi bên = Đất chiếm được (vùng trống được bao bọc) + Số quân bắt được. Quân Trắng được cộng thêm <strong>6.5 mục Komi</strong> để bù đắp việc phải đi sau.</p>
            </div>
          </div>

          <button
            onClick={() => setScreen('menu')}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs"
          >
            Đã Hiểu, Quay Lại Chơi
          </button>
        </div>
      )}

    </div>
  );
};
