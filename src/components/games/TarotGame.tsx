import React, { useState } from 'react';
import { TarotCard } from '../../types';
import { TAROT_DECK } from '../../data/initialData';
import { sounds } from '../../utils/audio';

interface TarotGameProps {
  onEarnCoins: (amount: number, reason: string) => void;
}

type ReadingMode = 'one_card' | 'three_cards';
type ReadingTopic = 'general' | 'love' | 'study' | 'career';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  positionLabel?: string;
}

export const TarotGame: React.FC<TarotGameProps> = ({ onEarnCoins }) => {
  const [mode, setMode] = useState<ReadingMode>('one_card');
  const [topic, setTopic] = useState<ReadingTopic>('general');
  const [question, setQuestion] = useState<string>('');
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [hasRevealed, setHasRevealed] = useState<boolean>(false);

  const topicInfo = {
    general: { label: 'Lá Chung (Tổng Quan)', icon: '🔮', desc: 'Năng lượng bao quát của cuộc sống và tâm thế hiện tại' },
    love: { label: 'Tình Duyên (Tình Cảm)', icon: '💖', desc: 'Mối quan hệ, cảm xúc hai chiều và duyên phận' },
    study: { label: 'Học Tập (Thi Cử)', icon: '📚', desc: 'Tiến độ học hành, tư duy và định hướng kỳ thi' },
    career: { label: 'Sự Nghiệp (Công Việc)', icon: '💼', desc: 'Cơ hội phát triển, tài chính và quyết định nghề nghiệp' }
  };

  const handleStartDraw = () => {
    sounds.playGateOpen();
    setIsShuffling(true);
    setHasRevealed(false);
    setDrawnCards([]);

    setTimeout(() => {
      // Shuffle deck
      const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
      const count = mode === 'one_card' ? 1 : 3;
      const positions = mode === 'three_cards'
        ? ['Hoàn Cảnh Hiện Tại / Quá Khứ', 'Thử Thách & Cơ Hội', 'Xu Hướng & Lời Khuyên Tương Lai']
        : ['Thông Điệp Trọng Tâm'];

      const chosen: DrawnCard[] = [];
      for (let i = 0; i < count; i++) {
        const isReversed = Math.random() < 0.35; // 35% chance reversed for realistic balance
        chosen.push({
          card: shuffled[i],
          isReversed,
          positionLabel: positions[i]
        });
      }

      setDrawnCards(chosen);
      setIsShuffling(false);
      setHasRevealed(true);
      sounds.playCardFlip();
      onEarnCoins(15, 'Trải bài Tarot tiên tri thành công! (+15 xu)');
    }, 1200);
  };

  const getInterpretation = (drawn: DrawnCard) => {
    const { card, isReversed } = drawn;
    const meaningObj = card.meanings[topic];
    const text = isReversed ? meaningObj.reversed : meaningObj.upright;
    const advice = meaningObj.advice;

    return {
      statusText: isReversed ? 'Lá Ngược (Shadow / Thử Thách)' : 'Lá Thuận (Light / Thuận Lợi)',
      interpretation: text,
      advice
    };
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-rose-200/80 p-5 sm:p-7 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
          🔮
        </div>
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-950">
            Khu Vườn Tarot Tiên Tri
          </h3>
          <p className="text-xs text-rose-700/80">
            Lời giải chuẩn xác, đa chiều và sâu sắc. Nhận 15 xu mỗi lần trải bài.
          </p>
        </div>
      </div>

      {/* Control Panel: Topic Selection */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-rose-950 mb-2">
          1. Chọn khía cạnh bạn muốn xem:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['general', 'love', 'study', 'career'] as ReadingTopic[]).map(t => (
            <button
              key={t}
              onClick={() => {
                sounds.playClick();
                setTopic(t);
              }}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                topic === t
                  ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102'
                  : 'bg-white/90 text-rose-900 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <span className="text-lg">{topicInfo[t].icon}</span>
              <span>{topicInfo[t].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-rose-950 mb-2">
          2. Chọn kiểu trải bài:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setMode('one_card');
            }}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'one_card'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                : 'bg-white/90 text-indigo-950 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <span>🃏</span>
            <span>Lá Chung (1 Lá Thông Điệp)</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setMode('three_cards');
            }}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'three_cards'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                : 'bg-white/90 text-indigo-950 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            <span>✨</span>
            <span>Trải 3 Lá (Chi Tiết Toàn Diện)</span>
          </button>
        </div>
      </div>

      {/* Question Input Frame (Enhanced High-Contrast & Clear UI) */}
      <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-white to-rose-50 border-2 border-purple-300 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
          <label className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <span className="text-base text-purple-600">✍️</span>
            <span>3. Nhập câu hỏi thắc mắc của bạn:</span>
          </label>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Chủ đề: {topicInfo[topic].label}
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={`VD: "Trong khía cạnh ${topicInfo[topic].label}, mình nên có tâm thế hay hành động như thế nào để mọi việc tiến triển thuận lợi nhất?"...`}
            className="w-full text-sm sm:text-base font-medium text-slate-900 bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-purple-400 focus:border-purple-600 focus:ring-4 focus:ring-purple-200/60 outline-none shadow-sm placeholder:text-slate-400 placeholder:text-xs sm:placeholder:text-sm placeholder:italic transition-all resize-y"
          />
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[11px] text-slate-500 font-semibold">Gợi ý nhanh:</span>
          {[
            'Thông điệp quan trọng nhất lúc này là gì?',
            'Mình nên chú ý điều gì trong thời gian tới?',
            'Làm sao để vượt qua thử thách hiện tại?'
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => {
                sounds.playClick();
                setQuestion(prompt);
              }}
              className="text-[10px] sm:text-[11px] font-semibold text-purple-700 bg-white hover:bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300 transition-colors cursor-pointer shadow-2xs"
            >
              + {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Draw Action Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleStartDraw}
          disabled={isShuffling}
          className="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-rose-500 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-sm font-bold rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 border-2 border-white/60 cursor-pointer"
        >
          <span>{isShuffling ? '🌀' : '🔮'}</span>
          <span>{isShuffling ? 'Đang Xào Bài & Kết Nối...' : 'Rút Bài Tiên Tri (+15 xu)'}</span>
        </button>
      </div>

      {/* Shuffling Animation */}
      {isShuffling && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin text-5xl mb-3">🌌</div>
          <p className="text-xs font-medium text-rose-700 animate-pulse">
            Những vì sao đang sắp xếp thông điệp dành riêng cho câu hỏi của bạn...
          </p>
        </div>
      )}

      {/* Revealed Cards Display */}
      {hasRevealed && drawnCards.length > 0 && !isShuffling && (
        <div className="space-y-6 pt-4 border-t border-rose-200/80 animate-[fadeIn_0.5s_ease-out]">
          {/* User question echo */}
          {question.trim() && (
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900">
              <span className="font-bold">Câu hỏi của bạn:</span> “{question}”
            </div>
          )}

          <div
            className={`grid gap-4 ${
              drawnCards.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {drawnCards.map((drawn, idx) => {
              const interpretation = getInterpretation(drawn);
              return (
                <div
                  key={idx}
                  className="bg-white/95 rounded-3xl border-2 border-purple-200/80 p-5 shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* Position Label */}
                    <div className="text-center mb-3">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 inline-block">
                        {drawn.positionLabel}
                      </span>
                    </div>

                    {/* Card Visual Emblem */}
                    <div className="w-24 h-36 mx-auto mb-4 rounded-2xl bg-gradient-to-b from-indigo-950 to-purple-900 border-2 border-amber-300 shadow-md flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                      <div className="text-4xl mb-1 filter drop-shadow">
                        {drawn.card.image}
                      </div>
                      <span className="text-[10px] text-amber-200 font-serif font-bold">
                        {drawn.card.name}
                      </span>
                      {drawn.isReversed && (
                        <span className="absolute bottom-1 text-[8px] bg-red-500/80 text-white px-1.5 py-0.2 rounded-full">
                          Ngược
                        </span>
                      )}
                    </div>

                    {/* Card Name */}
                    <div className="text-center mb-3">
                      <h4 className="font-serif text-base font-bold text-rose-950">
                        {drawn.card.nameVi}
                      </h4>
                      <p className="text-[11px] font-semibold text-purple-600">
                        {interpretation.statusText}
                      </p>
                    </div>

                    {/* Detailed Nuanced Interpretation strictly related to selected topic */}
                    <div className="space-y-3 text-xs leading-relaxed text-gray-800">
                      <div>
                        <span className="font-bold text-indigo-950 block mb-0.5">
                          Ý nghĩa ({topicInfo[topic].label}):
                        </span>
                        <p className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                          {interpretation.interpretation}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-rose-900 block mb-0.5">
                          💡 Lời khuyên chân thành:
                        </span>
                        <p className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 italic">
                          {interpretation.advice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
