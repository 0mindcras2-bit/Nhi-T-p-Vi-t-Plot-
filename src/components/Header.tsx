import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  activeTab: 'characters' | 'games' | 'community';
  onSelectTab: (tab: 'characters' | 'games' | 'community') => void;
  coins: number;
  isAuthor: boolean;
  onLoginAuthor: (password: string) => boolean;
  onLogoutAuthor: () => void;
  onOpenQr: () => void;
  onOpenMusic: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  coins,
  isAuthor,
  onLoginAuthor,
  onLogoutAuthor,
  onOpenQr,
  onOpenMusic
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLoginAuthor(passwordInput);
    if (success) {
      sounds.playUnlock();
      setShowPasswordModal(false);
      setPasswordInput('');
      setAuthError('');
    } else {
      sounds.playClick();
      setAuthError('Mật khẩu không chính xác! Hãy thử lại.');
    }
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
    if (!next) {
      sounds.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-rose-500/20 shadow-md text-white">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white shadow-md border border-rose-400/50">
            <span className="text-xl">🌹</span>
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Nhi tập viết plot</span>
              {isAuthor && (
                <span className="text-[11px] font-sans font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                  Tác Giả 👑
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Right action group: Coins, QR, Sound, Author Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Coin Display */}
          <div
            title="Số xu bạn tích lũy được từ các mini game để mở khóa bot"
            className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/50 text-amber-200 px-3 py-1.5 rounded-full shadow-xs text-xs sm:text-sm font-bold"
          >
            <span className="text-base">🪙</span>
            <span>{coins}</span>
            <span className="text-[10px] text-amber-300 hidden sm:inline">Xu</span>
          </div>

          {/* Music Manager & Track Rename Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenMusic();
            }}
            title="Quản lý nhạc, đổi tên bài hát & thêm nhạc mới"
            className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-rose-200 border border-rose-400/40 shadow-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer relative"
          >
            <span className="text-base">🎵</span>
          </button>

          {/* QR & Thank You Icon Button (Icon only in top corner) */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenQr();
            }}
            title="Lời cảm ơn & Mã QR của Nhi"
            className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-rose-200 border border-rose-400/40 shadow-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer relative"
          >
            <span className="text-base">💌</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="w-9 h-9 rounded-full text-rose-300 hover:bg-white/10 transition-colors text-sm flex items-center justify-center cursor-pointer"
          >
            {isMuted ? '🔇' : '🔔'}
          </button>

          {/* Author Mode Switch */}
          {isAuthor ? (
            <button
              onClick={() => {
                sounds.playClick();
                onLogoutAuthor();
              }}
              className="text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-400/40 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Thoát tác giả
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                setShowPasswordModal(true);
              }}
              title="Dành cho tác giả (Nhi) quản lý character, nhạc và QR"
              className="text-xs bg-white/5 text-rose-200 hover:bg-white/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>🔑</span>
              <span className="hidden sm:inline">Tác giả</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 py-1.5 scrollbar-none">
        <button
          onClick={() => {
            sounds.playClick();
            onSelectTab('characters');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap ${
            activeTab === 'characters'
              ? 'bg-rose-600 text-white shadow-xs font-semibold'
              : 'text-rose-200 hover:bg-white/10'
          }`}
        >
          <span>🌹</span>
          <span>Nhân Vật AI Studio</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onSelectTab('games');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap ${
            activeTab === 'games'
              ? 'bg-rose-600 text-white shadow-xs font-semibold'
              : 'text-rose-200 hover:bg-white/10'
          }`}
        >
          <span>🎮</span>
          <span>Khu Vực Trò Chơi</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onSelectTab('community');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap ${
            activeTab === 'community'
              ? 'bg-rose-600 text-white shadow-xs font-semibold'
              : 'text-rose-200 hover:bg-white/10'
          }`}
        >
          <span>💌</span>
          <span>Feedback & Request</span>
        </button>
      </div>

      {/* Author Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-rose-950 flex items-center gap-2">
                <span>🗝️</span> Chế Độ Tác Giả (Nhi)
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setAuthError('');
                }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-rose-700/80 mb-4">
              Vui lòng nhập mật khẩu tác giả để mở khóa quyền thêm, chỉnh sửa nhân vật, nhạc và mã QR.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  autoFocus
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
                />
                {authError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{authError}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-xs"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
