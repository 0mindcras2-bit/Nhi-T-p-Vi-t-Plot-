import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MusicTrack } from '../types';
import { sounds } from '../utils/audio';
import { uploadAudioFileToFirestore, resolveAudioUrl, getYouTubeVideoId } from '../utils/audioStorage';
import { YouTubePlayer } from './YouTubePlayer';

interface MusicPlayerProps {
  playlist: MusicTrack[];
  isAuthor: boolean;
  onUpdatePlaylist: (newPlaylist: MusicTrack[]) => void;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  currentIdx: number;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const PRESET_MELODIES: Omit<MusicTrack, 'id'>[] = [
  {
    title: 'Hộp Nhạc Cổ Tích & Ngân Hà',
    artist: 'Nhi Sanctuary • Fairytale Box',
    url: 'https://cdn.freesound.org/previews/415/415804_5121236-lq.mp3',
    credit: 'Freesound Creative Commons (ID: 415804)',
    creditUrl: 'https://freesound.org',
    isCustom: true
  },
  {
    title: 'Khúc Hát Biển Sâu Rafayel',
    artist: 'Lemuria Ocean Melody',
    url: 'https://cdn.freesound.org/previews/531/531947_11861866-lq.mp3',
    credit: 'Ocean Waves Lofi Collection',
    creditUrl: 'https://freesound.org',
    isCustom: true
  },
  {
    title: 'Bụi Sao Rơi Trong Đêm (Piano)',
    artist: 'Celestial Lofi • Stardust',
    url: 'https://cdn.freesound.org/previews/612/612644_11861866-lq.mp3',
    credit: 'Stardust Piano Chill Studio',
    creditUrl: 'https://freesound.org',
    isCustom: true
  },
  {
    title: 'Giai Điệu Hoa Hồng & Gai (Fairy Synth)',
    artist: 'Chimes of the Rose Garden',
    url: 'synth://fairy-melody',
    credit: 'Bản hòa âm độc quyền tạo bởi Nhi',
    creditUrl: '',
    isCustom: true
  }
];

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  playlist,
  onUpdatePlaylist,
  isPlaying,
  setIsPlaying,
  currentIdx,
  setCurrentIdx,
  showModal,
  setShowModal
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'presets' | 'url'>('list');

  // New URL track state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('Nhi Sanctuary');
  const [newUrl, setNewUrl] = useState('');
  const [newCredit, setNewCredit] = useState('');
  const [newCreditUrl, setNewCreditUrl] = useState('');

  // Upload track state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('Nhi Sanctuary');
  const [uploadCredit, setUploadCredit] = useState('');
  const [uploadCreditUrl, setUploadCreditUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit track modal / form state
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCredit, setEditCredit] = useState('');
  const [editCreditUrl, setEditCreditUrl] = useState('');

  // Audio loading & Autoplay state
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Picture-in-picture mini video toggle for YouTube tracks
  const [isMiniVideoOpen, setIsMiniVideoOpen] = useState(false);

  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack: MusicTrack | undefined = playlist[currentIdx] || playlist[0];

  // Check if current track is a YouTube URL
  const ytVideoId = getYouTubeVideoId(currentTrack?.url || '');

  // Detect YouTube URL in the new URL input
  const inputYtId = getYouTubeVideoId(newUrl);

