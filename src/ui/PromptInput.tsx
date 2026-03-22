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
  isGeneratingOpponent?: boolean;
}

export function PromptInput({ playerNumber, onFighterReady, onBack, isGeneratingOpponent = false }: PromptInputProps) {
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
  const accentHex = playerNumber === 1 ? '#00d4ff' : '#ff2d7b';

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
          radial-gradient(ellipse at 50% 30%, ${accentHex}06 0%, transparent 60%),
          linear-gradient(180deg, #06060f 0%, #0a0a1e 50%, #06060f 100%)
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
          letterSpacing: '0.35em',
          opacity: 0.6,
        }}>
          Player {playerNumber} Fighter
        </p>
        <FighterCard config={fighter} onFight={() => onFighterReady(fighter)} loading={isGeneratingOpponent} />
        {fighter.name === 'Default Dan' && (
          <p style={{
            fontFamily: 'var(--font-body)',
            color: 'rgba(255, 200, 50, 0.7)',
            fontSize: '13px',
            marginTop: '16px',
            textAlign: 'center',
            maxWidth: '380px',
            lineHeight: 1.5,
            fontWeight: 500,
          }}>
            AI generation failed — using fallback fighter. Try a different description.
          </p>
        )}
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
        radial-gradient(ellipse at 50% 40%, ${accentHex}06 0%, transparent 50%),
        linear-gradient(180deg, #06060f 0%, #0a0a1e 50%, #06060f 100%)
      `,
      fontFamily: 'var(--font-body)',
      zIndex: 10,
    }}>
      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
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
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '2px',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          transition: 'all 0.2s',
          zIndex: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${accentHex}55`;
          e.currentTarget.style.color = accentColor;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
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
          letterSpacing: '0.45em',
          marginBottom: '12px',
          opacity: 0.6,
        }}>
          Player {playerNumber}
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px, 5vw, 40px)',
          fontWeight: 900,
          color: '#fff',
          marginBottom: '12px',
          letterSpacing: '0.06em',
          textShadow: `0 0 40px ${accentHex}18`,
        }}>
          DESCRIBE YOUR FIGHTER
        </h1>

        {/* Decorative line */}
        <div style={{
          width: '160px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`,
          marginBottom: '36px',
          opacity: 0.35,
          animation: 'crack-in 0.5s 0.1s both',
        }} />

        <div style={{ width: '100%', maxWidth: '520px', padding: '0 20px' }}>
          <div style={{
            position: 'relative',
            border: `1px solid ${accentHex}18`,
            borderRadius: '6px',
            background: `${accentHex}04`,
            overflow: 'hidden',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}>
            {/* Animated top accent line */}
            <div style={{
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'border-flow 3s ease-in-out infinite',
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
                padding: '22px 24px',
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
              padding: '20px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              background: loading
                ? 'rgba(255,255,255,0.04)'
                : `linear-gradient(135deg, ${accentHex}20, rgba(180, 77, 255, 0.12))`,
              color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
              border: loading ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${accentHex}25`,
              borderRadius: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              opacity: !prompt.trim() ? 0.4 : 1,
              transition: 'opacity 0.2s, background 0.3s',
              boxShadow: loading || !prompt.trim() ? 'none' : `0 0 30px ${accentHex}10`,
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
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
                CLAUDE IS IMAGINING YOUR FIGHTER...
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
