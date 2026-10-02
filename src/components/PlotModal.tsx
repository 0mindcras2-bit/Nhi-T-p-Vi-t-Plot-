import React from 'react';
import { Character } from '../types';
import { sounds } from '../utils/audio';

interface PlotModalProps {
  character: Character | null;
  onClose: () => void;
  onOpenAiStudioLink: (char: Character) => void;
  isUnlocked: boolean;
}

export const PlotModal: React.FC<PlotModalProps> = ({
  character,
  onClose,
  onOpenAiStudioLink,
  isUnlocked
}) => {
  if (!character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-gradient-to-b from-rose-50 via-white to-pink-50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-rose-300 relative max-h-[90vh] overflow-y-auto animate-[zoomIn_0.2s_ease-out]">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-100 transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border-2 border-rose-300 shadow-md"
          />
          <div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-100/90 px-2.5 py-0.5 rounded-full inline-block mb-1">
              ✨ Cốt Truyện & Thiết Lập Nhân Vật
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-950">
              {character.name}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {character.hashtags.map((tag, i) => (
                <span key={i} className="text-[10px] text-rose-700 bg-white/80 border border-rose-200 px-1.5 py-0.5 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Plot Body */}
        <div className="bg-white/80 border border-rose-200/80 rounded-2xl p-5 mb-5 shadow-xs">
          <h4 className="font-serif text-sm font-bold text-rose-900 flex items-center gap-1.5 mb-2">
            <span>📜</span> Bối Cảnh & Plot Chi Tiết:
          </h4>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line font-sans">
            {character.plot}
          </p>
        </div>

        {/* Author Note */}
        {character.authorNote && (
          <div className="bg-rose-100/50 border border-rose-200 rounded-2xl p-3.5 mb-5 text-xs text-rose-900 italic">
            <span className="font-bold not-italic">Lời nhắn từ Nhi:</span> {character.authorNote}
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-3 justify-end items-center pt-2 border-t border-rose-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onOpenAiStudioLink(character);
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <span>{character.isLocked && !isUnlocked ? '🔒' : '🚀'}</span>
            <span>
              {character.isLocked && !isUnlocked
                ? `Mở khóa Link (${character.unlockCost} xu)`
                : 'Mở Link Google AI Studio'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
