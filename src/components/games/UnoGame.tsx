import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { sounds } from '../../utils/audio';

export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4';

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
  points: number;
}

export interface UnoPlayer {
  id: string;
  name: string;
  isAi: boolean;
  hand: UnoCard[];
  calledUno: boolean;
  score: number;
}

interface UnoStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  highestScore: number;
  totalUnoCalls: number;
}

interface UnoGameProps {
  onEarnCoins?: (amount: number, reason: string) => void;
}

const COLOR_MAP: Record<CardColor, { bg: string; text: string; nameVi: string; border: string; glow: string }> = {
  red: { bg: 'bg-red-600', text: 'text-red-500', nameVi: 'Đỏ', border: 'border-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]' },
  yellow: { bg: 'bg-amber-400', text: 'text-amber-500', nameVi: 'Vàng', border: 'border-amber-300', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.6)]' },
  green: { bg: 'bg-emerald-600', text: 'text-emerald-500', nameVi: 'Xanh Lá', border: 'border-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-500', nameVi: 'Xanh Dương', border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]' },
  wild: { bg: 'bg-slate-900', text: 'text-purple-400', nameVi: 'Đổi Màu', border: 'border-purple-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.7)]' }
};

export const UnoGame: React.FC<UnoGameProps> = ({ onEarnCoins }) => {
  // Screens: 'menu' | 'play' | 'gameover' | 'rules' | 'settings'
  const [screen, setScreen] = useState<'menu' | 'play' | 'gameover' | 'rules'>('menu');

  // Game Settings
  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Core Game State
  const [players, setPlayers] = useState<UnoPlayer[]>([]);
  const [drawPile, setDrawPile] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [activeColor, setActiveColor] = useState<CardColor>('red');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [turnDirection, setTurnDirection] = useState<1 | -1>(1); // 1 = clockwise, -1 = counter-clockwise
  const [winner, setWinner] = useState<UnoPlayer | null>(null);

  // Interactive Flow States
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Trận đấu UNO bắt đầu!');
  const [unoBanner, setUnoBanner] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Statistics
  const [stats, setStats] = useState<UnoStats>(() => {
    try {
      const saved = localStorage.getItem('nhi_uno_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      highestScore: 0,
      totalUnoCalls: 0
    };
  });

  const saveStats = (newStats: UnoStats) => {
    setStats(newStats);
    try {
      localStorage.setItem('nhi_uno_stats', JSON.stringify(newStats));
    } catch {}
  };

  const playSfx = useCallback((type: 'play' | 'draw' | 'uno' | 'win' | 'special') => {
    if (!soundEnabled) return;
    try {
      if (type === 'play') sounds.playClick();
      else if (type === 'draw') sounds.playClick();
      else if (type === 'uno') sounds.playUnlock();
      else if (type === 'win') sounds.playUnlock();
      else if (type === 'special') sounds.playGateOpen();
    } catch {}
  }, [soundEnabled]);

  // Generate Standard 108-Card Deck
  const generateDeck = (): UnoCard[] => {
    const deck: UnoCard[] = [];
    const colors: CardColor[] = ['red', 'yellow', 'green', 'blue'];

    let cardIdCounter = 1;

    colors.forEach(color => {
      // 1x '0' card
      deck.push({ id: `c-${cardIdCounter++}`, color, value: '0', points: 0 });

      // 2x '1'-'9' cards
      for (let n = 1; n <= 9; n++) {
        const val = n.toString() as CardValue;
        deck.push({ id: `c-${cardIdCounter++}`, color, value: val, points: n });
        deck.push({ id: `c-${cardIdCounter++}`, color, value: val, points: n });
      }

      // 2x Skip, Reverse, Draw Two
      deck.push({ id: `c-${cardIdCounter++}`, color, value: 'skip', points: 20 });
      deck.push({ id: `c-${cardIdCounter++}`, color, value: 'skip', points: 20 });
      deck.push({ id: `c-${cardIdCounter++}`, color, value: 'reverse', points: 20 });
      deck.push({ id: `c-${cardIdCounter++}`, color, value: 'reverse', points: 20 });
      deck.push({ id: `c-${cardIdCounter++}`, color, value: 'draw2', points: 20 });
      deck.push({ id: `c-${cardIdCounter++}`, color, value: 'draw2', points: 20 });
    });

    // 4x Wild & 4x Wild Draw Four
    for (let w = 0; w < 4; w++) {
      deck.push({ id: `c-${cardIdCounter++}`, color: 'wild', value: 'wild', points: 50 });
      deck.push({ id: `c-${cardIdCounter++}`, color: 'wild', value: 'wild4', points: 50 });
    }

    // Shuffle deck thoroughly (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  // Start / Reset New Game
  const handleStartGame = (playerCount: number = numPlayers) => {
    setNumPlayers(playerCount);
    const fullDeck = generateDeck();

    // Create Players
    const newPlayers: UnoPlayer[] = [];
    newPlayers.push({
      id: 'player-human',
      name: 'Bạn (Người Chơi)',
      isAi: false,
      hand: fullDeck.splice(0, 7),
      calledUno: false,
      score: 0
    });

    const aiNames = ['Tiểu Hoa (AI)', 'Rafayel (AI)', 'Ngân Hà (AI)'];
    for (let i = 1; i < playerCount; i++) {
      newPlayers.push({
        id: `player-ai-${i}`,
        name: aiNames[i - 1] || `AI ${i}`,
        isAi: true,
        hand: fullDeck.splice(0, 7),
        calledUno: false,
        score: 0
      });
    }

    // Top card for discard pile (ensure it's not a Wild card for fair start)
    let initialTopIdx = fullDeck.findIndex(c => c.color !== 'wild');
    if (initialTopIdx === -1) initialTopIdx = 0;
    const initialTop = fullDeck.splice(initialTopIdx, 1)[0];

    setPlayers(newPlayers);
    setDrawPile(fullDeck);
    setDiscardPile([initialTop]);
    setActiveColor(initialTop.color);
    setCurrentPlayerIdx(0);
    setTurnDirection(1);
    setWinner(null);
    setShowColorPicker(false);
    setPendingWildCard(null);
    setUnoBanner(null);
    setStatusMessage(`Trận đấu bắt đầu! Lá bài mở đầu là ${COLOR_MAP[initialTop.color]?.nameVi} ${initialTop.value.toUpperCase()}. Đến lượt bạn!`);
    setScreen('play');
    sounds.playCoin();
  };

  const topDiscard = discardPile[discardPile.length - 1];

  // Check if a card can be legally played
  const isCardPlayable = useCallback((card: UnoCard): boolean => {
    if (!topDiscard) return false;
    // Wild cards can always be played
    if (card.color === 'wild') return true;
    // Matching active color
    if (card.color === activeColor) return true;
    // Matching value/number
    if (card.value === topDiscard.value) return true;
    return false;
  }, [topDiscard, activeColor]);

  // Advance turn to the next player
  const advanceTurn = useCallback((
    step = 1,
    customPlayers?: UnoPlayer[],
    customDir?: 1 | -1
  ) => {
    const activeList = customPlayers || players;
    const dir = customDir ?? turnDirection;
    const total = activeList.length;
    let nextIdx = (currentPlayerIdx + dir * step) % total;
    if (nextIdx < 0) nextIdx += total;

    setCurrentPlayerIdx(nextIdx);

    const nextP = activeList[nextIdx];
    if (!nextP.isAi) {
      setStatusMessage('Đến lượt của bạn! Hãy chọn một lá bài phù hợp hoặc bốc bài.');
    } else {
      setStatusMessage(`Đến lượt của ${nextP.name}...`);
    }
  }, [players, turnDirection, currentPlayerIdx]);

  // Reshuffle discard pile into draw pile if draw pile runs low
  const replenishDrawPileIfNeeded = (currentDraw: UnoCard[], currentDiscard: UnoCard[]): { draw: UnoCard[]; discard: UnoCard[] } => {
    if (currentDraw.length > 3) return { draw: currentDraw, discard: currentDiscard };

    const top = currentDiscard[currentDiscard.length - 1];
    const reusable = currentDiscard.slice(0, currentDiscard.length - 1);
    // Shuffle reusable cards
    for (let i = reusable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reusable[i], reusable[j]] = [reusable[j], reusable[i]];
    }

    return {
      draw: [...currentDraw, ...reusable],
      discard: [top]
    };
  };

  // Finish game round
  const handleRoundEnd = useCallback((roundWinner: UnoPlayer, finalPlayers: UnoPlayer[]) => {
    setWinner(roundWinner);
    setScreen('gameover');
    playSfx('win');

    // Calculate score from opponents' hands
    let earnedPoints = 0;
    finalPlayers.forEach(p => {
      if (p.id !== roundWinner.id) {
        p.hand.forEach(c => {
          earnedPoints += c.points;
        });
      }
    });

    const isHumanWin = !roundWinner.isAi;
    const newPlayed = stats.gamesPlayed + 1;
    const newWon = stats.gamesWon + (isHumanWin ? 1 : 0);
    const newStats: UnoStats = {
      gamesPlayed: newPlayed,
      gamesWon: newWon,
      winRate: Math.round((newWon / newPlayed) * 100),
      highestScore: Math.max(stats.highestScore, earnedPoints),
      totalUnoCalls: stats.totalUnoCalls + (roundWinner.calledUno ? 1 : 0)
    };
    saveStats(newStats);

    if (isHumanWin && onEarnCoins) {
      const reward = numPlayers * 3;
      onEarnCoins(reward, `Chiến thắng bài UNO trước ${numPlayers - 1} AI (+${reward} xu)`);
    }
  }, [playSfx, stats, onEarnCoins, numPlayers]);

  // Execute Playing a Card
  const executePlayCard = useCallback((
    playerIdx: number,
    card: UnoCard,
    chosenColor?: CardColor
  ) => {
    const curPlayer = players[playerIdx];
    const newHand = curPlayer.hand.filter(c => c.id !== card.id);

    // Check Uno call rule
    let unoPenaltyApplied = false;
    if (newHand.length === 1 && !curPlayer.calledUno && curPlayer.isAi) {
      // AI has 85% chance to remember calling UNO
      if (Math.random() < 0.85) {
        curPlayer.calledUno = true;
        setUnoBanner(`${curPlayer.name}: "UNO! ⚡"`);
        playSfx('uno');
        setTimeout(() => setUnoBanner(null), 2500);
      }
    }

    // Win condition check
    if (newHand.length === 0) {
      const updatedPlayers = players.map((p, idx) =>
        idx === playerIdx ? { ...p, hand: newHand } : p
      );
      setPlayers(updatedPlayers);
      setDiscardPile(prev => [...prev, card]);
      handleRoundEnd(curPlayer, updatedPlayers);
      return;
    }

    const updatedPlayers = players.map((p, idx) =>
      idx === playerIdx ? { ...p, hand: newHand } : p
    );

    const nextDiscard = [...discardPile, card];
    setDiscardPile(nextDiscard);
    playSfx('play');

    let nextColor: CardColor = card.color === 'wild' ? (chosenColor || 'red') : card.color;
    setActiveColor(nextColor);

    let nextDir = turnDirection;
    let step = 1;

    // Apply Card Effects
    if (card.value === 'reverse') {
      if (players.length === 2) {
        // In 2 players, reverse acts like skip
        step = 2;
        setStatusMessage(`${curPlayer.name} đánh Đảo Chiều (Skip đối thủ)!`);
      } else {
        nextDir = (turnDirection === 1 ? -1 : 1) as 1 | -1;
        setTurnDirection(nextDir);
        setStatusMessage(`${curPlayer.name} đánh Đảo Chiều! Hướng đi được đổi.`);
      }
      playSfx('special');
    } else if (card.value === 'skip') {
      step = 2;
      setStatusMessage(`${curPlayer.name} đánh Bỏ Lượt (Skip) người tiếp theo!`);
      playSfx('special');
    } else if (card.value === 'draw2') {
      step = 2;
      // Target draws 2 cards
      const targetIdx = (playerIdx + nextDir) % players.length;
      const actualTarget = targetIdx < 0 ? targetIdx + players.length : targetIdx;

      let { draw: currD, discard: currDis } = replenishDrawPileIfNeeded(drawPile, nextDiscard);
      const drawnCards = currD.splice(0, 2);
      setDrawPile(currD);

      updatedPlayers[actualTarget].hand.push(...drawnCards);
      setStatusMessage(`${curPlayer.name} đánh +2! ${updatedPlayers[actualTarget].name} bị rút 2 lá và mất lượt.`);
      playSfx('special');
    } else if (card.value === 'wild4') {
      step = 2;
      const targetIdx = (playerIdx + nextDir) % players.length;
      const actualTarget = targetIdx < 0 ? targetIdx + players.length : targetIdx;

      let { draw: currD, discard: currDis } = replenishDrawPileIfNeeded(drawPile, nextDiscard);
      const drawnCards = currD.splice(0, 4);
      setDrawPile(currD);

      updatedPlayers[actualTarget].hand.push(...drawnCards);
      setStatusMessage(`${curPlayer.name} đánh Đổi Màu +4! Đổi sang màu ${COLOR_MAP[nextColor].nameVi}, ${updatedPlayers[actualTarget].name} bị rút 4 lá!`);
      playSfx('special');
    } else if (card.value === 'wild') {
      setStatusMessage(`${curPlayer.name} đánh Đổi Màu sang ${COLOR_MAP[nextColor].nameVi}!`);
      playSfx('special');
    } else {
      setStatusMessage(`${curPlayer.name} đánh ${COLOR_MAP[card.color]?.nameVi} ${card.value}.`);
    }

    setPlayers(updatedPlayers);
    advanceTurn(step, updatedPlayers, nextDir);
  }, [players, discardPile, playSfx, handleRoundEnd, turnDirection, advanceTurn, drawPile]);

  // Human player clicks card from hand
  const handleHumanPlayCard = (card: UnoCard) => {
    if (currentPlayerIdx !== 0 || isAiProcessing) return;
    if (!isCardPlayable(card)) {
      setStatusMessage('Lá bài này không hợp lệ! Hãy chọn lá cùng màu, cùng số hoặc lá Đổi Màu (Wild).');
      return;
    }

    // If wild, open color picker modal
    if (card.color === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    executePlayCard(0, card);
  };

  // Color chosen from picker
  const handleConfirmColor = (color: CardColor) => {
    setShowColorPicker(false);
    if (!pendingWildCard) return;
    executePlayCard(0, pendingWildCard, color);
    setPendingWildCard(null);
  };

  // Player draws a card from Draw Pile
  const handleDrawCard = () => {
    if (currentPlayerIdx !== 0 || isAiProcessing) return;

    let { draw: currDraw, discard: currDisc } = replenishDrawPileIfNeeded(drawPile, discardPile);
    if (currDraw.length === 0) {
      setStatusMessage('Chồng bài rút đã hết!');
      advanceTurn();
      return;
    }

    const drawnCard = currDraw.shift()!;
    setDrawPile(currDraw);
    setDiscardPile(currDisc);

    const updatedPlayers = [...players];
    updatedPlayers[0].hand.push(drawnCard);
    setPlayers(updatedPlayers);
    playSfx('draw');

    // If drawn card can be played immediately
    if (isCardPlayable(drawnCard)) {
      setStatusMessage(`Bạn vừa bốc được ${COLOR_MAP[drawnCard.color]?.nameVi} ${drawnCard.value} và có thể đánh ngay!`);
    } else {
      setStatusMessage(`Bạn vừa bốc được 1 lá bài nhưng không đánh được. Chuyển lượt!`);
      advanceTurn(1, updatedPlayers);
    }
  };

  // Press the big "UNO!" button
  const handleCallUno = () => {
    const curP = players[0];
    if (curP.hand.length <= 2) {
      curP.calledUno = true;
      setUnoBanner('BẠN ĐÃ HÔ UNO! 🔥');
      playSfx('uno');
      setTimeout(() => setUnoBanner(null), 2500);
    } else {
      setStatusMessage('Bạn chưa đến 1 lá bài để hô UNO!');
    }
  };

  // AI Turn Execution Loop
  useEffect(() => {
    if (screen !== 'play' || winner !== null) return;
    const curP = players[currentPlayerIdx];
    if (!curP || !curP.isAi) return;

    setIsAiProcessing(true);
    const timer = setTimeout(() => {
      // Find all playable cards in AI hand
      const playable = curP.hand.filter(c => isCardPlayable(c));

      if (playable.length > 0) {
        let chosenCard = playable[0];

        // AI Strategy Selection
        if (aiDifficulty === 'normal') {
          // Prefer high point cards, save wild for later
          const nonWild = playable.filter(c => c.color !== 'wild');
          if (nonWild.length > 0) {
            nonWild.sort((a, b) => b.points - a.points);
            chosenCard = nonWild[0];
          } else {
            chosenCard = playable[0];
          }
        } else if (aiDifficulty === 'hard') {
          // Check if next player has 1 card: prioritize +2, +4, skip
          const nextIdx = (currentPlayerIdx + turnDirection + players.length) % players.length;
          const nextP = players[nextIdx];
          if (nextP.hand.length <= 2) {
            const attackCard = playable.find(c => c.value === 'draw2' || c.value === 'wild4' || c.value === 'skip');
            if (attackCard) chosenCard = attackCard;
          }
        }

        // Determine best color if Wild
        let chosenColor: CardColor = 'red';
        if (chosenCard.color === 'wild') {
          const colorCounts: Record<CardColor, number> = { red: 0, yellow: 0, green: 0, blue: 0, wild: 0 };
          curP.hand.forEach(c => {
            if (c.color !== 'wild') colorCounts[c.color]++;
          });
          const best = (['red', 'yellow', 'green', 'blue'] as CardColor[]).reduce((a, b) =>
            colorCounts[a] >= colorCounts[b] ? a : b
          );
          chosenColor = best;
        }

        executePlayCard(currentPlayerIdx, chosenCard, chosenColor);
      } else {
        // AI must draw a card
        let { draw: currD, discard: currDis } = replenishDrawPileIfNeeded(drawPile, discardPile);
        if (currD.length > 0) {
          const drawnCard = currD.shift()!;
          setDrawPile(currD);
          setDiscardPile(currDis);
          curP.hand.push(drawnCard);

          if (isCardPlayable(drawnCard)) {
            // AI plays the drawn card immediately
            executePlayCard(currentPlayerIdx, drawnCard, drawnCard.color === 'wild' ? 'red' : undefined);
          } else {
            setStatusMessage(`${curP.name} không có bài hợp lệ, đã bốc 1 lá và nhường lượt.`);
            advanceTurn(1);
          }
        } else {
          advanceTurn(1);
        }
      }

      setIsAiProcessing(false);
    }, 900);

    return () => clearTimeout(timer);
  }, [currentPlayerIdx, screen, winner, players, isCardPlayable, aiDifficulty, turnDirection, executePlayCard, advanceTurn, drawPile, discardPile]);

  // Card UI Component
  const renderCard = (card: UnoCard, isPlayable = false, onClick?: () => void) => {
    const isW = card.color === 'wild';
    const colorStyle = COLOR_MAP[card.color] || COLOR_MAP.red;

    let symbolDisplay = card.value.toUpperCase();
    if (card.value === 'skip') symbolDisplay = '⊘';
    if (card.value === 'reverse') symbolDisplay = '⇄';
    if (card.value === 'draw2') symbolDisplay = '+2';
    if (card.value === 'wild') symbolDisplay = '🌈';
    if (card.value === 'wild4') symbolDisplay = '+4';

    return (
      <div
        key={card.id}
        onClick={onClick}
        className={`w-14 sm:w-16 h-20 sm:h-24 rounded-xl border-2 transition-all transform select-none relative flex flex-col items-center justify-between p-1.5 shadow-md ${
          isW
            ? 'bg-gradient-to-tr from-rose-600 via-amber-500 to-blue-600 border-white text-white'
            : `${colorStyle.bg} ${colorStyle.border} text-white`
        } ${
          isPlayable
            ? `cursor-pointer hover:-translate-y-3.5 hover:scale-108 ring-2 ring-white ${colorStyle.glow} z-10`
            : 'opacity-90'
        }`}
      >
        {/* Top-left mini label */}
        <span className="text-[10px] font-black self-start leading-none drop-shadow">
          {symbolDisplay}
        </span>

        {/* Central Oval */}
        <div className="w-9 sm:w-11 h-11 sm:h-13 bg-white/95 rounded-full flex items-center justify-center shadow-inner transform -rotate-12 border border-black/10">
          <span className={`text-base sm:text-lg font-black ${isW ? 'text-purple-600' : colorStyle.text} drop-shadow-xs`}>
            {symbolDisplay}
          </span>
        </div>

        {/* Bottom-right mini label */}
        <span className="text-[10px] font-black self-end leading-none drop-shadow transform rotate-180">
          {symbolDisplay}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-3 sm:p-6 shadow-2xl border-2 border-indigo-500/40 relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/30 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 via-yellow-400 to-blue-500 flex items-center justify-center text-xl shadow-lg border border-white/40">
            🎴
          </div>
          <div>
            <h2 className="font-serif font-black text-lg sm:text-xl text-yellow-300 tracking-wider flex items-center gap-1.5">
              <span>UNO! ĐẠI CHIẾN BÀI MÀU</span>
            </h2>
            <p className="text-[11px] text-indigo-200/80">
              Chuẩn 108 lá • Đổi màu • +2 • +4 • Bỏ lượt & Đảo chiều
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 text-xs border border-white/10 cursor-pointer"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setScreen('rules')}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-500/40 cursor-pointer flex items-center gap-1"
          >
            <span>📜</span> <span className="hidden sm:inline">Luật UNO</span>
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
          <div className="py-2">
            <div className="inline-flex gap-2 mb-2 animate-bounce">
              <span className="w-8 h-12 rounded-lg bg-red-600 border border-white shadow-md inline-block transform -rotate-12" />
              <span className="w-8 h-12 rounded-lg bg-amber-400 border border-white shadow-md inline-block transform -rotate-3" />
              <span className="w-8 h-12 rounded-lg bg-emerald-600 border border-white shadow-md inline-block transform rotate-6" />
              <span className="w-8 h-12 rounded-lg bg-blue-600 border border-white shadow-md inline-block transform rotate-15" />
            </div>
            <h1 className="text-4xl font-serif font-black tracking-widest text-yellow-300 drop-shadow-[0_4px_20px_rgba(251,191,36,0.6)]">
              UNO! CLASSIC
            </h1>
            <p className="text-xs text-indigo-200 mt-1">
              Đánh hết bài nhanh nhất & Hô UNO trước đối thủ!
            </p>
          </div>

          {/* Settings Grid */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/30 space-y-3.5 text-left text-xs">
            <div>
              <label className="font-bold text-yellow-200 block mb-1">
                Số lượng người chơi:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(count => (
                  <button
                    key={count}
                    onClick={() => {
                      sounds.playClick();
                      setNumPlayers(count);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      numPlayers === count
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-white shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {count} Người {count === 4 ? '(Chuẩn)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-yellow-200 block mb-1">
                Độ thông minh của AI:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'normal', 'hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => {
                      sounds.playClick();
                      setAiDifficulty(diff);
                    }}
                    className={`py-2 rounded-xl font-bold border capitalize transition-all cursor-pointer ${
                      aiDifficulty === diff
                        ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border-white shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {diff === 'easy' ? 'Dễ' : diff === 'normal' ? 'Vừa' : 'Khó'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleStartGame(numPlayers)}
              className="w-full py-4 px-4 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black rounded-2xl shadow-xl border border-white/50 text-sm cursor-pointer flex items-center justify-center gap-2 transform active:scale-98 transition-all tracking-wide"
            >
              <span>🔥</span> BẮT ĐẦU CHƠI ({numPlayers} NGƯỜI - AI {aiDifficulty.toUpperCase()})
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800">
            <div>
              <p className="text-yellow-400 font-bold text-base">{stats.gamesPlayed}</p>
              <p>Trận đã chơi</p>
            </div>
            <div>
              <p className="text-emerald-400 font-bold text-base">{stats.gamesWon}</p>
              <p>Thắng ({stats.winRate}%)</p>
            </div>
            <div>
              <p className="text-rose-400 font-bold text-base">{stats.totalUnoCalls}</p>
              <p>Lần hô UNO</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCREEN 2: ACTIVE UNO TABLE ================= */}
      {screen === 'play' && (
        <div className="flex flex-col items-center justify-between min-h-[520px] max-w-2xl mx-auto relative animate-[fadeIn_0.2s_ease-out]">
          
          {/* UNO Notification Banner */}
          {unoBanner && (
            <div className="absolute top-1/3 z-50 px-6 py-3 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-white font-black text-xl rounded-full shadow-[0_10px_35px_rgba(239,68,68,0.8)] border-2 border-white animate-bounce tracking-widest">
              {unoBanner}
            </div>
          )}

          {/* TOP AREA: Opponents / AI Players */}
          <div className="w-full flex items-center justify-around gap-2 pt-1 pb-3">
            {players.slice(1).map(aiPlayer => {
              const isAiTurn = players[currentPlayerIdx]?.id === aiPlayer.id;

              return (
                <div
                  key={aiPlayer.id}
                  className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center min-w-[90px] sm:min-w-[120px] ${
                    isAiTurn
                      ? 'bg-indigo-900/90 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] ring-2 ring-yellow-400/60 scale-105'
                      : 'bg-slate-900/80 border-slate-700'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm mb-1 shadow-inner">
                    🤖
                  </div>
                  <span className="text-xs font-bold text-slate-100 truncate max-w-[90px]">
                    {aiPlayer.name}
                  </span>
                  {/* Card count badge */}
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-black text-[10px] shadow-sm flex items-center gap-1">
                    <span>🂠</span>
                    <span>{aiPlayer.hand.length} lá</span>
                  </div>
                  {isAiTurn && (
                    <span className="text-[9px] text-yellow-300 font-bold mt-0.5 animate-pulse">
                      Đang đánh...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* CENTER TABLE: Draw Pile, Discard Pile & Active Color */}
          <div className="flex items-center justify-center gap-6 my-4 p-4 rounded-3xl bg-slate-900/70 border border-white/10 shadow-inner w-full max-w-md">
            
            {/* Draw Pile (Face Down) */}
            <div
              onClick={handleDrawCard}
              title="Nhấn để bốc 1 lá bài từ chồng bài"
              className={`w-16 sm:w-20 h-24 sm:h-28 rounded-xl border-2 border-white/60 bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer ${
                currentPlayerIdx === 0 && !isAiProcessing
                  ? 'hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                  : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black text-white text-xs border border-white transform -rotate-12 shadow-md">
                UNO
              </div>
              <span className="text-[9px] font-bold text-slate-300 mt-2">
                Bốc ({drawPile.length})
              </span>
            </div>

            {/* Turn & Color Direction Indicator */}
            <div className="flex flex-col items-center gap-1.5">
              {/* Active Color Orb */}
              <div
                className={`w-10 h-10 rounded-full ${COLOR_MAP[activeColor]?.bg} border-2 border-white shadow-lg flex items-center justify-center text-xs font-black`}
                title={`Màu đang yêu cầu: ${COLOR_MAP[activeColor]?.nameVi}`}
              >
                {COLOR_MAP[activeColor]?.nameVi[0]}
              </div>
              <span className="text-[10px] font-bold text-yellow-300">
                {COLOR_MAP[activeColor]?.nameVi}
              </span>
              <span className="text-xs text-indigo-300">
                {turnDirection === 1 ? '↻ Thuận' : '↺ Ngược'}
              </span>
            </div>

            {/* Discard Pile (Top Card) */}
            <div className="relative">
              {topDiscard && renderCard(topDiscard, false)}
            </div>

          </div>

          {/* Status Message Bar */}
          <div className="w-full max-w-md px-3 py-1.5 mb-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-center text-xs">
            <span className="text-yellow-300 font-bold">{statusMessage}</span>
          </div>

          {/* BOTTOM AREA: Player Hand & Big UNO Button */}
          <div className="w-full flex flex-col items-center gap-2">
            
            {/* Control Bar: Name + Call UNO button */}
            <div className="flex items-center justify-between w-full max-w-lg px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-ping" />
                <span className="font-bold text-slate-100">
                  Bài của bạn ({players[0]?.hand.length} lá):
                </span>
              </div>

              {/* Punchy UNO Button */}
              <button
                onClick={handleCallUno}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-white font-black text-xs shadow-lg border-2 border-white cursor-pointer transform active:scale-95 transition-all animate-pulse"
                title="Hô UNO khi còn 1 lá!"
              >
                ⚡ HÔ UNO!
              </button>
            </div>

            {/* Player Hand (Scrollable Fan) */}
            <div className="w-full max-w-xl overflow-x-auto pb-4 pt-2 flex items-center justify-center gap-1.5 sm:gap-2 px-2">
              {players[0]?.hand.map(card => {
                const playable = currentPlayerIdx === 0 && !isAiProcessing && isCardPlayable(card);
                return renderCard(card, playable, () => handleHumanPlayCard(card));
              })}
            </div>

          </div>

          {/* MODAL: Color Picker for Wild Cards */}
          {showColorPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
              <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl animate-[zoomIn_0.2s_ease-out]">
                <h3 className="font-black text-base text-yellow-300">
                  CHỌN MÀU BẠN MUỐN ĐỔI:
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['red', 'yellow', 'green', 'blue'] as CardColor[]).map(c => (
                    <button
                      key={c}
                      onClick={() => handleConfirmColor(c)}
                      className={`py-3 rounded-2xl font-black text-sm text-white shadow-md border-2 border-white/60 cursor-pointer transform active:scale-95 transition-transform ${COLOR_MAP[c].bg}`}
                    >
                      {COLOR_MAP[c].nameVi}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= SCREEN 3: GAME OVER ================= */}
      {screen === 'gameover' && winner && (
        <div className="max-w-md mx-auto py-6 space-y-4 text-center animate-[fadeIn_0.2s_ease-out]">
          <div className="p-5 rounded-3xl bg-slate-900 border-2 border-yellow-400 shadow-2xl space-y-3">
            <span className="text-5xl">🏆</span>
            <h2 className="text-2xl font-serif font-black text-yellow-300">
              TRẬN ĐẤU KẾT THÚC!
            </h2>
            <p className="text-lg font-bold text-white">
              {winner.isAi ? `${winner.name} đã chiến thắng!` : 'CHÚC MỪNG BẠN ĐÃ CHIẾN THẮNG! 🎉'}
            </p>

            {/* Remaining Cards Breakdown */}
            <div className="space-y-1.5 text-xs text-left pt-2 border-t border-slate-800">
              <p className="font-bold text-slate-400 mb-1">Số lá bài còn lại:</p>
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1 px-2 rounded bg-white/5">
                  <span className={p.id === winner.id ? 'font-bold text-yellow-300' : 'text-slate-300'}>
                    {p.name} {p.id === winner.id ? '👑 (0 lá)' : ''}
                  </span>
                  <span className="font-mono text-slate-300">
                    {p.id === winner.id ? 'Chiến Thắng' : `${p.hand.length} lá`}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-3">
              <button
                onClick={() => handleStartGame(numPlayers)}
                className="w-full py-3 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black rounded-xl shadow-lg cursor-pointer text-xs tracking-wider"
              >
                🔄 Chơi Ván Mới
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold rounded-xl cursor-pointer text-xs"
              >
                Về Menu Chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCREEN 4: RULES ================= */}
      {screen === 'rules' && (
        <div className="max-w-lg mx-auto py-2 space-y-4 text-left animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-500/30">
            <h3 className="text-base font-bold text-yellow-300 flex items-center gap-1.5">
              <span>📜</span> Hướng Dẫn Luật Chơi UNO Chuẩn
            </h3>
            <button
              onClick={() => setScreen('menu')}
              className="text-slate-400 hover:text-white text-xs cursor-pointer font-bold"
            >
              ✕ Đóng
            </button>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <h4 className="font-bold text-yellow-200 mb-1">1. Mục Tiêu Trò Chơi</h4>
              <p>Mỗi người khởi đầu với 7 lá bài. Mục tiêu là trở thành người đầu tiên đánh hết sạch bài trên tay.</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <h4 className="font-bold text-yellow-200 mb-1">2. Cách Đánh Bài Hợp Lệ</h4>
              <p>Bạn có thể đánh lá bài nếu nó <strong>cùng màu</strong>, hoặc <strong>cùng số/ký hiệu</strong> với lá bài trên cùng của chồng bài bỏ, hoặc là lá bài <strong>Đổi Màu (Wild)</strong>.</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <h4 className="font-bold text-yellow-200 mb-1">3. Các Lá Bài Chức Năng</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong>Bỏ lượt (Skip):</strong> Bỏ qua lượt đi của người tiếp theo.</li>
                <li><strong>Đảo chiều (Reverse):</strong> Đổi chiều đánh bài (thuận hoặc ngược kim đồng hồ).</li>
                <li><strong>Cộng 2 (+2):</strong> Người kế tiếp phải bốc 2 lá bài và mất lượt.</li>
                <li><strong>Đổi màu (Wild):</strong> Được đổi màu bài theo ý muốn.</li>
                <li><strong>Đổi màu +4:</strong> Được đổi màu bài và người kế tiếp phải bốc 4 lá rồi mất lượt.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <h4 className="font-bold text-yellow-200 mb-1">4. Quy Tắc Hô "UNO!"</h4>
              <p>Khi chỉ còn đúng 1 lá bài trên tay, bạn phải nhấn nút <strong>⚡ HÔ UNO!</strong>. Người chơi đánh hết bài đầu tiên sẽ chiến thắng ván đấu!</p>
            </div>
          </div>

          <button
            onClick={() => setScreen('menu')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
          >
            Đã Hiểu, Quay Lại Trò Chơi
          </button>
        </div>
      )}

    </div>
  );
};
