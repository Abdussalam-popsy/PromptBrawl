import { type FighterConfig } from '../ai/fighterConfig';

interface FighterCardProps {
  config: FighterConfig;
  onFight: () => void;
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '10px',
        width: '52px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '8px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: '2px',
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `0 0 12px ${color}66, inset 0 1px 0 rgba(255,255,255,0.2)`,
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 700,
        width: '18px',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

export function FighterCard({ config, onFight }: FighterCardProps) {
  const primary = config.color_palette.primary;
  const accent = config.color_palette.accent;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${primary}33`,
      borderRadius: '4px',
      padding: '28px 32px',
      maxWidth: '420px',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      animation: 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
      }} />

      {/* Corner accents */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '20px', height: '20px',
        borderTop: `2px solid ${primary}`, borderLeft: `2px solid ${primary}`,
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '20px', height: '20px',
        borderTop: `2px solid ${primary}`, borderRight: `2px solid ${primary}`,
      }} />

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '28px',
        fontWeight: 900,
        color: primary,
        margin: '0 0 4px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        textShadow: `0 0 30px ${primary}44`,
      }}>
        {config.name}
      </h2>

      <p style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '15px',
        fontStyle: 'italic',
        fontWeight: 500,
        margin: '0 0 16px 0',
      }}>
        {config.personality}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          padding: '3px 10px',
          background: `${config.color_palette.secondary}15`,
          color: config.color_palette.secondary,
          borderRadius: '2px',
          fontSize: '10px',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: '0.1em',
          border: `1px solid ${config.color_palette.secondary}22`,
        }}>
          {config.size_variant}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          padding: '3px 10px',
          background: `${accent}15`,
          color: accent,
          borderRadius: '2px',
          fontSize: '10px',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: '0.1em',
          border: `1px solid ${accent}22`,
        }}>
          {config.eye_expression}
        </span>
      </div>

      {/* Stats */}
      <StatBar label="SPD" value={config.stats.speed} max={10} color="#00d4ff" />
      <StatBar label="DMG" value={config.stats.damage} max={10} color="#ff2d7b" />
      <StatBar label="DEF" value={config.stats.defense} max={10} color="#00ff88" />
      <StatBar label="CHS" value={config.stats.chaos} max={10} color="#b44dff" />

      {/* Victory line */}
      <p style={{
        fontFamily: 'var(--font-body)',
        color: `${accent}cc`,
        fontSize: '14px',
        fontStyle: 'italic',
        fontWeight: 500,
        margin: '18px 0 22px 0',
        padding: '10px 14px',
        background: `${accent}08`,
        borderRadius: '2px',
        borderLeft: `2px solid ${accent}66`,
        lineHeight: 1.4,
      }}>
        "{config.victory_line}"
      </p>

      {/* Fight button */}
      <button
        onClick={onFight}
        className="btn-arcade"
        style={{
          width: '100%',
          padding: '18px',
          fontSize: '18px',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          background: `linear-gradient(135deg, ${primary}33, ${config.color_palette.secondary}22)`,
          color: '#fff',
          border: `1px solid ${primary}44`,
          borderRadius: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          textShadow: `0 0 20px ${primary}66`,
          boxShadow: `0 0 30px ${primary}11`,
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        }}
      >
        FIGHT
      </button>
    </div>
  );
}
