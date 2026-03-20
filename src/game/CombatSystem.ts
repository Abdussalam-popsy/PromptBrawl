import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { Fighter } from './Fighter';
import { type InputState } from './Controls';
import { type MoveDefinition, PROJECTILE_COLORS } from '../ai/moveLibrary';

interface Projectile {
  graphic: Graphics;
  x: number;
  y: number;
  vx: number;
  damage: number;
  owner: Fighter;
  active: boolean;
}

interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  life: number;
}

export class CombatSystem {
  private stageContainer: Container;
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private particleContainer: Container;
  private projectileContainer: Container;

  onHit?: (attacker: Fighter, defender: Fighter, damage: number, isHeavy: boolean) => void;

  constructor(stageContainer: Container) {
    this.stageContainer = stageContainer;
    this.projectileContainer = new Container();
    this.particleContainer = new Container();
    stageContainer.addChild(this.projectileContainer);
    stageContainer.addChild(this.particleContainer);
  }

  applyInput(fighter: Fighter, input: InputState, opponent: Fighter): void {
    if (fighter.state === 'dead' || fighter.state === 'hurt') return;

    // Movement
    if (input.left && fighter.state !== 'attacking') {
      fighter.vx = -fighter.speed;
      fighter.state = 'walking';
    } else if (input.right && fighter.state !== 'attacking') {
      fighter.vx = fighter.speed;
      fighter.state = 'walking';
    } else if (fighter.state !== 'attacking') {
      fighter.vx *= 0.7; // friction
      if (Math.abs(fighter.vx) < 0.1) fighter.vx = 0;
      if (fighter.state === 'walking') fighter.state = 'idle';
    }

    // Face opponent
    if (fighter.state !== 'attacking') {
      fighter.facing = opponent.x > fighter.x ? 1 : -1;
      fighter.container.scale.x = fighter.facing;
    }

    // Jump
    if (input.jump && fighter.grounded) {
      fighter.vy = -12;
      fighter.grounded = false;
      fighter.state = 'jumping';
    }

    // Attacks
    if (input.lightAttack) {
      this.tryAttack(fighter, opponent, 'light');
    }
    if (input.heavyAttack) {
      this.tryAttack(fighter, opponent, 'heavy');
    }
    if (input.special) {
      this.tryAttack(fighter, opponent, 'special');
    }
  }

  private tryAttack(attacker: Fighter, defender: Fighter, type: 'light' | 'heavy' | 'special'): void {
    const moveDef = attacker.startAttack(type);
    if (!moveDef) return;

    // Handle special cases that don't need to hit
    if (moveDef.name === 'Bubble Shield' || moveDef.name === 'Heal Pulse') {
      return;
    }

    // Teleport strike: move to opponent
    if (attacker.config.move_loadout.special === 'teleport_strike' && type === 'special') {
      const targetX = defender.x + (attacker.facing === 1 ? -60 : 60);
      attacker.x = targetX;
      attacker.container.x = targetX;
    }

    // Dash strike: lunge forward
    if (attacker.config.move_loadout.special === 'dash_strike' && type === 'special') {
      attacker.vx = attacker.facing * 20;
    }

    // Schedule hit check after startup
    setTimeout(() => {
      if (attacker.state === 'dead') return;

      if (moveDef.isProjectile) {
        this.spawnProjectile(attacker, defender, moveDef);
      } else {
        this.checkMeleeHit(attacker, defender, moveDef);
      }
    }, moveDef.startup);
  }

  private checkMeleeHit(attacker: Fighter, defender: Fighter, moveDef: MoveDefinition): void {
    const dist = Math.abs(attacker.x - defender.x);
    if (dist <= moveDef.range + defender.hitboxWidth / 2) {
      this.dealDamage(attacker, defender, moveDef);
    }
  }

