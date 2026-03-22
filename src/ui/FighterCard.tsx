import { useEffect, useRef, useState } from 'react';
import { type FighterConfig } from '../ai/fighterConfig';

interface FighterCardProps {
  config: FighterConfig;
  onFight: () => void;
  loading?: boolean;
}

function StatBar({ label, value, max, color, delay }: { label: string; value: number; max: number; color: string; delay: number }) {
  const [filled, setFilled] = useState(false);
  const pct = (value / max) * 100;

  useEffect(() => {
    const timer = setTimeout(() => setFilled(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(255,255,255,0.35)',
        fontSize: '10px',
        width: '36px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 700,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: '6px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: filled ? `${pct}%` : '0%',
          height: '100%',
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: '3px',
          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `0 0 12px ${color}44`,
          position: 'relative',
        }}>
          {/* Shine sweep */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25), transparent)',
            borderRadius: '3px 3px 0 0',
          }} />
        </div>
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        color: color,
        fontSize: '13px',
        fontWeight: 700,
        width: '20px',
        textAlign: 'right',
        textShadow: `0 0 10px ${color}44`,
      }}>
        {value}
      </span>
    </div>
  );
}

export function FighterCard({ config, onFight, loading = false }: FighterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const primary = config.color_palette.primary;
  const accent = config.color_palette.accent;
  const secondary = config.color_palette.secondary;

  console.log('[FighterCard] sprite_url:', config.sprite_url);

  return (
    <div
      ref={cardRef}
      style={{
        background: 'rgba(8, 8, 20, 0.95)',
        border: `1px solid ${primary}30`,
        borderRadius: '6px',
        padding: config.sprite_url ? '32px 180px 32px 36px' : '32px 36px',
        maxWidth: config.sprite_url ? '560px' : '440px',
        width: '100%',
        position: 'relative',
        overflow: 'visible',
        animation: 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Animated top gradient line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${primary}, ${accent}, ${secondary}, transparent)`,
        backgroundSize: '200% 100%',
        animation: 'border-flow 3s ease-in-out infinite',
      }} />

      {/* Corner brackets */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '24px', height: '24px',
        borderTop: `2px solid ${primary}`, borderLeft: `2px solid ${primary}`,
        opacity: 0.7,
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '24px', height: '24px',
        borderTop: `2px solid ${primary}`, borderRight: `2px solid ${primary}`,
        opacity: 0.7,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '24px', height: '24px',
        borderBottom: `2px solid ${primary}33`, borderLeft: `2px solid ${primary}33`,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px',
        borderBottom: `2px solid ${primary}33`, borderRight: `2px solid ${primary}33`,
      }} />

      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-25%',
        width: '150%',
        height: '150%',
        background: `radial-gradient(ellipse at 50% 0%, ${primary}08 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '30px',
        fontWeight: 900,
        color: primary,
        margin: '0 0 4px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        textShadow: `0 0 30px ${primary}55, 0 2px 4px rgba(0,0,0,0.5)`,
        position: 'relative',
      }}>
        {config.name}
      </h2>

      <p style={{
        fontFamily: 'var(--font-body)',
        color: 'rgba(255,255,255,0.35)',
        fontSize: '15px',
        fontStyle: 'italic',
        fontWeight: 500,
        margin: '0 0 18px 0',
        lineHeight: 1.4,
      }}>
        {config.personality}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          padding: '4px 12px',
          background: `${secondary}12`,
          color: secondary,
          borderRadius: '2px',
          fontSize: '10px',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: '0.1em',
          border: `1px solid ${secondary}20`,
        }}>
          {config.size_variant}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          padding: '4px 12px',
          background: `${accent}12`,
          color: accent,
          borderRadius: '2px',
          fontSize: '10px',
          textTransform: 'uppercase',
          fontWeight: 700,
          letterSpacing: '0.1em',
          border: `1px solid ${accent}20`,
        }}>
          {config.eye_expression}
        </span>
      </div>

      {/* Separator */}
      <div style={{
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${primary}20, transparent)`,
        marginBottom: '16px',
      }} />

      {/* Stats */}
      <StatBar label="SPD" value={config.stats.speed} max={10} color="#00d4ff" delay={200} />
      <StatBar label="DMG" value={config.stats.damage} max={10} color="#ff2d7b" delay={300} />
      <StatBar label="DEF" value={config.stats.defense} max={10} color="#00ff88" delay={400} />
      <StatBar label="CHS" value={config.stats.chaos} max={10} color="#b44dff" delay={500} />

      {/* Victory line */}
      <p style={{
        fontFamily: 'var(--font-body)',
        color: `${accent}bb`,
        fontSize: '14px',
        fontStyle: 'italic',
        fontWeight: 500,
        margin: '20px 0 24px 0',
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${accent}06, ${primary}04)`,
        borderRadius: '4px',
        borderLeft: `2px solid ${accent}55`,
        lineHeight: 1.5,
      }}>
        &ldquo;{config.victory_line}&rdquo;
      </p>

      {/* Fight button */}
      <button
        onClick={onFight}
        disabled={loading}
        className="btn-arcade"
        style={{
          width: '100%',
          padding: '20px',
          fontSize: '18px',
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          background: loading
            ? 'rgba(255,255,255,0.04)'
            : `linear-gradient(135deg, ${primary}28, ${secondary}18)`,
          color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
          border: loading ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${primary}40`,
          borderRadius: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          textShadow: loading ? 'none' : `0 0 20px ${primary}55`,
          boxShadow: loading ? 'none' : `0 0 40px ${primary}11, inset 0 1px 0 rgba(255,255,255,0.05)`,
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          cursor: loading ? 'not-allowed' : 'pointer',
          pointerEvents: loading ? 'none' : 'auto',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.5)',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }} />
            SUMMONING OPPONENT...
          </span>
        ) : (
          'FIGHT'
        )}
      </button>

      {config.sprite_url && (
        <img
          src={config.sprite_url}
          alt={config.name}
          style={{
            position: 'absolute',
            right: '-40px',
            bottom: '0',
            height: '120%',
            width: 'auto',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 24px ${primary})`,
            animation: 'spriteSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      <style>{`
        @keyframes spriteSlideIn {
          from { transform: translateX(80px) scale(0.8); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
