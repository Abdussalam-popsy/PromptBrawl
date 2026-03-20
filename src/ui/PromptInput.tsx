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

  if (fighter) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 100%)',
        zIndex: 10,
      }}>
        <p style={{
          color: '#8888cc',
          fontSize: '14px',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '3px',
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
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      zIndex: 10,
    }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px 16px',
          background: 'transparent',
          color: '#666',
          border: '1px solid #333',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        ← Back
      </button>

      <h2 style={{
        fontSize: '18px',
        color: '#4488ff',
        textTransform: 'uppercase',
        letterSpacing: '4px',
        marginBottom: '8px',
      }}>
        Player {playerNumber}
      </h2>

      <h1 style={{
        fontSize: '36px',
        fontWeight: 900,
        color: '#fff',
        marginBottom: '32px',
      }}>
        Describe your fighter
      </h1>

      <div style={{ width: '100%', maxWidth: '500px', padding: '0 20px' }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          disabled={loading}
          rows={3}
          style={{
            width: '100%',
            padding: '16px 20px',
            fontSize: '18px',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            border: '2px solid #333',
            borderRadius: '12px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#4488ff'}
          onBlur={e => e.currentTarget.style.borderColor = '#333'}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 700,
            background: loading
              ? 'linear-gradient(135deg, #333, #444)'
              : 'linear-gradient(135deg, #4488ff, #2244aa)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'default' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            opacity: !prompt.trim() ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <span>
              Summoning your fighter
              <span style={{ animation: 'pulse 1s infinite' }}>...</span>
            </span>
          ) : (
            'Generate Fighter'
          )}
        </button>
      </div>
    </div>
  );
}
