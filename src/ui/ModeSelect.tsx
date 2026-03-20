import { type GameMode } from '../game/GameLoop';

interface ModeSelectProps {
  onSelect: (mode: GameMode) => void;
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
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
      <h1 style={{
        fontSize: '72px',
        fontWeight: 900,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '8px',
        marginBottom: '8px',
        textShadow: '0 0 40px rgba(68, 136, 255, 0.5), 0 4px 20px rgba(0,0,0,0.5)',
      }}>
        PromptBrawl
      </h1>
      <p style={{
        color: '#8888cc',
        fontSize: '18px',
        marginBottom: '60px',
        letterSpacing: '4px',
        textTransform: 'uppercase',
      }}>
        Describe anyone. Watch them fight.
      </p>

      <div style={{ display: 'flex', gap: '24px' }}>
        <button
          onClick={() => onSelect('vsAI')}
          style={{
            padding: '20px 48px',
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4488ff, #2244aa)',
            color: '#fff',
            border: '2px solid #6699ff',
            borderRadius: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            transition: 'all 0.2s',
            boxShadow: '0 0 30px rgba(68, 136, 255, 0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 50px rgba(68, 136, 255, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(68, 136, 255, 0.3)';
          }}
        >
          vs AI
        </button>

        <button
          onClick={() => onSelect('vsPlayer')}
          style={{
            padding: '20px 48px',
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #ff4444, #aa2222)',
            color: '#fff',
            border: '2px solid #ff6666',
            borderRadius: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            transition: 'all 0.2s',
            boxShadow: '0 0 30px rgba(255, 68, 68, 0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 68, 68, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 68, 68, 0.3)';
          }}
        >
          vs Player
        </button>
      </div>

      <p style={{
        color: '#555577',
        fontSize: '13px',
        marginTop: '40px',
        letterSpacing: '2px',
      }}>
        WASD to move &nbsp;|&nbsp; Space / F / G to fight
      </p>
    </div>
  );
}
