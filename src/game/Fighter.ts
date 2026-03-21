import { Container, Graphics } from 'pixi.js';
import { type FighterConfig, type EyeExpression } from '../ai/fighterConfig';
import { getMoveDef, type MoveDefinition } from '../ai/moveLibrary';

interface SizeParams {
  headRadius: number;
  bodyWidth: number;
  bodyHeight: number;
  armWidth: number;
  armHeight: number;
  legWidth: number;
  legHeight: number;
  weaponWidth: number;
  weaponHeight: number;
  scale: number;
}

const SIZE_PARAMS: Record<string, SizeParams> = {
  light: {
    headRadius: 16, bodyWidth: 24, bodyHeight: 30,
    armWidth: 8, armHeight: 24, legWidth: 9, legHeight: 28,
    weaponWidth: 6, weaponHeight: 30, scale: 1.0,
  },
  medium: {
    headRadius: 20, bodyWidth: 30, bodyHeight: 34,
    armWidth: 10, armHeight: 26, legWidth: 11, legHeight: 26,
    weaponWidth: 8, weaponHeight: 32, scale: 1.0,
  },
  heavy: {
    headRadius: 24, bodyWidth: 40, bodyHeight: 32,
    armWidth: 14, armHeight: 28, legWidth: 14, legHeight: 22,
    weaponWidth: 10, weaponHeight: 36, scale: 1.0,
  },
};

export type FighterState = 'idle' | 'walking' | 'jumping' | 'attacking' | 'hurt' | 'dead' | 'blocking';

export class Fighter {
  container: Container;
  config: FighterConfig;
  facing: 1 | -1; // 1 = right, -1 = left

  // Physics
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  grounded: boolean = true;

  // Combat
  hp: number = 100;
  maxHp: number = 100;
  state: FighterState = 'idle';
  attackTimer: number = 0;
  hurtTimer: number = 0;
  specialCooldown: number = 0;
  shieldActive: boolean = false;
  shieldTimer: number = 0;

  // Drawing parts
  private head: Graphics;
  private body: Graphics;
  private leftArm: Graphics;
  private rightArm: Graphics;
  private leftLeg: Graphics;
  private rightLeg: Graphics;
  private weapon: Graphics;
  private leftEye: Graphics;
  private rightEye: Graphics;
  private sizeParams: SizeParams;

  // Animation
  private animFrame: number = 0;
  private currentExpression: EyeExpression;

  constructor(config: FighterConfig, startX: number, startY: number, facing: 1 | -1) {
    this.config = config;
    this.x = startX;
    this.y = startY;
    this.facing = facing;
    this.currentExpression = config.eye_expression;
    this.sizeParams = SIZE_PARAMS[config.size_variant] ?? SIZE_PARAMS.medium;

    this.container = new Container();
    this.container.x = startX;
    this.container.y = startY;

    // Create graphics parts
    this.leftLeg = new Graphics();
    this.rightLeg = new Graphics();
    this.body = new Graphics();
    this.leftArm = new Graphics();
    this.rightArm = new Graphics();
    this.head = new Graphics();
    this.weapon = new Graphics();
    this.leftEye = new Graphics();
    this.rightEye = new Graphics();

    // Add in z-order (back to front)
    this.container.addChild(this.leftLeg);
    this.container.addChild(this.rightLeg);
    this.container.addChild(this.leftArm);
    this.container.addChild(this.body);
    this.container.addChild(this.rightArm);
    this.container.addChild(this.weapon);
    this.container.addChild(this.head);
    this.container.addChild(this.leftEye);
    this.container.addChild(this.rightEye);

    this.draw();
  }

