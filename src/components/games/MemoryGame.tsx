import React, { useState, useEffect, useCallback } from 'react';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';

interface MemoryGameProps {
  onEarnCoins: (amount: number, reason: string) => void;
}

interface CardItem {
  uid: string;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Full rich pool of symbols including all user requested icons: 💐, ☄️, 🐏, 🪼, 🍅, 🧋, 🃏, 🪄, 🧸
const SYMBOL_POOL = [
  '💐', // Bó hoa
  '☄️', // Sao chổi
  '🐏', // Cừu / Bạch dương
  '🪼', // Sứa biển
  '🍅', // Cà chua
  '🧋', // Trà sữa
  '🃏', // Lá bài Joker
  '🪄', // Đũa phép
  '🧸', // Gấu bông
  '🌹', // Hoa hồng
  '🐟', // Cá nóc DJ 🎵
  '🐥', // Gà con
  '🐋', // Cá voi
  '⭐', // Ngôi sao
  '👑', // Vương miện
  '🔮', // Cầu pha lê
  '📜', // Cuộn thư
];

type GridMode = 8 | 10 | 12;

export const MemoryGame: React.FC<MemoryGameProps> = ({ onEarnCoins }) => {
  const [pairCount, setPairCount] = useState<GridMode>(8);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const initGame = useCallback((count: GridMode = pairCount) => {
    sounds.playGateOpen();

    // Randomly select `count` unique symbols from SYMBOL_POOL
    const shuffledPool = [...SYMBOL_POOL].sort(() => Math.random() - 0.5);
    const chosenSymbols = shuffledPool.slice(0, count);

    const deck: CardItem[] = [];
    chosenSymbols.forEach((sym, idx) => {
      deck.push({
        uid: `${idx}-a`,
        symbol: sym,
        isFlipped: false,
        isMatched: false
      });
      deck.push({
        uid: `${idx}-b`,
        symbol: sym,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle deck
    deck.sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsCompleted(false);
    setIsLocked(false);
  }, [pairCount]);

  useEffect(() => {
    initGame(pairCount);
  }, [pairCount, initGame]);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    sounds.playCardFlip();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsLocked(true);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.symbol === secondCard.symbol) {
        // Matched! Keep them permanently flipped face-up
        setTimeout(() => {
          sounds.playCoin();
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setCards([...newCards]);
          setFlippedIndices([]);
          setIsLocked(false);

          const newMatchCount = matches + 1;
          setMatches(newMatchCount);

          if (newMatchCount === pairCount) {
            // Victory!
            setIsCompleted(true);
            sounds.playUnlock();
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 }
            });
            const reward = pairCount === 12 ? 30 : pairCount === 10 ? 20 : 15;
            onEarnCoins(reward, `Hoàn thành ghép ${pairCount} cặp thẻ hình giống! (+${reward} xu)`);
          }
        }, 400);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 850);
      }
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl border-2 border-rose-300 p-4 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-2xl shadow-md border border-white/50">
            🃏
          </div>
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-1.5">
              <span>Lật Hình Cặp Đôi Kỳ Ảo</span>
            </h3>
            <p className="text-xs text-rose-700 font-medium">
              Tìm các cặp biểu tượng giống nhau • Thẻ trùng sẽ lật hẳn lên rõ nét
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-rose-50 border-2 border-rose-200 px-3.5 py-1.5 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Số lượt lật</span>
            <span className="text-base sm:text-lg font-black text-rose-950 font-mono">{moves}</span>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-300 px-3.5 py-1.5 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Đã ghép</span>
            <span className="text-base sm:text-lg font-black text-emerald-950 font-mono">{matches} / {pairCount}</span>
          </div>
          <button
            onClick={() => initGame(pairCount)}
            className="text-xs px-3.5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>🔄</span> <span>Ván Mới</span>
          </button>
        </div>
      </div>

      {/* Grid Mode Selector (8 / 10 / 12 pairs) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5 bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <span className="text-xs font-bold text-slate-700 px-2">
          Chọn số lượng cặp thẻ:
        </span>
        <div className="flex items-center gap-1.5">
          {([8, 10, 12] as GridMode[]).map(cnt => (
            <button
              key={cnt}
              onClick={() => {
                sounds.playClick();
                setPairCount(cnt);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                pairCount === cnt
                  ? 'bg-rose-500 text-white shadow-md font-black scale-105'
                  : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200'
              }`}
            >
              {cnt} Cặp ({cnt * 2} thẻ)
            </button>
          ))}
        </div>
      </div>

      {/* Victory Banner */}
      {isCompleted && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-100 via-rose-100 to-emerald-100 border-2 border-amber-400 rounded-3xl text-center shadow-lg animate-bounce">
          <h4 className="font-serif text-lg sm:text-xl font-black text-slate-900 mb-1">
            🎉 XUẤT SẮC! BẠN ĐÃ TÌM HẾT CÁC CẶP HÌNH!
          </h4>
          <p className="text-xs sm:text-sm text-slate-800 font-medium">
            Hoàn thành trong <strong>{moves} lượt lật</strong> • Nhận thưởng <strong className="text-emerald-700 font-black">+{pairCount === 12 ? 30 : pairCount === 10 ? 20 : 15} Xu 🪙</strong>
          </p>
          <button
            onClick={() => initGame(pairCount)}
            className="mt-3 px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800 transition-all cursor-pointer"
          >
            Chơi Thêm Ván Nữa 🔄
          </button>
        </div>
      )}

      {/* Cards Grid: Ultra-clear, fully flipped when matched, no text label overlay */}
      <div className={`grid gap-3 sm:gap-4 max-w-2xl mx-auto ${
        pairCount === 12
          ? 'grid-cols-4 sm:grid-cols-6'
          : pairCount === 10
          ? 'grid-cols-4 sm:grid-cols-5'
          : 'grid-cols-4'
      }`}>
        {cards.map((card, idx) => {
          const isOpen = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.uid}
              onClick={() => handleCardClick(idx)}
              className="aspect-square relative cursor-pointer select-none [perspective:1000px] group"
            >
              <div
                className={`w-full h-full rounded-2xl transition-all duration-400 [transform-style:preserve-3d] ${
                  isOpen ? '[transform:rotateY(180deg)]' : 'group-hover:scale-102 group-hover:-translate-y-0.5'
                }`}
              >
                {/* Front (Hidden Face / Elegant Royal Back of Card) */}
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-rose-800 via-purple-900 to-slate-900 border-2 border-amber-300 shadow-md flex items-center justify-center [backface-visibility:hidden] transition-shadow hover:shadow-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-amber-300/40 bg-white/5 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl text-amber-200 filter drop-shadow">
                      ✨
                    </span>
                  </div>
                </div>

                {/* Back (Revealed Face: Crystal clear, no text, clean emoji presentation) */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-2xl shadow-md flex items-center justify-center p-2 [transform:rotateY(180deg)] [backface-visibility:hidden] transition-all ${
                    card.isMatched
                      ? 'bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-400 ring-2 ring-emerald-300/60 shadow-md'
                      : 'bg-gradient-to-br from-white via-rose-50 to-pink-50 border-2 border-rose-400 ring-2 ring-rose-200 shadow-lg'
                  }`}
                >
                  <span className="text-4xl sm:text-5xl select-none filter drop-shadow-sm transition-transform duration-200">
                    {card.symbol}
                  </span>

                  {/* Subtle completed check indicator on matched cards */}
                  {card.isMatched && (
                    <span className="absolute top-1.5 right-1.5 text-[10px] text-emerald-600 bg-emerald-100 font-black rounded-full w-4 h-4 flex items-center justify-center shadow-2xs">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
