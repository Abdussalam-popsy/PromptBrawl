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
      gap: '8px',
      marginBottom: '6px',
    }}>
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontWeight: 700,
        color: '#ccc',
        minWidth: '28px',
        textAlign: 'center',
      }}>
        {keys}
      </span>
      <span style={{ color: '#999', fontSize: '12px' }}>{label}</span>
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
      background: 'rgba(5, 5, 15, 0.88)',
      backdropFilter: 'blur(4px)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      zIndex: 25,
    }}>
      <h1 style={{
        fontSize: '48px',
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '8px',
        marginBottom: '36px',
        textShadow: '0 0 30px rgba(68, 136, 255, 0.3)',
      }}>
        Paused
      </h1>

      {/* Controls reminder */}
      <div style={{
        marginBottom: '36px',
        padding: '20px 28px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          color: p1Config.color_palette.primary,
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '10px',
        }}>
          Controls
        </p>
        <CompactControl keys="A/D" label="Move" />
        <CompactControl keys="W" label="Jump" />
        <CompactControl keys="Space" label="Light Attack" />
        <CompactControl keys="F" label="Heavy Attack" />
        <CompactControl keys="G" label={getSpecialName(p1Config)} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '240px' }}>
        <button
          onClick={onResume}
          style={{
            padding: '14px',
            fontSize: '18px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4488ff, #2244aa)',
            color: '#fff',
            border: '2px solid #6699ff',
            borderRadius: '10px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Resume
        </button>

        <button
          onClick={onQuit}
          style={{
            padding: '14px',
            fontSize: '16px',
            fontWeight: 600,
            background: 'transparent',
            color: '#888',
            border: '1px solid #333',
            borderRadius: '10px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#ff4444';
            e.currentTarget.style.color = '#ff4444';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#888';
          }}
        >
          Quit to Menu
        </button>
      </div>

      <p style={{
        color: '#444',
        fontSize: '12px',
        marginTop: '20px',
        letterSpacing: '1px',
      }}>
        Press Escape to resume
      </p>
    </div>
  );
}
