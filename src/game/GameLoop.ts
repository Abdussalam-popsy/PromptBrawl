import { Application, Container } from 'pixi.js';
import { Arena } from './Arena';
import { Fighter } from './Fighter';
import { CombatSystem } from './CombatSystem';
import { Controls } from './Controls';
import { AIOpponent } from './AIOpponent';
import { type FighterConfig } from '../ai/fighterConfig';
import { type MultiplayerSession } from '../network/multiplayer';
import { SYNC_RATE_MS, type StateMessage, type ActionMessage } from '../network/syncProtocol';

export type GameMode = 'vsAI' | 'vsPlayer' | 'vsOnline';

export interface GameCallbacks {
  onHealthChange: (p1Hp: number, p2Hp: number) => void;
  onSpecialCooldown: (p1Cd: number, p2Cd: number) => void;
  onGameOver: (winner: FighterConfig) => void;
}

export class GameLoop {
  private app: Application;
  private arena: Arena;
  private p1: Fighter;
  private p2: Fighter;
  private combat: CombatSystem;
  private controls: Controls;
  private ai: AIOpponent | null;
  private multiplayer: MultiplayerSession | null = null;
  private gameOver: boolean = false;
  private paused: boolean = false;
  private callbacks: GameCallbacks;
  private gameContainer: Container;
  private syncTimer: number = 0;

  constructor(
    app: Application,
    p1Config: FighterConfig,
    p2Config: FighterConfig,
    mode: GameMode,
    callbacks: GameCallbacks,
    multiplayer?: MultiplayerSession,
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

    // Fighters
    this.p1 = new Fighter(p1Config, this.arena.p1SpawnX, this.arena.groundY, 1);
    this.p2 = new Fighter(p2Config, this.arena.p2SpawnX, this.arena.groundY, -1);
    this.gameContainer.addChild(this.p1.container);
    this.gameContainer.addChild(this.p2.container);

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

    // Start game loop
    this.app.ticker.add(this.update);

    // Initial health
    this.callbacks.onHealthChange(100, 100);
  }

  private setupMultiplayer(): void {
    if (!this.multiplayer) return;

    // When we receive remote state, apply it to P2
    this.multiplayer.onState = (state: StateMessage) => {
      this.p2.setRemoteState(state);
      this.callbacks.onHealthChange(this.p1.hp, this.p2.hp);
    };

    // When we receive remote attack, trigger it on P2
    this.multiplayer.onAction = (action: ActionMessage) => {
      this.combat.applyInput(this.p2, {
        left: false, right: false, jump: false,
        lightAttack: action.attack === 'light',
        heavyAttack: action.attack === 'heavy',
        special: action.attack === 'special',
      }, this.p1);
    };

    this.multiplayer.onPeerLeft = () => {
      // Opponent disconnected — they forfeit
      if (!this.gameOver) {
        this.gameOver = true;
        this.callbacks.onGameOver(this.p1.config);
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

  triggerButton(action: 'lightAttack' | 'heavyAttack' | 'special'): void {
    this.controls.triggerButton(action);
  }

  private update = (): void => {
    if (this.gameOver || this.paused) return;

    const dt = this.app.ticker.deltaTime;

    // Get inputs
    const p1Input = this.controls.getP1Input();

    // Apply P1 input (always local)
    this.combat.applyInput(this.p1, p1Input, this.p2);

    // Send attack actions over multiplayer
    if (this.multiplayer) {
      if (p1Input.lightAttack) this.multiplayer.sendAction('light');
      if (p1Input.heavyAttack) this.multiplayer.sendAction('heavy');
      if (p1Input.special) this.multiplayer.sendAction('special');
    }

    // P2 input: AI mode uses AI, online mode uses remote state (applied via callback), local mode uses empty
    if (this.ai) {
      const p2Input = this.ai.getInput(this.p2, this.p1);
      this.combat.applyInput(this.p2, p2Input, this.p1);
    } else if (!this.multiplayer) {
      // Local vsPlayer — no input for P2 (on-screen buttons not supported for P2)
      const emptyInput = { left: false, right: false, jump: false, lightAttack: false, heavyAttack: false, special: false };
      this.combat.applyInput(this.p2, emptyInput, this.p1);
    }
    // vsOnline: P2 input is handled via multiplayer.onAction callback

    // Clear single-frame inputs
    this.controls.clearJustPressed();

    // Update fighters
    this.p1.update(dt, this.arena.groundY, this.arena.width);
    this.p2.update(dt, this.arena.groundY, this.arena.width);

    // Update projectiles & particles
    this.combat.updateProjectiles(dt, [this.p1, this.p2], this.arena.width);
    this.combat.updateParticles(dt);

    // Broadcast local state to remote peer at SYNC_RATE
    if (this.multiplayer) {
      this.syncTimer += dt * 16.67;
      if (this.syncTimer >= SYNC_RATE_MS) {
        this.syncTimer = 0;
        this.multiplayer.sendState({
          x: this.p1.x,
          y: this.p1.y,
          vx: this.p1.vx,
          vy: this.p1.vy,
          facing: this.p1.facing,
          state: this.p1.state,
          hp: this.p1.hp,
          specialCooldown: this.p1.specialCooldown,
          shieldActive: this.p1.shieldActive,
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
  }
}
