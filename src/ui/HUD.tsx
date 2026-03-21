import { type FighterConfig } from '../ai/fighterConfig';

interface HUDProps {
  p1Config: FighterConfig;
  p2Config: FighterConfig;
  p1Hp: number;
  p2Hp: number;
  p1SpecialCd: number;
  p2SpecialCd: number;
  p1Label?: string;
  p2Label?: string;
}

function HealthBar({
  config,
  hp,
  specialCd,
  align,
  label,
}: {
  config: FighterConfig;
  hp: number;
  specialCd: number;
  align: 'left' | 'right';
  label?: string;
}) {
  const displayHp = Math.round(Math.max(0, hp));
  const pct = Math.max(0, Math.min(100, displayHp));
  const critical = pct <= 30;
  const barColor = critical ? '#ff2244' : config.color_palette.primary;
  const specialReady = specialCd <= 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      width: '44%',
    }}>
      {/* Role label */}
      {label && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '9px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '2px',
        }}>
          {label}
        </span>
      )}

      {/* Name + Special indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          color: config.color_palette.primary,
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: `0 0 20px ${config.color_palette.primary}44, 0 2px 4px rgba(0,0,0,0.8)`,
        }}>
          {config.name}
        </span>
        {specialReady && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            color: config.color_palette.accent,
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 6px',
            background: `${config.color_palette.accent}18`,
            border: `1px solid ${config.color_palette.accent}33`,
            borderRadius: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            animation: 'neon-pulse 2s ease-in-out infinite',
          }}>
            SP
          </span>
        )}
      </div>

      {/* Health bar */}
      <div style={{
        width: '100%',
        height: '20px',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '2px',
        overflow: 'hidden',
        border: critical
          ? '1px solid rgba(255, 34, 68, 0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        boxShadow: critical ? '0 0 15px rgba(255, 34, 68, 0.2)' : 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          [align]: 0,
          width: `${pct}%`,
          height: '100%',
          background: critical
            ? 'linear-gradient(180deg, #ff4466, #cc1133)'
            : `linear-gradient(180deg, ${barColor}dd, ${barColor}88)`,
          transition: 'width 0.3s ease-out',
          boxShadow: critical ? '0 0 12px rgba(255, 34, 68, 0.5)' : `0 0 8px ${barColor}33`,
        }} />
        {/* Glass reflection */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
          pointerEvents: 'none',
        }} />
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-mono)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 700,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          letterSpacing: '0.05em',
        }}>
          {displayHp}
        </span>
      </div>
    </div>
  );
}

export function HUD({ p1Config, p2Config, p1Hp, p2Hp, p1SpecialCd, p2SpecialCd, p1Label, p2Label }: HUDProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '14px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      zIndex: 5,
      background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
    }}>
      <HealthBar config={p1Config} hp={p1Hp} specialCd={p1SpecialCd} align="left" label={p1Label} />
      <span style={{
        fontFamily: 'var(--font-display)',
        color: 'rgba(255,255,255,0.15)',
        fontSize: '16px',
        fontWeight: 700,
        marginTop: '18px',
        letterSpacing: '0.1em',
      }}>
        VS
      </span>
      <HealthBar config={p2Config} hp={p2Hp} specialCd={p2SpecialCd} align="right" label={p2Label} />
    </div>
  );
}
