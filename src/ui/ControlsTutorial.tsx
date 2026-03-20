import { useState, useEffect, useCallback } from 'react';
import { type FighterConfig } from '../ai/fighterConfig';
import { SPECIAL_DEFS } from '../ai/moveLibrary';

interface ControlsTutorialProps {
  p1Config: FighterConfig;
  p2Config: FighterConfig;
  onStart: () => void;
}

const COUNTDOWN_SECONDS = 5;

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '15px',
      fontWeight: 700,
      color: '#fff',
      minWidth: '32px',
      textAlign: 'center',
    }}>
      {children}
    </span>
  );
}

function ControlRow({ keys, label, detail, accentColor }: {
  keys: string;
  label: string;
  detail?: string;
  accentColor?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    }}>
      <div style={{ width: '80px', textAlign: 'right' }}>
        <KeyBadge>{keys}</KeyBadge>
      </div>
      <div>
        <span style={{ color: '#ddd', fontSize: '14px', fontWeight: 600 }}>{label}</span>
        {detail && (
          <span style={{
            color: accentColor ?? '#666',
            fontSize: '12px',
            marginLeft: '8px',
            fontStyle: 'italic',
          }}>
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}

function getSpecialName(config: FighterConfig): string {
  const def = SPECIAL_DEFS[config.move_loadout.special];
  return def?.name ?? config.move_loadout.special.replace(/_/g, ' ');
}

export function ControlsTutorial({ p1Config, onStart }: ControlsTutorialProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onStart]);

  const handleStart = useCallback(() => {
    onStart();
  }, [onStart]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleStart]);

  const p1Special = getSpecialName(p1Config);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      zIndex: 15,
    }}>
      <h1 style={{
        fontSize: '36px',
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '6px',
        marginBottom: '40px',
        textShadow: '0 0 30px rgba(68, 136, 255, 0.4)',
      }}>
        How to Fight
      </h1>

      {/* Keyboard Controls */}
      <div style={{
        padding: '24px 36px',
        background: 'rgba(68, 136, 255, 0.06)',
        border: `1px solid ${p1Config.color_palette.primary}44`,
        borderRadius: '16px',
        minWidth: '320px',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#8888cc',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '18px',
          textAlign: 'center',
        }}>
          Keyboard
        </h2>
        <ControlRow keys="A / D" label="Move" />
        <ControlRow keys="W" label="Jump" />
        <ControlRow keys="Space" label="Light Attack" detail="Fast, low damage" />
        <ControlRow keys="F" label="Heavy Attack" detail="Slow, high damage" />
        <ControlRow
          keys="G"
          label="Special"
          detail={p1Special.toUpperCase()}
          accentColor={p1Config.color_palette.accent}
        />
      </div>

      {/* On-screen buttons note */}
      <p style={{
        color: '#777',
        fontSize: '14px',
        marginBottom: '32px',
        textAlign: 'center',
        maxWidth: '360px',
        lineHeight: 1.5,
      }}>
        You can also use the <span style={{ color: '#aaa', fontWeight: 600 }}>on-screen buttons</span> at
        the bottom of the screen for attacks
      </p>

      <button
        onClick={handleStart}
        style={{
          padding: '18px 64px',
          fontSize: '24px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #4488ff, #2244aa)',
          color: '#fff',
          border: '2px solid #6699ff',
          borderRadius: '12px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '6px',
          boxShadow: '0 0 40px rgba(68, 136, 255, 0.3)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        FIGHT
      </button>

      <p style={{
        color: '#555577',
        fontSize: '13px',
        marginTop: '16px',
        letterSpacing: '2px',
      }}>
        Press Space to start &nbsp;&middot;&nbsp; Auto-start in {countdown}s
      </p>
    </div>
  );
}
