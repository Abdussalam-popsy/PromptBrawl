import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { type FighterConfig } from '../ai/fighterConfig';

interface VictoryScreenProps {
  winner: FighterConfig;
  onPlayAgain: () => void;
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.floor((num & 0xff) + (255 - (num & 0xff)) * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function ensureBright(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
  if (luminance < 80) return lighten(hex, 0.5);
  return hex;
}

export function VictoryScreen({ winner, onPlayAgain }: VictoryScreenProps) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const primary = ensureBright(winner.color_palette.primary);
  const secondary = winner.color_palette.secondary;
  const accent = winner.color_palette.accent;

  useEffect(() => {
    // Confetti burst
    try {
      if (confettiRef.current) {
        const container = confettiRef.current;
        const colors = [primary, secondary, accent, '#ffffff', '#ffdd44', '#ff66aa', '#00ff88'];

        for (let i = 0; i < 100; i++) {
          const piece = document.createElement('div');
          const size = 4 + Math.random() * 10;
          const isCircle = Math.random() > 0.5;
          const color = colors[Math.floor(Math.random() * colors.length)];
          piece.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${isCircle ? size : size * 0.35}px;
            background: ${color};
            border-radius: ${isCircle ? '50%' : '1px'};
            left: ${30 + Math.random() * 40}%;
            top: 40%;
            pointer-events: none;
            opacity: 0;
          `;
          container.appendChild(piece);

          const angle = Math.random() * Math.PI * 2;
          const distance = 150 + Math.random() * 500;

          gsap.to(piece, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance + Math.random() * 300,
            rotation: Math.random() * 1080 - 540,
            opacity: 1,
            duration: 0.4,
            delay: Math.random() * 0.4,
            ease: 'power2.out',
          });

          gsap.to(piece, {
            opacity: 0,
            duration: 1.2,
            delay: 1.5 + Math.random() * 2,
            ease: 'power1.in',
            onComplete: () => piece.remove(),
          });
        }
      }
    } catch {
      // GSAP failure won't block the screen
    }
  }, [winner, primary, secondary, accent]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at center, ${lighten(primary, 0.2)} 0%, ${primary}88 30%, #0d0d24 70%, #06060f 100%)
      `,
      zIndex: 20,
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />

      {/* Confetti container */}
      <div
        ref={confettiRef}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      />

      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${primary}22 0%, transparent 60%)`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        animation: 'neon-pulse 3s ease-in-out infinite',
      }} />

      <div ref={contentRef} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* WINNER label */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          marginBottom: '8px',
          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          animation: 'slide-up 0.5s both',
        }}>
          WINNER
        </p>

        {/* Fighter name */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 10vw, 88px)',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 24px 0',
          textAlign: 'center',
          textShadow: `
            0 0 60px ${primary}66,
            0 0 120px ${primary}22,
            2px 2px 0 rgba(0,0,0,0.5)
          `,
          lineHeight: 1.1,
          padding: '0 20px',
          animation: 'scale-in 0.6s 0.1s both',
        }}>
          {winner.name}
        </h1>

        {/* Victory line */}
        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 3vw, 24px)',
          fontStyle: 'italic',
          fontWeight: 600,
          maxWidth: '560px',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: '0 0 48px 0',
          padding: '14px 24px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          borderLeft: `2px solid ${accent}88`,
          borderRight: `2px solid ${accent}88`,
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'slide-up 0.5s 0.3s both',
        }}>
          &ldquo;{winner.victory_line}&rdquo;
        </p>

        {/* Play Again button */}
        <button
          onClick={onPlayAgain}
          className="btn-arcade"
          style={{
            padding: '20px 64px',
            fontSize: '18px',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            background: 'rgba(255,255,255,0.95)',
            color: '#06060f',
            border: 'none',
            borderRadius: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            boxShadow: `0 0 40px rgba(255,255,255,0.15), 0 8px 30px rgba(0,0,0,0.3)`,
            animation: 'scale-in 0.4s 0.5s both',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
