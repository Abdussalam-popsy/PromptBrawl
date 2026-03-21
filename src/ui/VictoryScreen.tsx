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
    // Content entrance animation
    try {
      if (contentRef.current) {
        gsap.from(contentRef.current.children, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
        });
      }
    } catch { /* GSAP failure won't block */ }

    // Confetti burst
    try {
      if (confettiRef.current) {
        const container = confettiRef.current;
        const colors = [primary, secondary, accent, '#ffffff', '#ffdd44', '#ff66aa', '#00ff88'];

        for (let i = 0; i < 120; i++) {
          const piece = document.createElement('div');
          const size = 3 + Math.random() * 10;
          const isCircle = Math.random() > 0.6;
          const isStar = !isCircle && Math.random() > 0.5;
          const color = colors[Math.floor(Math.random() * colors.length)];
          piece.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${isCircle ? size : isStar ? size : size * 0.3}px;
            background: ${color};
            border-radius: ${isCircle ? '50%' : isStar ? '1px' : '1px'};
            left: ${35 + Math.random() * 30}%;
            top: 45%;
            pointer-events: none;
            opacity: 0;
            box-shadow: 0 0 ${4 + Math.random() * 6}px ${color}88;
          `;
          container.appendChild(piece);

          const angle = Math.random() * Math.PI * 2;
          const distance = 200 + Math.random() * 600;

          gsap.to(piece, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance + Math.random() * 300,
            rotation: Math.random() * 1080 - 540,
            opacity: 1,
            duration: 0.5,
            delay: Math.random() * 0.5,
            ease: 'power2.out',
          });

          gsap.to(piece, {
            opacity: 0,
            duration: 1.5,
            delay: 1.8 + Math.random() * 2,
            ease: 'power1.in',
            onComplete: () => piece.remove(),
          });
        }
      }
    } catch { /* GSAP failure won't block */ }
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
        radial-gradient(ellipse at center, ${primary}33 0%, ${primary}11 25%, #0d0d24 65%, #06060f 100%)
      `,
      zIndex: 20,
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />

      {/* Pulse rings */}
      {[0, 0.5, 1, 1.5].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: `1px solid ${primary}33`,
          animation: `pulse-ring 3s ${delay}s ease-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Confetti container */}
      <div
        ref={confettiRef}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
      />

      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        width: '900px',
        height: '900px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${primary}18 0%, transparent 55%)`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        animation: 'neon-pulse 3s ease-in-out infinite',
      }} />

      <div ref={contentRef} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Crown / WINNER label */}
        <div style={{
          fontSize: '40px',
          marginBottom: '8px',
          animation: 'float 3s ease-in-out infinite',
          filter: `drop-shadow(0 0 20px ${primary}66)`,
        }}>
          &#x1F451;
        </div>

        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.5em',
          marginBottom: '12px',
          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
        }}>
          WINNER
        </p>

        {/* Decorative line */}
        <div style={{
          width: 'clamp(120px, 30vw, 300px)',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
          marginBottom: '16px',
          opacity: 0.6,
          animation: 'crack-in 0.6s 0.3s both',
        }} />

        {/* Fighter name */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(44px, 10vw, 92px)',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 20px 0',
          textAlign: 'center',
          textShadow: `
            0 0 60px ${primary}66,
            0 0 120px ${primary}22,
            2px 2px 0 rgba(0,0,0,0.5)
          `,
          lineHeight: 1.1,
          padding: '0 20px',
        }}>
          {winner.name}
        </h1>

        {/* Victory line */}
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(16px, 3vw, 22px)',
          fontStyle: 'italic',
          fontWeight: 600,
          maxWidth: '560px',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: '0 0 44px 0',
          padding: '16px 28px',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: '6px',
          borderLeft: `3px solid ${accent}88`,
          borderRight: `3px solid ${accent}88`,
          textShadow: '0 2px 6px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)',
        }}>
          &ldquo;{winner.victory_line}&rdquo;
        </p>

        {/* Play Again button */}
        <button
          onClick={onPlayAgain}
          className="btn-arcade"
          style={{
            padding: '22px 72px',
            fontSize: '18px',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            background: 'rgba(255,255,255,0.95)',
            color: '#06060f',
            border: 'none',
            borderRadius: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            boxShadow: `0 0 50px rgba(255,255,255,0.15), 0 8px 30px rgba(0,0,0,0.3), 0 0 80px ${primary}22`,
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
