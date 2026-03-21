import { useState, useRef, useCallback, useEffect } from 'react';
import { Application } from 'pixi.js';
import { type FighterConfig } from './ai/fighterConfig';
import { generateFighter, getRandomAIPrompt } from './ai/generateFighter';
import { SPECIAL_DEFS } from './ai/moveLibrary';
import { GameLoop, type GameMode } from './game/GameLoop';
import { ModeSelect } from './ui/ModeSelect';
import { PromptInput } from './ui/PromptInput';
import { ControlsTutorial } from './ui/ControlsTutorial';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { VictoryScreen } from './ui/VictoryScreen';
import { Lobby } from './ui/Lobby';
import { MultiplayerSession, type ConnectionStatus } from './network/multiplayer';

type Screen = 'modeSelect' | 'lobby' | 'p1Prompt' | 'waitingForPeer' | 'vsScreen' | 'tutorial' | 'fighting' | 'victory';

export function App() {
  const [screen, setScreen] = useState<Screen>('modeSelect');
  const [mode, setMode] = useState<GameMode>('vsAI');
  const [p1Config, setP1Config] = useState<FighterConfig | null>(null);
  const [p2Config, setP2Config] = useState<FighterConfig | null>(null);
  const [winner, setWinner] = useState<FighterConfig | null>(null);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [p1SpecialCd, setP1SpecialCd] = useState(0);
  const [p2SpecialCd, setP2SpecialCd] = useState(0);
  const [paused, setPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [peerJoined, setPeerJoined] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const mpRef = useRef<MultiplayerSession | null>(null);
  const configResendRef = useRef<number | null>(null);
  // Use refs for configs to avoid stale closures
  const p1ConfigRef = useRef<FighterConfig | null>(null);
  const p2ConfigRef = useRef<FighterConfig | null>(null);

  const stopConfigResend = useCallback(() => {
    if (configResendRef.current !== null) {
      clearInterval(configResendRef.current);
      configResendRef.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    setPaused(false);
    setScreen('modeSelect');
    setP1Config(null);
    setP2Config(null);
    p1ConfigRef.current = null;
    p2ConfigRef.current = null;
    setWinner(null);
    setP1Hp(100);
    setP2Hp(100);
    setPeerDisconnected(false);
    setConnectionError('');
    stopConfigResend();
    mpRef.current?.disconnect();
    mpRef.current = null;
    setRoomCode('');
    setIsHost(false);
    setPeerJoined(false);
    setConnectionStatus('disconnected');
  }, [stopConfigResend]);

  const handleModeSelect = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    if (selectedMode === 'vsOnline') {
      setScreen('lobby');
      setConnectionError('');
      const session = new MultiplayerSession();
      mpRef.current = session;
      session.onConnectionChange = (status) => setConnectionStatus(status);
      const clientId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setConnectionStatus('connecting');
      session.connect(clientId).then(() => {
        setConnectionStatus('connected');
      }).catch(err => {
        console.error('[multiplayer] Connection failed:', err);
        setConnectionStatus('disconnected');
        setConnectionError(err instanceof Error ? err.message : 'Connection failed');
      });
    } else {
      setScreen('p1Prompt');
    }
  }, []);

  const handleRetryConnection = useCallback(() => {
    setConnectionError('');
    mpRef.current?.disconnect();
    const session = new MultiplayerSession();
    mpRef.current = session;
    session.onConnectionChange = (status) => setConnectionStatus(status);
    const clientId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setConnectionStatus('connecting');
    session.connect(clientId).then(() => {
      setConnectionStatus('connected');
    }).catch(err => {
      console.error('[multiplayer] Retry failed:', err);
      setConnectionStatus('disconnected');
      setConnectionError(err instanceof Error ? err.message : 'Connection failed');
    });
  }, []);

  // Check if both configs ready and trigger game start (host only)
  const checkBothReady = useCallback(() => {
    const session = mpRef.current;
    if (!session) return;
    const myConfig = p1ConfigRef.current;
    const peerConfig = p2ConfigRef.current;
    if (myConfig && peerConfig) {
      stopConfigResend();
      if (session.isHost) {
        // Host sends game_start
        session.sendGameStart();
      }
      setScreen('vsScreen');
    }
  }, [stopConfigResend]);

  const handleCreateRoom = useCallback(async (): Promise<string> => {
    const session = mpRef.current;
    if (!session) throw new Error('Not connected');
    const code = await session.createRoom();
    setRoomCode(code);
    setIsHost(true);
    session.onPeerJoined = () => {
      setPeerJoined(true);
      setScreen('p1Prompt');
    };
    return code;
  }, []);

  const handleJoinRoom = useCallback(async (code: string): Promise<void> => {
    const session = mpRef.current;
    if (!session) throw new Error('Not connected');
    await session.joinRoom(code);
    setRoomCode(code);
    setIsHost(false);
    setScreen('p1Prompt');
    session.onPeerJoined = () => {
      setPeerJoined(true);
    };
  }, []);

  const handleP1Ready = useCallback(async (config: FighterConfig) => {
    setP1Config(config);
    p1ConfigRef.current = config;

    if (mode === 'vsOnline') {
      const session = mpRef.current;
      if (!session) return;
      // Send config immediately
      session.sendFighterConfig(config);
      // Resend every 500ms until both configs are confirmed
      stopConfigResend();
      configResendRef.current = window.setInterval(() => {
        // Keep resending until we have both configs
        if (p2ConfigRef.current) {
          stopConfigResend();
          return;
        }
        session.sendFighterConfig(config);
      }, 500);
      // Show waiting screen
      setScreen('waitingForPeer');
      // Check if we already have peer config
      checkBothReady();
    } else if (mode === 'vsAI') {
      const aiPrompt = getRandomAIPrompt();
      const aiConfig = await generateFighter(aiPrompt);
      setP2Config(aiConfig);
      p2ConfigRef.current = aiConfig;
      setScreen('vsScreen');
    }
  }, [mode, stopConfigResend, checkBothReady]);

  // Listen for peer fighter config and game_start in online mode
  useEffect(() => {
    if (mode !== 'vsOnline' || !mpRef.current) return;
    const session = mpRef.current;

    session.onFighterConfig = (remoteConfig: FighterConfig) => {
      setP2Config(remoteConfig);
      p2ConfigRef.current = remoteConfig;
      // If we also have our config, we're both ready
      if (p1ConfigRef.current) {
        stopConfigResend();
        if (session.isHost) {
          session.sendGameStart();
        }
        setScreen('vsScreen');
      }
    };

    session.onGameStart = () => {
      // Guest receives game_start from host
      if (p1ConfigRef.current && p2ConfigRef.current) {
        stopConfigResend();
        setScreen('vsScreen');
      }
    };
  }, [mode, stopConfigResend]);

  // VS screen auto-advance to tutorial
  useEffect(() => {
    if (screen === 'vsScreen') {
      const timer = setTimeout(() => setScreen('tutorial'), 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleTutorialStart = useCallback(() => {
    setScreen('fighting');
  }, []);

  // Pause on Escape during fight
  useEffect(() => {
    if (screen !== 'fighting') return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const gl = gameLoopRef.current;
        if (!gl) return;

        if (gl.isPaused) {
          gl.resume();
          setPaused(false);
        } else {
          gl.pause();
          setPaused(true);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen]);

  const handleResume = useCallback(() => {
    gameLoopRef.current?.resume();
    setPaused(false);
  }, []);

  // Start the game when entering fighting screen
  useEffect(() => {
    if (screen !== 'fighting' || !p1Config || !p2Config) return;

    let mounted = true;

    const initGame = async () => {
      const app = new Application();
      await app.init({
        background: '#0a0a1a',
        resizeTo: window,
        antialias: true,
        preference: 'webgl',
      });

      if (!mounted || !canvasRef.current) return;

      canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const gameLoop = new GameLoop(app, p1Config, p2Config, mode, {
        onHealthChange: (h1, h2) => {
          setP1Hp(h1);
          setP2Hp(h2);
        },
        onSpecialCooldown: (cd1, cd2) => {
          setP1SpecialCd(cd1);
          setP2SpecialCd(cd2);
        },
        onGameOver: (winnerConfig) => {
          setWinner(winnerConfig);
          setScreen('victory');
        },
        onPeerDisconnected: () => {
          setPeerDisconnected(true);
          gameLoopRef.current?.pause();
        },
      }, mpRef.current ?? undefined);
      gameLoopRef.current = gameLoop;
    };

    initGame();

    return () => {
      mounted = false;
      gameLoopRef.current?.destroy();
      gameLoopRef.current = null;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [screen, p1Config, p2Config, mode]);

  const handleAttackButton = useCallback((action: 'lightAttack' | 'heavyAttack' | 'special') => {
    gameLoopRef.current?.triggerButton(action);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#06060f',
      position: 'relative',
    }}>
      {/* PixiJS canvas container */}
      <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* UI Overlays */}
      {screen === 'modeSelect' && (
        <ModeSelect onSelect={handleModeSelect} />
      )}

      {screen === 'lobby' && (
        <Lobby
          onBack={() => { resetAll(); }}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          connectionStatus={connectionStatus}
          roomCode={roomCode}
          isHost={isHost}
          peerJoined={peerJoined}
          connectionError={connectionError}
          onRetry={handleRetryConnection}
        />
      )}

      {screen === 'p1Prompt' && (
        <PromptInput
          playerNumber={1}
          onFighterReady={handleP1Ready}
          onBack={() => setScreen('modeSelect')}
        />
      )}

      {/* Waiting for peer's config after submitting own */}
      {screen === 'waitingForPeer' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)',
          zIndex: 10,
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }} />
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              marginBottom: '24px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              animation: 'neon-pulse 2s ease-in-out infinite',
            }}>
              Waiting for opponent's fighter...
            </p>
            <div style={{
              width: '32px',
              height: '32px',
              border: '2px solid rgba(0, 212, 255, 0.15)',
              borderTopColor: 'var(--neon-blue)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        </div>
      )}

      {screen === 'vsScreen' && p1Config && p2Config && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `
            radial-gradient(ellipse at 30% 50%, ${p1Config.color_palette.primary}11 0%, transparent 40%),
            radial-gradient(ellipse at 70% 50%, ${p2Config.color_palette.primary}11 0%, transparent 40%),
            linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)
          `,
          zIndex: 10,
          overflow: 'hidden',
        }}>
          {/* Scanline */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }} />
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              color: p1Config.color_palette.primary,
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textShadow: `0 0 40px ${p1Config.color_palette.primary}44`,
              animation: 'slide-up 0.4s both',
            }}>
              {p1Config.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              color: 'rgba(255,255,255,0.12)',
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 900,
              margin: '0 28px',
              letterSpacing: '0.1em',
              animation: 'scale-in 0.3s 0.15s both',
            }}>
              VS
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              color: p2Config.color_palette.primary,
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textShadow: `0 0 40px ${p2Config.color_palette.primary}44`,
              animation: 'slide-up 0.4s 0.1s both',
            }}>
              {p2Config.name}
            </span>
          </div>
        </div>
      )}

      {screen === 'tutorial' && p1Config && p2Config && (
        <ControlsTutorial
          p1Config={p1Config}
          p2Config={p2Config}
          onStart={handleTutorialStart}
        />
      )}

      {screen === 'fighting' && p1Config && p2Config && (
        <>
          <HUD
            p1Config={p1Config}
            p2Config={p2Config}
            p1Hp={p1Hp}
            p2Hp={p2Hp}
            p1SpecialCd={p1SpecialCd}
            p2SpecialCd={p2SpecialCd}
          />

          {/* On-screen attack buttons */}
          {!paused && !peerDisconnected && (() => {
            const specialName = SPECIAL_DEFS[p1Config.move_loadout.special]?.name
              ?? p1Config.move_loadout.special.replace(/_/g, ' ');
            const cooldownSec = Math.ceil(Math.max(0, p1SpecialCd) / 1000);
            const onCooldown = p1SpecialCd > 0;

            const btnBase: React.CSSProperties = {
              padding: '0 28px',
              minHeight: '90px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              borderRadius: '4px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'transform 0.1s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '120px',
            };

            return (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px',
                zIndex: 6,
                userSelect: 'none',
              }}>
                {/* ATTACK */}
                <button
                  onPointerDown={(e) => { e.preventDefault(); handleAttackButton('lightAttack'); }}
                  style={{
                    ...btnBase,
                    background: 'linear-gradient(180deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.2))',
                    color: 'var(--neon-blue)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
                    fontSize: '14px',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                  onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1, opacity: 0.8 }}>&#9876;</span>
                  <span style={{ letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '13px' }}>ATTACK</span>
                  <span style={{ fontSize: '9px', color: 'rgba(0, 212, 255, 0.4)', fontWeight: 500, fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>Fast hit</span>
                </button>

                {/* HEAVY */}
                <button
                  onPointerDown={(e) => { e.preventDefault(); handleAttackButton('heavyAttack'); }}
                  style={{
                    ...btnBase,
                    background: 'linear-gradient(180deg, rgba(255, 136, 0, 0.15), rgba(200, 80, 0, 0.2))',
                    color: '#ff8800',
                    border: '1px solid rgba(255, 136, 0, 0.25)',
                    boxShadow: '0 0 20px rgba(255, 136, 0, 0.1)',
                    fontSize: '14px',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                  onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '20px', lineHeight: 1, opacity: 0.8 }}>&#128165;</span>
                  <span style={{ letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '13px' }}>HEAVY</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255, 136, 0, 0.4)', fontWeight: 500, fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>Slow power</span>
                </button>

                {/* SPECIAL */}
                <button
                  onPointerDown={(e) => { e.preventDefault(); handleAttackButton('special'); }}
                  style={{
                    ...btnBase,
                    background: onCooldown
                      ? 'rgba(255,255,255,0.03)'
                      : `linear-gradient(180deg, ${p1Config.color_palette.accent}22, ${p1Config.color_palette.primary}18)`,
                    color: onCooldown ? 'rgba(255,255,255,0.2)' : '#fff',
                    border: onCooldown
                      ? '1px solid rgba(255,255,255,0.06)'
                      : `1px solid ${p1Config.color_palette.accent}44`,
                    cursor: onCooldown ? 'default' : 'pointer',
                    boxShadow: onCooldown ? 'none' : `0 0 20px ${p1Config.color_palette.accent}15`,
                    opacity: onCooldown ? 0.6 : 1,
                    minWidth: '130px',
                    fontSize: '14px',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                  onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1, opacity: 0.8 }}>{onCooldown ? '\u23F3' : '\u2728'}</span>
                  <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '12px' }}>
                    {onCooldown ? `${cooldownSec}s` : specialName}
                  </span>
                  <span style={{ fontSize: '9px', color: onCooldown ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', fontWeight: 500, fontFamily: 'var(--font-body)', letterSpacing: '0.05em' }}>
                    {onCooldown ? 'Cooldown' : 'Special'}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* Peer disconnected overlay */}
          {peerDisconnected && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(4, 4, 12, 0.92)',
              backdropFilter: 'blur(8px)',
              zIndex: 30,
              animation: 'fade-in 0.2s both',
            }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
              }} />
              <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 45, 123, 0.1)',
                  border: '2px solid rgba(255, 45, 123, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '24px',
                }}>
                  &#x26A0;
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: 'var(--neon-pink)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px',
                }}>
                  OPPONENT DISCONNECTED
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '15px',
                  fontWeight: 500,
                  marginBottom: '32px',
                }}>
                  Your opponent has left the match
                </p>
                <button
                  onClick={resetAll}
                  className="btn-arcade"
                  style={{
                    padding: '16px 48px',
                    fontSize: '16px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
                    color: 'var(--neon-blue)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  RETURN TO MENU
                </button>
              </div>
            </div>
          )}

          {paused && !peerDisconnected && (
            <PauseMenu
              p1Config={p1Config}
              p2Config={p2Config}
              onResume={handleResume}
              onQuit={resetAll}
            />
          )}
        </>
      )}

      {screen === 'victory' && winner && (
        <VictoryScreen winner={winner} onPlayAgain={resetAll} />
      )}
    </div>
  );
}
