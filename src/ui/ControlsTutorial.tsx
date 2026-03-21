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
      padding: '5px 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderBottom: '2px solid rgba(255,255,255,0.15)',
      borderRadius: '3px',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      fontWeight: 700,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      minWidth: '28px',
    }}>
      {children}
    </span>
  );
}

function ControlRow({ keys, label, detail, accentColor }: {
  keys: React.ReactNode;
  label: string;
  detail?: string;
  accentColor?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '14px',
    }}>
      <div style={{
        minWidth: '150px',
        textAlign: 'right',
        display: 'flex',
        gap: '4px',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
      }}>
        {keys}
      </div>
      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '16px' }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          color: '#eee',
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}>
          {label}
        </span>
        {detail && (
          <span style={{
            fontFamily: 'var(--font-body)',
            color: accentColor ?? 'rgba(255,255,255,0.3)',
            fontSize: '12px',
            marginLeft: '10px',
            fontWeight: 500,
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
      background: `
        radial-gradient(ellipse at 50% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 50%),
        linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)
      `,
      fontFamily: 'var(--font-body)',
      zIndex: 15,
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '32px',
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        marginBottom: '36px',
        textShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
        zIndex: 1,
        animation: 'slide-up 0.4s both',
      }}>
        HOW TO FIGHT
      </h1>

      {/* Controls Card */}
      <div style={{
        padding: '28px 36px',
        background: 'rgba(0, 212, 255, 0.03)',
        border: '1px solid rgba(0, 212, 255, 0.1)',
        borderRadius: '4px',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1,
        animation: 'scale-in 0.4s 0.1s both',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--neon-blue), transparent)',
          opacity: 0.5,
        }} />

        <ControlRow
          keys={<><KeyBadge>A / D</KeyBadge><span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>or</span><KeyBadge>&larr; / &rarr;</KeyBadge></>}
          label="Move"
        />
        <ControlRow
          keys={<><KeyBadge>W</KeyBadge><span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>or</span><KeyBadge>&uarr;</KeyBadge></>}
          label="Jump"
        />
        <ControlRow
          keys={<KeyBadge>Space</KeyBadge>}
          label="Light Attack"
          detail="Fast, low damage"
        />
        <ControlRow
          keys={<KeyBadge>F</KeyBadge>}
          label="Heavy Attack"
          detail="Slow but devastating"
        />
        <ControlRow
          keys={<KeyBadge>G</KeyBadge>}
          label={`Special: ${p1Special}`}
          detail="Unique ability, 5s cooldown"
          accentColor={p1Config.color_palette.accent}
        />
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.35)',
        fontSize: '14px',
        marginBottom: '32px',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.5,
        zIndex: 1,
        animation: 'slide-up 0.4s 0.2s both',
      }}>
        Or click the <span style={{ color: '#fff', fontWeight: 700 }}>buttons at the bottom</span> of the screen
      </p>

      <button
        onClick={handleStart}
        className="btn-arcade"
        style={{
          padding: '20px 72px',
          fontSize: '22px',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(180, 77, 255, 0.15))',
          color: '#fff',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.15)',
          zIndex: 1,
          animation: 'scale-in 0.4s 0.3s both',
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
      >
        FIGHT
      </button>

      <p style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.15)',
        fontSize: '11px',
        marginTop: '16px',
        letterSpacing: '0.1em',
        zIndex: 1,
        animation: 'fade-in 0.4s 0.5s both',
      }}>
        PRESS SPACE TO START &bull; AUTO-START IN {countdown}s
      </p>
    </div>
  );
}
