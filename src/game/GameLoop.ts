import { Application, Container } from 'pixi.js';
import { Arena } from './Arena';
import { Fighter } from './Fighter';
import { CombatSystem } from './CombatSystem';
import { Controls } from './Controls';
import { AIOpponent } from './AIOpponent';
import { type FighterConfig } from '../ai/fighterConfig';

export type GameMode = 'vsAI' | 'vsPlayer';

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
  private gameOver: boolean = false;
  private paused: boolean = false;
  private callbacks: GameCallbacks;
  private gameContainer: Container;

  constructor(
    app: Application,
    p1Config: FighterConfig,
    p2Config: FighterConfig,
    mode: GameMode,
    callbacks: GameCallbacks,
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

    // Start game loop
    this.app.ticker.add(this.update);

    // Initial health
    this.callbacks.onHealthChange(100, 100);
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
    const p2Input = this.ai
      ? this.ai.getInput(this.p2, this.p1)
      : { left: false, right: false, jump: false, lightAttack: false, heavyAttack: false, special: false };

    // Apply inputs
    this.combat.applyInput(this.p1, p1Input, this.p2);
    this.combat.applyInput(this.p2, p2Input, this.p1);

    // Clear single-frame inputs
    this.controls.clearJustPressed();

    // Update fighters
    this.p1.update(dt, this.arena.groundY, this.arena.width);
    this.p2.update(dt, this.arena.groundY, this.arena.width);

    // Update projectiles & particles
    this.combat.updateProjectiles(dt, [this.p1, this.p2], this.arena.width);
    this.combat.updateParticles(dt);

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
