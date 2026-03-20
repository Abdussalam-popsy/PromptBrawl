import { type FighterConfig } from '../ai/fighterConfig';

interface FighterCardProps {
  config: FighterConfig;
  onFight: () => void;
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{
        color: '#aaa',
        fontSize: '12px',
        width: '60px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '8px',
        background: '#1a1a2e',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${(value / max) * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, #4488ff, #44ccff)`,
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, width: '20px' }}>
        {value}
      </span>
    </div>
  );
}

export function FighterCard({ config, onFight }: FighterCardProps) {
  return (
    <div style={{
      background: 'rgba(20, 20, 40, 0.95)',
      border: `2px solid ${config.color_palette.primary}`,
      borderRadius: '16px',
      padding: '28px',
      maxWidth: '400px',
      width: '100%',
      boxShadow: `0 0 40px ${config.color_palette.primary}44`,
    }}>
      <h2 style={{
        fontSize: '32px',
        fontWeight: 900,
        color: config.color_palette.primary,
        margin: '0 0 4px 0',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        {config.name}
      </h2>

      <p style={{
        color: '#8888aa',
        fontSize: '14px',
        fontStyle: 'italic',
        margin: '0 0 16px 0',
      }}>
        {config.personality}
      </p>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <span style={{
          padding: '2px 10px',
          background: config.color_palette.secondary + '33',
          color: config.color_palette.secondary,
          borderRadius: '12px',
          fontSize: '12px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {config.size_variant}
        </span>
        <span style={{
          padding: '2px 10px',
          background: config.color_palette.accent + '33',
          color: config.color_palette.accent,
          borderRadius: '12px',
          fontSize: '12px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          {config.eye_expression}
        </span>
      </div>

      <StatBar label="Speed" value={config.stats.speed} max={10} />
      <StatBar label="Damage" value={config.stats.damage} max={10} />
      <StatBar label="Defense" value={config.stats.defense} max={10} />
      <StatBar label="Chaos" value={config.stats.chaos} max={10} />

      <p style={{
        color: config.color_palette.accent,
        fontSize: '14px',
        fontStyle: 'italic',
        margin: '16px 0 20px 0',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        borderLeft: `3px solid ${config.color_palette.accent}`,
      }}>
        "{config.victory_line}"
      </p>

      <button
        onClick={onFight}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '22px',
          fontWeight: 900,
          background: `linear-gradient(135deg, ${config.color_palette.primary}, ${config.color_palette.secondary})`,
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '6px',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        FIGHT
      </button>
    </div>
  );
}
