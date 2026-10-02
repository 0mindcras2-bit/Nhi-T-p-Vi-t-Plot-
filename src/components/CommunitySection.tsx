import React, { useState } from 'react';
import { FeedbackItem, PlotRequestItem } from '../types';
import { sounds } from '../utils/audio';

interface CommunitySectionProps {
  feedbacks: FeedbackItem[];
  requests: PlotRequestItem[];
  isAuthor: boolean;
  onSubmitFeedback: (item: Omit<FeedbackItem, 'id' | 'createdAt'>) => void;
  onSubmitRequest: (item: Omit<PlotRequestItem, 'id' | 'createdAt'>) => void;
  onDeleteFeedback?: (id: string) => void;
  onDeleteRequest?: (id: string) => void;
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({
  feedbacks,
  requests,
  isAuthor,
  onSubmitFeedback,
  onSubmitRequest,
  onDeleteFeedback,
  onDeleteRequest
}) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'request'>('feedback');

  // Feedback form state
  const [fbName, setFbName] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbReaction, setFbReaction] = useState('🌹');

  // Request form state
  const [reqName, setReqName] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqGenre, setReqGenre] = useState('Kỳ ảo, Lãng mạn');
  const [reqDesc, setReqDesc] = useState('');

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbMessage.trim()) return;
    sounds.playCoin();
    onSubmitFeedback({
      authorName: fbName.trim(),
      message: fbMessage.trim(),
      reaction: fbReaction
    });
    setFbMessage('');
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqTitle.trim() || !reqDesc.trim()) return;
    sounds.playCoin();
    onSubmitRequest({
      authorName: reqName.trim(),
      title: reqTitle.trim(),
      genre: reqGenre.trim(),
      description: reqDesc.trim(),
      status: 'pending'
    });
    setReqTitle('');
    setReqDesc('');
  };

  const reactions = ['🌹', '🐟', '🐥', '🐋', '✨', '💖', '👑'];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/90 border border-rose-300 text-rose-800 text-xs font-bold mb-2">
          <span>💌</span>
          <span>Góc Giao Lưu & Yêu Thương</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-950">
          Khu Vực Feedback & Yêu Cầu Plot
        </h2>
        <p className="text-xs text-rose-700/80 mt-1">
          Gửi lời nhắn động viên tới Nhi hoặc đóng góp ý tưởng plot bạn ấp ủ
        </p>
      </div>

      {/* Segment Switcher */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('feedback');
          }}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'feedback'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-white/80 text-rose-900 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <span>💖</span>
          <span>Hòm Thư Feedback ({feedbacks.length})</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('request');
          }}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'request'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-white/80 text-rose-900 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <span>📜</span>
          <span>Yêu Cầu Character & Plot ({requests.length})</span>
        </button>
      </div>

      {/* FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submission Form (Enhanced High Contrast & Clear UI) */}
          <div className="bg-white rounded-3xl border-2 border-rose-300 p-5 sm:p-6 shadow-xl">
            <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 mb-4 pb-2.5 border-b border-rose-100 flex items-center gap-2">
              <span className="text-xl">✍️</span> Gửi Lời Nhắn Đến Nhi
            </h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Tên / Biệt danh của bạn:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bé Mây, Độc giả dễ thương..."
                  value={fbName}
                  onChange={e => setFbName(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white px-3.5 py-2.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none shadow-xs placeholder:text-slate-400 placeholder:italic transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Chọn biểu tượng cảm xúc:</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {reactions.map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => {
                        sounds.playClick();
                        setFbReaction(r);
                      }}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl transition-all cursor-pointer ${
                        fbReaction === r
                          ? 'bg-rose-500 text-white border-2 border-rose-600 scale-110 shadow-md ring-2 ring-rose-200'
                          : 'bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>💌</span>
                  <span>Lời nhắn gửi yêu thương:</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Chia sẻ cảm nhận về nhân vật, cốt truyện hoặc lời nhắn gửi động viên tới Nhi..."
                  value={fbMessage}
                  onChange={e => setFbMessage(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white p-3.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none shadow-xs placeholder:text-slate-400 placeholder:italic transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-white/40"
              >
                <span>💌</span> Gửi Lời Nhắn Đến Nhi
              </button>
            </form>
          </div>

          {/* Feedback Feed */}
          <div className="md:col-span-2 space-y-3">
            {feedbacks.map(fb => (
              <div
                key={fb.id}
                className="bg-white/85 backdrop-blur-md rounded-2xl border border-rose-200/80 p-4 shadow-xs relative group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{fb.reaction}</span>
                    <span className="font-serif text-xs font-bold text-rose-950">
                      {fb.authorName}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-sans">
                  {fb.message}
                </p>

                {isAuthor && onDeleteFeedback && (
                  <button
                    onClick={() => onDeleteFeedback(fb.id)}
                    className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑️ Xóa
                  </button>
                )}
              </div>
            ))}

            {feedbacks.length === 0 && (
              <div className="p-8 text-center bg-white/60 rounded-2xl border border-rose-200 text-xs text-rose-600">
                Chưa có lời nhắn nào. Hãy là người đầu tiên gửi yêu thương đến Nhi nhé!
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUEST TAB */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submission Form (Enhanced High Contrast & Clear UI) */}
          <div className="bg-white rounded-3xl border-2 border-rose-300 p-5 sm:p-6 shadow-xl">
            <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 mb-4 pb-2.5 border-b border-rose-100 flex items-center gap-2">
              <span className="text-xl">💡</span> Đặt Hàng Ý Tưởng Plot
            </h3>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Tên người yêu cầu:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hạt Dẻ, Độc giả ruột..."
                  value={reqName}
                  onChange={e => setReqName(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white px-3.5 py-2.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none shadow-xs placeholder:text-slate-400 placeholder:italic transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>📖</span>
                  <span>Tên nhân vật / Tiêu đề cốt truyện:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đại công tước & Tiên cá nhỏ..."
                  value={reqTitle}
                  onChange={e => setReqTitle(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white px-3.5 py-2.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none shadow-xs placeholder:text-slate-400 placeholder:italic transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>Thể loại / Trope yêu thích:</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Ngược nhẹ, Ngọt sủng, Cổ trang, Học đường..."
                  value={reqGenre}
                  onChange={e => setReqGenre(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white px-3.5 py-2.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none shadow-xs placeholder:text-slate-400 placeholder:italic transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>Mô tả chi tiết ý tưởng:</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Chi tiết hoàn cảnh gặp gỡ, nét tính cách mong muốn, bối cảnh thế giới..."
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 hover:bg-white focus:bg-white p-3.5 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none shadow-xs placeholder:text-slate-400 placeholder:italic transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-white/40"
              >
                <span>✨</span> Gửi Yêu Cầu Plot
              </button>
            </form>
          </div>

          {/* Request List */}
          <div className="md:col-span-2 space-y-3">
            {requests.map(req => (
              <div
                key={req.id}
                className="bg-white/85 backdrop-blur-md rounded-2xl border border-rose-200/80 p-4 shadow-xs relative group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <h4 className="font-serif text-sm font-bold text-rose-950">
                    {req.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      req.status === 'writing'
                        ? 'bg-amber-100 text-amber-800'
                        : req.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {req.status === 'writing'
                      ? '✍️ Nhi đang viết'
                      : req.status === 'completed'
                      ? '✅ Đã hoàn thành'
                      : '⏳ Đang chờ duyệt'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-rose-600 font-semibold mb-2">
                  <span>Yêu cầu bởi: {req.authorName}</span>
                  <span>•</span>
                  <span className="bg-rose-50 border border-rose-200 px-2 py-0.2 rounded-md">
                    {req.genre}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-sans">
                  {req.description}
                </p>

                {isAuthor && onDeleteRequest && (
                  <button
                    onClick={() => onDeleteRequest(req.id)}
                    className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑️ Xóa
                  </button>
                )}
              </div>
            ))}

            {requests.length === 0 && (
              <div className="p-8 text-center bg-white/60 rounded-2xl border border-rose-200 text-xs text-rose-600">
                Chưa có yêu cầu nào. Bạn có ý tưởng hay ho nào muốn Nhi viết không?
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
