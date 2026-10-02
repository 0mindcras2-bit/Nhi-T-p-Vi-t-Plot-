import React, { useState, useEffect } from 'react';
import { sounds } from '../../utils/audio';

interface BlockBlastProps {
  onEarnCoins: (amount: number, reason: string) => void;
}

type Grid = (string | null)[][];

interface Shape {
  id: string;
  matrix: number[][]; // 1 for filled, 0 for empty
  color: string;
}

const SHAPE_TEMPLATES: { matrix: number[][]; color: string }[] = [
  // 1x1 dot
  { matrix: [[1]], color: '#f43f5e' },
  // 2x2 square
  { matrix: [[1, 1], [1, 1]], color: '#ec4899' },
  // 3x1 line horizontal
  { matrix: [[1, 1, 1]], color: '#8b5cf6' },
  // 1x3 line vertical
  { matrix: [[1], [1], [1]], color: '#6366f1' },
  // 4x1 line horizontal
  { matrix: [[1, 1, 1, 1]], color: '#3b82f6' },
  // 1x4 line vertical
  { matrix: [[1], [1], [1], [1]], color: '#06b6d4' },
  // L shape
  { matrix: [[1, 0], [1, 0], [1, 1]], color: '#10b981' },
  // Reverse L
  { matrix: [[0, 1], [0, 1], [1, 1]], color: '#f59e0b' },
  // Corner 2x2
  { matrix: [[1, 1], [1, 0]], color: '#f97316' },
  // T shape
  { matrix: [[1, 1, 1], [0, 1, 0]], color: '#d946ef' }
];

