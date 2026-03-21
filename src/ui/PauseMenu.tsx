import { useEffect, useCallback } from 'react';
import { type FighterConfig } from '../ai/fighterConfig';
import { SPECIAL_DEFS } from '../ai/moveLibrary';

interface PauseMenuProps {
  p1Config: FighterConfig;
  p2Config: FighterConfig;
  onResume: () => void;
  onQuit: () => void;
}

function getSpecialName(config: FighterConfig): string {
  const def = SPECIAL_DEFS[config.move_loadout.special];
  return def?.name ?? config.move_loadout.special.replace(/_/g, ' ');
}

function CompactControl({ keys, label, accent }: { keys: string; label: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '10px',
    }}>
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '2px solid rgba(255,255,255,0.12)',
        borderRadius: '3px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 700,
        color: accent ?? 'rgba(255,255,255,0.5)',
        minWidth: '36px',
        textAlign: 'center',
      }}>
        {keys}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.35)',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        {label}
      </span>
    </div>
  );
}

export function PauseMenu({ p1Config, onResume, onQuit }: PauseMenuProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onResume();
    }
  }, [onResume]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(4, 4, 12, 0.94)',
      backdropFilter: 'blur(12px)',
      fontFamily: 'var(--font-body)',
      zIndex: 25,
      animation: 'fade-in 0.15s both',
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
      }} />

      {/* Glitch title */}
      <div style={{ position: 'relative', marginBottom: '40px', zIndex: 1 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '48px',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          textShadow: '0 0 40px rgba(0, 212, 255, 0.2)',
          margin: 0,
        }}>
          PAUSED
        </h1>
        <h1 aria-hidden style={{
          position: 'absolute', inset: 0, margin: 0,
          fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900,
          color: 'var(--neon-blue)', textTransform: 'uppercase', letterSpacing: '0.25em',
          opacity: 0.3, animation: 'glitch-1 6s infinite linear', pointerEvents: 'none',
        }}>
          PAUSED
        </h1>
      </div>

      {/* Controls reminder */}
      <div style={{
        marginBottom: '36px',
        padding: '24px 32px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.05)',
        zIndex: 1,
        position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--neon-blue), transparent)',
          opacity: 0.3,
        }} />

        <p style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--neon-blue)',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          marginBottom: '14px',
          opacity: 0.5,
        }}>
          Controls
        </p>
        <CompactControl keys="A/D" label="Move Left / Right" />
        <CompactControl keys="W" label="Jump" />
        <CompactControl keys="Space" label="Light Attack" />
        <CompactControl keys="F" label="Heavy Attack" />
        <CompactControl keys="G" label={getSpecialName(p1Config)} accent={p1Config.color_palette.accent} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '260px', zIndex: 1 }}>
        <button
          onClick={onResume}
          className="btn-arcade"
          style={{
            padding: '18px',
            fontSize: '16px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
            color: 'var(--neon-blue)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            borderRadius: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.08)',
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          Resume
        </button>

        <button
          onClick={onQuit}
          style={{
            padding: '14px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '2px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255, 45, 123, 0.4)';
            e.currentTarget.style.color = 'var(--neon-pink)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
          }}
        >
          Quit to Menu
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '28px',
        zIndex: 1,
      }}>
        <div style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
        <p style={{
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.1)',
          fontSize: '10px',
          letterSpacing: '0.15em',
        }}>
          ESC TO RESUME
        </p>
        <div style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
      </div>
    </div>
  );
}
