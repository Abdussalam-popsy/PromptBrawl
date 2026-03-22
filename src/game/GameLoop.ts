import { Application, Container } from 'pixi.js';
import { Arena } from './Arena';
import { ArenaBackground } from './ArenaBackground';
import { Fighter } from './Fighter';
import { CombatSystem } from './CombatSystem';
import { Controls } from './Controls';
import { AIOpponent } from './AIOpponent';
import { type FighterConfig } from '../ai/fighterConfig';
import { type MultiplayerSession } from '../network/multiplayer';
import { SYNC_RATE_MS, type StateMessage, type ActionMessage } from '../network/syncProtocol';
import { commentary } from './CommentarySystem';

export type GameMode = 'vsAI' | 'vsOnline';

export interface GameCallbacks {
  onHealthChange: (p1Hp: number, p2Hp: number) => void;
  onSpecialCooldown: (p1Cd: number, p2Cd: number) => void;
  onTimeUpdate?: (secondsLeft: number) => void;
  onGameOver: (winner: FighterConfig) => void;
  onPeerDisconnected?: () => void;
}

export class GameLoop {
  private app: Application;
  private arena: Arena;
  private arenaBg: ArenaBackground;
  private p1: Fighter;
  private p2: Fighter;
  // In online mode, local/remote point to which fighter this client controls
  private local: Fighter;
  private remote: Fighter;
  private combat: CombatSystem;
  controls: Controls;
  private ai: AIOpponent | null;
  private multiplayer: MultiplayerSession | null = null;
  private gameOver: boolean = false;
  private destroyed: boolean = false;
  private paused: boolean = false;
  private countdownActive: boolean = true;
  private callbacks: GameCallbacks;
  private gameContainer: Container;
  private syncTimer: number = 0;
  private resizeHandler: (() => void) | null = null;
  private readonly roundTime: number = 60;
  private timeElapsed: number = 0;
  private lastDisplayedSecond: number = 60;

  constructor(
    app: Application,
    p1Config: FighterConfig,
    p2Config: FighterConfig,
    mode: GameMode,
    callbacks: GameCallbacks,
    multiplayer?: MultiplayerSession,
    isHost: boolean = true,
  ) {
    this.app = app;
    this.callbacks = callbacks;

    // Game container (for screen shake)
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    // Arena — use the actual renderer dimensions (set by resizeTo: window)
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    this.arena = new Arena(w, h);

    // Dynamic background — use p1's background config (from AI generation)
    this.arenaBg = new ArenaBackground(p1Config.background, w, h, this.arena.groundY);
    this.gameContainer.addChild(this.arenaBg.container);

    // Skip Arena's built-in sky when we have a dynamic background
    if (p1Config.background) {
      this.arena.skipSky = true;
    }
    this.gameContainer.addChild(this.arena.container);

    // Fighters — p1 is always left, p2 is always right
    this.p1 = new Fighter(p1Config, this.arena.p1SpawnX, this.arena.groundY, 1, w, h);
    this.p2 = new Fighter(p2Config, this.arena.p2SpawnX, this.arena.groundY, -1, w, h);
    this.gameContainer.addChild(this.p1.container);
    this.gameContainer.addChild(this.p2.container);

    // In online mode: host controls p1 (left), guest controls p2 (right)
    this.local = isHost ? this.p1 : this.p2;
    this.remote = isHost ? this.p2 : this.p1;

    // Combat system
    this.combat = new CombatSystem(this.gameContainer);
    this.combat.onHit = (attacker, defender, _damage, _isHeavy) => {
      this.callbacks.onHealthChange(this.p1.hp, this.p2.hp);
      if (defender === this.p2 && this.ai) {
        this.ai.onDamageTaken();
      }
      // Commentary: low health warning
      if (defender.hp > 0 && defender.hp <= 25) {
        commentary.play(defender.config.name, 'low_health');
      }
      // Commentary: special move
      if (attacker.state === 'attacking' && attacker.specialCooldown > 0) {
        commentary.play(attacker.config.name, 'special');
      }
    };

    // Load commentary audio (non-blocking — never delays game start)
    commentary.reset();
    const p1Commentary = (p1Config as unknown as Record<string, unknown>).commentary as Record<string, string> | null | undefined;
    const p2Commentary = (p2Config as unknown as Record<string, unknown>).commentary as Record<string, string> | null | undefined;
    commentary.loadFromConfig(p1Config.name, p1Commentary).catch(() => {});
    commentary.loadFromConfig(p2Config.name, p2Commentary).catch(() => {});

    // Controls
    this.controls = new Controls();

    // AI
    this.ai = mode === 'vsAI' ? new AIOpponent() : null;

    // Multiplayer
    if (mode === 'vsOnline' && multiplayer) {
      this.multiplayer = multiplayer;
      this.setupMultiplayer();
    }

    // Resize handler — update arena AND reposition fighters
    this.resizeHandler = () => {
      const newW = this.app.renderer.width;
      const newH = this.app.renderer.height;
      if (newW !== this.arena.width || newH !== this.arena.height) {
        const oldW = this.arena.width;
        this.arena.resize(newW, newH);
        this.arenaBg.resize(newW, newH, this.arena.groundY);

        // Reposition fighters proportionally to new arena size
        this.p1.x = (this.p1.x / oldW) * newW;
        this.p1.y = Math.min(this.p1.y, this.arena.groundY);
        if (this.p1.grounded) this.p1.y = this.arena.groundY;

        this.p2.x = (this.p2.x / oldW) * newW;
        this.p2.y = Math.min(this.p2.y, this.arena.groundY);
        if (this.p2.grounded) this.p2.y = this.arena.groundY;
      }
    };
    window.addEventListener('resize', this.resizeHandler);

    // Start game loop
    this.app.ticker.add(this.update);

    // Initial health
    this.callbacks.onHealthChange(100, 100);
  }

