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
  // myConfig = the config this player created, peerConfig = received from network
  const [myConfig, setMyConfig] = useState<FighterConfig | null>(null);
  const [peerConfig, setPeerConfig] = useState<FighterConfig | null>(null);
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
  const [waitingExpired, setWaitingExpired] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const mpRef = useRef<MultiplayerSession | null>(null);
  const configResendRef = useRef<number | null>(null);
  const myConfigRef = useRef<FighterConfig | null>(null);
  const peerConfigRef = useRef<FighterConfig | null>(null);

  // Derive p1Config (left/host) and p2Config (right/guest) from myConfig + peerConfig
  // Host: p1=my, p2=peer. Guest: p1=peer, p2=my.
  const p1Config = mode === 'vsOnline' && !isHost ? peerConfig : myConfig;
  const p2Config = mode === 'vsOnline' && !isHost ? myConfig : peerConfig;

  const stopConfigResend = useCallback(() => {
    if (configResendRef.current !== null) {
      clearInterval(configResendRef.current);
      configResendRef.current = null;
    }
  }, []);

  const resetAll = useCallback(() => {
    setPaused(false);
    setScreen('modeSelect');
    setMyConfig(null);
    setPeerConfig(null);
    myConfigRef.current = null;
    peerConfigRef.current = null;
    setWinner(null);
    setP1Hp(100);
    setP2Hp(100);
    setPeerDisconnected(false);
    setWaitingExpired(false);
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
    setMyConfig(config);
    myConfigRef.current = config;

    if (mode === 'vsOnline') {
      const session = mpRef.current;
      if (!session) return;
      session.sendFighterConfig(config);
      stopConfigResend();
      configResendRef.current = window.setInterval(() => {
        if (peerConfigRef.current) {
          stopConfigResend();
          return;
        }
        session.sendFighterConfig(config);
      }, 500);
      setScreen('waitingForPeer');
      // Check if we already have peer config
      if (peerConfigRef.current) {
        stopConfigResend();
        if (session.isHost) session.sendGameStart();
        setScreen('vsScreen');
      }
    } else if (mode === 'vsAI') {
      const aiPrompt = getRandomAIPrompt();
      const aiConfig = await generateFighter(aiPrompt);
      setPeerConfig(aiConfig);
      peerConfigRef.current = aiConfig;
      setScreen('vsScreen');
    }
  }, [mode, stopConfigResend]);

  // Listen for peer fighter config and game_start in online mode
  useEffect(() => {
    if (mode !== 'vsOnline' || !mpRef.current) return;
    const session = mpRef.current;

    session.onFighterConfig = (remoteConfig: FighterConfig) => {
      setPeerConfig(remoteConfig);
      peerConfigRef.current = remoteConfig;
      if (myConfigRef.current) {
        stopConfigResend();
        if (session.isHost) session.sendGameStart();
        setScreen('vsScreen');
      }
    };

    session.onGameStart = () => {
      if (myConfigRef.current && peerConfigRef.current) {
        stopConfigResend();
        setScreen('vsScreen');
      }
    };
  }, [mode, stopConfigResend]);

  // waitingForPeer 60s timeout
  useEffect(() => {
    if (screen !== 'waitingForPeer') {
      setWaitingExpired(false);
      return;
    }
    const timer = setTimeout(() => setWaitingExpired(true), 60000);
    return () => clearTimeout(timer);
  }, [screen]);

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
        if (gl.isPaused) { gl.resume(); setPaused(false); }
        else { gl.pause(); setPaused(true); }
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

    let resizeHandler: (() => void) | null = null;

    const initGame = async () => {
      try {
        const container = canvasRef.current;
        if (!container) return;

        // Ensure container fills parent, then force layout to get actual pixel dimensions
        container.style.width = '100%';
        container.style.height = '100%';
        const rect = container.getBoundingClientRect();

        const app = new Application();
        await app.init({
          background: '#0a0a1a',
          width: rect.width,
          height: rect.height,
          resizeTo: container,
          antialias: true,
          preference: 'webgl',
        });

        if (!mounted) return;

        container.appendChild(app.canvas as HTMLCanvasElement);
        appRef.current = app;

        // Resize listener to keep PixiJS in sync with container
        resizeHandler = () => {
          app.renderer.resize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', resizeHandler);

        const gameLoop = new GameLoop(app, p1Config, p2Config, mode, {
          onHealthChange: (h1, h2) => { setP1Hp(h1); setP2Hp(h2); },
          onSpecialCooldown: (cd1, cd2) => { setP1SpecialCd(cd1); setP2SpecialCd(cd2); },
          onGameOver: (winnerConfig) => { setWinner(winnerConfig); setScreen('victory'); },
          onPeerDisconnected: () => { setPeerDisconnected(true); gameLoopRef.current?.pause(); },
        }, mpRef.current ?? undefined, isHost);
        gameLoopRef.current = gameLoop;
      } catch (err) {
        console.error('Game init failed:', err);
        setScreen('modeSelect');
      }
    };

    initGame().catch(console.error);

    return () => {
      mounted = false;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      gameLoopRef.current?.destroy();
      gameLoopRef.current = null;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [screen, p1Config, p2Config, mode, isHost]);

  const handleAttackButton = useCallback((action: 'lightAttack' | 'heavyAttack' | 'special') => {
    gameLoopRef.current?.triggerButton(action);
  }, []);

  const handleDpadDown = useCallback((direction: 'left' | 'right') => {
    gameLoopRef.current?.controls.setTouchDirection(direction, true);
  }, []);

  const handleDpadUp = useCallback((direction: 'left' | 'right') => {
    gameLoopRef.current?.controls.setTouchDirection(direction, false);
  }, []);

  const handleJumpButton = useCallback(() => {
    gameLoopRef.current?.triggerButton('jump');
  }, []);

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

  // Determine special info for the local player's fighter
  const localConfig = isHost ? p1Config : p2Config;
  const localSpecialCd = isHost ? p1SpecialCd : p2SpecialCd;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#06060f',
      position: 'relative',
    }}>
      {/* PixiJS canvas container — always fullscreen */}
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
          playerNumber={isHost || mode === 'vsAI' ? 1 : 2}
          onFighterReady={handleP1Ready}
          onBack={() => setScreen('modeSelect')}
        />
      )}

      {/* Waiting for peer's config after submitting own */}
      {screen === 'waitingForPeer' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)',
          zIndex: 10,
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }} />
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {waitingExpired ? (
              <>
                <p style={{
                  fontFamily: 'var(--font-display)', color: 'var(--neon-pink)',
                  fontSize: '14px', marginBottom: '12px', letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}>
                  Opponent didn't join. Room expired.
                </p>
                <button
                  onClick={resetAll}
                  className="btn-arcade"
                  style={{
                    marginTop: '16px', padding: '14px 40px', fontSize: '14px', fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
                    color: 'var(--neon-blue)', border: '1px solid rgba(0, 212, 255, 0.25)',
                    borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.15em',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  BACK TO MENU
                </button>
              </>
            ) : (
              <>
                <p style={{
                  fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.5)',
                  fontSize: '14px', marginBottom: '24px', letterSpacing: '0.3em',
                  textTransform: 'uppercase', animation: 'neon-pulse 2s ease-in-out infinite',
                }}>
                  Waiting for opponent's fighter...
                </p>
                <div style={{
                  width: '32px', height: '32px',
                  border: '2px solid rgba(0, 212, 255, 0.15)', borderTopColor: 'var(--neon-blue)',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                }} />
              </>
            )}
          </div>
        </div>
      )}

      {screen === 'vsScreen' && p1Config && p2Config && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `
            radial-gradient(ellipse at 50% 20%, ${p1Config.color_palette.primary}11 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, ${p2Config.color_palette.primary}11 0%, transparent 40%),
            linear-gradient(180deg, #06060f 0%, #0d0d24 50%, #06060f 100%)
          `,
          zIndex: 10, overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          }} />
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '16px', zIndex: 1, maxWidth: '80vw',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', color: p1Config.color_palette.primary,
              fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.05em', textShadow: `0 0 40px ${p1Config.color_palette.primary}44`,
              animation: 'slide-up 0.4s both',
              maxWidth: '80vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textAlign: 'center',
            }}>
              {p1Config.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.12)',
              fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 900,
              letterSpacing: '0.1em', animation: 'scale-in 0.3s 0.15s both',
              textAlign: 'center',
            }}>
              VS
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', color: p2Config.color_palette.primary,
              fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.05em', textShadow: `0 0 40px ${p2Config.color_palette.primary}44`,
              animation: 'slide-up 0.4s 0.1s both',
              maxWidth: '80vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textAlign: 'center',
            }}>
              {p2Config.name}
            </div>
          </div>
        </div>
      )}

      {screen === 'tutorial' && p1Config && p2Config && (
        <ControlsTutorial p1Config={p1Config} p2Config={p2Config} onStart={handleTutorialStart} />
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
            p1Label={mode === 'vsOnline' ? 'P1 · HOST' : undefined}
            p2Label={mode === 'vsOnline' ? 'P2 · GUEST' : undefined}
          />

          {/* On-screen attack buttons — desktop/tablet overlay at bottom */}
          {!paused && !peerDisconnected && (() => {
            const specialName = localConfig
              ? (SPECIAL_DEFS[localConfig.move_loadout.special]?.name ?? localConfig.move_loadout.special.replace(/_/g, ' '))
              : 'Special';
            const cooldownSec = Math.ceil(Math.max(0, localSpecialCd) / 1000);
            const onCooldown = localSpecialCd > 0;
            const accentColor = localConfig?.color_palette.accent ?? '#b44dff';
            const primaryColor = localConfig?.color_palette.primary ?? '#00d4ff';

            const noTouch: React.CSSProperties = {
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
            };

            const atkBtn: React.CSSProperties = {
              ...noTouch,
              minHeight: '80px',
              minWidth: '80px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '0 16px',
            };

            const dpadBtn: React.CSSProperties = {
              ...noTouch,
              minHeight: '70px',
              minWidth: '70px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '24px',
              padding: 0,
            };

            const preventMenu = (e: React.MouseEvent) => e.preventDefault();

            return (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                zIndex: 6,
                userSelect: 'none',
                pointerEvents: 'none',
              }}>
                {/* D-pad — left side (touch devices only) */}
                {isTouchDevice ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', pointerEvents: 'auto' }}>
                    <button
                      onPointerDown={(e) => { e.preventDefault(); handleDpadDown('left'); }}
                      onPointerUp={(e) => { e.preventDefault(); handleDpadUp('left'); }}
                      onPointerLeave={(e) => { e.preventDefault(); handleDpadUp('left'); }}
                      onPointerCancel={(e) => { e.preventDefault(); handleDpadUp('left'); }}
                      onContextMenu={preventMenu}
                      style={dpadBtn}
                    >
                      &#9664;
                    </button>
                    <button
                      onPointerDown={(e) => { e.preventDefault(); handleJumpButton(); }}
                      onContextMenu={preventMenu}
                      style={{ ...dpadBtn, minHeight: '80px' }}
                    >
                      &#9650;
                    </button>
                    <button
                      onPointerDown={(e) => { e.preventDefault(); handleDpadDown('right'); }}
                      onPointerUp={(e) => { e.preventDefault(); handleDpadUp('right'); }}
                      onPointerLeave={(e) => { e.preventDefault(); handleDpadUp('right'); }}
                      onPointerCancel={(e) => { e.preventDefault(); handleDpadUp('right'); }}
                      onContextMenu={preventMenu}
                      style={dpadBtn}
                    >
                      &#9654;
                    </button>
                  </div>
                ) : <div />}

                {/* Attack buttons — right side */}
                <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
                  <button
                    onPointerDown={(e) => { e.preventDefault(); handleAttackButton('lightAttack'); }}
                    onContextMenu={preventMenu}
                    style={{
                      ...atkBtn,
                      background: 'linear-gradient(180deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.2))',
                      color: 'var(--neon-blue)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      boxShadow: '0 0 15px rgba(0, 212, 255, 0.1)',
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1, opacity: 0.8 }}>&#9876;</span>
                    <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '11px' }}>ATK</span>
                  </button>

                  <button
                    onPointerDown={(e) => { e.preventDefault(); handleAttackButton('heavyAttack'); }}
                    onContextMenu={preventMenu}
                    style={{
                      ...atkBtn,
                      background: 'linear-gradient(180deg, rgba(255, 136, 0, 0.15), rgba(200, 80, 0, 0.2))',
                      color: '#ff8800',
                      border: '1px solid rgba(255, 136, 0, 0.25)',
                      boxShadow: '0 0 15px rgba(255, 136, 0, 0.1)',
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1, opacity: 0.8 }}>&#128165;</span>
                    <span style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '11px' }}>HVY</span>
                  </button>

                  <button
                    onPointerDown={(e) => { e.preventDefault(); handleAttackButton('special'); }}
                    onContextMenu={preventMenu}
                    style={{
                      ...atkBtn,
                      background: onCooldown
                        ? 'rgba(255,255,255,0.03)'
                        : `linear-gradient(180deg, ${accentColor}22, ${primaryColor}18)`,
                      color: onCooldown ? 'rgba(255,255,255,0.2)' : '#fff',
                      border: onCooldown
                        ? '1px solid rgba(255,255,255,0.06)'
                        : `1px solid ${accentColor}44`,
                      opacity: onCooldown ? 0.6 : 1,
                      boxShadow: onCooldown ? 'none' : `0 0 15px ${accentColor}15`,
                    }}
                  >
                    <span style={{ fontSize: '18px', lineHeight: 1, opacity: 0.8 }}>{onCooldown ? '\u23F3' : '\u2728'}</span>
                    <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '10px' }}>
                      {onCooldown ? `${cooldownSec}s` : specialName}
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Peer disconnected overlay */}
          {peerDisconnected && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(4, 4, 12, 0.92)', backdropFilter: 'blur(8px)',
              zIndex: 30, animation: 'fade-in 0.2s both',
            }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
              }} />
              <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(255, 45, 123, 0.1)', border: '2px solid rgba(255, 45, 123, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '20px', fontSize: '24px',
                }}>
                  &#x26A0;
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900,
                  color: 'var(--neon-pink)', textTransform: 'uppercase', letterSpacing: '0.1em',
                  marginBottom: '12px',
                }}>
                  OPPONENT DISCONNECTED
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.4)',
                  fontSize: '15px', fontWeight: 500, marginBottom: '32px',
                }}>
                  Your opponent has left the match
                </p>
                <button onClick={resetAll} className="btn-arcade" style={{
                  padding: '16px 48px', fontSize: '16px', fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 100, 200, 0.1))',
                  color: 'var(--neon-blue)', border: '1px solid rgba(0, 212, 255, 0.25)',
                  borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.15em',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                }}>
                  RETURN TO MENU
                </button>
              </div>
            </div>
          )}

          {paused && !peerDisconnected && p1Config && p2Config && (
            <PauseMenu p1Config={p1Config} p2Config={p2Config} onResume={handleResume} onQuit={resetAll} />
          )}
        </>
      )}

      {screen === 'victory' && winner && (
        <VictoryScreen winner={winner} onPlayAgain={resetAll} />
      )}
    </div>
  );
}
