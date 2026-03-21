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

function CompactControl({ keys, label }: { keys: string; label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px',
    }}>
      <span style={{
        display: 'inline-block',
        padding: '3px 8px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '2px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.5)',
        minWidth: '28px',
        textAlign: 'center',
      }}>
        {keys}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.35)',
        fontSize: '13px',
        fontWeight: 500,
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
      background: 'rgba(4, 4, 12, 0.92)',
      backdropFilter: 'blur(8px)',
      fontFamily: 'var(--font-body)',
      zIndex: 25,
      animation: 'fade-in 0.15s both',
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
      }} />

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '42px',
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: '36px',
        textShadow: '0 0 40px rgba(0, 212, 255, 0.2)',
        zIndex: 1,
      }}>
        PAUSED
      </h1>

      {/* Controls reminder */}
      <div style={{
        marginBottom: '36px',
        padding: '20px 28px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '4px',
        border: '1px solid rgba(255,255,255,0.04)',
        zIndex: 1,
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--neon-blue)',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          marginBottom: '12px',
          opacity: 0.6,
        }}>
          Controls
        </p>
        <CompactControl keys="A/D or ???/???" label="Move" />
        <CompactControl keys="W or ???" label="Jump" />
        <CompactControl keys="Space" label="Light Attack" />
        <CompactControl keys="F" label="Heavy Attack" />
        <CompactControl keys="G" label={getSpecialName(p1Config)} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '240px', zIndex: 1 }}>
        <button
          onClick={onResume}
          className="btn-arcade"
          style={{
            padding: '16px',
            fontSize: '16px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
            color: 'var(--neon-blue)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            borderRadius: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
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

      <p style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.12)',
        fontSize: '10px',
        marginTop: '24px',
        letterSpacing: '0.1em',
        zIndex: 1,
      }}>
        PRESS ESC TO RESUME
      </p>
    </div>
  );
}
