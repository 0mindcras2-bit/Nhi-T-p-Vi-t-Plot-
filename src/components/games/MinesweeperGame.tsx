import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { sounds } from '../../utils/audio';

export type MinesweeperDifficulty = 'beginner' | 'intermediate' | 'expert' | 'custom';

export interface MinesweeperStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimeBeginner: number | null;
  bestTimeIntermediate: number | null;
  bestTimeExpert: number | null;
  totalMinesCleared: number;
  totalFlagsPlaced: number;
}

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  isExploded?: boolean;
  isFalseFlag?: boolean;
}

interface MinesweeperGameProps {
  onEarnCoins?: (amount: number, reason: string) => void;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-500 font-bold',
  2: 'text-emerald-500 font-bold',
  3: 'text-red-500 font-bold',
  4: 'text-indigo-600 font-extrabold',
  5: 'text-amber-700 font-extrabold',
  6: 'text-teal-500 font-extrabold',
  7: 'text-purple-600 font-black',
  8: 'text-gray-500 font-black'
};

const DIFFICULTY_CONFIGS: Record<'beginner' | 'intermediate' | 'expert', { rows: number; cols: number; mines: number; label: string; reward: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10, label: 'Tân Thủ (9×9, 10 Mìn)', reward: 5 },
  intermediate: { rows: 16, cols: 16, mines: 40, label: 'Trung Cấp (16×16, 40 Mìn)', reward: 12 },
  expert: { rows: 16, cols: 30, mines: 99, label: 'Chuyên Gia (30×16, 99 Mìn)', reward: 25 }
};

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({ onEarnCoins }) => {
  // Screen / Modals
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Settings
  const [difficulty, setDifficulty] = useState<MinesweeperDifficulty>('beginner');
  const [customRows, setCustomRows] = useState<number>(10);
  const [customCols, setCustomCols] = useState<number>(10);
  const [customMines, setCustomMines] = useState<number>(15);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Mobile Tap Action Mode: 'dig' (cuốc đất / mở ô) or 'flag' (cắm cờ)
  const [mobileMode, setMobileMode] = useState<'dig' | 'flag'>('dig');

  // Game Core State
  const [rows, setRows] = useState<number>(9);
  const [cols, setCols] = useState<number>(9);
  const [totalMines, setTotalMines] = useState<number>(10);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [isFirstClick, setIsFirstClick] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(0);
  const [flagCount, setFlagCount] = useState<number>(0);
  const [smileyState, setSmileyState] = useState<'normal' | 'surprised' | 'won' | 'lost'>('normal');

  // Touch Long-press timer ref for mobile
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  // Statistics
  const [stats, setStats] = useState<MinesweeperStats>(() => {
    try {
      const saved = localStorage.getItem('nhi_minesweeper_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTimeBeginner: null,
      bestTimeIntermediate: null,
      bestTimeExpert: null,
      totalMinesCleared: 0,
      totalFlagsPlaced: 0
    };
  });

  const saveStats = (newStats: MinesweeperStats) => {
    setStats(newStats);
    try {
      localStorage.setItem('nhi_minesweeper_stats', JSON.stringify(newStats));
    } catch {}
  };

  // Sound effects
  const playSfx = useCallback((type: 'click' | 'flag' | 'unflag' | 'explode' | 'win') => {
    if (!soundEnabled) return;
    try {
      if (type === 'click') sounds.playClick();
      else if (type === 'flag' || type === 'unflag') sounds.playCoin();
      else if (type === 'explode') sounds.playUnlock();
      else if (type === 'win') sounds.playUnlock();
    } catch {}
  }, [soundEnabled]);

  // Create an initial empty matrix
  const createEmptyBoard = useCallback((r: number, c: number): Cell[][] => {
    const newBoard: Cell[][] = [];
    for (let row = 0; row < r; row++) {
      const rowArr: Cell[] = [];
      for (let col = 0; col < c; col++) {
        rowArr.push({
          row,
          col,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        });
      }
      newBoard.push(rowArr);
    }
    return newBoard;
  }, []);

  // Initialize or Reset Game
  const resetGame = useCallback((diff = difficulty) => {
    let r = 9;
    let c = 9;
    let m = 10;

    if (diff === 'custom') {
      r = Math.max(5, Math.min(customRows, 24));
      c = Math.max(5, Math.min(customCols, 30));
      m = Math.max(1, Math.min(customMines, r * c - 9));
    } else {
      const cfg = DIFFICULTY_CONFIGS[diff];
      r = cfg.rows;
      c = cfg.cols;
      m = cfg.mines;
    }

    setRows(r);
    setCols(c);
    setTotalMines(m);
    setBoard(createEmptyBoard(r, c));
    setGameStatus('ready');
    setIsFirstClick(true);
    setTimer(0);
    setFlagCount(0);
    setSmileyState('normal');
  }, [difficulty, customRows, customCols, customMines, createEmptyBoard]);

  // Initialize on mount or difficulty change
  useEffect(() => {
    resetGame(difficulty);
  }, [difficulty, resetGame]);

  // Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => Math.min(prev + 1, 999));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus]);

  // Generate Minefield guaranteeing the first clicked cell (and adjacent cells when possible) are SAFE
  const populateMinesAfterFirstClick = (
    initialBoard: Cell[][],
    startRow: number,
    startCol: number,
    r: number,
    c: number,
    m: number
  ): Cell[][] => {
    const newBoard = initialBoard.map(rowArr => rowArr.map(cell => ({ ...cell })));

    // Reserved safe zone around first click
    const safeCoords = new Set<string>();
    safeCoords.add(`${startRow},${startCol}`);

    // If board is spacious enough, ensure all 8 surrounding cells are safe too for a pleasant opening cascade
    if (r * c - 9 >= m) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = startRow + dr;
          const nc = startCol + dc;
          if (nr >= 0 && nr < r && nc >= 0 && nc < c) {
            safeCoords.add(`${nr},${nc}`);
          }
        }
      }
    }

    // Place mines randomly in non-safe coordinates
    let minesPlaced = 0;
    while (minesPlaced < m) {
      const randR = Math.floor(Math.random() * r);
      const randC = Math.floor(Math.random() * c);
      const key = `${randR},${randC}`;

      if (!safeCoords.has(key) && !newBoard[randR][randC].isMine) {
        newBoard[randR][randC].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mine counts for each cell
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < r && nc >= 0 && nc < c && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[row][col].adjacentMines = count;
        }
      }
    }

    return newBoard;
  };

  // Check Win condition
  const checkWinCondition = (currentBoard: Cell[][], r: number, c: number, m: number): boolean => {
    let unrevealedSafeCells = 0;
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        const cell = currentBoard[row][col];
        if (!cell.isMine && !cell.isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }
    return unrevealedSafeCells === 0;
  };

  // Handle Win Event
  const triggerWin = (finalTime: number) => {
    setGameStatus('won');
    setSmileyState('won');
    playSfx('win');

    // Update Statistics
    const updatedStats = { ...stats };
    updatedStats.gamesPlayed += 1;
    updatedStats.gamesWon += 1;
    updatedStats.totalMinesCleared += totalMines;

    if (difficulty === 'beginner') {
      if (updatedStats.bestTimeBeginner === null || finalTime < updatedStats.bestTimeBeginner) {
        updatedStats.bestTimeBeginner = finalTime;
      }
    } else if (difficulty === 'intermediate') {
      if (updatedStats.bestTimeIntermediate === null || finalTime < updatedStats.bestTimeIntermediate) {
        updatedStats.bestTimeIntermediate = finalTime;
      }
    } else if (difficulty === 'expert') {
      if (updatedStats.bestTimeExpert === null || finalTime < updatedStats.bestTimeExpert) {
        updatedStats.bestTimeExpert = finalTime;
      }
    }
    saveStats(updatedStats);

    // Reward Coins to user!
    if (onEarnCoins) {
      let reward = 5;
      if (difficulty === 'intermediate') reward = 12;
      else if (difficulty === 'expert') reward = 25;
      else if (difficulty === 'custom') reward = Math.max(5, Math.floor(totalMines / 2));
      onEarnCoins(reward, `Thắng game Dò Mìn (${difficulty.toUpperCase()} - ${finalTime}s) (+${reward} xu)`);
    }
  };

  // Handle Loss Event
  const triggerLoss = (currentBoard: Cell[][], explodedRow: number, explodedCol: number) => {
    setGameStatus('lost');
    setSmileyState('lost');
    playSfx('explode');

    // Reveal all mines and mark false flags
    const finalBoard = currentBoard.map(rowArr =>
      rowArr.map(cell => {
        const copy = { ...cell };
        if (cell.row === explodedRow && cell.col === explodedCol) {
          copy.isRevealed = true;
          copy.isExploded = true;
        } else if (cell.isMine && !cell.isFlagged) {
          copy.isRevealed = true;
        } else if (!cell.isMine && cell.isFlagged) {
          copy.isFalseFlag = true;
        }
        return copy;
      })
    );
    setBoard(finalBoard);

    // Update Statistics
    const updatedStats = { ...stats };
    updatedStats.gamesPlayed += 1;
    saveStats(updatedStats);
  };

  // Flood Reveal Empty Cells (Zero Cascade)
  const floodReveal = (startBoard: Cell[][], startRow: number, startCol: number, r: number, c: number): Cell[][] => {
    const newBoard = startBoard.map(rowArr => rowArr.map(cell => ({ ...cell })));
    const queue: [number, number][] = [[startRow, startCol]];

    newBoard[startRow][startCol].isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const currentCell = newBoard[currR][currC];

      // If this cell has 0 adjacent mines, auto-reveal its 8 neighbors
      if (currentCell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = currR + dr;
            const nc = currC + dc;

            if (nr >= 0 && nr < r && nc >= 0 && nc < c) {
              const neighbor = newBoard[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.adjacentMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    return newBoard;
  };

  // Toggle Flag on Cell
  const handleToggleFlag = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    const cell = board[row]?.[col];
    if (!cell || cell.isRevealed) return;

    const newBoard = board.map(rArr => rArr.map(c => ({ ...c })));
    const target = newBoard[row][col];

    if (!target.isFlagged) {
      target.isFlagged = true;
      setFlagCount(prev => prev + 1);
      playSfx('flag');

      const updatedStats = { ...stats };
      updatedStats.totalFlagsPlaced += 1;
      saveStats(updatedStats);
    } else {
      target.isFlagged = false;
      setFlagCount(prev => prev - 1);
      playSfx('unflag');
    }

    setBoard(newBoard);
  };

  // Reveal a Cell
  const handleRevealCell = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    let activeBoard = board;

    // First click initialization
    if (isFirstClick) {
      setIsFirstClick(false);
      setGameStatus('playing');
      activeBoard = populateMinesAfterFirstClick(board, row, col, rows, cols, totalMines);
    }

    const cell = activeBoard[row]?.[col];
    if (!cell || cell.isRevealed || cell.isFlagged) return;

    // Clicked a mine -> Game Over!
    if (cell.isMine) {
      triggerLoss(activeBoard, row, col);
      return;
    }

    // Safe cell -> Reveal with cascade if zero
    playSfx('click');
    const revealedBoard = floodReveal(activeBoard, row, col, rows, cols);
    setBoard(revealedBoard);

    // Check Win
    if (checkWinCondition(revealedBoard, rows, cols, totalMines)) {
      triggerWin(timer);
    }
  };

  // Chording: Clicking a revealed numbered cell to auto-reveal adjacent cells if flags match number
  const handleChord = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;
    const cell = board[row]?.[col];
    if (!cell || !cell.isRevealed || cell.adjacentMines === 0) return;

    // Count adjacent flags
    let adjacentFlags = 0;
    const neighbors: [number, number][] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          neighbors.push([nr, nc]);
          if (board[nr][nc].isFlagged) {
            adjacentFlags++;
          }
        }
      }
    }

    // Only chord if flags count matches exactly the number
    if (adjacentFlags !== cell.adjacentMines) return;

    // Check if any unflagged neighbor is a mine (incorrect flags by player -> Boom!)
    for (const [nr, nc] of neighbors) {
      const neighbor = board[nr][nc];
      if (!neighbor.isRevealed && !neighbor.isFlagged && neighbor.isMine) {
        triggerLoss(board, nr, nc);
        return;
      }
    }

    // All unflagged neighbors are safe -> Cascade reveal them
    let chordedBoard = board.map(rArr => rArr.map(c => ({ ...c })));
    for (const [nr, nc] of neighbors) {
      const neighbor = chordedBoard[nr][nc];
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        chordedBoard = floodReveal(chordedBoard, nr, nc, rows, cols);
      }
    }

    playSfx('click');
    setBoard(chordedBoard);

    if (checkWinCondition(chordedBoard, rows, cols, totalMines)) {
      triggerWin(timer);
    }
  };

  // Unified click handler based on mobileMode or desktop click
  const handleCellClick = (row: number, col: number) => {
    if (isLongPressRef.current) return;
    const cell = board[row]?.[col];
    if (!cell) return;

    // If already revealed and has numbers, try chording
    if (cell.isRevealed && cell.adjacentMines > 0) {
      handleChord(row, col);
      return;
    }

    if (mobileMode === 'flag') {
      handleToggleFlag(row, col);
    } else {
      handleRevealCell(row, col);
    }
  };

  // Keyboard Shortcuts: R for Restart, F for Flag Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in custom input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      } else if (e.key === 'f' || e.key === 'F') {
        setMobileMode(prev => (prev === 'dig' ? 'flag' : 'dig'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  // Format digital 3-digit counter
  const formatDigital = (val: number): string => {
    if (val < 0) return '-' + String(Math.abs(val)).padStart(2, '0');
    return String(Math.min(val, 999)).padStart(3, '0');
  };

  // Format MM:SS for statistics
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-3xl p-3 sm:p-6 shadow-2xl border-2 transition-colors relative select-none ${
      isDarkMode
        ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
        : 'bg-stone-100 border-stone-300 text-stone-900 shadow-xl'
    }`}>
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-500 to-rose-600 flex items-center justify-center text-xl shadow-md border border-white/30">
            💣
          </div>
          <div>
            <h2 className="font-serif font-black text-lg sm:text-xl text-amber-400 tracking-wide flex items-center gap-1.5">
              <span>DÒ MÌN KINH ĐIỂN (MINESWEEPER)</span>
            </h2>
            <p className="text-[11px] opacity-75">
              Chuẩn luật dò mìn • Mở an toàn lần đầu • Thắng nhận thưởng Xu!
            </p>
          </div>
        </div>

        {/* Header Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs border border-white/10 cursor-pointer"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs border border-white/10 cursor-pointer"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => setShowStatsModal(true)}
            title="Xem thành tích & kỷ lục thời gian"
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold border border-white/10 cursor-pointer flex items-center gap-1"
          >
            <span>🏆</span> <span className="hidden sm:inline">Kỷ Lục</span>
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold border border-amber-500/40 cursor-pointer flex items-center gap-1"
          >
            <span>📜</span> <span className="hidden sm:inline">Luật Chơi</span>
          </button>
        </div>
      </div>

      {/* Difficulty Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-bold">
        {(['beginner', 'intermediate', 'expert', 'custom'] as MinesweeperDifficulty[]).map(d => (
          <button
            key={d}
            onClick={() => {
              sounds.playClick();
              setDifficulty(d);
            }}
            className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer text-center ${
              difficulty === d
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black scale-102'
                : 'bg-white/5 hover:bg-white/10 border-white/10 opacity-80'
            }`}
          >
            {d === 'beginner' && 'Tân Thủ (9×9)'}
            {d === 'intermediate' && 'Trung Cấp (16×16)'}
            {d === 'expert' && 'Chuyên Gia (30×16)'}
            {d === 'custom' && 'Tùy Chỉnh (Custom)'}
          </button>
        ))}
      </div>

      {/* Custom Size Form */}
      {difficulty === 'custom' && (
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span>Hàng:</span>
            <input
              type="number"
              min={5}
              max={24}
              value={customRows}
              onChange={e => setCustomRows(parseInt(e.target.value) || 9)}
              className="w-16 px-2 py-1 bg-black/40 border border-white/20 rounded-lg text-center font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>Cột:</span>
            <input
              type="number"
              min={5}
              max={30}
              value={customCols}
              onChange={e => setCustomCols(parseInt(e.target.value) || 9)}
              className="w-16 px-2 py-1 bg-black/40 border border-white/20 rounded-lg text-center font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>Số mìn:</span>
            <input
              type="number"
              min={1}
              max={customRows * customCols - 9}
              value={customMines}
              onChange={e => setCustomMines(parseInt(e.target.value) || 10)}
              className="w-16 px-2 py-1 bg-black/40 border border-white/20 rounded-lg text-center font-bold"
            />
          </div>
          <button
            onClick={() => resetGame('custom')}
            className="py-1 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow-md"
          >
            Áp Dụng Bàn Cờ Mới
          </button>
        </div>
      )}

      {/* Mobile Tool Switcher: Dig (⛏️) vs Flag (🚩) */}
      <div className="flex items-center justify-between mb-3 bg-white/5 p-1.5 rounded-2xl border border-white/10 sm:max-w-md mx-auto">
        <span className="text-[11px] font-bold px-2 text-amber-300">
          Chế độ chạm màn hình:
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sounds.playClick();
              setMobileMode('dig');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              mobileMode === 'dig'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>⛏️</span> <span>Mở Ô (Dig)</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setMobileMode('flag');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              mobileMode === 'flag'
                ? 'bg-red-500 text-white shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🚩</span> <span>Cắm Cờ (Flag)</span>
          </button>
        </div>
      </div>

      {/* GAME BOARD CONTAINER */}
      <div className="flex flex-col items-center">
        
        {/* Classic Minesweeper Control Console Header */}
        <div className="w-full max-w-xl bg-slate-950 p-2.5 rounded-2xl border-4 border-slate-700 shadow-inner flex items-center justify-between mb-3 select-none">
          {/* Remaining Mines Counter */}
          <div className="bg-black border-2 border-red-950 px-3 py-1 rounded-lg shadow-inner">
            <span className="font-mono text-2xl font-black text-red-600 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {formatDigital(totalMines - flagCount)}
            </span>
          </div>

          {/* Interactive Smiley Face Button */}
          <button
            onClick={() => {
              sounds.playClick();
              resetGame();
            }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 border-3 border-amber-600 shadow-md flex items-center justify-center text-2xl cursor-pointer active:scale-95 transition-transform"
            title="Nhấn để bắt đầu lại ván mới (Phím tắt: R)"
          >
            {gameStatus === 'won' ? '😎' : gameStatus === 'lost' ? '😵' : smileyState === 'surprised' ? '😮' : '🙂'}
          </button>

          {/* Digital Timer */}
          <div className="bg-black border-2 border-red-950 px-3 py-1 rounded-lg shadow-inner">
            <span className="font-mono text-2xl font-black text-red-600 tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {formatDigital(timer)}
            </span>
          </div>
        </div>

        {/* Scrollable Grid Canvas */}
        <div className="w-full max-w-full overflow-x-auto p-2 rounded-2xl bg-slate-950/80 border-4 border-slate-700 shadow-2xl flex justify-center">
          <div
            className="grid gap-[2px] p-2 bg-slate-800 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              width: cols > 18 ? `${cols * 28}px` : 'auto'
            }}
            onContextMenu={e => e.preventDefault()}
          >
            {board.map((rowArr, rIdx) =>
              rowArr.map((cell, cIdx) => {
                const isRevealed = cell.isRevealed;
                const isMine = cell.isMine;
                const isFlagged = cell.isFlagged;
                const isExploded = cell.isExploded;
                const isFalseFlag = cell.isFalseFlag;
                const adjacent = cell.adjacentMines;

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onMouseDown={() => {
                      if (gameStatus === 'playing') setSmileyState('surprised');
                    }}
                    onMouseUp={() => {
                      if (gameStatus === 'playing') setSmileyState('normal');
                    }}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    onContextMenu={e => {
                      e.preventDefault();
                      handleToggleFlag(rIdx, cIdx);
                    }}
                    onTouchStart={() => {
                      // Support mobile long-press for flagging
                      isLongPressRef.current = false;
                      longPressTimeoutRef.current = setTimeout(() => {
                        isLongPressRef.current = true;
                        handleToggleFlag(rIdx, cIdx);
                      }, 400);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimeoutRef.current) {
                        clearTimeout(longPressTimeoutRef.current);
                      }
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-mono font-bold text-sm select-none cursor-pointer transition-colors duration-100 rounded-[3px] ${
                      isRevealed
                        ? isExploded
                          ? 'bg-red-600 text-white shadow-inner animate-pulse'
                          : isMine
                          ? 'bg-slate-700 shadow-inner'
                          : 'bg-slate-300 dark:bg-slate-800 border border-slate-700/50 shadow-inner'
                        : isFlagged
                        ? 'bg-gradient-to-br from-slate-600 to-slate-800 border-t-2 border-l-2 border-slate-500 border-b-2 border-r-2 border-slate-900 shadow-sm'
                        : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 border-t-2 border-l-2 border-slate-400 border-b-2 border-r-2 border-slate-900 shadow-sm active:border-slate-800'
                    }`}
                  >
                    {/* Render Revealed Mine */}
                    {isRevealed && isMine && (
                      <span className="text-base leading-none drop-shadow">💣</span>
                    )}

                    {/* Render False Flag after Loss */}
                    {isFalseFlag && (
                      <span className="text-base text-red-500 font-black relative">
                        🚩<span className="absolute inset-0 text-black text-lg">✕</span>
                      </span>
                    )}

                    {/* Render Flag on Hidden Cell */}
                    {!isRevealed && isFlagged && (
                      <span className="text-sm leading-none drop-shadow animate-[scaleIn_0.1s_ease-out]">🚩</span>
                    )}

                    {/* Render Number on Revealed Safe Cell */}
                    {isRevealed && !isMine && adjacent > 0 && (
                      <span className={NUMBER_COLORS[adjacent] || 'text-white'}>
                        {adjacent}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Win Banner Announcement */}
        {gameStatus === 'won' && (
          <div className="w-full max-w-md mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 text-slate-950 shadow-2xl border-2 border-white flex flex-col items-center text-center animate-bounce">
            <span className="text-3xl">🎉 🏆 😎</span>
            <h3 className="font-serif font-black text-xl tracking-wide mt-1">
              XUẤT SẮC! BẠN ĐÃ THẮNG!
            </h3>
            <p className="text-xs font-bold mt-1">
              Thời gian hoàn thành: <strong>{timer} giây</strong> • Cấp độ: <strong>{difficulty.toUpperCase()}</strong>
            </p>
            <p className="text-xs text-emerald-900 font-extrabold mt-1">
              🪙 Phần thưởng: +{difficulty === 'intermediate' ? 12 : difficulty === 'expert' ? 25 : 5} Xu đã được cộng vào ví của bạn!
            </p>
            <button
              onClick={() => resetGame()}
              className="mt-3 py-1.5 px-5 bg-slate-950 text-white font-black rounded-xl text-xs shadow-lg hover:bg-slate-900 cursor-pointer"
            >
              🔄 Chơi Tiếp Ván Khác
            </button>
          </div>
        )}

        {/* Loss Banner Announcement */}
        {gameStatus === 'lost' && (
          <div className="w-full max-w-md mt-4 p-3 rounded-2xl bg-red-950/90 text-red-200 border-2 border-red-500 shadow-xl flex items-center justify-between text-xs animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💥</span>
              <div>
                <p className="font-bold text-white">Bạn đã giẫm phải mìn! (Game Over)</p>
                <p className="text-[10px] text-red-300">Đừng nản lòng, hãy nhấn mặt cười hoặc nút bên để chơi lại!</p>
              </div>
            </div>
            <button
              onClick={() => resetGame()}
              className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shrink-0 cursor-pointer shadow-md"
            >
              Chơi Lại ↺
            </button>
          </div>
        )}

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between w-full max-w-xl text-[10px] opacity-70 mt-3 pt-2 border-t border-white/10">
          <span>Chuột trái: Mở ô • Chuột phải: Cắm cờ • Bấm số: Mở nhanh (Chord)</span>
          <span className="hidden sm:inline">Phím tắt: R (Chơi lại), F (Đổi cờ)</span>
        </div>

      </div>

      {/* ================= MODAL: HOW TO PLAY ================= */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3.5 animate-[zoomIn_0.2s_ease-out]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-serif font-black text-base text-amber-300 flex items-center gap-2">
                <span>📜</span> Hướng Dẫn Luật Chơi Dò Mìn (Minesweeper)
              </h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2.5 text-slate-300 max-h-[60vh] overflow-y-auto pr-1 leading-relaxed">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-amber-200">1. Mục Tiêu Trò Chơi</p>
                <p>Khám phá toàn bộ các ô an toàn trên bản đồ mà không được giẫm vào bất kỳ quả mìn nào.</p>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-amber-200">2. Ý Nghĩa Của Các Con Số</p>
                <p>Con số hiển thị trong ô cho biết có chính xác bao nhiêu quả mìn nằm trong 8 ô vuông xung quanh ô đó (ngang, dọc, chéo).</p>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-amber-200">3. Cắm Cờ (Flags)</p>
                <p>Dùng chuột phải (hoặc chuyển sang chế độ 🚩 trên điện thoại) để cắm cờ đánh dấu ô bạn nghi ngờ có mìn.</p>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-amber-200">4. Mở Nhanh Xung Quanh (Chording)</p>
                <p>Khi bạn đã cắm đủ số cờ quanh một ô số, nhấp vào chính ô số đó để tự động mở tất cả các ô còn lại xung quanh cùng lúc!</p>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-amber-200">5. Phần Thưởng Xu</p>
                <p>Mỗi ván thắng sẽ tặng bạn xu tích lũy dùng để mở khóa các bot AI Studio độc quyền.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
            >
              Đã Hiểu, Quay Lại Trò Chơi
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: STATISTICS ================= */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-[zoomIn_0.2s_ease-out]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-serif font-black text-base text-amber-300 flex items-center gap-2">
                <span>🏆</span> Bảng Thành Tích Dò Mìn
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xl font-black text-amber-400">{stats.gamesPlayed}</p>
                <p className="text-[10px] opacity-75">Trận đã chơi</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xl font-black text-emerald-400">
                  {stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%'}
                </p>
                <p className="text-[10px] opacity-75">Tỷ lệ thắng ({stats.gamesWon} trận)</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
              <p className="font-bold text-amber-200 mb-2">⏱️ Kỷ Lục Thời Gian Nhanh Nhất:</p>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>🥇 Tân Thủ (9×9):</span>
                <span className="font-mono font-bold text-amber-300">{formatTime(stats.bestTimeBeginner)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span>🥈 Trung Cấp (16×16):</span>
                <span className="font-mono font-bold text-amber-300">{formatTime(stats.bestTimeIntermediate)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>🥉 Chuyên Gia (30×16):</span>
                <span className="font-mono font-bold text-amber-300">{formatTime(stats.bestTimeExpert)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
