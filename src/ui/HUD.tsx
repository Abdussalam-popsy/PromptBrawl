import { type FighterConfig } from '../ai/fighterConfig';

interface HUDProps {
  p1Config: FighterConfig;
  p2Config: FighterConfig;
  p1Hp: number;
  p2Hp: number;
  p1SpecialCd: number;
  p2SpecialCd: number;
}

function HealthBar({
  config,
  hp,
  specialCd,
  align,
}: {
  config: FighterConfig;
  hp: number;
  specialCd: number;
  align: 'left' | 'right';
}) {
  const displayHp = Math.round(Math.max(0, hp));
  const pct = Math.max(0, Math.min(100, displayHp));
  const barColor = pct > 30 ? config.color_palette.primary : '#ff2222';
  const specialReady = specialCd <= 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      width: '45%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
      }}>
        <span style={{
          color: config.color_palette.primary,
          fontSize: '16px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          {config.name}
        </span>
        {specialReady && (
          <span style={{
            color: config.color_palette.accent,
            fontSize: '11px',
            fontWeight: 600,
            padding: '1px 6px',
            background: config.color_palette.accent + '22',
            borderRadius: '4px',
            textTransform: 'uppercase',
          }}>
            SP
          </span>
        )}
      </div>

      <div style={{
        width: '100%',
        height: '18px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '9px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          [align]: 0,
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(180deg, ${barColor}, ${barColor}aa)`,
          borderRadius: '9px',
          transition: 'width 0.3s ease-out',
          boxShadow: pct <= 30 ? '0 0 10px #ff2222' : 'none',
        }} />
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}>
          {displayHp}
        </span>
      </div>
    </div>
  );
}

export function HUD({ p1Config, p2Config, p1Hp, p2Hp, p1SpecialCd, p2SpecialCd }: HUDProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      <HealthBar config={p1Config} hp={p1Hp} specialCd={p1SpecialCd} align="left" />
      <span style={{
        color: '#444',
        fontSize: '20px',
        fontWeight: 900,
        marginTop: '16px',
      }}>
        VS
      </span>
      <HealthBar config={p2Config} hp={p2Hp} specialCd={p2SpecialCd} align="right" />
    </div>
  );
}