  private dealDamage(attacker: Fighter, defender: Fighter, moveDef: MoveDefinition): void {
    let rawDamage = Math.max(1, Math.round(attacker.damage * moveDef.multiplier) - defender.defense);

    // Chaos critical hit
    if (Math.random() < attacker.chaosChance) {
      rawDamage = Math.round(rawDamage * 1.5);
      this.spawnParticles(defender.x, defender.y - 30, 0xffff00, 12); // golden crit particles
    }

    const knockbackDir = attacker.x < defender.x ? 1 : -1;
    defender.takeDamage(rawDamage, knockbackDir, moveDef.knockback);

    const isHeavy = moveDef.type === 'heavy' || moveDef.type === 'special';
    this.onHit?.(attacker, defender, rawDamage, isHeavy);

    // Hit flash — briefly tint white then restore
    defender.container.tint = 0xffffff;
    gsap.delayedCall(0.1, () => {
      if (defender.container) {
        defender.container.tint = 0xff4444;
        gsap.delayedCall(0.1, () => {
          if (defender.container) defender.container.tint = 0xffffff;
        });
      }
    });

    // Impact particles
    const hitColor = parseInt(attacker.config.color_palette.accent.replace('#', ''), 16);
    this.spawnParticles(defender.x, defender.y - 30, hitColor, isHeavy ? 10 : 6);

    // Screen shake on heavy
    if (isHeavy) {
      this.screenShake();
    }
  }

  private spawnProjectile(attacker: Fighter, _defender: Fighter, moveDef: MoveDefinition): void {
    const color = PROJECTILE_COLORS[attacker.config.move_loadout.projectile_sprite] ?? 0xffffff;
    const graphic = new Graphics();
    graphic.circle(0, 0, 8);
    graphic.fill(color);
    // Glow effect
    graphic.circle(0, 0, 12);
    graphic.fill({ color, alpha: 0.3 });

    const startX = attacker.x + attacker.facing * 40;
    const startY = attacker.y - 30;
    graphic.x = startX;
    graphic.y = startY;

    this.projectileContainer.addChild(graphic);

    this.projectiles.push({
      graphic,
      x: startX,
      y: startY,
      vx: attacker.facing * (moveDef.projectileSpeed ?? 6),
      damage: Math.max(1, Math.round(attacker.damage * moveDef.multiplier) - 2),
      owner: attacker,
      active: true,
    });
  }

  private spawnParticles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const graphic = new Graphics();
      const size = 2 + Math.random() * 4;
      graphic.circle(0, 0, size);
      graphic.fill(color);
      graphic.x = x;
      graphic.y = y;
      this.particleContainer.addChild(graphic);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;

      this.particles.push({
        graphic,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1.0,
      });
    }
  }

  private screenShake(): void {
    const orig = { x: this.stageContainer.x, y: this.stageContainer.y };
    gsap.to(this.stageContainer, {
      x: orig.x + 8,
      y: orig.y + 4,
      duration: 0.03,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.stageContainer.x = orig.x;
        this.stageContainer.y = orig.y;
      },
    });
  }

  updateProjectiles(dt: number, fighters: Fighter[], arenaWidth: number): void {
    for (const proj of this.projectiles) {
      if (!proj.active) continue;

      proj.x += proj.vx * dt;
      proj.graphic.x = proj.x;

      // Off-screen check
      if (proj.x < -50 || proj.x > arenaWidth + 50) {
        proj.active = false;
        this.projectileContainer.removeChild(proj.graphic);
        proj.graphic.destroy();
        continue;
      }

      // Hit check against fighters that aren't the owner
      for (const fighter of fighters) {
        if (fighter === proj.owner || fighter.state === 'dead') continue;
        const dist = Math.abs(proj.x - fighter.x);
        const yDist = Math.abs(proj.y - (fighter.y - 30));
        if (dist < fighter.hitboxWidth && yDist < 40) {
          const knockDir = proj.vx > 0 ? 1 : -1;
          fighter.takeDamage(proj.damage, knockDir, 5);
          this.onHit?.(proj.owner, fighter, proj.damage, true);

          const hitColor = parseInt(proj.owner.config.color_palette.accent.replace('#', ''), 16);
          this.spawnParticles(fighter.x, fighter.y - 30, hitColor, 8);
          this.screenShake();

          proj.active = false;
          this.projectileContainer.removeChild(proj.graphic);
          proj.graphic.destroy();
          break;
        }
      }
    }

    // Clean up inactive
    this.projectiles = this.projectiles.filter(p => p.active);
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.graphic.x += p.vx * dt;
      p.graphic.y += p.vy * dt;
      p.vy += 0.2 * dt;
      p.life -= 0.03 * dt;
      p.graphic.alpha = Math.max(0, p.life);

      if (p.life <= 0) {
        this.particleContainer.removeChild(p.graphic);
        p.graphic.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  cleanup(): void {
    for (const proj of this.projectiles) {
      this.projectileContainer.removeChild(proj.graphic);
      proj.graphic.destroy();
    }
    this.projectiles = [];

    for (const p of this.particles) {
      this.particleContainer.removeChild(p.graphic);
      p.graphic.destroy();
    }
    this.particles = [];
  }
}