  private hexToNum(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  draw(): void {
    const s = this.sizeParams;
    const primary = this.hexToNum(this.config.color_palette.primary);
    const secondary = this.hexToNum(this.config.color_palette.secondary);
    const accent = this.hexToNum(this.config.color_palette.accent);

    // Clear all
    this.head.clear();
    this.body.clear();
    this.leftArm.clear();
    this.rightArm.clear();
    this.leftLeg.clear();
    this.rightLeg.clear();
    this.weapon.clear();
    this.leftEye.clear();
    this.rightEye.clear();

    // Body
    this.body.roundRect(-s.bodyWidth / 2, -s.bodyHeight, s.bodyWidth, s.bodyHeight, 6);
    this.body.fill(primary);

    // Head
    this.head.circle(0, -s.bodyHeight - s.headRadius, s.headRadius);
    this.head.fill(secondary);

    // Eyes
    this.drawEyes(s, accent);

    // Left Arm
    const armOffsetX = s.bodyWidth / 2 + 2;
    this.leftArm.roundRect(-armOffsetX - s.armWidth, -s.bodyHeight + 2, s.armWidth, s.armHeight, 3);
    this.leftArm.fill(primary);

    // Right Arm
    this.rightArm.roundRect(armOffsetX, -s.bodyHeight + 2, s.armWidth, s.armHeight, 3);
    this.rightArm.fill(primary);

    // Weapon (on the leading hand)
    const weaponX = this.facing === 1
      ? armOffsetX + s.armWidth / 2 - s.weaponWidth / 2
      : -armOffsetX - s.armWidth / 2 - s.weaponWidth / 2;
    this.weapon.roundRect(weaponX, -s.bodyHeight - 5, s.weaponWidth, s.weaponHeight, 2);
    this.weapon.fill(accent);

    // Left Leg
    this.leftLeg.roundRect(-s.bodyWidth / 3 - s.legWidth / 2, 0, s.legWidth, s.legHeight, 3);
    this.leftLeg.fill(primary);

    // Right Leg
    this.rightLeg.roundRect(s.bodyWidth / 3 - s.legWidth / 2, 0, s.legWidth, s.legHeight, 3);
    this.rightLeg.fill(primary);

    // Scale facing
    this.container.scale.x = this.facing;
  }

  private drawEyes(s: SizeParams, accent: number): void {
    this.leftEye.clear();
    this.rightEye.clear();

    const eyeY = -s.bodyHeight - s.headRadius;
    const eyeSpacing = s.headRadius * 0.35;
    const eyeSize = s.headRadius * 0.18;

    switch (this.currentExpression) {
      case 'angry':
        // Angry slanted eyes
        this.leftEye.circle(-eyeSpacing, eyeY - 1, eyeSize);
        this.leftEye.fill(accent);
        this.rightEye.circle(eyeSpacing, eyeY + 1, eyeSize);
        this.rightEye.fill(accent);
        break;
      case 'greedy':
        // Dollar sign eyes (wider)
        this.leftEye.circle(-eyeSpacing, eyeY, eyeSize * 1.3);
        this.leftEye.fill(0xffd700);
        this.rightEye.circle(eyeSpacing, eyeY, eyeSize * 1.3);
        this.rightEye.fill(0xffd700);
        break;
      case 'scared':
        // Wide eyes
        this.leftEye.circle(-eyeSpacing, eyeY - 2, eyeSize * 1.5);
        this.leftEye.fill(accent);
        this.rightEye.circle(eyeSpacing, eyeY - 2, eyeSize * 1.5);
        this.rightEye.fill(accent);
        break;
      case 'unhinged':
        // Asymmetric eyes
        this.leftEye.circle(-eyeSpacing, eyeY, eyeSize * 1.6);
        this.leftEye.fill(accent);
        this.rightEye.circle(eyeSpacing, eyeY + 2, eyeSize * 0.8);
        this.rightEye.fill(accent);
        break;
      default: // neutral
        this.leftEye.circle(-eyeSpacing, eyeY, eyeSize);
        this.leftEye.fill(accent);
        this.rightEye.circle(eyeSpacing, eyeY, eyeSize);
        this.rightEye.fill(accent);
    }
  }

  setExpression(expr: EyeExpression): void {
    this.currentExpression = expr;
    const s = this.sizeParams;
    const accent = this.hexToNum(this.config.color_palette.accent);
    this.drawEyes(s, accent);
  }

  getMoveDef(type: 'light' | 'heavy' | 'special'): MoveDefinition {
    const loadout = this.config.move_loadout;
    switch (type) {
      case 'light': return getMoveDef('light', loadout.light_attack);
      case 'heavy': return getMoveDef('heavy', loadout.heavy_attack);
      case 'special': return getMoveDef('special', loadout.special);
    }
  }

  get speed(): number {
    return 2 + this.config.stats.speed * 0.5;
  }

  get damage(): number {
    return this.config.stats.damage;
  }

  get defense(): number {
    return this.config.stats.defense;
  }

  get chaosChance(): number {
    return this.config.stats.chaos * 0.04; // max ~40% at chaos 10
  }

  get hitboxWidth(): number {
    return this.sizeParams.bodyWidth + 10;
  }

  update(dt: number, groundY: number, arenaWidth: number): void {
    this.animFrame += dt;

    // Timers
    if (this.attackTimer > 0) this.attackTimer -= dt * 16.67;
    if (this.hurtTimer > 0) this.hurtTimer -= dt * 16.67;
    if (this.specialCooldown > 0) this.specialCooldown -= dt * 16.67;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt * 16.67;
      if (this.shieldTimer <= 0) this.shieldActive = false;
    }

    // State recovery
    if (this.state === 'attacking' && this.attackTimer <= 0) {
      this.state = 'idle';
    }
    if (this.state === 'hurt' && this.hurtTimer <= 0) {
      this.state = 'idle';
    }

    // Gravity
    if (!this.grounded) {
      this.vy += 0.6 * dt;
    }

    // Apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ground collision
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.grounded = true;
    }

