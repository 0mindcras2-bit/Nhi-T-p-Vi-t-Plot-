export interface Character {
  id: string;
  name: string;
  avatar: string;
  hashtags: string[];
  plot: string;
  aiStudioLink: string;
  isLocked: boolean;
  unlockCost: number;
  likes: number;
  createdAt: string;
  authorNote?: string;
}

export interface AppConfig {
  qrUrl: string;
  qrThankYou: string;
  playlist: MusicTrack[];
  updatedAt?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  isCustom?: boolean;
  credit?: string; // Tên tác giả / cre nguồn nhạc
  creditUrl?: string; // Link gốc bài hát (YouTube, SoundCloud, v.v.)
  audioId?: string; // Firestore document ID if stored in chunks
}

export interface FeedbackItem {
  id: string;
  authorName: string;
  message: string;
  reaction: string;
  createdAt: string;
}

export interface PlotRequestItem {
  id: string;
  authorName: string;
  title: string;
  description: string;
  genre: string;
  status?: 'pending' | 'writing' | 'completed';
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'coin' | 'error';
  title: string;
  message: string;
  coinsSpent?: number;
}

export interface TarotCard {
  id: string;
  name: string;
  nameVi: string;
  arcana: 'Major' | 'Minor';
  image: string;
  keywords: string[];
  meanings: {
    general: {
      upright: string;
      reversed: string;
      advice: string;
    };
    love: {
      upright: string;
      reversed: string;
      advice: string;
    };
    study: {
      upright: string;
      reversed: string;
      advice: string;
    };
    career: {
      upright: string;
      reversed: string;
      advice: string;
    };
  };
}
