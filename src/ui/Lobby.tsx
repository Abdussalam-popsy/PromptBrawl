import { useState } from 'react';
import { type ConnectionStatus } from '../network/multiplayer';

interface LobbyProps {
  onBack: () => void;
  onCreateRoom: () => Promise<string>;
  onJoinRoom: (code: string) => Promise<void>;
  connectionStatus: ConnectionStatus;
  roomCode: string;
  isHost: boolean;
  peerJoined: boolean;
  connectionError: string;
  onRetry: () => void;
}

export function Lobby({
  onBack,
  onCreateRoom,
  onJoinRoom,
  connectionStatus,
  roomCode,
  isHost,
  peerJoined,
  connectionError,
  onRetry,
}: LobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await onCreateRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length !== 4) {
      setError('Room code must be 4 letters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onJoinRoom(joinCode.toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: `
      radial-gradient(ellipse at 30% 40%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 60%, rgba(255, 45, 123, 0.05) 0%, transparent 50%),
      linear-gradient(180deg, #06060f 0%, #0a0a1e 50%, #06060f 100%)
    `,
    fontFamily: 'var(--font-body)',
    zIndex: 10,
    overflow: 'hidden',
  };

  const scanline = (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25,
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
    }} />
  );

  // Waiting for peer after room created
  if (roomCode && isHost && !peerJoined) {
    return (
      <div style={containerStyle}>
        {scanline}
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            marginBottom: '24px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            animation: 'neon-pulse 2s ease-in-out infinite',
          }}>
            Waiting for opponent...
          </p>

          {/* Room code display */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
          }}>
            {roomCode.split('').map((char, i) => (
              <div key={i} style={{
                width: '68px',
                height: '84px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '42px',
                fontWeight: 900,
                color: 'var(--neon-blue)',
                background: 'rgba(0, 212, 255, 0.04)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '6px',
                textShadow: '0 0 25px rgba(0, 212, 255, 0.6)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.08), inset 0 0 15px rgba(0, 212, 255, 0.03)',
                animation: `digit-slide 0.4s ${i * 0.08}s both cubic-bezier(0.16, 1, 0.3, 1)`,
                position: 'relative',
              }}>
                {char}
                {/* Corner marks */}
                <div style={{
                  position: 'absolute', top: 4, left: 4, width: '6px', height: '6px',
                  borderTop: '1px solid rgba(0, 212, 255, 0.3)', borderLeft: '1px solid rgba(0, 212, 255, 0.3)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 4, right: 4, width: '6px', height: '6px',
                  borderBottom: '1px solid rgba(0, 212, 255, 0.3)', borderRight: '1px solid rgba(0, 212, 255, 0.3)',
                }} />
              </div>
            ))}
          </div>

          <p style={{
            fontFamily: 'var(--font-body)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
            marginBottom: '40px',
            fontWeight: 500,
          }}>
            Share this code with your opponent
          </p>

          {/* Spinner */}
          <div style={{ position: 'relative', width: '40px', height: '40px', marginBottom: '32px' }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid rgba(0, 212, 255, 0.1)',
              borderTopColor: 'var(--neon-blue)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '4px',
              border: '1px solid rgba(180, 77, 255, 0.1)',
              borderBottomColor: 'var(--neon-purple)',
              borderRadius: '50%',
              animation: 'counter-spin 1.2s linear infinite',
            }} />
          </div>

          <button
            onClick={onBack}
            style={{
              padding: '10px 28px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '2px',
              cursor: 'pointer',
              fontWeight: 600,
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 45, 123, 0.3)';
              e.currentTarget.style.color = 'var(--neon-pink)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Guest joined room
  if (roomCode && !isHost) {
    return (
      <div style={containerStyle}>
        {scanline}
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            color: '#fff',
            fontSize: '24px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}>
            Joined Room <span style={{ color: 'var(--neon-blue)', textShadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}>{roomCode}</span>
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '15px',
            fontWeight: 500,
            animation: 'neon-pulse 2s ease-in-out infinite',
          }}>
            Connected! Preparing battle...
          </p>
          <div style={{
            width: '32px', height: '32px', margin: '24px auto 0',
            border: '2px solid rgba(0, 212, 255, 0.15)', borderTopColor: 'var(--neon-blue)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  // Initial lobby: create or join
  return (
    <div style={containerStyle}>
      {scanline}

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 6vw, 46px)',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '8px',
          textShadow: '0 0 40px rgba(0, 212, 255, 0.3)',
          animation: 'slide-up 0.4s both',
        }}>
          ONLINE BATTLE
        </h1>

        {/* Decorative line */}
        <div style={{
          width: '180px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--neon-blue), var(--neon-pink), transparent)',
          marginBottom: '40px',
          opacity: 0.4,
          animation: 'crack-in 0.5s 0.1s both',
        }} />

        {connectionStatus === 'connecting' && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            color: 'rgba(0, 212, 255, 0.5)',
            fontSize: '12px',
            marginBottom: '24px',
            letterSpacing: '0.1em',
            animation: 'neon-pulse 1.5s ease-in-out infinite',
          }}>
            CONNECTING TO SERVER...
          </p>
        )}

        {connectionError && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            animation: 'fade-in 0.3s both',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--neon-pink)',
              fontSize: '12px',
              letterSpacing: '0.05em',
            }}>
              CONNECTION FAILED: {connectionError}
            </p>
            <button
              onClick={onRetry}
              className="btn-arcade"
              style={{
                padding: '10px 28px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
                color: 'var(--neon-blue)',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                borderRadius: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              RETRY
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'stretch',
          animation: 'scale-in 0.4s 0.1s both',
        }}>
          {/* Create Room */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '32px',
            background: 'rgba(0, 212, 255, 0.03)',
            border: '1px solid rgba(0, 212, 255, 0.1)',
            borderRadius: '6px',
            position: 'relative',
            backdropFilter: 'blur(4px)',
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--neon-blue), transparent)',
              opacity: 0.4,
            }} />
            <h3 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--neon-blue)',
              fontSize: '14px',
              margin: 0,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: '0 0 15px rgba(0, 212, 255, 0.3)',
            }}>
              Host a Game
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: '13px',
              margin: 0,
              textAlign: 'center',
              maxWidth: '200px',
              fontWeight: 500,
              lineHeight: 1.5,
            }}>
              Create a room and share the code with a friend
            </p>
            <button
              onClick={handleCreate}
              disabled={loading || connectionStatus !== 'connected'}
              className="btn-arcade"
              style={{
                padding: '14px 36px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: (loading || connectionStatus !== 'connected')
                  ? 'rgba(0, 212, 255, 0.05)'
                  : 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
                color: (loading || connectionStatus !== 'connected') ? 'rgba(255,255,255,0.3)' : 'var(--neon-blue)',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                borderRadius: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                boxShadow: (loading || connectionStatus !== 'connected') ? 'none' : '0 0 20px rgba(0, 212, 255, 0.08)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
            >
              {connectionStatus === 'connecting' ? 'CONNECTING...' : loading ? 'CREATING...' : 'CREATE ROOM'}
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '0 4px',
          }}>
            <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)' }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              color: 'rgba(255,255,255,0.08)',
              fontSize: '11px',
              letterSpacing: '0.25em',
            }}>OR</span>
            <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)' }} />
          </div>

          {/* Join Room */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '32px',
            background: 'rgba(255, 45, 123, 0.03)',
            border: '1px solid rgba(255, 45, 123, 0.1)',
            borderRadius: '6px',
            position: 'relative',
            backdropFilter: 'blur(4px)',
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--neon-pink), transparent)',
              opacity: 0.4,
            }} />
            <h3 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--neon-pink)',
              fontSize: '14px',
              margin: 0,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: '0 0 15px rgba(255, 45, 123, 0.3)',
            }}>
              Join a Game
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: '13px',
              margin: 0,
              textAlign: 'center',
              maxWidth: '200px',
              fontWeight: 500,
              lineHeight: 1.5,
            }}>
              Enter the 4-letter room code from your opponent
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="----"
              maxLength={4}
              style={{
                padding: '12px',
                fontSize: '26px',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
                letterSpacing: '0.5em',
                width: '170px',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                border: '1px solid rgba(255, 45, 123, 0.2)',
                borderRadius: '4px',
                outline: 'none',
                caretColor: 'var(--neon-pink)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 45, 123, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 45, 123, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 45, 123, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 4 || connectionStatus !== 'connected'}
              className="btn-arcade"
              style={{
                padding: '14px 36px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                background: (loading || joinCode.length !== 4 || connectionStatus !== 'connected')
                  ? 'rgba(255, 45, 123, 0.05)'
                  : 'linear-gradient(135deg, rgba(255, 45, 123, 0.15), rgba(200, 20, 80, 0.1))',
                color: (loading || joinCode.length !== 4 || connectionStatus !== 'connected') ? 'rgba(255,255,255,0.2)' : 'var(--neon-pink)',
                border: '1px solid rgba(255, 45, 123, 0.25)',
                borderRadius: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                boxShadow: (loading || joinCode.length !== 4 || connectionStatus !== 'connected') ? 'none' : '0 0 20px rgba(255, 45, 123, 0.08)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
            >
              {connectionStatus === 'connecting' ? 'CONNECTING...' : loading ? 'JOINING...' : 'JOIN ROOM'}
            </button>
          </div>
        </div>

        {error && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--neon-pink)',
            fontSize: '12px',
            marginTop: '24px',
            letterSpacing: '0.05em',
          }}>
            {error}
          </p>
        )}

        <button
          onClick={onBack}
          style={{
            marginTop: '40px',
            padding: '10px 28px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '2px',
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.05em',
            transition: 'all 0.2s',
            animation: 'fade-in 0.4s 0.3s both',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.2)';
          }}
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
}