  private setupMultiplayer(): void {
    if (!this.multiplayer) return;

    // When we receive remote state, denormalize positions and apply to remote fighter
    this.multiplayer.onState = (state: StateMessage) => {
      this.remote.setRemoteState({
        ...state,
        x: state.x * this.arena.width,
        y: state.y * this.arena.height,
        vx: state.vx * this.arena.width,
        vy: state.vy * this.arena.height,
      });
      this.callbacks.onHealthChange(this.p1.hp, this.p2.hp);
    };

    // When we receive remote attack, trigger it on the remote fighter
    this.multiplayer.onAction = (action: ActionMessage) => {
      this.combat.applyInput(this.remote, {
        left: false, right: false, jump: false,
        lightAttack: action.attack === 'light',
        heavyAttack: action.attack === 'heavy',
        special: action.attack === 'special',
      }, this.local);
    };

    this.multiplayer.onPeerLeft = () => {
      if (!this.gameOver) {
        this.gameOver = true;
        this.callbacks.onPeerDisconnected?.();
      }
    };
  }

  pause(): void {
    this.paused = true;
    this.app.ticker.stop();
  }

  resume(): void {
    this.paused = false;
    this.app.ticker.start();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  triggerButton(action: 'lightAttack' | 'heavyAttack' | 'special' | 'jump'): void {
    this.controls.triggerButton(action);
  }

  startFight(): void {
    this.countdownActive = false;
    // Play intro commentary AFTER countdown ends
    commentary.playDelayed(this.p1.config.name, 'intro', 500);
    commentary.playDelayed(this.p2.config.name, 'intro', 2500);
  }

  private update = (): void => {
    if (this.destroyed || this.gameOver || this.paused || this.countdownActive) return;

    const dt = this.app.ticker.deltaTime;

    // Get inputs — always apply to the local fighter
    const localInput = this.controls.getP1Input();
    const opponent = this.local === this.p1 ? this.p2 : this.p1;
    this.combat.applyInput(this.local, localInput, opponent);

    // Send attack actions over multiplayer
    if (this.multiplayer) {
      if (localInput.lightAttack) this.multiplayer.sendAction('light');
      if (localInput.heavyAttack) this.multiplayer.sendAction('heavy');
      if (localInput.special) this.multiplayer.sendAction('special');
    }

    // AI controls p2 (only in vsAI mode where local=p1)
    if (this.ai) {
      const p2Input = this.ai.getInput(this.p2, this.p1);
      this.combat.applyInput(this.p2, p2Input, this.p1);
    }
    // vsOnline: remote fighter input is handled via multiplayer.onAction callback

    // Clear single-frame inputs
    this.controls.clearJustPressed();

    // Update fighters
    this.p1.update(dt, this.arena.groundY, this.arena.width);
    this.p2.update(dt, this.arena.groundY, this.arena.width);

    // Update projectiles & particles
    this.combat.updateProjectiles(dt, [this.p1, this.p2], this.arena.width);
    this.combat.updateParticles(dt);

    // Broadcast local fighter state to remote peer at SYNC_RATE
    if (this.multiplayer) {
      this.syncTimer += dt * 16.67;
      if (this.syncTimer >= SYNC_RATE_MS) {
        this.syncTimer = 0;
        this.multiplayer.sendState({
          x: this.local.x / this.arena.width,
          y: this.local.y / this.arena.height,
          vx: this.local.vx / this.arena.width,
          vy: this.local.vy / this.arena.height,
          facing: this.local.facing,
          state: this.local.state,
          hp: this.local.hp,
          specialCooldown: this.local.specialCooldown,
          shieldActive: this.local.shieldActive,
        });
      }
    }

    // Round timer
    this.timeElapsed += dt / 60;
    const remaining = Math.max(0, Math.ceil(this.roundTime - this.timeElapsed));
    if (remaining !== this.lastDisplayedSecond) {
      this.lastDisplayedSecond = remaining;
      this.callbacks.onTimeUpdate?.(remaining);
    }

    // Time's up — winner is whoever has more HP
    if (remaining <= 0) {
      this.gameOver = true;
      this.app.ticker.stop();
      const winner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
      commentary.playDelayed(winner.config.name, 'victory', 400);
      this.callbacks.onGameOver(winner.config);
      return;
    }

    // Cooldown updates
    this.callbacks.onSpecialCooldown(this.p1.specialCooldown, this.p2.specialCooldown);

    // Check game over — stop ticker IMMEDIATELY to prevent null refs
    // Delay onGameOver by 2600ms so blob death reveal (1900ms) completes with 700ms buffer
    if (this.p1.state === 'dead') {
      this.gameOver = true;
      this.app.ticker.stop();
      commentary.playDelayed(this.p2.config.name, 'victory', 400);
      setTimeout(() => {
        if (!this.destroyed) this.callbacks.onGameOver(this.p2.config);
      }, 2600);
    } else if (this.p2.state === 'dead') {
      this.gameOver = true;
      this.app.ticker.stop();
      commentary.playDelayed(this.p1.config.name, 'victory', 400);
      setTimeout(() => {
        if (!this.destroyed) this.callbacks.onGameOver(this.p1.config);
      }, 2600);
    }
  };

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.gameOver = true;

    // 1. Stop ticker FIRST — no more update calls
    this.app.ticker.stop();
    this.app.ticker.remove(this.update);

    // 2. Clean up event listeners
    this.controls.destroy();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // 3. Clean up game objects last
    this.combat.cleanup();
    commentary.destroy();
    this.gameContainer.destroy({ children: true });
  }
}
