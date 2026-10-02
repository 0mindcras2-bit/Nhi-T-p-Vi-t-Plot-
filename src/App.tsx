import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Character,
  AppConfig,
  FeedbackItem,
  PlotRequestItem,
  ToastMessage,
  MusicTrack
} from './types';
import {
  INITIAL_CHARACTERS,
  INITIAL_CONFIG,
  INITIAL_FEEDBACKS,
  INITIAL_REQUESTS
} from './data/initialData';
import { sounds } from './utils/audio';
import confetti from 'canvas-confetti';

import { Header } from './components/Header';
import { MascotFloaters } from './components/MascotFloaters';
import { MusicPlayer } from './components/MusicPlayer';
import { QrCodeCorner } from './components/QrCodeCorner';
import { CharacterCard } from './components/CharacterCard';
import { PlotModal } from './components/PlotModal';
import { CharacterEditModal } from './components/CharacterEditModal';
import { MinigamesHub } from './components/games/MinigamesHub';
import { CommunitySection } from './components/CommunitySection';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'characters' | 'games' | 'community'>('characters');

  const [isAuthor, setIsAuthor] = useState<boolean>(() => {
    return sessionStorage.getItem('nhi_author_mode') === 'true';
  });

  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('nhi_user_coins');
    return saved !== null ? parseInt(saved, 10) : 50;
  });

  const [unlockedCharIds, setUnlockedCharIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('nhi_unlocked_chars');
    return saved ? JSON.parse(saved) : [];
  });

  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [requests, setRequests] = useState<PlotRequestItem[]>([]);

  // Music state integrated with red pufferfish
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [showMusicModal, setShowMusicModal] = useState<boolean>(false);

  // Search & Hashtags
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modals state
  const [viewingPlotChar, setViewingPlotChar] = useState<Character | null>(null);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    localStorage.setItem('nhi_user_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('nhi_unlocked_chars', JSON.stringify(unlockedCharIds));
  }, [unlockedCharIds]);

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    const unsubChars = onSnapshot(
      collection(db, 'characters'),
      snapshot => {
        if (!snapshot.empty) {
          const list: Character[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Character, 'id'>) });
          });
          // Ensure hearts start from 0 by default
          if (localStorage.getItem('nhi_hearts_reset_zero_v1') !== 'true') {
            localStorage.setItem('nhi_hearts_reset_zero_v1', 'true');
            list.forEach(c => {
              if (c.likes !== 0) {
                c.likes = 0;
                setDoc(doc(db, 'characters', c.id), { likes: 0 }, { merge: true }).catch(() => {});
              }
            });
          }
          setCharacters(list);
        } else {
          INITIAL_CHARACTERS.forEach(async char => {
            try {
              const { id, ...data } = char;
              await setDoc(doc(db, 'characters', id), data);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, 'characters');
            }
          });
        }
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'characters');
      }
    );

    const unsubConfig = onSnapshot(
      doc(db, 'config', 'settings'),
      docSnap => {
        if (docSnap.exists()) {
          setConfig(docSnap.data() as AppConfig);
        } else {
          setDoc(doc(db, 'config', 'settings'), INITIAL_CONFIG).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, 'config/settings');
          });
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, 'config/settings');
      }
    );

    const unsubFeedbacks = onSnapshot(
      collection(db, 'feedbacks'),
      snapshot => {
        if (!snapshot.empty) {
          const list: FeedbackItem[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Omit<FeedbackItem, 'id'>;
            // Filter out legacy mock data if any
            if (!docSnap.id.startsWith('fb-') && data.authorName !== 'Mây Nhỏ' && data.authorName !== 'Lemuria_Seeker' && data.authorName !== 'An Nhiên') {
              list.push({ id: docSnap.id, ...data });
            }
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setFeedbacks(list);
        } else {
          setFeedbacks([]);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'feedbacks');
      }
    );

    const unsubRequests = onSnapshot(
      collection(db, 'requests'),
      snapshot => {
        if (!snapshot.empty) {
          const list: PlotRequestItem[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Omit<PlotRequestItem, 'id'>;
            // Filter out legacy mock data if any
            if (!docSnap.id.startsWith('req-') && data.authorName !== 'Hạt Tiêu' && data.authorName !== 'Moonlight') {
              list.push({ id: docSnap.id, ...data });
            }
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRequests(list);
        } else {
          setRequests([]);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'requests');
      }
    );

    return () => {
      unsubChars();
      unsubConfig();
      unsubFeedbacks();
      unsubRequests();
    };
  }, []);

  const handleLoginAuthor = (password: string): boolean => {
    if (password === 'rafayel0306haha') {
      setIsAuthor(true);
      sessionStorage.setItem('nhi_author_mode', 'true');
      addToast({
        type: 'success',
        title: 'Chào mừng Tác Giả!',
        message: 'Bạn đã đăng nhập chế độ tác giả 🌹'
      });
      return true;
    }
    return false;
  };

  const handleLogoutAuthor = () => {
    setIsAuthor(false);
    sessionStorage.removeItem('nhi_author_mode');
    addToast({
      type: 'info',
      title: 'Đã Thoát Tác Giả',
      message: 'Hiện đang ở chế độ khách.'
    });
  };

  const handleEarnCoins = (amount: number, reason: string) => {
    setCoins(prev => prev + amount);
    sounds.playCoin();
    addToast({
      type: 'coin',
      title: `+${amount} Xu!`,
      message: reason
    });
  };

  const handleLikeCharacter = async (char: Character) => {
    const updatedLikes = (char.likes || 0) + 1;
    setCharacters(prev =>
      prev.map(c => (c.id === char.id ? { ...c, likes: updatedLikes } : c))
    );
    try {
      await updateDoc(doc(db, 'characters', char.id), { likes: updatedLikes });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `characters/${char.id}`);
    }
  };

  const handleOpenCharacterLink = (char: Character) => {
    const isUnlocked = !char.isLocked || unlockedCharIds.includes(char.id);

    if (isUnlocked) {
      sounds.playClick();
      window.open(char.aiStudioLink, '_blank', 'noopener,noreferrer');
    } else {
      const cost = char.unlockCost || 30;
      if (coins < cost) {
        sounds.playClick();
        addToast({
          type: 'error',
          title: 'Chưa đủ xu',
          message: `Cần ${cost} xu để mở khóa liên kết của ${char.name}. Chơi trò chơi để nhận xu nhé!`
        });
        return;
      }

      setCoins(prev => prev - cost);
      setUnlockedCharIds(prev => [...prev, char.id]);
      sounds.playUnlock();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      addToast({
        type: 'success',
        title: 'Mở Khóa Thành Công!',
        message: `Đã mở khóa liên kết Google AI Studio của "${char.name}"!`,
        coinsSpent: cost
      });

      setTimeout(() => {
        window.open(char.aiStudioLink, '_blank', 'noopener,noreferrer');
      }, 600);
    }
  };

  const handleSaveCharacter = async (charData: Partial<Character>) => {
    if (editingChar) {
      try {
        await updateDoc(doc(db, 'characters', editingChar.id), charData);
        addToast({
          type: 'success',
          title: 'Đã Cập Nhật',
          message: `Nhân vật "${charData.name}" đã được lưu.`
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `characters/${editingChar.id}`);
      }
    } else {
      try {
        const newDoc: Omit<Character, 'id'> = {
          name: charData.name || 'Nhân vật mới',
          avatar: charData.avatar || '',
          hashtags: charData.hashtags || ['#AIStudio'],
          plot: charData.plot || '',
          aiStudioLink: charData.aiStudioLink || 'https://aistudio.google.com/',
          isLocked: !!charData.isLocked,
          unlockCost: charData.unlockCost || 0,
          likes: 0,
          createdAt: new Date().toISOString(),
          authorNote: charData.authorNote || ''
        };
        await addDoc(collection(db, 'characters'), newDoc);
        addToast({
          type: 'success',
          title: 'Đã Tạo Nhân Vật',
          message: `Nhân vật "${newDoc.name}" đã được thêm thành công!`
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'characters');
      }
    }
  };

  const handleDeleteCharacter = async (char: Character) => {
    if (!window.confirm(`Xóa nhân vật "${char.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'characters', char.id));
      addToast({
        type: 'info',
        title: 'Đã Xóa',
        message: `Đã xóa "${char.name}".`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `characters/${char.id}`);
    }
  };

  const handleUpdateQr = async (newQrUrl: string, newThankYou: string) => {
    const updated: AppConfig = {
      ...config,
      qrUrl: newQrUrl,
      qrThankYou: newThankYou,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    try {
      await setDoc(doc(db, 'config', 'settings'), updated);
      addToast({
        type: 'success',
        title: 'Đã Lưu Mã QR',
        message: 'Thông tin đã đồng bộ lên Firebase.'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/settings');
    }
  };

  const handleUpdatePlaylist = async (newPlaylist: MusicTrack[]) => {
    const updated: AppConfig = {
      ...config,
      playlist: newPlaylist,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    try {
      await setDoc(doc(db, 'config', 'settings'), updated);
      addToast({
        type: 'success',
        title: 'Đã Lưu Playlist',
        message: 'Danh sách bài hát đã đồng bộ.'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/settings');
    }
  };

  const handleSubmitFeedback = async (item: Omit<FeedbackItem, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'feedbacks'), {
        ...item,
        createdAt: new Date().toISOString()
      });
      addToast({
        type: 'success',
        title: 'Đã Gửi Lời Nhắn',
        message: 'Cảm ơn bạn đã gửi lời nhắn tới Nhi 🌹'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'feedbacks');
    }
  };

  const handleSubmitRequest = async (item: Omit<PlotRequestItem, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'requests'), {
        ...item,
        createdAt: new Date().toISOString()
      });
      addToast({
        type: 'success',
        title: 'Đã Gửi Yêu Cầu',
        message: 'Ý tưởng đã được chuyển tới Nhi ✨'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'requests');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'feedbacks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `feedbacks/${id}`);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'requests', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `requests/${id}`);
    }
  };

  const allHashtags = useMemo(() => {
    const set = new Set<string>();
    characters.forEach(c => {
      c.hashtags.forEach(tag => set.add(tag));
    });
    return Array.from(set);
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    return characters.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.plot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.hashtags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = selectedTag === 'all' || c.hashtags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [characters, searchQuery, selectedTag]);

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden bg-slate-950">
      {/* EXACT USER MILKY WAY BACKGROUND IMAGE */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Real photo uploaded by user */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/user_milky_way.jpg')` }}
        />

        {/* Soft atmospheric night overlay to ensure crisp contrast for text and cards */}
        <div className="absolute inset-0 bg-slate-950/35" />
      </div>

      {/* 4D Floating Mascots, Stardust Scroll Effect & Integrated Music in Red Pufferfish */}
      <MascotFloaters
        onBonusCoin={handleEarnCoins}
        playlist={config.playlist || INITIAL_CONFIG.playlist}
        currentTrackIndex={currentTrackIndex}
        isPlayingMusic={isPlayingMusic}
        onToggleMusic={() => setIsPlayingMusic(prev => !prev)}
        onNextMusic={() => {
          const list = config.playlist || INITIAL_CONFIG.playlist;
          if (list.length <= 1) return;
          const isShuffle = localStorage.getItem('nhi_music_shuffle') !== 'false';
          if (isShuffle) {
            // Retrieve or generate unplayed cycle queue from session
            let queue: number[] = [];
            try {
              const savedQ = sessionStorage.getItem('nhi_cycle_queue');
              if (savedQ) queue = JSON.parse(savedQ);
            } catch {}

            if (!queue || queue.length === 0) {
              const allIdx = Array.from({ length: list.length }, (_, i) => i);
              for (let i = allIdx.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIdx[i], allIdx[j]] = [allIdx[j], allIdx[i]];
              }
              if (allIdx[0] === currentTrackIndex && allIdx.length > 1) {
                [allIdx[0], allIdx[allIdx.length - 1]] = [allIdx[allIdx.length - 1], allIdx[0]];
              }
              queue = allIdx.filter(idx => idx !== currentTrackIndex);
              if (queue.length === 0) queue = allIdx;
            }

            const nextIndex = queue.shift()!;
            try {
              sessionStorage.setItem('nhi_cycle_queue', JSON.stringify(queue));
            } catch {}
            setCurrentTrackIndex(nextIndex);
          } else {
            setCurrentTrackIndex((currentTrackIndex + 1) % list.length);
          }
          setIsPlayingMusic(true);
        }}
        onPrevMusic={() => {
          const list = config.playlist || INITIAL_CONFIG.playlist;
          setCurrentTrackIndex((currentTrackIndex - 1 + list.length) % list.length);
          setIsPlayingMusic(true);
        }}
        onOpenMusicModal={() => setShowMusicModal(true)}
      />

      {/* Music Audio Engine & Playlist Management Modal */}
      <MusicPlayer
        playlist={config.playlist || INITIAL_CONFIG.playlist}
        isAuthor={isAuthor}
        onUpdatePlaylist={handleUpdatePlaylist}
        isPlaying={isPlayingMusic}
        setIsPlaying={setIsPlayingMusic}
        currentIdx={currentTrackIndex}
        setCurrentIdx={setCurrentTrackIndex}
        showModal={showMusicModal}
        setShowModal={setShowMusicModal}
      />

      {/* Corner QR Code & Thank You Widget */}
      <QrCodeCorner
        qrUrl={config.qrUrl || INITIAL_CONFIG.qrUrl}
        thankYouMessage={config.qrThankYou || INITIAL_CONFIG.qrThankYou}
        isAuthor={isAuthor}
        onUpdateQr={handleUpdateQr}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        coins={coins}
        isAuthor={isAuthor}
        onLoginAuthor={handleLoginAuthor}
        onLogoutAuthor={handleLogoutAuthor}
        onOpenQr={() => setShowQrModal(true)}
        onOpenMusic={() => setShowMusicModal(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 pb-28">
        {/* TAB 1: CHARACTERS SHOWCASE */}
        {activeTab === 'characters' && (
          <div>
            {/* Clean Hero Header (Removed unnecessary clutter) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>🌹</span>
                  <span>Nhân Vật AI Studio</span>
                </h2>
                <p className="text-xs text-rose-200/80 mt-1">
                  Đọc plot, thả tim hoặc dùng xu mở khóa link trò chuyện trực tiếp
                </p>
              </div>

              {/* Author Only Add Button */}
              {isAuthor && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setEditingChar(null);
                    setIsEditModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-950 font-bold text-xs rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>➕</span> Thêm Nhân Vật Mới
                </button>
              )}
            </div>

            {/* Search Bar & Hashtags Filter */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-rose-500/20 p-3.5 mb-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="w-full md:w-80 relative">
                <input
                  type="text"
                  placeholder="Tìm nhân vật, plot, hashtag..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-rose-400/40 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none bg-slate-950/80 text-white placeholder:text-gray-400"
                />
                <span className="absolute left-3 top-2.5 text-xs text-rose-400">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2 text-xs text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSelectedTag('all');
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                    selectedTag === 'all'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-white/10 text-rose-200 hover:bg-white/15'
                  }`}
                >
                  Tất cả ({characters.length})
                </button>
                {allHashtags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedTag(tag);
                    }}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-white/10 text-rose-200 hover:bg-white/15'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Character Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCharacters.map(char => (
                <CharacterCard
                  key={char.id}
                  character={char}
                  isAuthor={isAuthor}
                  isUnlocked={!char.isLocked || unlockedCharIds.includes(char.id)}
                  onLike={handleLikeCharacter}
                  onOpenPlot={setViewingPlotChar}
                  onOpenLink={handleOpenCharacterLink}
                  onEdit={charToEdit => {
                    setEditingChar(charToEdit);
                    setIsEditModalOpen(true);
                  }}
                  onDelete={handleDeleteCharacter}
                />
              ))}
            </div>

            {filteredCharacters.length === 0 && (
              <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-rose-500/20 mt-6">
                <span className="text-4xl block mb-2">🌹</span>
                <h4 className="font-serif text-base font-bold text-rose-200">
                  Không tìm thấy nhân vật phù hợp
                </h4>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MINIGAMES HUB */}
        {activeTab === 'games' && (
          <MinigamesHub
            coins={coins}
            onEarnCoins={handleEarnCoins}
          />
        )}

        {/* TAB 4: COMMUNITY (FEEDBACK & REQUESTS) */}
        {activeTab === 'community' && (
          <CommunitySection
            feedbacks={feedbacks}
            requests={requests}
            isAuthor={isAuthor}
            onSubmitFeedback={handleSubmitFeedback}
            onSubmitRequest={handleSubmitRequest}
            onDeleteFeedback={handleDeleteFeedback}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </main>

      {/* Plot Modal */}
      <PlotModal
        character={viewingPlotChar}
        onClose={() => setViewingPlotChar(null)}
        onOpenAiStudioLink={handleOpenCharacterLink}
        isUnlocked={
          viewingPlotChar ? !viewingPlotChar.isLocked || unlockedCharIds.includes(viewingPlotChar.id) : false
        }
      />

      {/* Author Edit Modal */}
      <CharacterEditModal
        character={editingChar}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCharacter}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