export const BlockBlastGame: React.FC<BlockBlastProps> = ({ onEarnCoins }) => {
  const [grid, setGrid] = useState<Grid>(() =>
    Array(8).fill(null).map(() => Array(8).fill(null))
  );
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [availableShapes, setAvailableShapes] = useState<Shape[]>([]);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lastBlastMsg, setLastBlastMsg] = useState<string>('');

  // Spawn 3 random shapes
  const spawnShapes = () => {
    const newShapes: Shape[] = [];
    for (let i = 0; i < 3; i++) {
      const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
      newShapes.push({
        id: `shape-${Date.now()}-${i}-${Math.random()}`,
        matrix: template.matrix,
        color: template.color
      });
    }
    setAvailableShapes(newShapes);
    setSelectedShapeIndex(0);
  };

  useEffect(() => {
    spawnShapes();
  }, []);

  const canPlaceShape = (shape: Shape, startR: number, startC: number, currentGrid: Grid): boolean => {
    const rows = shape.matrix.length;
    const cols = shape.matrix[0].length;

    if (startR + rows > 8 || startC + cols > 8) return false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape.matrix[r][c] === 1) {
          if (currentGrid[startR + r][startC + c] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Check if any available shape can be placed
  const checkHasMoves = (shapes: Shape[], currentGrid: Grid): boolean => {
    for (const shape of shapes) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (canPlaceShape(shape, r, c, currentGrid)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedShapeIndex === null || gameOver) return;
    const shape = availableShapes[selectedShapeIndex];
    if (!shape) return;

    if (!canPlaceShape(shape, r, c, grid)) {
      sounds.playClick();
      return;
    }

    sounds.playCardFlip();

    // Place shape
    const newGrid = grid.map(row => [...row]);
    const shapeRows = shape.matrix.length;
    const shapeCols = shape.matrix[0].length;
    let placedBlocks = 0;

    for (let row = 0; row < shapeRows; row++) {
      for (let col = 0; col < shapeCols; col++) {
        if (shape.matrix[row][col] === 1) {
          newGrid[r + row][c + col] = shape.color;
          placedBlocks++;
        }
      }
    }

    // Check completed rows & cols
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let row = 0; row < 8; row++) {
      if (newGrid[row].every(cell => cell !== null)) {
        fullRows.push(row);
      }
    }

    for (let col = 0; col < 8; col++) {
      let isFull = true;
      for (let row = 0; row < 8; row++) {
        if (newGrid[row][col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        fullCols.push(col);
      }
    }

    // Blast lines
    const totalLines = fullRows.length + fullCols.length;
    let earnedPoints = placedBlocks * 10;

    if (totalLines > 0) {
      sounds.playBlast();

      // Clear rows
      for (const row of fullRows) {
        for (let col = 0; col < 8; col++) {
          newGrid[row][col] = null;
        }
      }
      // Clear cols
      for (const col of fullCols) {
        for (let row = 0; row < 8; row++) {
          newGrid[row][col] = null;
        }
      }

      earnedPoints += totalLines * 100 * totalLines; // Combo multiplier!
      const earnedCoins = totalLines * 5;
      onEarnCoins(earnedCoins, `Phá vỡ ${totalLines} hàng/cột Block Blast! (+${earnedCoins} xu)`);
      setLastBlastMsg(`💥 COMBO BLAST x${totalLines}! +${earnedCoins} Xu 🪙`);
      setTimeout(() => setLastBlastMsg(''), 2500);
    }

    const newScore = score + earnedPoints;
    setScore(newScore);
    if (newScore > highScore) setHighScore(newScore);
    setGrid(newGrid);

    // Remove used shape
    const remaining = availableShapes.filter((_, idx) => idx !== selectedShapeIndex);

    if (remaining.length === 0) {
      spawnShapes();
    } else {
      setAvailableShapes(remaining);
      setSelectedShapeIndex(0);
      // Check if remaining shapes have valid moves
      if (!checkHasMoves(remaining, newGrid)) {
        setGameOver(true);
      }
    }
  };

  const handleRestart = () => {
    sounds.playGateOpen();
    setGrid(Array(8).fill(null).map(() => Array(8).fill(null)));
    setScore(0);
    setGameOver(false);
    spawnShapes();
  };

  // Preview cell state
  const isCellPreview = (r: number, c: number): boolean => {
    if (hoverRow === null || hoverCol === null || selectedShapeIndex === null) return false;
    const shape = availableShapes[selectedShapeIndex];
    if (!shape) return false;

    const shapeRows = shape.matrix.length;
    const shapeCols = shape.matrix[0].length;

    const relR = r - hoverRow;
    const relC = c - hoverCol;

    if (relR >= 0 && relR < shapeRows && relC >= 0 && relC < shapeCols) {
      return shape.matrix[relR][relC] === 1;
    }
    return false;
  };

  const isValidPlacementAtHover = (): boolean => {
    if (hoverRow === null || hoverCol === null || selectedShapeIndex === null) return false;
    const shape = availableShapes[selectedShapeIndex];
    if (!shape) return false;
    return canPlaceShape(shape, hoverRow, hoverCol, grid);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-rose-200/80 p-5 sm:p-7 shadow-lg">
      {/* Title & Score Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center text-2xl shadow-md">
            🧱
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-950">
              Blocks Blast Hoa Hồng
            </h3>
            <p className="text-xs text-rose-700/80">
              Xếp đầy hàng hoặc cột để phá nổ và nhận xu thưởng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-rose-600 font-bold uppercase block">Điểm số</span>
            <span className="text-base font-extrabold text-rose-950">{score}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-amber-700 font-bold uppercase block">Kỷ lục</span>
            <span className="text-base font-extrabold text-amber-900">{highScore}</span>
          </div>
          <button
            onClick={handleRestart}
            className="text-xs px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xl border border-rose-300 transition-colors"
          >
            Chơi Lại 🔄
          </button>
        </div>
      </div>

      {lastBlastMsg && (
        <div className="mb-3 p-2 bg-gradient-to-r from-amber-400 to-rose-400 text-white text-center font-bold text-xs rounded-xl shadow-md animate-bounce">
          {lastBlastMsg}
        </div>
      )}

      {/* Main Game Layout */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        {/* 8x8 Grid Container */}
        <div className="relative p-3 bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-purple-950/80 rounded-3xl shadow-xl border-2 border-rose-300">
          <div
            className="grid grid-cols-8 gap-1 sm:gap-1.5"
            onMouseLeave={() => {
              setHoverRow(null);
              setHoverCol(null);
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const preview = isCellPreview(r, c);
                const valid = isValidPlacementAtHover();

                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseEnter={() => {
                      setHoverRow(r);
                      setHoverCol(c);
                    }}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all cursor-pointer relative flex items-center justify-center ${
                      cell
                        ? 'shadow-md border border-white/40 scale-95'
                        : preview
                        ? valid
                          ? 'bg-rose-400/80 border-2 border-white animate-pulse'
                          : 'bg-red-500/40 border border-red-400'
                        : 'bg-white/10 hover:bg-white/20 border border-white/5'
                    }`}
                    style={cell ? { backgroundColor: cell } : {}}
                  >
                    {cell && <span className="text-[10px] text-white/50">✦</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center text-white">
              <span className="text-4xl mb-2">💫</span>
              <h4 className="font-serif text-xl font-bold mb-1 text-rose-300">
                Không Còn Nước Đi Hợp Lệ!
              </h4>
              <p className="text-xs text-gray-300 mb-4">
                Bạn đã đạt {score} điểm trong lượt chơi này!
              </p>
              <button
                onClick={handleRestart}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Chơi Ván Mới 🌟
              </button>
            </div>
          )}
        </div>

        {/* Available Shapes Drawer */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-bold text-rose-950">
            Chọn khối để đặt vào bàn cờ:
          </span>
          <div className="flex lg:flex-col gap-3">
            {availableShapes.map((shape, idx) => {
              const isSelected = selectedShapeIndex === idx;
              return (
                <div
                  key={shape.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedShapeIndex(idx);
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center bg-white/90 ${
                    isSelected
                      ? 'border-rose-500 shadow-md scale-105 bg-rose-50/80'
                      : 'border-rose-200/80 hover:bg-rose-50/40'
                  }`}
                >
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${shape.matrix[0].length}, minmax(0, 1fr))`
                    }}
                  >
                    {shape.matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`${r}-${c}`}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded-md"
                          style={{
                            backgroundColor: val === 1 ? shape.color : 'transparent'
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-rose-600 max-w-[200px] text-center mt-1">
            Mẹo: Phá nổ đồng thời nhiều hàng hoặc cột để nhân điểm và xu thưởng!
          </p>
        </div>
      </div>
    </div>
  );
};
