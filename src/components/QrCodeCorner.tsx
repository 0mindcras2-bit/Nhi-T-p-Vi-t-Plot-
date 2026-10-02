import React, { useState, useRef } from 'react';
import { sounds } from '../utils/audio';
import { processImageFile } from '../utils/imageHelper';

interface QrCodeCornerProps {
  qrUrl: string;
  thankYouMessage: string;
  isAuthor: boolean;
  onUpdateQr: (newQrUrl: string, newThankYou: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeCorner: React.FC<QrCodeCornerProps> = ({
  qrUrl,
  thankYouMessage,
  isAuthor,
  onUpdateQr,
  isOpen,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempQrUrl, setTempQrUrl] = useState(qrUrl);
  const [tempThankYou, setTempThankYou] = useState(thankYouMessage);
  const [isUploading, setIsUploading] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await processImageFile(file, 600, 0.9);
      setTempQrUrl(dataUrl);
      sounds.playCoin();
    } catch {
      alert('Không thể tải ảnh này. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateQr(tempQrUrl, tempThankYou);
    setIsEditing(false);
    sounds.playCoin();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900/95 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-400/50 relative animate-[zoomIn_0.2s_ease-out]">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
        >
          ✕
        </button>

        {!isEditing ? (
          <div className="text-center">
            <div className="inline-flex items-center gap-1 bg-rose-500/20 border border-rose-400/40 text-rose-200 px-3 py-0.5 rounded-full text-[11px] font-semibold mb-3">
              <span>🌹</span> Góc Nhỏ Của Nhi
            </div>

            <h3 className="font-serif text-lg font-bold text-rose-100 mb-2">
              Lời Cảm Ơn & QR Tip
            </h3>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-rose-100/90 leading-relaxed italic mb-4">
              <p>“{thankYouMessage}”</p>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 inline-block mx-auto mb-3">
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-36 h-36 object-contain rounded-xl shadow-xs border border-white/20 bg-white"
              />
              <p className="text-[10px] text-rose-300 mt-2 font-medium">
                Quét mã để kết nối / ủng hộ tác giả 🧋
              </p>
            </div>

            {isAuthor && (
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-center">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setTempQrUrl(qrUrl);
                    setTempThankYou(thankYouMessage);
                    setIsEditing(true);
                  }}
                  className="text-xs bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 font-semibold px-3 py-1.5 rounded-xl border border-rose-400/40 transition-colors cursor-pointer"
                >
                  ✏️ Chỉnh sửa QR & Lời cảm ơn
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="text-sm font-bold text-rose-200 font-serif mb-1">
              ✏️ Chỉnh Sửa Mã QR
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                Ảnh Mã QR:
              </label>

              {/* Hidden file input */}
              <input
                type="file"
                ref={qrFileInputRef}
                accept="image/*"
                onChange={handleQrFileChange}
                className="hidden"
              />

              <div className="flex gap-2 items-center mb-2">
                <button
                  type="button"
                  onClick={() => qrFileInputRef.current?.click()}
                  className="flex-1 py-1.5 px-3 bg-white/10 hover:bg-white/15 text-rose-200 border border-rose-400/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📷</span>
                  <span>{isUploading ? 'Đang xử lý ảnh...' : 'Tải ảnh QR từ thiết bị'}</span>
                </button>

                {tempQrUrl && (
                  <img
                    src={tempQrUrl}
                    alt="QR Preview"
                    className="w-10 h-10 object-contain rounded-lg border border-white/30 bg-white shrink-0"
                  />
                )}
              </div>

              <input
                type="text"
                value={tempQrUrl.startsWith('data:') ? 'Ảnh QR đã tải từ thiết bị' : tempQrUrl}
                onChange={e => {
                  if (!e.target.value.startsWith('Ảnh QR')) {
                    setTempQrUrl(e.target.value);
                  }
                }}
                placeholder="Hoặc dán liên kết URL ảnh..."
                className="w-full text-xs px-3 py-1.5 border border-rose-400/40 rounded-xl bg-slate-800 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-rose-300 mb-1">
                Lời cảm ơn:
              </label>
              <textarea
                rows={3}
                value={tempThankYou}
                onChange={e => setTempThankYou(e.target.value)}
                required
                className="w-full text-xs px-3 py-1.5 border border-rose-400/40 rounded-xl bg-slate-800 text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs text-gray-300 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-xs cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
