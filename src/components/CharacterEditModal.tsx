import React, { useState, useEffect, useRef } from 'react';
import { Character } from '../types';
import { sounds } from '../utils/audio';
import { processImageFile } from '../utils/imageHelper';

interface CharacterEditModalProps {
  character: Character | null; // null if creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (charData: Partial<Character>) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
];

const POPULAR_TAGS = [
  '#KỳẢo',
  '#NgọtSủng',
  '#BiểnSâu',
  '#NgânHà',
  '#HoàngGia',
  '#Yandere',
  '#EnemiesToLovers',
  '#ChữaLành'
];

export const CharacterEditModal: React.FC<CharacterEditModalProps> = ({
  character,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [tagsInput, setTagsInput] = useState('#Fantasy, #Romance');
  const [plot, setPlot] = useState('');
  const [aiStudioLink, setAiStudioLink] = useState('https://aistudio.google.com/prompts/new_chat');
  const [isLocked, setIsLocked] = useState(false);
  const [unlockCost, setUnlockCost] = useState(30);
  const [authorNote, setAuthorNote] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const dataUrl = await processImageFile(file, 800, 0.85);
      setAvatar(dataUrl);
      sounds.playCoin();
    } catch {
      alert('Không thể đọc file ảnh này. Vui lòng chọn ảnh khác!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddQuickTag = (tag: string) => {
    sounds.playClick();
    const currentTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (!currentTags.includes(tag)) {
      setTagsInput(currentTags.length > 0 ? `${tagsInput}, ${tag}` : tag);
    }
  };

  useEffect(() => {
    if (character) {
      setName(character.name);
      setAvatar(character.avatar);
      setTagsInput(character.hashtags.join(', '));
      setPlot(character.plot);
      setAiStudioLink(character.aiStudioLink);
      setIsLocked(character.isLocked);
      setUnlockCost(character.unlockCost || 30);
      setAuthorNote(character.authorNote || '');
    } else {
      setName('');
      setAvatar(PRESET_AVATARS[0]);
      setTagsInput('#Fantasy, #NgọtSủng');
      setPlot('');
      setAiStudioLink('https://aistudio.google.com/prompts/new_chat');
      setIsLocked(false);
      setUnlockCost(30);
      setAuthorNote('');
    }
  }, [character, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !plot.trim()) return;

    const hashtags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    sounds.playCoin();
    onSave({
      name: name.trim(),
      avatar: avatar.trim() || PRESET_AVATARS[0],
      hashtags,
      plot: plot.trim(),
      aiStudioLink: aiStudioLink.trim() || 'https://aistudio.google.com/prompts/new_chat',
      isLocked,
      unlockCost: isLocked ? Math.max(5, Number(unlockCost)) : 0,
      authorNote: authorNote.trim(),
      likes: character?.likes ?? 0
    });
    onClose();
  };

  const parsedTags = tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .map(t => (t.startsWith('#') ? t : `#${t}`));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900/95 border-2 border-rose-400/40 rounded-3xl w-full max-w-4xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-[zoomIn_0.2s_ease-out]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-rose-500/25 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-xl shadow-md border border-rose-300/40">
              🌹
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-rose-100">
                {character ? 'Chỉnh Sửa Nhân Vật' : 'Tạo Nhân Vật AI Studio Mới'}
              </h3>
              <p className="text-xs text-rose-300/70">
                Thiết lập ảnh đại diện, cốt truyện plot và liên kết bot trò chuyện
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body: Split Layout (Preview on Left, Editor on Right) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: LIVE CARD PREVIEW (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <span>👁️</span> Xem Trước Thực Tế
              </span>
              <span className="text-[11px] text-gray-400">Hiển thị như trên web</span>
            </div>

            {/* Live Mock Card */}
            <div className="bg-slate-950/90 rounded-3xl border border-rose-400/40 p-4 shadow-xl relative overflow-hidden flex flex-col">
              {/* Card Image */}
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden mb-3 border border-white/10 bg-slate-800">
                <img
                  src={avatar || PRESET_AVATARS[0]}
                  alt="Live Preview"
                  className="w-full h-full object-cover"
                />
                {isLocked && (
                  <div className="absolute top-2.5 right-2.5 bg-amber-950/85 backdrop-blur-md border border-amber-400/60 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <span>🔒</span> {unlockCost} Xu
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md border border-white/20 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>💖</span> {character?.likes ?? 0}
                </div>
              </div>

              {/* Title */}
              <h4 className="font-serif font-bold text-base text-rose-100 truncate mb-1">
                {name.trim() || 'Tên nhân vật của bạn...'}
              </h4>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-2.5">
                {parsedTags.length > 0 ? (
                  parsedTags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-rose-500/20 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded-md font-medium"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-gray-500 italic">#Hashtags...</span>
                )}
              </div>

              {/* Plot excerpt */}
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-3 font-sans">
                {plot.trim() || 'Mô tả cốt truyện (plot), tính cách nhân vật và bối cảnh sẽ hiển thị tại đây...'}
              </p>

              {/* Simulated Button */}
              <div className="mt-auto pt-2 border-t border-white/10">
                <div className="w-full py-2 bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-bold rounded-xl text-center">
                  {isLocked ? `🔒 Mở khóa (${unlockCost} Xu)` : '💬 Trò Chuyện Ngay'}
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-gray-400 leading-relaxed">
              💡 <strong className="text-rose-200">Mẹo:</strong> Hãy viết phần mở đầu (plot) hấp dẫn gợi mở cảm xúc để độc giả muốn trò chuyện cùng bot ngay!
            </div>
          </div>

          {/* RIGHT COLUMN: FORM FIELDS (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Section 1: Basic Info */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <label className="block text-xs font-bold text-rose-200 uppercase tracking-wide">
                1. Tên Nhân Vật & Danh Xưng *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Rafayel • Họa Sĩ Biển Sâu"
                required
                className="w-full text-sm px-4 py-2.5 bg-slate-950/80 border border-rose-400/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            {/* Section 2: Avatar Upload & Selection */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <label className="block text-xs font-bold text-rose-200 uppercase tracking-wide">
                2. Hình Ảnh Đại Diện Nhân Vật *
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {/* Upload & Preview Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto flex-1 py-3 px-4 bg-gradient-to-r from-rose-500/30 to-pink-500/30 hover:from-rose-500/40 hover:to-pink-500/40 border border-rose-400/60 rounded-xl text-xs sm:text-sm font-bold text-rose-100 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 shadow-xs"
                >
                  <span className="text-base">📷</span>
                  <span>{isUploadingImage ? 'Đang nén & xử lý ảnh...' : 'Tải Ảnh Từ Điện Thoại / Máy Tính'}</span>
                </button>

                {avatar && (
                  <div className="flex items-center gap-2 shrink-0">
                    <img
                      src={avatar}
                      alt="Thumbnail"
                      className="w-11 h-11 object-cover rounded-xl border-2 border-rose-400 shadow-md"
                    />
                    <span className="text-[11px] text-rose-300 font-medium hidden sm:inline">Ảnh hiện tại</span>
                  </div>
                )}
              </div>

              {/* Direct URL input fallback */}
              <div>
                <input
                  type="text"
                  value={avatar.startsWith('data:') ? 'Ảnh đã tải từ máy (Base64)' : avatar}
                  onChange={e => {
                    if (!e.target.value.startsWith('Ảnh đã tải')) {
                      setAvatar(e.target.value);
                    }
                  }}
                  placeholder="Hoặc dán link ảnh trực tuyến (https://...)"
                  className="w-full text-xs px-3.5 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              {/* Preset Avatars */}
              <div>
                <p className="text-[11px] text-gray-400 mb-1.5 font-medium">Hoặc chọn avatar gợi ý có sẵn:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setAvatar(url)}
                      className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-transform hover:scale-105 cursor-pointer ${
                        avatar === url ? 'border-rose-400 scale-105 shadow-md' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Hashtags */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <label className="block text-xs font-bold text-rose-200 uppercase tracking-wide">
                3. Hashtags & Thể Loại
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="#Fantasy, #NgọtSủng, #BiểnSâu..."
                className="w-full text-xs px-3.5 py-2 bg-slate-950/80 border border-rose-400/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              {/* Quick Tag Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-semibold mr-1">Chạm để thêm nhanh:</span>
                {POPULAR_TAGS.map((tag, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddQuickTag(tag)}
                    className="text-[10px] bg-rose-500/15 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4: Plot Description */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-rose-200 uppercase tracking-wide">
                  4. Cốt Truyện & Lời Mở Đầu (Plot) *
                </label>
                <span className="text-[10px] text-gray-400">{plot.length} ký tự</span>
              </div>
              <textarea
                rows={5}
                value={plot}
                onChange={e => setPlot(e.target.value)}
                required
                placeholder="Mô tả bối cảnh, ngoại hình, tính cách, hoàn cảnh gặp gỡ và câu thoại mở đầu khi chat..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-950/80 border border-rose-400/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400 leading-relaxed font-sans"
              />
            </div>

            {/* Section 5: AI Studio Link & Coin Lock */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div>
                <label className="block text-xs font-bold text-rose-200 uppercase tracking-wide mb-1.5">
                  5. Đường Link Bot Google AI Studio *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={aiStudioLink}
                    onChange={e => setAiStudioLink(e.target.value)}
                    placeholder="https://aistudio.google.com/prompts/..."
                    required
                    className="flex-1 text-xs px-3.5 py-2 bg-slate-950/80 border border-rose-400/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  {aiStudioLink && (
                    <a
                      href={aiStudioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-rose-200 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <span>↗</span> Thử Link
                    </a>
                  )}
                </div>
              </div>

              {/* Lock Toggle */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-100 flex items-center gap-1.5">
                    <span>🔒</span> Khóa bot bằng Xu (Minigame)
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Độc giả chơi minigame tích xu để mở khóa đường link này
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLocked}
                      onChange={e => setIsLocked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>

                  {isLocked && (
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-amber-400/50">
                      <input
                        type="number"
                        min={5}
                        max={200}
                        value={unlockCost}
                        onChange={e => setUnlockCost(Number(e.target.value))}
                        className="w-14 text-xs font-bold bg-transparent text-amber-300 text-center focus:outline-none"
                      />
                      <span className="text-xs text-amber-200 font-bold">🪙 Xu</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Author Note */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="block text-xs font-bold text-rose-200 uppercase tracking-wide">
                6. Lời Nhắn Của Nhi Tới Độc Giả (Tùy chọn)
              </label>
              <input
                type="text"
                value={authorNote}
                onChange={e => setAuthorNote(e.target.value)}
                placeholder="VD: Bot này plot ngược nhẹ, gợi ý bạn nên đọc vào ban đêm..."
                className="w-full text-xs px-3.5 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-rose-500/25 bg-slate-950/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-rose-300/40"
          >
            <span>💾</span>
            <span>{character ? 'Lưu Thay Đổi 🌹' : 'Tạo Nhân Vật Mới ✨'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
