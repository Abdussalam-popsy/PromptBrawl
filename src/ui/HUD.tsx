import { type FighterConfig } from '../ai/fighterConfig';

interface HUDProps {
  p1Config: FighterConfig;
  p2Config: FighterConfig;
  p1Hp: number;
  p2Hp: number;
  p1SpecialCd: number;
  p2SpecialCd: number;
  timeLeft?: number;
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
  const specialPct = specialCd > 0 ? Math.max(0, 100 - (specialCd / 5000) * 100) : 100;

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
          color: 'rgba(255,255,255,0.25)',
          fontSize: '9px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '3px',
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
        {specialReady ? (
          <span style={{
            fontFamily: 'var(--font-mono)',
            color: config.color_palette.accent,
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 8px',
            background: `${config.color_palette.accent}18`,
            border: `1px solid ${config.color_palette.accent}33`,
            borderRadius: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            animation: 'neon-pulse 1.5s ease-in-out infinite',
            boxShadow: `0 0 10px ${config.color_palette.accent}22`,
          }}>
            SP READY
          </span>
        ) : (
          <div style={{
            width: '32px',
            height: '4px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${specialPct}%`,
              height: '100%',
              background: config.color_palette.accent,
              borderRadius: '2px',
              transition: 'width 0.3s linear',
              opacity: 0.5,
            }} />
          </div>
        )}
      </div>

      {/* Health bar */}
      <div style={{
        width: '100%',
        height: '22px',
        background: 'rgba(0,0,0,0.75)',
        borderRadius: '2px',
        overflow: 'hidden',
        border: critical
          ? '1px solid rgba(255, 34, 68, 0.5)'
          : '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        boxShadow: critical
          ? '0 0 20px rgba(255, 34, 68, 0.25), inset 0 0 8px rgba(255, 34, 68, 0.1)'
          : `inset 0 0 6px rgba(0,0,0,0.5)`,
      }}>
        {/* Damage trail (slightly brighter, delayed transition) */}
        <div style={{
          position: 'absolute',
          top: 0,
          [align]: 0,
          width: `${pct + 2}%`,
          height: '100%',
          background: critical
            ? 'rgba(255, 68, 100, 0.15)'
            : `${barColor}15`,
          transition: 'width 0.8s ease-out',
        }} />

        {/* Main health fill */}
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
          ...(critical ? { animation: 'health-flash 1s ease-in-out infinite' } : {}),
        }} />

        {/* Segmented overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(${align === 'left' ? '90deg' : '270deg'}, transparent, transparent 9.8%, rgba(0,0,0,0.2) 9.8%, rgba(0,0,0,0.2) 10%)`,
          pointerEvents: 'none',
        }} />

        {/* Glass reflection */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), transparent)',
          pointerEvents: 'none',
        }} />

        {/* HP number */}
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-mono)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)',
          letterSpacing: '0.05em',
        }}>
          {displayHp}
        </span>
      </div>
    </div>
  );
}

export function HUD({ p1Config, p2Config, p1Hp, p2Hp, p1SpecialCd, p2SpecialCd, timeLeft = 60, p1Label, p2Label }: HUDProps) {
  const critical = timeLeft <= 10;
  const urgent = timeLeft <= 5;

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
      background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)',
    }}>
      <HealthBar config={p1Config} hp={p1Hp} specialCd={p1SpecialCd} align="left" label={p1Label} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '4px',
        minWidth: '56px',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          color: critical ? '#ff2244' : 'rgba(255,255,255,0.85)',
          fontSize: '32px',
          fontWeight: 900,
          letterSpacing: '0.05em',
          textShadow: critical
            ? '0 0 20px rgba(255, 34, 68, 0.6), 0 2px 4px rgba(0,0,0,0.8)'
            : '0 2px 4px rgba(0,0,0,0.8)',
          lineHeight: 1,
          animation: urgent ? 'timer-pulse 0.5s ease-in-out infinite' : undefined,
        }}>
          {timeLeft}
        </span>
      </div>
      <HealthBar config={p2Config} hp={p2Hp} specialCd={p2SpecialCd} align="right" label={p2Label} />

      {urgent && (
        <style>{`
          @keyframes timer-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.8; }
          }
        `}</style>
      )}
    </div>
  );
}
