import React, { useEffect, useState, useRef } from 'react';
import { sounds } from '../utils/audio';
import { MusicTrack } from '../types';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // radians
  size: number;
  headColor: string;
  trailColor: string;
  life: number;
  maxLife: number;
  trailHistory: { x: number; y: number }[];
}

interface MascotFloatersProps {
  onBonusCoin?: (amount: number, reason: string) => void;
  playlist: MusicTrack[];
  currentTrackIndex: number;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  onNextMusic: () => void;
  onPrevMusic: () => void;
  onOpenMusicModal: () => void;
}

export const MascotFloaters: React.FC<MascotFloatersProps> = ({
  onBonusCoin,
  playlist,
  currentTrackIndex,
  isPlayingMusic,
  onToggleMusic,
  onNextMusic,
  onOpenMusicModal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const [clickCount, setClickCount] = useState<number>(0);
  const [showPufferMusicPlayer, setShowPufferMusicPlayer] = useState<boolean>(false);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Helper to spawn a fantasy shooting star
  const spawnShootingStar = (canvasWidth: number, canvasHeight: number, isCompanion = false) => {
    const angleDeg = 35 + Math.random() * 20; // 35 to 55 degrees
    const angleRad = (angleDeg * Math.PI) / 180;
    const speed = 14 + Math.random() * 12; // High-speed streak
    const length = 120 + Math.random() * 140; // 120 - 260px tail
    const startX = Math.random() * (canvasWidth * 0.85);
    const startY = -20 + Math.random() * (canvasHeight * 0.35);

    const starPalettes = [
      { head: '#ffffff', trail: '#c084fc' }, // Violet nebula
      { head: '#fef08a', trail: '#f59e0b' }, // Golden starlight
      { head: '#ffffff', trail: '#38bdf8' }, // Cyan diamond
      { head: '#fbcfe8', trail: '#f43f5e' }  // Rose stardust
    ];
    const palette = starPalettes[Math.floor(Math.random() * starPalettes.length)];

    const star: ShootingStar = {
      x: isCompanion ? startX + 30 : startX,
      y: isCompanion ? startY - 20 : startY,
      length,
      speed,
      angle: angleRad,
      size: 2.2 + Math.random() * 1.5,
      headColor: palette.head,
      trailColor: palette.trail,
      life: 0,
      maxLife: 40 + Math.floor(Math.random() * 30),
      trailHistory: []
    };

    shootingStarsRef.current.push(star);
  };

  // High-frequency, rich stardust & shooting stars canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const stardustColors = [
      '#ffffff', // Diamond white
      '#fef08a', // Pale gold
      '#fcd34d', // Warm amber
      '#f43f5e', // Rose petal
      '#fda4af', // Fairy pink
      '#c084fc', // Nebula purple
      '#a855f7', // Deep lavender
      '#38bdf8'  // Starlight blue
    ];

    // Seed continuous ambient stardust across the viewport
    for (let i = 0; i < 70; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.8 + 0.8,
        color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.5 - 0.1,
        life: Math.random() * 100,
        maxLife: 150 + Math.random() * 120,
        twinkleSpeed: Math.random() * 0.08 + 0.02
      });
    }

    // Stardust on Mouse Move
    const handleMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          size: Math.random() * 3.2 + 1,
          color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
          speedX: (Math.random() - 0.5) * 1.2,
          speedY: (Math.random() - 0.5) * 1.2 - 0.3,
          life: 0,
          maxLife: 35 + Math.random() * 25,
          twinkleSpeed: 0.1
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Stardust on Scroll
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      lastScrollY = currentScrollY;

      const count = Math.min(20, Math.max(6, Math.floor(delta / 5)));
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 3.5 + 1.2,
          color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2.5 - 0.8,
          life: 0,
          maxLife: 45 + Math.random() * 35,
          twinkleSpeed: 0.12
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let animId: number;
    let frame = 0;
    let nextShootingStarFrame = 40; // Spawn first star quickly

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // HIGH FREQUENCY SHOOTING STAR GENERATOR (Random intervals ~1.2s - 2.2s)
      if (frame >= nextShootingStarFrame) {
        spawnShootingStar(width, height);
        // 35% chance to spawn a companion twin shooting star
        if (Math.random() < 0.35) {
          setTimeout(() => {
            spawnShootingStar(width, height, true);
          }, 180);
        }
        // Set next trigger: between 50 and 95 frames at 60fps = 0.8s to 1.6s!
        nextShootingStarFrame = frame + Math.floor(50 + Math.random() * 55);
      }

      // 1. RENDER & UPDATE SHOOTING STARS
      const stars = shootingStarsRef.current;
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life++;

        // Calculate movement
        const moveX = Math.cos(s.angle) * s.speed;
        const moveY = Math.sin(s.angle) * s.speed;
        s.x += moveX;
        s.y += moveY;

        // Tail origin behind head
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        // Opacity fade in and fade out
        let alpha = 1;
        if (s.life < 8) {
          alpha = s.life / 8;
        } else if (s.life > s.maxLife - 12) {
          alpha = Math.max(0, (s.maxLife - s.life) / 12);
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Create radiant linear gradient for the tail
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.6, s.trailColor);
        grad.addColorStop(1, s.headColor);

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.size;
        ctx.lineCap = 'round';
        ctx.shadowColor = s.trailColor;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Glowing Star Head
        ctx.fillStyle = s.headColor;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Cross Sparkle at the head
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x - s.size * 3, s.y);
        ctx.lineTo(s.x + s.size * 3, s.y);
        ctx.moveTo(s.x, s.y - s.size * 3);
        ctx.lineTo(s.x, s.y + s.size * 3);
        ctx.stroke();

        ctx.restore();

        // Drop stardust in the wake of the shooting star
        if (frame % 3 === 0 && particlesRef.current.length < 130) {
          particlesRef.current.push({
            x: s.x - Math.cos(s.angle) * (Math.random() * s.length * 0.5),
            y: s.y - Math.sin(s.angle) * (Math.random() * s.length * 0.5),
            size: Math.random() * 2.2 + 0.6,
            color: s.trailColor,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: Math.random() * 0.5,
            life: 0,
            maxLife: 30 + Math.random() * 20,
            twinkleSpeed: 0.15
          });
        }

        // Cleanup out-of-bounds or expired stars
        if (s.life >= s.maxLife || s.x > width + 100 || s.y > height + 100) {
          stars.splice(i, 1);
        }
      }

      // 2. RENDER & UPDATE AMBIENT STARDUST
      if (frame % 7 === 0 && particlesRef.current.length < 110) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height + 5,
          size: Math.random() * 2.5 + 0.8,
          color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -Math.random() * 0.6 - 0.2,
          life: 0,
          maxLife: 180 + Math.random() * 100,
          twinkleSpeed: Math.random() * 0.08 + 0.02
        });
      }

      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;

        const baseAlpha = Math.max(0, 1 - p.life / p.maxLife);
        const twinkle = 0.6 + 0.4 * Math.sin(frame * p.twinkleSpeed);
        const alpha = baseAlpha * twinkle;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size > 2 ? 8 : 4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Cross sparkle for larger stardust
        if (p.size > 2.2 && alpha > 0.5) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size * 1.8, p.y);
          ctx.lineTo(p.x + p.size * 1.8, p.y);
          ctx.moveTo(p.x, p.y - p.size * 1.8);
          ctx.lineTo(p.x, p.y + p.size * 1.8);
          ctx.stroke();
        }

        ctx.restore();

        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > width + 10) {
          list.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handlePufferClick = () => {
    sounds.playCoin();
    setShowPufferMusicPlayer(prev => !prev);
    setClickCount(prev => prev + 1);

    if (onBonusCoin && clickCount % 4 === 3) {
      onBonusCoin(5, 'Cá nóc DJ 🎵 tặng bạn 5 Xu! 🎵');
    }
  };

  return (
    <>
      {/* High-fidelity stardust and high-frequency shooting star canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-20"
      />

      {/* Red Pufferfish with Integrated Music Controller */}
      <div className="fixed bottom-6 left-6 z-30 select-none">
        {/* Floating Mini Music Card */}
        {showPufferMusicPlayer && (
          <div className="absolute -top-32 left-0 min-w-[250px] bg-slate-900/95 backdrop-blur-md px-3.5 py-3 rounded-2xl shadow-2xl border border-rose-400/60 text-white animate-[bounce_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-rose-500/30">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 flex items-center gap-1">
                <span>🎵</span> Cá Nóc DJ 🎵
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowPufferMusicPlayer(false);
                }}
                className="text-gray-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-2">
              <p className="text-xs font-bold text-rose-100 truncate">
                {currentTrack?.title || 'Nhạc Nền Thần Tiên'}
              </p>
              <div className="flex items-center justify-between text-[10px] text-gray-300 gap-1 truncate">
                <span className="truncate">{currentTrack?.artist || 'Nhi Sanctuary'}</span>
                {currentTrack?.credit && (
                  <span className="text-amber-300 font-semibold truncate shrink-0">
                    • Cre: {currentTrack.credit}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  sounds.playClick();
                  onToggleMusic();
                }}
                className="flex-1 py-1 px-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isPlayingMusic ? '⏸️ Tạm Dừng' : '▶️ Phát Nhạc'}</span>
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  sounds.playClick();
                  onNextMusic();
                }}
                title="Đổi bài tiếp theo"
                className="p-1 px-2 bg-white/10 hover:bg-white/20 text-xs rounded-lg text-rose-200 cursor-pointer"
              >
                ⏭️
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  sounds.playClick();
                  onOpenMusicModal();
                }}
                title="Mở bảng thêm nhạc & đổi tên bài hát"
                className="py-1 px-2.5 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/60 text-xs rounded-lg text-rose-200 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>🎶 Quản lý</span>
              </button>
            </div>

            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-rose-400/60" />
          </div>
        )}

        {/* Mascot Fish Body */}
        <div
          onClick={handlePufferClick}
          title="Nhấn vào Cá nóc DJ 🎵 để bật/tắt nhạc và quản lý bài hát!"
          className="relative cursor-pointer group transform transition-all duration-300 hover:scale-125 active:scale-95 animate-[bounce_4s_infinite_ease-in-out]"
        >
          {isPlayingMusic && (
            <div className="pointer-events-none absolute -top-4 -right-1 text-sm text-amber-300 animate-pulse">
              ♪ ♫
            </div>
          )}

          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 shadow-[0_8px_24px_rgba(244,63,94,0.5)] flex items-center justify-center relative border-2 border-white/80">
            <div className="absolute -top-1.5 w-12 h-5 border-t-2 border-l-2 border-r-2 border-indigo-900 rounded-t-full" />
            <div className="absolute -left-1 top-4 w-2 h-3.5 bg-indigo-900 rounded-full" />
            <div className="absolute -right-1 top-4 w-2 h-3.5 bg-indigo-900 rounded-full" />

            <div className="flex gap-2">
              <div className="w-2.5 h-3 bg-white rounded-full relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              </div>
              <div className="w-2.5 h-3 bg-white rounded-full relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
              </div>
            </div>

            <div className="absolute bottom-3 left-2 w-2 h-1 bg-pink-300 rounded-full opacity-80" />
            <div className="absolute bottom-3 right-2 w-2 h-1 bg-pink-300 rounded-full opacity-80" />
          </div>

          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-rose-900/90 px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap border border-rose-300/40">
            Cá nóc DJ 🎵
          </span>
        </div>
      </div>

      {/* Yellow Baby Chick */}
      <div
        onClick={() => {
          sounds.playClick();
          if (onBonusCoin) onBonusCoin(2, 'Gà con chúc bạn ngày an lành! (+2 xu)');
        }}
        title="Gà con hoàng kim mang lại may mắn!"
        className="fixed top-20 right-6 z-20 cursor-pointer select-none group"
      >
        <div className="relative transform transition-all duration-300 group-hover:scale-125 group-active:scale-90 animate-[pulse_3s_infinite]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-400 shadow-[0_6px_16px_rgba(251,191,36,0.4)] flex items-center justify-center border border-white">
            <span className="text-lg">🐥</span>
          </div>
        </div>
      </div>

      {/* Celestial Whale */}
      <div
        onClick={() => {
          sounds.playGateOpen();
          // Trigger twin shooting star streak immediately
          if (canvasRef.current) {
            spawnShootingStar(window.innerWidth, window.innerHeight);
            setTimeout(() => spawnShootingStar(window.innerWidth, window.innerHeight, true), 150);
          }
        }}
        title="Cá voi ngân hà, chạm để triệu hồi bầy sao băng!"
        className="fixed top-28 left-4 z-10 cursor-pointer select-none group opacity-80 hover:opacity-100 transition-opacity"
      >
        <div className="flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-indigo-300/30 text-indigo-100 text-xs shadow-md transform transition-transform group-hover:scale-110">
          <span className="text-lg animate-[bounce_5s_infinite]">🐋</span>
          <span className="text-[10px] text-pink-200 hidden sm:inline">Cá voi ngân hà (Gọi sao băng)</span>
        </div>
      </div>
    </>
  );
};
