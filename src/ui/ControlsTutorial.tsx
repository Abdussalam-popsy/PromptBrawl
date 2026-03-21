import { useState, useEffect, useCallback } from 'react';
import { type FighterConfig } from '../ai/fighterConfig';
import { SPECIAL_DEFS } from '../ai/moveLibrary';

interface ControlsTutorialProps {
  p1Config: FighterConfig;
  p2Config: FighterConfig;
  onStart: () => void;
}

const COUNTDOWN_SECONDS = 5;

function KeyBadge({ children, glow }: { children: React.ReactNode; glow?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 14px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderBottom: '2px solid rgba(255,255,255,0.15)',
      borderRadius: '4px',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      fontWeight: 700,
      color: glow ?? 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      minWidth: '30px',
      textShadow: glow ? `0 0 10px ${glow}55` : undefined,
      boxShadow: glow ? `0 0 8px ${glow}11, inset 0 0 4px ${glow}08` : undefined,
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
      <div style={{
        borderLeft: `1px solid ${accentColor ? accentColor + '33' : 'rgba(255,255,255,0.06)'}`,
        paddingLeft: '16px',
      }}>
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
  const specialAccent = p1Config.color_palette.accent;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at 50% 50%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
        linear-gradient(180deg, #06060f 0%, #0a0a1e 50%, #06060f 100%)
      `,
      fontFamily: 'var(--font-body)',
      zIndex: 15,
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
      }} />

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '34px',
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: '8px',
        textShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
        zIndex: 1,
        animation: 'slide-up 0.4s both',
      }}>
        HOW TO FIGHT
      </h1>

      {/* Decorative line under title */}
      <div style={{
        width: '200px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--neon-blue), transparent)',
        marginBottom: '32px',
        opacity: 0.4,
        zIndex: 1,
        animation: 'crack-in 0.5s 0.2s both',
      }} />

      {/* Controls Card */}
      <div style={{
        padding: '28px 40px',
        background: 'rgba(8, 8, 20, 0.8)',
        border: '1px solid rgba(0, 212, 255, 0.1)',
        borderRadius: '6px',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1,
        animation: 'scale-in 0.4s 0.1s both',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Animated top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--neon-blue), var(--neon-purple), transparent)',
          backgroundSize: '200% 100%',
          animation: 'border-flow 3s ease-in-out infinite',
          opacity: 0.6,
        }} />

        <ControlRow
          keys={<><KeyBadge>A / D</KeyBadge><span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>or</span><KeyBadge>&larr; / &rarr;</KeyBadge></>}
          label="Move"
        />
        <ControlRow
          keys={<><KeyBadge>W</KeyBadge><span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>or</span><KeyBadge>&uarr;</KeyBadge></>}
          label="Jump"
        />
        <ControlRow
          keys={<KeyBadge glow="#00d4ff">Space</KeyBadge>}
          label="Light Attack"
          detail="Fast, low damage"
        />
        <ControlRow
          keys={<KeyBadge glow="#ff8800">F</KeyBadge>}
          label="Heavy Attack"
          detail="Slow but devastating"
        />

        {/* Separator before special */}
        <div style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${specialAccent}33, transparent)`,
          margin: '6px 0 14px 0',
        }} />

        <ControlRow
          keys={<KeyBadge glow={specialAccent}>G</KeyBadge>}
          label={`Special: ${p1Special}`}
          detail="Unique ability, 5s cooldown"
          accentColor={specialAccent}
        />
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '14px',
        marginBottom: '32px',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.5,
        zIndex: 1,
        animation: 'slide-up 0.4s 0.2s both',
      }}>
        Or use the <span style={{ color: '#fff', fontWeight: 700 }}>on-screen buttons</span>
      </p>

      <button
        onClick={handleStart}
        className="btn-arcade"
        style={{
          padding: '22px 80px',
          fontSize: '24px',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(180, 77, 255, 0.15))',
          color: '#fff',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          boxShadow: '0 0 50px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          zIndex: 1,
          animation: 'scale-in 0.4s 0.3s both',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
      >
        FIGHT
      </button>

      {/* Countdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '20px',
        zIndex: 1,
        animation: 'fade-in 0.4s 0.5s both',
      }}>
        <div style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
        <p style={{
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.12)',
          fontSize: '11px',
          letterSpacing: '0.12em',
        }}>
          SPACE TO START &bull; AUTO {countdown}s
        </p>
        <div style={{ width: '24px', height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
      </div>
    </div>
  );
}
