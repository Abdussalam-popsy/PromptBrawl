import { useState, useEffect, useCallback } from 'react';
import { type FighterConfig } from '../ai/fighterConfig';
import { generateFighter } from '../ai/generateFighter';
import { FighterCard } from './FighterCard';

const PLACEHOLDERS = [
  'Mr Krabs weaponising his greed...',
  'A passive aggressive middle manager...',
  'Scorpion but tiny and furious...',
  'A caffeinated squirrel with a grudge...',
  'Gandalf if he was a bouncer...',
  'A sentient cactus with trust issues...',
];

interface PromptInputProps {
  playerNumber: 1 | 2;
  onFighterReady: (config: FighterConfig) => void;
  onBack: () => void;
}

export function PromptInput({ playerNumber, onFighterReady, onBack }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [fighter, setFighter] = useState<FighterConfig | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    const config = await generateFighter(prompt.trim());
    setFighter(config);
    setLoading(false);
  }, [prompt, loading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  const accentColor = playerNumber === 1 ? 'var(--neon-blue)' : 'var(--neon-pink)';

  if (fighter) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(0, 212, 255, 0.04) 0%, transparent 60%),
          linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)
        `,
        zIndex: 10,
        animation: 'fade-in 0.3s both',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          color: accentColor,
          fontSize: '12px',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          opacity: 0.7,
        }}>
          Player {playerNumber} Fighter
        </p>
        <FighterCard config={fighter} onFight={() => onFighterReady(fighter)} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse at 50% 40%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
        linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)
      `,
      fontFamily: 'var(--font-body)',
      zIndex: 10,
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
      }} />

      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          padding: '8px 18px',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          background: 'transparent',
          color: 'rgba(255,255,255,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '2px',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          transition: 'all 0.2s',
          zIndex: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
          e.currentTarget.style.color = 'var(--neon-blue)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
        }}
      >
        &larr; BACK
      </button>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.4em',
          marginBottom: '12px',
          opacity: 0.7,
        }}>
          Player {playerNumber}
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 900,
          color: '#fff',
          marginBottom: '36px',
          letterSpacing: '0.05em',
          textShadow: '0 0 40px rgba(0, 212, 255, 0.15)',
        }}>
          DESCRIBE YOUR FIGHTER
        </h1>

        <div style={{ width: '100%', maxWidth: '520px', padding: '0 20px' }}>
          <div style={{
            position: 'relative',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            borderRadius: '4px',
            background: 'rgba(0, 212, 255, 0.03)',
            overflow: 'hidden',
          }}>
            {/* Top accent line */}
            <div style={{
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              opacity: 0.5,
            }} />
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '20px 22px',
                fontSize: '17px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                background: 'transparent',
                color: '#fff',
                border: 'none',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5,
                letterSpacing: '0.02em',
              }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn-arcade"
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '18px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: loading
                ? 'rgba(255,255,255,0.05)'
                : `linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(180, 77, 255, 0.15))`,
              color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
              border: loading ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              opacity: !prompt.trim() ? 0.4 : 1,
              transition: 'opacity 0.2s, background 0.3s',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            {loading ? (
              <span style={{ animation: 'neon-pulse 1s infinite' }}>
                SUMMONING FIGHTER...
              </span>
            ) : (
              'GENERATE FIGHTER'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
