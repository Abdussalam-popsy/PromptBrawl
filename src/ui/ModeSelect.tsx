import { useEffect, useRef } from 'react';
import { type GameMode } from '../game/GameLoop';

interface ModeSelectProps {
  onSelect: (mode: GameMode) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stagger-animate children on mount
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll('[data-animate]');
    els.forEach((el, i) => {
      (el as HTMLElement).style.animation = `slide-up 0.5s ${i * 0.1}s both`;
    });
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 50%, rgba(255, 45, 123, 0.06) 0%, transparent 50%),
        linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)
      `,
      fontFamily: 'var(--font-body)',
      zIndex: 10,
      overflow: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        pointerEvents: 'none',
        opacity: 0.4,
      }} />

      {/* Grid floor effect */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '-20%',
        right: '-20%',
        height: '40%',
        background: `
          linear-gradient(to top, rgba(0, 212, 255, 0.08) 0%, transparent 100%),
          repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(0, 212, 255, 0.04) 80px, rgba(0, 212, 255, 0.04) 81px),
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0, 212, 255, 0.03) 40px, rgba(0, 212, 255, 0.03) 41px)
        `,
        transform: 'perspective(500px) rotateX(45deg)',
        transformOrigin: 'bottom center',
        pointerEvents: 'none',
      }} />

      <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
        {/* Title */}
        <h1 data-animate style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 80px)',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '4px',
          textShadow: `
            0 0 40px rgba(0, 212, 255, 0.5),
            0 0 80px rgba(0, 212, 255, 0.2),
            0 4px 20px rgba(0,0,0,0.8)
          `,
          animation: 'neon-pulse 4s ease-in-out infinite',
        }}>
          PromptBrawl
        </h1>

        {/* Tagline */}
        <p data-animate style={{
          fontFamily: 'var(--font-display)',
          color: 'rgba(0, 212, 255, 0.6)',
          fontSize: 'clamp(12px, 2vw, 16px)',
          marginBottom: '60px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}>
          Describe anyone. Watch them fight.
        </p>

        {/* Mode buttons */}
        <div data-animate style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* VS AI */}
          <button
            className="btn-arcade"
            onClick={() => onSelect('vsAI')}
            style={{
              padding: '22px 52px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.2))',
              color: 'var(--neon-blue)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            }}
          >
            vs AI
          </button>

          {/* VS PLAYER (Online) */}
          <button
            className="btn-arcade"
            onClick={() => onSelect('vsOnline')}
            style={{
              padding: '22px 52px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, rgba(255, 45, 123, 0.15), rgba(200, 20, 80, 0.2))',
              color: 'var(--neon-pink)',
              border: '1px solid rgba(255, 45, 123, 0.3)',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              boxShadow: '0 0 30px rgba(255, 45, 123, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            }}
          >
            vs Player
          </button>
        </div>

        {/* Controls hint */}
        <p data-animate style={{
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '11px',
          marginTop: '48px',
          letterSpacing: '0.15em',
        }}>
          WASD / Arrow Keys to move &nbsp;&bull;&nbsp; Space / F / G to fight
        </p>
      </div>
    </div>
  );
}
