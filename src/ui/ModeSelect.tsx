import { useEffect, useRef } from 'react';
import { type GameMode } from '../game/GameLoop';

interface ModeSelectProps {
  onSelect: (mode: GameMode) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll('[data-animate]');
    els.forEach((el, i) => {
      (el as HTMLElement).style.animation = `slide-up 0.6s ${i * 0.12}s both cubic-bezier(0.16, 1, 0.3, 1)`;
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
        radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 50%, rgba(255, 45, 123, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 50% 120%, rgba(180, 77, 255, 0.06) 0%, transparent 40%),
        linear-gradient(180deg, #06060f 0%, #0a0a1e 50%, #06060f 100%)
      `,
      fontFamily: 'var(--font-body)',
      zIndex: 10,
      overflow: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
        pointerEvents: 'none',
        opacity: 0.5,
      }} />

      {/* Animated grid floor */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '-20%',
        right: '-20%',
        height: '45%',
        background: `
          linear-gradient(to top, rgba(0, 212, 255, 0.1) 0%, transparent 100%),
          repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(0, 212, 255, 0.05) 80px, rgba(0, 212, 255, 0.05) 81px),
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0, 212, 255, 0.04) 40px, rgba(0, 212, 255, 0.04) 41px)
        `,
        transform: 'perspective(500px) rotateX(50deg)',
        transformOrigin: 'bottom center',
        pointerEvents: 'none',
      }} />

      {/* Ambient hex particles */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '6px',
        height: '6px',
        background: 'var(--neon-blue)',
        borderRadius: '50%',
        animation: 'float 4s ease-in-out infinite',
        opacity: 0.3,
        boxShadow: '0 0 20px var(--neon-blue)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '15%',
        width: '4px',
        height: '4px',
        background: 'var(--neon-pink)',
        borderRadius: '50%',
        animation: 'float 5s ease-in-out infinite 1s',
        opacity: 0.25,
        boxShadow: '0 0 15px var(--neon-pink)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '80%',
        width: '5px',
        height: '5px',
        background: 'var(--neon-purple)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite 2s',
        opacity: 0.2,
        boxShadow: '0 0 18px var(--neon-purple)',
        pointerEvents: 'none',
      }} />

      <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
        {/* Glitch Title */}
        <div data-animate style={{ position: 'relative', marginBottom: '4px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 8vw, 84px)',
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            textShadow: `
              0 0 40px rgba(0, 212, 255, 0.5),
              0 0 80px rgba(0, 212, 255, 0.2),
              0 4px 20px rgba(0,0,0,0.8)
            `,
            animation: 'neon-pulse 4s ease-in-out infinite',
            margin: 0,
          }}>
            PromptBrawl
          </h1>
          {/* Glitch layer 1 */}
          <h1 aria-hidden style={{
            position: 'absolute',
            inset: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 8vw, 84px)',
            fontWeight: 900,
            color: 'var(--neon-blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            margin: 0,
            opacity: 0.6,
            animation: 'glitch-1 4s infinite linear',
            pointerEvents: 'none',
          }}>
            PromptBrawl
          </h1>
          {/* Glitch layer 2 */}
          <h1 aria-hidden style={{
            position: 'absolute',
            inset: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 8vw, 84px)',
            fontWeight: 900,
            color: 'var(--neon-pink)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            margin: 0,
            opacity: 0.4,
            animation: 'glitch-2 4s infinite linear 0.15s',
            pointerEvents: 'none',
          }}>
            PromptBrawl
          </h1>
        </div>

        {/* Decorative line */}
        <div data-animate style={{
          width: 'clamp(200px, 40vw, 400px)',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--neon-blue), var(--neon-purple), var(--neon-pink), transparent)',
          marginBottom: '16px',
          opacity: 0.5,
        }} />

        {/* Tagline */}
        <p data-animate style={{
          fontFamily: 'var(--font-display)',
          color: 'rgba(0, 212, 255, 0.5)',
          fontSize: 'clamp(11px, 1.8vw, 15px)',
          marginBottom: '64px',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}>
          Describe anyone. Watch them fight.
        </p>

        {/* Mode buttons */}
        <div data-animate style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* VS AI */}
          <button
            className="btn-arcade"
            onClick={() => onSelect('vsAI')}
            style={{
              padding: '24px 56px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: `
                linear-gradient(135deg, rgba(0, 212, 255, 0.12) 0%, rgba(0, 100, 200, 0.18) 100%)
              `,
              color: 'var(--neon-blue)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
              position: 'relative',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>vs AI</span>
          </button>

          {/* VS PLAYER (Online) */}
          <button
            className="btn-arcade"
            onClick={() => onSelect('vsOnline')}
            style={{
              padding: '24px 56px',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, rgba(255, 45, 123, 0.12) 0%, rgba(200, 20, 80, 0.18) 100%)',
              color: 'var(--neon-pink)',
              border: '1px solid rgba(255, 45, 123, 0.3)',
              borderRadius: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              boxShadow: '0 0 30px rgba(255, 45, 123, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>vs Player</span>
          </button>
        </div>

        {/* Decorative separator */}
        <div data-animate style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '52px',
        }}>
          <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.12)',
            fontSize: '10px',
            letterSpacing: '0.2em',
          }}>
            WASD / ARROWS &bull; SPACE / F / G
          </span>
          <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
        </div>
      </div>
    </div>
  );
}
