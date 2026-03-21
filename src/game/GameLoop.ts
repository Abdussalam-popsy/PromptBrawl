import { Application, Container } from 'pixi.js';
import { Arena } from './Arena';
import { Fighter } from './Fighter';
import { CombatSystem } from './CombatSystem';
import { Controls } from './Controls';
import { AIOpponent } from './AIOpponent';
import { type FighterConfig } from '../ai/fighterConfig';
import { type MultiplayerSession } from '../network/multiplayer';
import { SYNC_RATE_MS, type StateMessage, type ActionMessage } from '../network/syncProtocol';

export type GameMode = 'vsAI' | 'vsOnline';

export interface GameCallbacks {
  onHealthChange: (p1Hp: number, p2Hp: number) => void;
  onSpecialCooldown: (p1Cd: number, p2Cd: number) => void;
  onGameOver: (winner: FighterConfig) => void;
  onPeerDisconnected?: () => void;
}

export class GameLoop {
  private app: Application;
  private arena: Arena;
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
  private paused: boolean = false;
  private callbacks: GameCallbacks;
  private gameContainer: Container;
  private syncTimer: number = 0;
  private resizeHandler: (() => void) | null = null;

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

    // Arena — use window dimensions directly since resizeTo may not have fired yet
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.arena = new Arena(w, h);
    this.gameContainer.addChild(this.arena.container);

    // Fighters — p1 is always left, p2 is always right
    this.p1 = new Fighter(p1Config, this.arena.p1SpawnX, this.arena.groundY, 1);
    this.p2 = new Fighter(p2Config, this.arena.p2SpawnX, this.arena.groundY, -1);
    this.gameContainer.addChild(this.p1.container);
    this.gameContainer.addChild(this.p2.container);

    // In online mode: host controls p1 (left), guest controls p2 (right)
    this.local = isHost ? this.p1 : this.p2;
    this.remote = isHost ? this.p2 : this.p1;

    // Combat system
    this.combat = new CombatSystem(this.gameContainer);
    this.combat.onHit = (_attacker, defender, _damage, _isHeavy) => {
      this.callbacks.onHealthChange(this.p1.hp, this.p2.hp);
      if (defender === this.p2 && this.ai) {
        this.ai.onDamageTaken();
      }
    };

    // Controls
    this.controls = new Controls();

    // AI
    this.ai = mode === 'vsAI' ? new AIOpponent() : null;

    // Multiplayer
    if (mode === 'vsOnline' && multiplayer) {
      this.multiplayer = multiplayer;
      this.setupMultiplayer();
    }

    // Resize handler — use renderer size (which tracks the container via resizeTo)
    this.resizeHandler = () => {
      // PixiJS resizeTo handles renderer resize automatically;
      // we just need to update the arena to match
      const newW = this.app.renderer.width;
      const newH = this.app.renderer.height;
      if (newW !== this.arena.width || newH !== this.arena.height) {
        this.arena.resize(newW, newH);
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

    // When we receive remote state, apply it to the remote fighter
    this.multiplayer.onState = (state: StateMessage) => {
      this.remote.setRemoteState(state);
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

  private update = (): void => {
    if (this.gameOver || this.paused) return;

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
          x: this.local.x,
          y: this.local.y,
          vx: this.local.vx,
          vy: this.local.vy,
          facing: this.local.facing,
          state: this.local.state,
          hp: this.local.hp,
          specialCooldown: this.local.specialCooldown,
          shieldActive: this.local.shieldActive,
        });
      }
    }

    // Cooldown updates
    this.callbacks.onSpecialCooldown(this.p1.specialCooldown, this.p2.specialCooldown);

    // Check game over
    if (this.p1.state === 'dead') {
      this.gameOver = true;
      this.callbacks.onGameOver(this.p2.config);
    } else if (this.p2.state === 'dead') {
      this.gameOver = true;
      this.callbacks.onGameOver(this.p1.config);
    }
  };

  destroy(): void {
    this.app.ticker.remove(this.update);
    this.controls.destroy();
    this.combat.cleanup();
    this.gameContainer.destroy({ children: true });
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }
}
