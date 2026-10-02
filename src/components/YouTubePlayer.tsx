import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  onEnded: () => void;
  isMiniVideoOpen: boolean;
  onToggleMiniVideo: () => void;
  trackTitle?: string;
  trackArtist?: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: unknown) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  isPlaying,
  onEnded,
  isMiniVideoOpen,
  onToggleMiniVideo,
  trackTitle,
  trackArtist
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [isApiReady, setIsApiReady] = useState<boolean>(false);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

  // 1. Load YouTube IFrame API Script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const scriptId = 'youtube-iframe-api-script';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(scriptTag);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      setIsApiReady(true);
    };
  }, []);

  // 2. Initialize or update YouTube Player
  useEffect(() => {
    if (!isApiReady || !videoId || !containerRef.current) {
      if (!videoId && playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
      return;
    }

    // If player exists, switch video ID
    if (playerRef.current) {
      try {
        playerRef.current.loadVideoById(videoId);
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (err) {
        console.warn('Error loading new YouTube video ID:', err);
      }
      return;
    }

    // Create fresh player
    try {
      const ytPlayer = new window.YT!.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: event => {
            playerRef.current = event.target;
            setIsPlayerReady(true);
            if (isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: event => {
            // State 0 is ENDED
            if (event.data === 0) {
              onEnded();
            }
          },
          onError: err => {
            console.warn('YouTube Player Event Error:', err);
          }
        }
      });
      playerRef.current = ytPlayer;
    } catch (err) {
      console.error('Failed to instantiate YouTube Player:', err);
    }

    return () => {
      // Keep player intact for smooth continuous background audio
    };
  }, [isApiReady, videoId]);

  // 3. Sync play/pause state
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('Error controlling YouTube play state:', err);
    }
  }, [isPlaying, isPlayerReady]);

  if (!videoId) return null;

  return (
    <>
      {/* Floating Mini Video Window (Picture-in-Picture) */}
      <div
        className={`fixed transition-all duration-300 z-50 ${
          isMiniVideoOpen
            ? 'bottom-20 right-4 w-72 sm:w-80 h-48 bg-slate-900/95 border-2 border-rose-400 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden flex flex-col'
            : 'pointer-events-none opacity-0 -bottom-96 -right-96 w-64 h-36'
        }`}
      >
        {isMiniVideoOpen && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-rose-500/30 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-red-500 text-sm">▶</span>
              <span className="font-bold text-rose-200 truncate text-[11px]">
                {trackTitle || 'Đang phát YouTube'}
              </span>
            </div>
            <button
              onClick={onToggleMiniVideo}
              title="Thu nhỏ video (vẫn phát nhạc nền)"
              className="text-gray-400 hover:text-white px-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* The YouTube iframe mount container */}
        <div className="flex-1 w-full h-full relative bg-black">
          <div ref={containerRef} className="w-full h-full absolute inset-0" />
        </div>

        {isMiniVideoOpen && trackArtist && (
          <div className="px-3 py-1 bg-slate-950/90 text-[10px] text-gray-400 truncate">
            {trackArtist}
          </div>
        )}
      </div>
    </>
  );
};
