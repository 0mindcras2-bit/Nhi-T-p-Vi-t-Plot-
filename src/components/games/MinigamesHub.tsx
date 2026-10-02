import React, { useState } from 'react';
import { MinesweeperGame } from './MinesweeperGame';
import { GoGame } from './GoGame';
import { UnoGame } from './UnoGame';
import { TarotGame } from './TarotGame';
import { BlockBlastGame } from './BlockBlastGame';
import { MemoryGame } from './MemoryGame';
import { sounds } from '../../utils/audio';

interface MinigamesHubProps {
  coins: number;
  onEarnCoins: (amount: number, reason: string) => void;
}

type ActiveGame = 'minesweeper' | 'go' | 'uno' | 'tarot' | 'block_blast' | 'memory';

export const MinigamesHub: React.FC<MinigamesHubProps> = ({
  coins,
  onEarnCoins
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGame>('minesweeper');

  const games = [
    {
      id: 'minesweeper' as ActiveGame,
      title: 'Dò Mìn (Mines)',
      icon: '💣',
      desc: 'Phá mìn nhận xu thưởng hấp dẫn'
    },
    {
      id: 'go' as ActiveGame,
      title: 'Cờ Vây (Go)',
      icon: '⚪⚫',
      desc: 'Chiến thuật bao vây & chiếm đất'
    },
    {
      id: 'uno' as ActiveGame,
      title: 'Bài UNO',
      icon: '🎴',
      desc: 'Đại chiến bài màu & hô UNO!'
    },
    {
      id: 'tarot' as ActiveGame,
      title: 'Tarot Tiên Tri',
      icon: '🔮',
      desc: 'Giải đáp tình duyên, học tập, sự nghiệp'
    },
    {
      id: 'block_blast' as ActiveGame,
      title: 'Blocks Blast',
      icon: '🧱',
      desc: 'Xếp hình phá khối nhận điểm & xu'
    },
    {
      id: 'memory' as ActiveGame,
      title: 'Lật Hình Giống',
      icon: '🃏',
      desc: 'Ghép cặp các linh thú huyền bí'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:px-4">
      {/* Title & Coin Balance Bar */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-bold mb-2 shadow-xs">
          <span>🪙</span>
          <span>Ví Tiền Của Bạn: {coins} Xu (Dùng để mở khóa bot AI Studio)</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-950">
          Khu Vực Trò Chơi Kỳ Ảo
        </h2>
        <p className="text-xs text-rose-700/80 mt-1">
          Chơi Dò Mìn, Cờ Vây, UNO và các minigame để nhận thưởng Xu mở khóa bot độc quyền
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => {
              sounds.playClick();
              setActiveGame(game.id);
            }}
            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
              activeGame === game.id
                ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102 font-semibold'
                : 'bg-white/80 text-rose-900 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <span className="text-2xl mb-1">{game.icon}</span>
            <span className="text-xs font-bold truncate w-full">{game.title}</span>
            <span
              className={`text-[9px] mt-0.5 line-clamp-1 ${
                activeGame === game.id ? 'text-rose-100' : 'text-gray-500'
              }`}
            >
              {game.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Render Selected Game */}
      <div>
        {activeGame === 'minesweeper' && <MinesweeperGame onEarnCoins={onEarnCoins} />}
        {activeGame === 'go' && <GoGame onEarnCoins={onEarnCoins} />}
        {activeGame === 'uno' && <UnoGame onEarnCoins={onEarnCoins} />}
        {activeGame === 'tarot' && <TarotGame onEarnCoins={onEarnCoins} />}
        {activeGame === 'block_blast' && <BlockBlastGame onEarnCoins={onEarnCoins} />}
        {activeGame === 'memory' && <MemoryGame onEarnCoins={onEarnCoins} />}
      </div>
    </div>
  );
};