    // Arena bounds
    const halfW = this.sizeParams.bodyWidth / 2 + 10;
    if (this.x < halfW) this.x = halfW;
    if (this.x > arenaWidth - halfW) this.x = arenaWidth - halfW;

    // Update container position
    this.container.x = this.x;
    this.container.y = this.y;

    // Idle bob animation
    if (this.state === 'idle' || this.state === 'walking') {
      const bob = Math.sin(this.animFrame * 0.05) * 2;
      this.body.y = bob;
      this.head.y = bob;
      this.leftEye.y = bob;
      this.rightEye.y = bob;
      this.weapon.y = bob;
      this.leftArm.y = bob * 0.5;
      this.rightArm.y = bob * 0.5;
    }

    // Attack animation (arm swing)
    if (this.state === 'attacking') {
      const swing = -20;
      this.rightArm.y = swing;
      this.weapon.y = swing;
    }
  }

  canAttack(): boolean {
    return this.state !== 'attacking' && this.state !== 'hurt' && this.state !== 'dead';
  }

  startAttack(type: 'light' | 'heavy' | 'special'): MoveDefinition | null {
    if (!this.canAttack()) return null;
    if (type === 'special' && this.specialCooldown > 0) return null;

    const moveDef = this.getMoveDef(type);
    this.state = 'attacking';
    this.attackTimer = moveDef.startup + moveDef.recovery;

    if (type === 'special') {
      this.specialCooldown = moveDef.cooldown;

      // Bubble shield is a self-buff
      if (this.config.move_loadout.special === 'bubble_shield') {
        this.shieldActive = true;
        this.shieldTimer = 3000;
      }

      // Heal pulse heals self
      if (this.config.move_loadout.special === 'heal_pulse') {
        this.hp = Math.min(this.maxHp, this.hp + 15);
      }
    }

    return moveDef;
  }

  takeDamage(rawDamage: number, knockbackDir: number, knockback: number): void {
    if (this.state === 'dead') return;

    let finalDamage = rawDamage;
    if (this.shieldActive) {
      finalDamage = Math.floor(finalDamage * 0.3);
    }

    this.hp = Math.max(0, this.hp - finalDamage);
    this.state = 'hurt';
    this.hurtTimer = 300;
    this.vx = knockbackDir * knockback;
    this.vy = -3;
    this.grounded = false;

    this.setExpression('scared');
    setTimeout(() => {
      if (this.state !== 'dead') {
        this.setExpression(this.config.eye_expression);
      }
    }, 500);

    if (this.hp <= 0) {
      this.state = 'dead';
    }
  }

  /** Apply remote player state with interpolation for smooth movement */
  setRemoteState(remote: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    state: FighterState;
    hp: number;
    specialCooldown: number;
    shieldActive: boolean;
  }): void {
    const LERP = 0.3;
    this.x += (remote.x - this.x) * LERP;
    this.y += (remote.y - this.y) * LERP;
    this.vx = remote.vx;
    this.vy = remote.vy;
    this.facing = remote.facing;
    this.state = remote.state;
    this.hp = remote.hp;
    this.specialCooldown = remote.specialCooldown;
    this.shieldActive = remote.shieldActive;
    this.container.scale.x = this.facing;
  }

  reset(startX: number, startY: number, facing: 1 | -1): void {
    this.x = startX;
    this.y = startY;
    this.facing = facing;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.state = 'idle';
    this.attackTimer = 0;
    this.hurtTimer = 0;
    this.specialCooldown = 0;
    this.shieldActive = false;
    this.grounded = true;
    this.setExpression(this.config.eye_expression);
    this.container.x = startX;
    this.container.y = startY;
    this.container.scale.x = facing;
    this.container.tint = 0xffffff;
  }
}