  // Resolve and play audio track (for Non-YouTube audio)
  useEffect(() => {
    if (!currentTrack) return;

    let isCancelled = false;

    const playCurrentTrack = async () => {
      // 1. If paused
      if (!isPlaying) {
        sounds.stopAmbientMelody();
        if (audioRef.current) {
          audioRef.current.pause();
        }
        return;
      }

      // 2. If it's a YouTube track, YouTubePlayer handles audio & video
      if (ytVideoId) {
        sounds.stopAmbientMelody();
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsLoadingAudio(false);
        setAutoplayBlocked(false);
        return;
      }

      // 3. If it's a Synth melody
      if (currentTrack.url.startsWith('synth://')) {
        sounds.startAmbientMelody();
        if (audioRef.current) audioRef.current.pause();
        setAutoplayBlocked(false);
        return;
      }

      // 4. Normal URL or firestore:// chunked audio
      sounds.stopAmbientMelody();
      setIsLoadingAudio(true);

      try {
        const resolved = await resolveAudioUrl(currentTrack.url);
        if (isCancelled) return;

        if (audioRef.current) {
          audioRef.current.src = resolved;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setAutoplayBlocked(false);
              })
              .catch((err: unknown) => {
                console.warn('Browser autoplay blocked:', err);
                setAutoplayBlocked(true);
              });
          }
        }
      } catch (err) {
        console.error('Audio playback error:', err);
        sounds.startAmbientMelody();
      } finally {
        if (!isCancelled) {
          setIsLoadingAudio(false);
        }
      }
    };

    playCurrentTrack();

    return () => {
      isCancelled = true;
    };
  }, [isPlaying, currentIdx, currentTrack, ytVideoId]);

  // Global user interaction handler to resume music if autoplay was blocked
  useEffect(() => {
    const handleFirstGesture = () => {
      if (autoplayBlocked && audioRef.current && !ytVideoId) {
        audioRef.current.play().then(() => {
          setAutoplayBlocked(false);
        }).catch(() => {});
      }
    };

    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [autoplayBlocked, ytVideoId]);

  // Shuffle / random rotation mode (default: true)
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nhi_music_shuffle');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // True cycle queue: plays every song in playlist before any song can repeat
  const remainingShuffleQueueRef = useRef<number[]>([]);
  const playedHistoryRef = useRef<number[]>([]);

  const toggleShuffle = () => {
    sounds.playClick();
    setIsShuffle(prev => {
      const nextVal = !prev;
      try {
        localStorage.setItem('nhi_music_shuffle', String(nextVal));
      } catch {}
      return nextVal;
    });
  };

  // Get next non-repeating shuffle index in current cycle
  const getNextCycleIndex = useCallback((current: number, total: number): number => {
    if (total <= 1) return 0;

    // If all songs in current cycle have been played, create a fresh full cycle
    if (remainingShuffleQueueRef.current.length === 0) {
      const allIndices = Array.from({ length: total }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
      }

      // If the first song in new cycle happens to match current, swap to avoid immediate back-to-back replay
      if (allIndices[0] === current && allIndices.length > 1) {
        [allIndices[0], allIndices[allIndices.length - 1]] = [allIndices[allIndices.length - 1], allIndices[0]];
      }

      const filtered = allIndices.filter(i => i !== current);
      remainingShuffleQueueRef.current = filtered.length > 0 ? filtered : allIndices;
    }

    // Return next unplayed track from the cycle
    return remainingShuffleQueueRef.current.shift()!;
  }, []);

  const nextTrack = () => {
    sounds.playClick();
    if (playlist.length === 0) return;
    if (playlist.length === 1) {
      setCurrentIdx(0);
      setIsPlaying(true);
      return;
    }

    playedHistoryRef.current.push(currentIdx);

    if (isShuffle) {
      const nextIndex = getNextCycleIndex(currentIdx, playlist.length);
      setCurrentIdx(nextIndex);
    } else {
      setCurrentIdx((currentIdx + 1) % playlist.length);
    }
    setIsPlaying(true);
  };

  const prevTrack = () => {
    sounds.playClick();
    if (playlist.length === 0) return;
    if (playedHistoryRef.current.length > 0) {
      const prevIdx = playedHistoryRef.current.pop()!;
      setCurrentIdx(prevIdx);
    } else {
      setCurrentIdx((currentIdx - 1 + playlist.length) % playlist.length);
    }
    setIsPlaying(true);
  };

  // Start editing a track's info and credits
  const handleStartEdit = (track: MusicTrack) => {
    sounds.playClick();
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist || 'Nhi Sanctuary');
    setEditCredit(track.credit || '');
    setEditCreditUrl(track.creditUrl || '');
  };

  // Save edited track's info and credits to Firestore
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack || !editTitle.trim()) return;

    const updated = playlist.map(t =>
      t.id === editingTrack.id
        ? {
            ...t,
            title: editTitle.trim(),
            artist: editArtist.trim() || 'Nhi Sanctuary',
            credit: editCredit.trim(),
            creditUrl: editCreditUrl.trim()
          }
        : t
    );

    onUpdatePlaylist(updated);
    setEditingTrack(null);
    sounds.playCoin();
  };

  // Handle file selection for upload
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
    setUploadTitle(cleanFileName);
    setActiveTab('upload');
  };

  // Perform permanent Firestore chunked upload
  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(5);

      const result = await uploadAudioFileToFirestore(uploadFile, percent => {
        setUploadProgress(percent);
      });

      const newTrack: MusicTrack = {
        id: `track-${Date.now()}`,
        title: uploadTitle.trim() || uploadFile.name,
        artist: uploadArtist.trim() || 'Nhi Sanctuary',
        url: result.url,
        credit: uploadCredit.trim() || 'Tải lên bởi tác giả Nhi',
        creditUrl: uploadCreditUrl.trim(),
        audioId: result.audioId,
        isCustom: true
      };

      const updated = [...playlist, newTrack];
      onUpdatePlaylist(updated);
      setCurrentIdx(updated.length - 1);
      setIsPlaying(true);

      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadCredit('');
      setUploadCreditUrl('');
      setActiveTab('list');
      sounds.playUnlock();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải tệp âm thanh lên máy chủ!';
      alert(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add preset fairytale track
  const handleAddPreset = (preset: typeof PRESET_MELODIES[0]) => {
    const newTrack: MusicTrack = {
      id: `track-preset-${Date.now()}-${Math.random()}`,
      ...preset
    };

    const updated = [...playlist, newTrack];
    onUpdatePlaylist(updated);
    setCurrentIdx(updated.length - 1);
    setIsPlaying(true);
    setActiveTab('list');
    sounds.playCoin();
  };

  // Restore all presets while keeping all custom added tracks
  const handleRestoreAllPresets = () => {
    sounds.playClick();
    const existingTitles = new Set(playlist.map(t => t.title.toLowerCase().trim()));
    const missingPresets: MusicTrack[] = PRESET_MELODIES
      .filter(p => !existingTitles.has(p.title.toLowerCase().trim()))
      .map(p => ({
        id: `track-preset-${Date.now()}-${Math.random()}`,
        ...p
      }));

    if (missingPresets.length === 0) {
      alert('Tất cả các bài hát mẫu thần tiên đã có sẵn trong danh sách!');
      return;
    }

    const updated = [...playlist, ...missingPresets];
    onUpdatePlaylist(updated);
    sounds.playCoin();
    alert(`Đã khôi phục thêm ${missingPresets.length} bài hát mẫu vào danh sách của bạn!`);
  };

  // Add custom URL track (YouTube, direct MP3, Catbox, Google Drive, SoundCloud, etc.)
  const handleAddUrlTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const detectedYtId = getYouTubeVideoId(newUrl.trim());

    const track: MusicTrack = {
      id: `track-${Date.now()}`,
      title: newTitle.trim(),
      artist: newArtist.trim() || (detectedYtId ? 'YouTube Music' : 'Nhi Sanctuary'),
      url: newUrl.trim(),
      credit: newCredit.trim() || (detectedYtId ? 'Nguồn nhạc YouTube' : ''),
      creditUrl: newCreditUrl.trim() || (detectedYtId ? newUrl.trim() : ''),
      isCustom: true
    };

    const updated = [...playlist, track];
    onUpdatePlaylist(updated);
    setCurrentIdx(updated.length - 1);
    setIsPlaying(true);
    setNewTitle('');
    setNewUrl('');
    setNewCredit('');
    setNewCreditUrl('');
    setActiveTab('list');
    sounds.playCoin();
  };

  // Delete track
  const handleDeleteTrack = (trackId: string) => {
    if (playlist.length <= 1) {
      alert('Danh sách cần giữ lại ít nhất 1 bài hát.');
      return;
    }
    const updated = playlist.filter(t => t.id !== trackId);
    onUpdatePlaylist(updated);
    if (currentIdx >= updated.length) {
      setCurrentIdx(0);
    }
    sounds.playClick();
  };

  return (
    <>
      {/* HTML5 Audio for direct MP3, WAV, OGG, and Firestore chunked audio */}
      <audio
        ref={audioRef}
        onEnded={nextTrack}
        className="hidden"
      />

      {/* YouTube IFrame Player for YouTube URLs */}
      <YouTubePlayer
        videoId={ytVideoId}
        isPlaying={isPlaying}
        onEnded={nextTrack}
        isMiniVideoOpen={isMiniVideoOpen}
        onToggleMiniVideo={() => setIsMiniVideoOpen(prev => !prev)}
        trackTitle={currentTrack?.title}
        trackArtist={currentTrack?.artist}
      />

      {/* Floating Mini Video Button if playing YouTube and video is minimized */}
      {ytVideoId && isPlaying && !isMiniVideoOpen && (
        <button
          onClick={() => setIsMiniVideoOpen(true)}
          title="Bấm để mở video YouTube nhỏ góc màn hình"
          className="fixed bottom-24 right-5 z-30 px-3 py-1.5 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-lg border border-white/40 flex items-center gap-1.5 animate-pulse cursor-pointer backdrop-blur-xs"
        >
          <span className="text-sm">📺</span>
          <span>Xem MV YouTube</span>
        </button>
      )}

      {/* Gentle Floating Banner if browser blocked autoplay */}
      {autoplayBlocked && !isPlaying && !ytVideoId && (
        <div
          onClick={() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
            if (audioRef.current) audioRef.current.play().catch(() => {});
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border-2 border-amber-400 text-amber-200 px-5 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-3 cursor-pointer animate-bounce hover:scale-105 transition-transform"
        >
          <span className="text-xl">🎵</span>
          <span className="text-xs sm:text-sm font-bold">Chạm vào đây để bật nhạc nền du dương! ✨</span>
        </div>
      )}

      {/* Playlist & Audio Management Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900/95 text-white rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.9)] border-2 border-rose-400/40 relative max-h-[90vh] flex flex-col animate-[zoomIn_0.2s_ease-out]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/30 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-red-500 flex items-center justify-center text-xl shadow-md border border-rose-300/40">
                  🎵
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-rose-100 flex items-center gap-2">
                    Phòng Thu Âm Nhạc & Ghi Công (Cre)
                  </h3>
                  <p className="text-[11px] text-rose-300/80">
                    Hỗ trợ phát nhạc từ YouTube, tệp tải lên đồng bộ, và chỉnh sửa nguồn Cre bản quyền
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTrack(null);
                }}
                className="text-gray-400 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Action Tabs */}
            <div className="flex gap-1.5 p-1 bg-white/5 rounded-2xl mb-3 border border-white/10 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingTrack(null);
                  setActiveTab('list');
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'list' && !editingTrack
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-200 hover:bg-white/5'
                }`}
              >
                Danh Sách ({playlist.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTrack(null);
                  setActiveTab('url');
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'url'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-200 hover:bg-white/5'
                }`}
              >
                <span>🔴/🔗</span> Link YouTube / URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTrack(null);
                  audioFileInputRef.current?.click();
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'upload'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white/5 hover:bg-rose-500/20 text-rose-200 border border-rose-400/30'
                }`}
              >
                <span>📂</span> Tải File Máy
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTrack(null);
                  setActiveTab('presets');
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'presets'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-200 hover:bg-white/5'
                }`}
              >
                ✨ Bài Mẫu
              </button>
            </div>

            {/* Hidden Audio File Input */}
            <input
              type="file"
              ref={audioFileInputRef}
              accept="audio/*,.mp3,.wav,.m4a,.ogg"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* MODAL BODY (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1">

              {/* SECTION: EDIT SPECIFIC TRACK (TITLE & CRE) */}
              {editingTrack ? (
                <form onSubmit={handleSaveEdit} className="space-y-3.5 bg-slate-950/80 p-4 rounded-2xl border-2 border-rose-400/50 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                    <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                      <span>✏️</span> Chỉnh Sửa Thông Tin & Cre Nhạc
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTrack(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      Tên bài hát: *
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="VD: 知我 (Nhạc phim 剑来)"
                      required
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-rose-400/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {/* Artist */}
                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      Nghệ sĩ / Người thể hiện:
                    </label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={e => setEditArtist(e.target.value)}
                      placeholder="VD: Nhạc phim 剑来 / Ca sĩ..."
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  {/* Credit / Source */}
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center justify-between">
                      <span>🏷️ Cre / Nguồn nhạc bản quyền:</span>
                      <span className="text-[10px] text-gray-400 font-normal">Hiển thị cho độc giả xem</span>
                    </label>
                    <input
                      type="text"
                      value={editCredit}
                      onChange={e => setEditCredit(e.target.value)}
                      placeholder="VD: Cre: YouTube / Sáng tác bởi... / Hoạt hình Kiếm Lai"
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-amber-400/50 rounded-xl text-amber-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Credit URL */}
                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      🔗 Link gốc bài hát (nếu có):
                    </label>
                    <input
                      type="url"
                      value={editCreditUrl}
                      onChange={e => setEditCreditUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingTrack(null)}
                      className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-md border border-rose-300/40 cursor-pointer"
                    >
                      💾 Lưu Thay Đổi & Đồng Bộ
                    </button>
                  </div>
                </form>
              ) : null}

              {/* TAB 1: TRACK LIST */}
              {activeTab === 'list' && !editingTrack && (
                <div className="space-y-2.5">
                  {playlist.map((track, idx) => {
                    const trackYtId = getYouTubeVideoId(track.url);
                    const isSelected = idx === currentIdx;

                    return (
                      <div
                        key={track.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-rose-950/80 border-rose-400 shadow-md ring-1 ring-rose-400/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {/* Top Row: Play trigger & Title */}
                        <div className="flex items-center justify-between gap-2">
                          <div
                            onClick={() => {
                              sounds.playClick();
                              playedHistoryRef.current.push(currentIdx);
                              remainingShuffleQueueRef.current = remainingShuffleQueueRef.current.filter(i => i !== idx);
                              setCurrentIdx(idx);
                              setIsPlaying(true);
                            }}
                            className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
                          >
                            <span className="text-lg shrink-0">
                              {isSelected && isPlaying ? (
                                trackYtId ? '🔴' : (isLoadingAudio ? '⏳' : '🔊')
                              ) : (
                                trackYtId ? '▶️' : '🎶'
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs sm:text-sm font-bold text-rose-100 truncate">
                                  {track.title}
                                </p>
                                {trackYtId && (
                                  <span className="px-1.5 py-0.2 bg-red-600/80 text-[9px] font-bold text-white rounded-md shrink-0">
                                    YouTube
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 truncate">
                                {track.artist || 'Nhi Sanctuary'}
                              </p>
                            </div>
                          </div>

                          {/* Actions: Video toggle (if YT), Edit Cre & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {trackYtId && isSelected && (
                              <button
                                type="button"
                                onClick={() => setIsMiniVideoOpen(prev => !prev)}
                                title="Xem hoặc thu nhỏ video YouTube"
                                className="px-2 py-1 text-[10px] font-bold bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>📺</span> {isMiniVideoOpen ? 'Ẩn' : 'Xem'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(track)}
                              title="Sửa tên bài hát & cre nguồn nhạc"
                              className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/40 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>✏️</span> Sửa Cre
                            </button>
                            {playlist.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTrack(track.id)}
                                title="Xóa bài hát khỏi danh sách"
                                className="w-7 h-7 flex items-center justify-center text-xs text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-lg cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Cre / Credit Info */}
                        {(track.credit || track.creditUrl || trackYtId) && (
                          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-300/90 gap-2">
                            <span className="truncate flex items-center gap-1">
                              <span>🏷️</span> Cre: <strong>{track.credit || (trackYtId ? 'Nguồn YouTube' : 'Chưa đặt')}</strong>
                            </span>
                            {(track.creditUrl || (trackYtId && track.url)) && (
                              <a
                                href={track.creditUrl || track.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-rose-300 hover:underline shrink-0 flex items-center gap-0.5"
                              >
                                <span>↗</span> Bản gốc
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Restore Presets Helper */}
                  <div className="pt-3 border-t border-white/10 text-center">
                    <button
                      type="button"
                      onClick={handleRestoreAllPresets}
                      className="text-xs text-rose-300/80 hover:text-rose-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
                    >
                      ✨ Khôi phục thêm các bài mẫu thần tiên (Giữ nguyên bài đã thêm)
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: ADD YOUTUBE LINK OR DIRECT URL */}
              {activeTab === 'url' && !editingTrack && (
                <form onSubmit={handleAddUrlTrack} className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-rose-400/40">
                  <div className="pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                      <span>🔴/🔗</span> Thêm Nhạc Qua Đường Dẫn (YouTube / MP3 / Direct Link)
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Dán link YouTube (youtu.be / youtube.com) hoặc link nhạc trực tiếp (.mp3, SoundCloud, Google Drive)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      Đường dẫn URL bài hát: *
                    </label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={e => {
                        const val = e.target.value;
                        setNewUrl(val);
                        // Auto-fill friendly title if YouTube detected and title is empty
                        if (!newTitle) {
                          const ytid = getYouTubeVideoId(val);
                          if (ytid) {
                            setNewTitle('Bài Hát YouTube Mới');
                            setNewArtist('YouTube Music');
                          }
                        }
                      }}
                      placeholder="VD: https://youtu.be/... hoặc https://.../music.mp3"
                      required
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-rose-400/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />

                    {inputYtId && (
                      <div className="mt-1.5 flex items-center gap-2 p-2 bg-red-950/60 border border-red-500/40 rounded-xl text-[11px] text-red-200">
                        <span className="text-base">🔴</span>
                        <span>Đã phát hiện link YouTube! Ứng dụng sẽ phát nhạc chất lượng cao kèm tùy chọn xem MV.</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      Tên bài hát: *
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="VD: 知我 (Nhạc phim 剑来)"
                      required
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      Nghệ sĩ / Thể hiện:
                    </label>
                    <input
                      type="text"
                      value={newArtist}
                      onChange={e => setNewArtist(e.target.value)}
                      placeholder="VD: Nhạc phim 剑来 / Ca sĩ..."
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      🏷️ Cre / Nguồn nhạc:
                    </label>
                    <input
                      type="text"
                      value={newCredit}
                      onChange={e => setNewCredit(e.target.value)}
                      placeholder="VD: Cre: YouTube / Sáng tác bởi... / Cover"
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-amber-400/40 rounded-xl text-amber-100 placeholder-gray-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-200 mb-1">
                      🔗 Link bài hát gốc:
                    </label>
                    <input
                      type="url"
                      value={newCreditUrl}
                      onChange={e => setNewCreditUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md border border-rose-300/40 cursor-pointer"
                  >
                    ➕ Thêm Bài Hát Này & Đồng Bộ Mọi Người
                  </button>
                </form>
              )}

              {/* TAB 3: UPLOAD AUDIO FILE (CHUNKED TO FIRESTORE) */}
              {activeTab === 'upload' && !editingTrack && (
                <form onSubmit={handleConfirmUpload} className="space-y-3.5 bg-slate-950/80 p-4 rounded-2xl border border-rose-400/40">
                  <div className="pb-2 border-b border-white/10">
                    <h4 className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                      <span>📂</span> Tải Lên Tệp Âm Thanh & Tự Động Đồng Bộ Mọi Thiết Bị
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Nhạc được lưu trực tiếp vào Firebase để bất kỳ ai vào trang web cũng đều nghe được!
                    </p>
                  </div>

                  {/* Selected File Notice */}
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-rose-100 truncate">
                        {uploadFile ? uploadFile.name : 'Chưa chọn tệp'}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : 'Hỗ trợ .mp3, .wav, .m4a, .ogg'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {uploadFile ? 'Đổi Tệp Khác' : 'Chọn Tệp'}
                    </button>
                  </div>

                  {uploadFile && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-rose-200 mb-1">
                          Tên bài hát: *
                        </label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={e => setUploadTitle(e.target.value)}
                          placeholder="VD: Khúc Ca Đêm Trăng"
                          required
                          className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-rose-400/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-rose-200 mb-1">
                          Nghệ sĩ / Người thể hiện:
                        </label>
                        <input
                          type="text"
                          value={uploadArtist}
                          onChange={e => setUploadArtist(e.target.value)}
                          placeholder="VD: Nhi Sanctuary / Ca sĩ..."
                          className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          🏷️ Cre / Nguồn bài hát: *
                        </label>
                        <input
                          type="text"
                          value={uploadCredit}
                          onChange={e => setUploadCredit(e.target.value)}
                          placeholder="VD: Cre: YouTube / Cover bởi Nhi / Tác giả..."
                          className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-amber-400/50 rounded-xl text-amber-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-rose-200 mb-1">
                          🔗 Link gốc bài hát (nếu có):
                        </label>
                        <input
                          type="url"
                          value={uploadCreditUrl}
                          onChange={e => setUploadCreditUrl(e.target.value)}
                          placeholder="https://youtube.com/..."
                          className="w-full text-xs px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none"
                        />
                      </div>

                      {isUploading && (
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-xs text-rose-200 font-bold">
                            <span>Đang mã hóa & đồng bộ lên máy chủ...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-rose-400/30">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg border border-rose-300/40 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{isUploading ? '⏳ Đang Tải Lên...' : '🚀 Tải Lên & Đồng Bộ Toàn Bộ Khách Nghe'}</span>
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* TAB 4: PRESETS */}
              {activeTab === 'presets' && !editingTrack && (
                <div className="space-y-2">
                  <p className="text-xs text-rose-200 font-bold mb-2">
                    Giai điệu thần tiên có sẵn:
                  </p>
                  {PRESET_MELODIES.map((preset, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-rose-100 truncate">
                          {preset.title}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {preset.artist}
                        </p>
                        {preset.credit && (
                          <p className="text-[10px] text-amber-300/80 truncate mt-0.5">
                            🏷️ Cre: {preset.credit}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPreset(preset)}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/40 text-rose-200 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        ➕ Thêm
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Playback Control Bar */}
            <div className="mt-4 pt-3 border-t border-rose-500/30 flex items-center justify-between gap-3 shrink-0 bg-slate-950/60 p-3 rounded-2xl">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{ytVideoId ? '🔴' : '🎵'}</span>
                  <p className="text-xs font-bold text-rose-100 truncate">
                    {currentTrack?.title || 'Chưa phát bài nào'}
                  </p>
                  {ytVideoId && (
                    <span className="px-1.5 py-0.2 bg-red-600/80 text-[8px] font-bold text-white rounded shrink-0">
                      YouTube
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 truncate">
                  <span>{currentTrack?.artist || 'Nhi Sanctuary'}</span>
                  {currentTrack?.credit && (
                    <span className="text-amber-300 truncate">
                      • Cre: {currentTrack.credit}
                    </span>
                  )}
                </div>
              </div>

              {/* Playback Controls & Video Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isShuffle
                      ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-400/50 scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-gray-400'
                  }`}
                  title={isShuffle ? 'Phát ngẫu nhiên / luân phiên: ĐANG BẬT' : 'Phát ngẫu nhiên / luân phiên: ĐANG TẮT'}
                >
                  🔀
                </button>
                {ytVideoId && (
                  <button
                    type="button"
                    onClick={() => setIsMiniVideoOpen(prev => !prev)}
                    className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-[10px] font-bold text-red-200 border border-red-500/40 cursor-pointer"
                    title="Mở hoặc thu nhỏ video"
                  >
                    📺 {isMiniVideoOpen ? 'Ẩn' : 'Xem'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={prevTrack}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center text-rose-200 cursor-pointer"
                  title="Bài trước"
                >
                  ⏮️
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying(prev => !prev)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white flex items-center justify-center shadow-md border border-rose-300/40 cursor-pointer"
                  title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                >
                  {isPlaying ? (isLoadingAudio ? '⏳' : '⏸️') : '▶️'}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center text-rose-200 cursor-pointer"
                  title="Bài kế tiếp"
                >
                  ⏭️
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
