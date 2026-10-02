import React, { useState } from 'react';
import { Character } from '../types';
import { sounds } from '../utils/audio';

interface CharacterCardProps {
  character: Character;
  isAuthor: boolean;
  isUnlocked: boolean;
  onLike: (character: Character) => void;
  onOpenPlot: (character: Character) => void;
  onOpenLink: (character: Character) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isAuthor,
  isUnlocked,
  onLike,
  onOpenPlot,
  onOpenLink,
  onEdit,
  onDelete
}) => {
  const [likeBurst, setLikeBurst] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playCoin();
    setLikeBurst(true);
    setTimeout(() => setLikeBurst(false), 800);
    onLike(character);
  };

  const isLinkAvailable = !character.isLocked || isUnlocked;

  return (
    <div className="group relative bg-white/85 backdrop-blur-md rounded-3xl border-2 border-rose-200/80 shadow-[0_4px_20px_rgba(244,63,94,0.08)] hover:shadow-[0_12px_32px_rgba(244,63,94,0.18)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden">
      {/* Image Banner with Badge */}
      <div className="relative h-56 w-full overflow-hidden bg-rose-100">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Lock status pill */}
        <div className="absolute top-3 left-3">
          {character.isLocked ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                isUnlocked
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}
            >
              <span>{isUnlocked ? '🔓 Đã mở khóa' : `🔒 Khóa (${character.unlockCost} xu)`}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md bg-emerald-500/85 text-white">
              <span>✨ Mở miễn phí</span>
            </span>
          )}
        </div>

        {/* Small Cute Like Button in Corner */}
        <button
          onClick={handleLikeClick}
          title="Thả tim yêu thích nhân vật"
          className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white text-rose-600 px-2.5 py-1 rounded-full shadow-md backdrop-blur-md transition-all active:scale-90 text-xs font-semibold cursor-pointer"
        >
          <span className={`text-sm ${likeBurst ? 'scale-150 animate-ping' : ''}`}>
            ❤️
          </span>
          <span>{character.likes}</span>
        </button>

        {/* Floating Heart Burst effect on click */}
        {likeBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-bounce">💖</span>
          </div>
        )}

        {/* Name on image bottom */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-serif text-lg font-bold text-white drop-shadow-md truncate">
            {character.name}
          </h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Hashtags list */}
          <div className="flex flex-wrap gap-1 mb-3">
            {character.hashtags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Short preview of plot */}
          <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed mb-4">
            {character.plot}
          </p>
        </div>

        {/* Action Buttons: Plot & Link */}
        <div className="pt-2 border-t border-rose-100 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Plot Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenPlot(character);
              }}
              className="w-full py-2 px-3 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <span>📜</span>
              <span>Xem Plot</span>
            </button>

            {/* Link Google AI Studio Button */}
            <button
              onClick={() => {
                onOpenLink(character);
              }}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                isLinkAvailable
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
              }`}
            >
              <span>{isLinkAvailable ? '🔗' : '🗝️'}</span>
              <span>{isLinkAvailable ? 'Link Bot' : `Mở Link (${character.unlockCost} xu)`}</span>
            </button>
          </div>

          {/* Author Edit & Delete buttons (Only visible to Nhi) */}
          {isAuthor && (
            <div className="flex gap-2 pt-2 border-t border-dashed border-rose-200">
              <button
                onClick={() => onEdit && onEdit(character)}
                className="flex-1 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
              >
                ✏️ Sửa
              </button>
              <button
                onClick={() => onDelete && onDelete(character)}
                className="py-1 px-2.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
              >
                🗑️ Xóa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
