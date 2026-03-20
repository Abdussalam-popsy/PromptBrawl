import { useState, useRef, useCallback, useEffect } from 'react';
import { Application } from 'pixi.js';
import { type FighterConfig } from './ai/fighterConfig';
import { generateFighter, getRandomAIPrompt } from './ai/generateFighter';
import { GameLoop, type GameMode } from './game/GameLoop';
import { ModeSelect } from './ui/ModeSelect';
import { PromptInput } from './ui/PromptInput';
import { ControlsTutorial } from './ui/ControlsTutorial';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { VictoryScreen } from './ui/VictoryScreen';

type Screen = 'modeSelect' | 'p1Prompt' | 'p2Prompt' | 'vsScreen' | 'tutorial' | 'fighting' | 'victory';

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

  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);

  const handleModeSelect = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    setScreen('p1Prompt');
  }, []);

  const handleP1Ready = useCallback(async (config: FighterConfig) => {
    setP1Config(config);

    if (mode === 'vsAI') {
      // Auto-generate AI opponent
      const aiPrompt = getRandomAIPrompt();
      const aiConfig = await generateFighter(aiPrompt);
      setP2Config(aiConfig);
      setScreen('vsScreen');
    } else {
      setScreen('p2Prompt');
    }
  }, [mode]);

  const handleP2Ready = useCallback((config: FighterConfig) => {
    setP2Config(config);
    setScreen('vsScreen');
  }, []);

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

  const handleQuit = useCallback(() => {
    setPaused(false);
    setScreen('modeSelect');
    setP1Config(null);
    setP2Config(null);
    setWinner(null);
    setP1Hp(100);
    setP2Hp(100);
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
      });
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

  const handlePlayAgain = useCallback(() => {
    setScreen('modeSelect');
    setP1Config(null);
    setP2Config(null);
    setWinner(null);
    setP1Hp(100);
    setP2Hp(100);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0a0a1a',
      position: 'relative',
    }}>
      {/* PixiJS canvas container */}
      <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* UI Overlays */}
      {screen === 'modeSelect' && (
        <ModeSelect onSelect={handleModeSelect} />
      )}

      {screen === 'p1Prompt' && (
        <PromptInput
          playerNumber={1}
          onFighterReady={handleP1Ready}
          onBack={() => setScreen('modeSelect')}
        />
      )}

      {screen === 'p2Prompt' && (
        <PromptInput
          playerNumber={2}
          onFighterReady={handleP2Ready}
          onBack={() => setScreen('p1Prompt')}
        />
      )}

      {screen === 'vsScreen' && p1Config && p2Config && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 100%)',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{
              color: p1Config.color_palette.primary,
              fontSize: '36px',
              fontWeight: 900,
              textTransform: 'uppercase',
            }}>
              {p1Config.name}
            </span>
            <span style={{
              color: '#444',
              fontSize: '48px',
              fontWeight: 900,
              margin: '0 32px',
            }}>
              VS
            </span>
            <span style={{
              color: p2Config.color_palette.primary,
              fontSize: '36px',
              fontWeight: 900,
              textTransform: 'uppercase',
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
          {!paused && (
            <div style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '12px',
              zIndex: 6,
              userSelect: 'none',
            }}>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleAttackButton('lightAttack'); }}
                style={{
                  padding: '16px 28px',
                  fontSize: '16px',
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, rgba(68,136,255,0.9), rgba(34,68,170,0.9))',
                  color: '#fff',
                  border: '2px solid rgba(100,160,255,0.6)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 4px 15px rgba(68,136,255,0.3)',
                }}
              >
                Attack
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleAttackButton('heavyAttack'); }}
                style={{
                  padding: '16px 28px',
                  fontSize: '16px',
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, rgba(255,136,0,0.9), rgba(200,80,0,0.9))',
                  color: '#fff',
                  border: '2px solid rgba(255,170,50,0.6)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 4px 15px rgba(255,136,0,0.3)',
                }}
              >
                Heavy
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleAttackButton('special'); }}
                style={{
                  padding: '16px 28px',
                  fontSize: '16px',
                  fontWeight: 800,
                  background: p1SpecialCd > 0
                    ? 'linear-gradient(180deg, rgba(80,80,80,0.7), rgba(50,50,50,0.7))'
                    : `linear-gradient(180deg, ${p1Config.color_palette.accent}ee, ${p1Config.color_palette.primary}ee)`,
                  color: p1SpecialCd > 0 ? '#666' : '#fff',
                  border: p1SpecialCd > 0
                    ? '2px solid rgba(100,100,100,0.4)'
                    : `2px solid ${p1Config.color_palette.accent}88`,
                  borderRadius: '12px',
                  cursor: p1SpecialCd > 0 ? 'default' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: p1SpecialCd > 0 ? 'none' : `0 4px 15px ${p1Config.color_palette.accent}44`,
                  transition: 'all 0.2s',
                }}
              >
                Special
              </button>
            </div>
          )}

          {paused && (
            <PauseMenu
              p1Config={p1Config}
              p2Config={p2Config}
              onResume={handleResume}
              onQuit={handleQuit}
            />
          )}
        </>
      )}

      {screen === 'victory' && winner && (
        <VictoryScreen winner={winner} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
