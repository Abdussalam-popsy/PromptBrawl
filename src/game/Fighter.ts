import { Container, Graphics, Sprite, Assets } from 'pixi.js';
import { gsap } from 'gsap';
import { type FighterConfig, type EyeExpression, type SilhouetteConfig, type DominantAccessory } from '../ai/fighterConfig';
import { getMoveDef, type MoveDefinition } from '../ai/moveLibrary';

interface CharacterStyle {
  proportions: {
    bodyWidthMul: number;
    bodyHeightMul: number;
    headScaleMul: number;
    limbLengthMul: number;
    limbThicknessMul: number;
  };
  motion: {
    idleAmplitude: number;
    idleSpeed: number;
    attackSwingAngle: number;
    bobLimbDamping: number;
    centerOfMassOffsetY: number;
  };
  visuals: {
    shadowScale: number;
    bodyCornerRadius: number;
  };
}

const DEFAULT_STYLE: CharacterStyle = {
  proportions: {
    bodyWidthMul: 1.0,
    bodyHeightMul: 1.0,
    headScaleMul: 1.0,
    limbLengthMul: 1.0,
    limbThicknessMul: 1.0,
  },
  motion: {
    idleAmplitude: 2.0,
    idleSpeed: 0.05,
    attackSwingAngle: 0.8,
    bobLimbDamping: 0.5,
    centerOfMassOffsetY: 0,
  },
  visuals: {
    shadowScale: 1.0,
    bodyCornerRadius: 0.42,
  },
};

function deriveStyle(config: FighterConfig): CharacterStyle {
  const { size_variant, stats } = config;

  const sizePresets: Record<string, { bodyW: number; bodyH: number; head: number; limbLen: number; limbThick: number; comY: number }> = {
    light:  { bodyW: 0.82, bodyH: 1.0, head: 1.05, limbLen: 1.0, limbThick: 0.82, comY: -6 },
    medium: { bodyW: 1.0,  bodyH: 1.0, head: 1.0,  limbLen: 1.0, limbThick: 1.0,  comY: 0 },
    heavy:  { bodyW: 1.35, bodyH: 1.0, head: 0.9,  limbLen: 1.0, limbThick: 1.3,  comY: 8 },
  };
  const base = sizePresets[size_variant] ?? sizePresets.medium;

  const speedFactor = stats.speed / 6;
  const chaosFactor = stats.chaos / 6;

  return {
    proportions: {
      bodyWidthMul: base.bodyW,
      bodyHeightMul: base.bodyH,
      headScaleMul: base.head,
      limbLengthMul: base.limbLen,
      limbThicknessMul: base.limbThick,
    },
    motion: {
      idleAmplitude: 1.5 + chaosFactor * 1.0,
      idleSpeed: 0.04 + speedFactor * 0.02,
      attackSwingAngle: 0.6 + (stats.damage / 10) * 0.4,
      bobLimbDamping: 0.3 + chaosFactor * 0.4,
      centerOfMassOffsetY: base.comY,
    },
    visuals: {
      shadowScale: base.bodyW,
      bodyCornerRadius: size_variant === 'heavy' ? 0.35 : 0.42,
    },
  };
}

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
  private shadow: Graphics;
  private leftFoot: Graphics;
  private rightFoot: Graphics;
  private accentDetail: Graphics;
  private accessoryBehind: Graphics;
  private accessoryFront: Graphics;
  private sizeParams: SizeParams;
  private style: CharacterStyle;

  // Animation
  private animFrame: number = 0;
  private idlePhase: number = 0;
  private flashOverlay: Graphics | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private expressionTimer: ReturnType<typeof setTimeout> | null = null;
  private currentExpression: EyeExpression;
  private screenScale: number = 1;
  private spriteObj: Sprite | null = null;
  private useSprite: boolean = false;

  constructor(config: FighterConfig, startX: number, startY: number, facing: 1 | -1, canvasWidth: number = 800, canvasHeight: number = 600) {
    this.config = config;
    this.x = startX;
    this.y = startY;
    this.facing = facing;
    this.currentExpression = config.eye_expression;
    this.idlePhase = Math.random() * Math.PI * 2;
    this.screenScale = Math.min(canvasWidth, canvasHeight) / 800;
    const base = SIZE_PARAMS[config.size_variant] ?? SIZE_PARAMS.medium;
    this.sizeParams = {
      headRadius: base.headRadius * this.screenScale,
      bodyWidth: base.bodyWidth * this.screenScale,
      bodyHeight: base.bodyHeight * this.screenScale,
      armWidth: base.armWidth * this.screenScale,
      armHeight: base.armHeight * this.screenScale,
      legWidth: base.legWidth * this.screenScale,
      legHeight: base.legHeight * this.screenScale,
      weaponWidth: base.weaponWidth * this.screenScale,
      weaponHeight: base.weaponHeight * this.screenScale,
      scale: base.scale,
    };
    this.style = config.silhouette ? deriveStyle(config) : DEFAULT_STYLE;

    this.container = new Container();
    this.container.x = startX;
    this.container.y = startY;

    // Create graphics parts
    this.shadow = new Graphics();
    this.leftFoot = new Graphics();
    this.rightFoot = new Graphics();
    this.leftLeg = new Graphics();
    this.rightLeg = new Graphics();
    this.accessoryBehind = new Graphics();
    this.body = new Graphics();
    this.accentDetail = new Graphics();
    this.leftArm = new Graphics();
    this.rightArm = new Graphics();
    this.head = new Graphics();
    this.accessoryFront = new Graphics();
    this.weapon = new Graphics();
    this.leftEye = new Graphics();
    this.rightEye = new Graphics();

    // Add in z-order (back to front)
    this.container.addChild(this.shadow);
    this.container.addChild(this.leftFoot);
    this.container.addChild(this.rightFoot);
    this.container.addChild(this.leftLeg);
    this.container.addChild(this.rightLeg);
    this.container.addChild(this.accessoryBehind);  // wings, cape, spikes — behind body
    this.container.addChild(this.leftArm);
    this.container.addChild(this.body);
    this.container.addChild(this.accentDetail);
    this.container.addChild(this.rightArm);
    this.container.addChild(this.weapon);
    this.container.addChild(this.head);
    this.container.addChild(this.accessoryFront);    // hats, horns, visor — in front
    this.container.addChild(this.leftEye);
    this.container.addChild(this.rightEye);

    this.draw();

    // Attempt to load AI-generated sprite as overlay (procedural rig stays as fallback)
    if (config.sprite_url) {
      this.loadSprite(config.sprite_url);
    }
  }

  private loadSprite(url: string): void {
    Assets.load<import('pixi.js').Texture>(url)
      .then((texture) => {
        const sprite = new Sprite(texture);
        // Scale sprite to match rig height
        const r = this.getRigDimensions();
        const targetH = r.bh + r.totalLegsAndFeet + r.headR * 2;
        const scale = targetH / texture.height;
        sprite.scale.set(scale);
        // Anchor at bottom center — sits on ground correctly
        sprite.anchor.set(0.5, 1.0);
        sprite.x = 0;
        sprite.y = 0;

        this.spriteObj = sprite;
        this.useSprite = true;
        this.container.addChild(sprite);

        // Hide procedural rig parts (but keep them for hitbox calculations)
        this.setRigVisible(false);
      })
      .catch((e) => {
        console.warn('Sprite load failed, using rig:', e);
      });
  }

  private setRigVisible(visible: boolean): void {
    const alpha = visible ? 1 : 0;
    this.head.alpha = alpha;
    this.body.alpha = alpha;
    this.leftArm.alpha = alpha;
    this.rightArm.alpha = alpha;
    this.leftLeg.alpha = alpha;
    this.rightLeg.alpha = alpha;
    this.leftFoot.alpha = alpha;
    this.rightFoot.alpha = alpha;
    this.weapon.alpha = alpha;
    this.leftEye.alpha = alpha;
    this.rightEye.alpha = alpha;
    this.accentDetail.alpha = alpha;
    this.accessoryBehind.alpha = alpha;
    this.accessoryFront.alpha = alpha;
  }

  private hexToNum(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  draw(): void {
    const sil = this.config.silhouette;
    if (sil) {
      this.drawSilhouette(sil);
    } else {
      this.drawClassic();
    }
    // Scale facing
    this.container.scale.x = this.facing;
  }

  /** Darken a hex color by a factor (0 = black, 1 = unchanged) */
  private darkenColor(hex: string, factor: number): number {
    const n = this.hexToNum(hex);
    const r = Math.floor(((n >> 16) & 0xff) * factor);
    const g = Math.floor(((n >> 8) & 0xff) * factor);
    const b = Math.floor((n & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }


  /** Fixed rig dimensions — base skeleton scaled by CharacterStyle multipliers */
  private getRigDimensions(): {
    sc: number; bw: number; bh: number; headR: number;
    footW: number; footH: number; footR: number;
    legW: number; legH: number; legR: number;
    armW: number; armH: number; armR: number;
    legSpacing: number; totalLegsAndFeet: number;
    bodyBottom: number; headOverlap: number; headCenterY: number;
    armX: number; armY: number;
  } {
    const sc = this.screenScale * 1.1;
    const p = this.style.proportions;
    const bw = 65 * sc * p.bodyWidthMul;
    const bh = 58 * sc * p.bodyHeightMul;
    const headR = 26 * sc * p.headScaleMul;
    const footW = 22 * sc * p.bodyWidthMul;
    const footH = 14 * sc;
    const footR = 7 * sc;
    const legW = 16 * sc * p.limbThicknessMul;
    const legH = 28 * sc * p.limbLengthMul;
    const legR = 8 * sc;
    const armW = 14 * sc * p.limbThicknessMul;
    const armH = 32 * sc * p.limbLengthMul;
    const armR = 7 * sc;
    const legSpacing = bw * 0.22;
    const totalLegsAndFeet = footH + legH;
    const headOverlap = headR * 0.4;
    const bodyBottom = -totalLegsAndFeet + 2 * sc;
    const headCenterY = bodyBottom - bh + headOverlap - headR;
    const armX = bw / 2 - 4 * sc;
    const armY = bodyBottom - bh + bh * 0.15;
    return {
      sc, bw, bh, headR, footW, footH, footR,
      legW, legH, legR, armW, armH, armR,
      legSpacing, totalLegsAndFeet, bodyBottom,
      headOverlap, headCenterY, armX, armY,
    };
  }

  private drawSilhouette(_sil: SilhouetteConfig): void {
    const r = this.getRigDimensions();
    const { sc, bw, bh } = r;

    // Colors from palette only — ignore sil shape/size fields
    const primary = this.hexToNum(this.config.color_palette.primary);
    const secondary = this.hexToNum(this.config.color_palette.secondary);
    const accent = this.hexToNum(this.config.color_palette.accent);
    const darkPrimary = this.darkenColor(this.config.color_palette.primary, 0.55);

    // Clear all parts
    this.shadow.clear();
    this.leftFoot.clear();
    this.rightFoot.clear();
    this.leftLeg.clear();
    this.rightLeg.clear();
    this.accessoryBehind.clear();
    this.leftArm.clear();
    this.rightArm.clear();
    this.body.clear();
    this.accentDetail.clear();
    this.head.clear();
    this.accessoryFront.clear();
    this.weapon.clear();
    this.leftEye.clear();
    this.rightEye.clear();

    // ========== 1. SHADOW ==========
    this.shadow.ellipse(0, 4 * sc, bw * 0.4 * this.style.visuals.shadowScale, 6 * sc);
    this.shadow.fill({ color: 0x000000, alpha: 0.2 });

    // ========== 2. FEET — wide flat rects, splayed outward ==========
    this.leftFoot.roundRect(
      -r.legSpacing - r.footW / 2 - 2 * sc,
      -r.footH + 2 * sc,
      r.footW, r.footH, r.footR,
    );
    this.leftFoot.fill(darkPrimary);
    this.rightFoot.roundRect(
      r.legSpacing - r.footW / 2 + 2 * sc,
      -r.footH + 2 * sc,
      r.footW, r.footH, r.footR,
    );
    this.rightFoot.fill(darkPrimary);

    // ========== 3. LEGS — sausage shape ==========
    this.leftLeg.roundRect(
      -r.legSpacing - r.legW / 2,
      -r.footH - r.legH + 2 * sc,
      r.legW, r.legH, r.legR,
    );
    this.leftLeg.fill(secondary);
    this.rightLeg.roundRect(
      r.legSpacing - r.legW / 2,
      -r.footH - r.legH + 2 * sc,
      r.legW, r.legH, r.legR,
    );
    this.rightLeg.fill(secondary);

    // ========== 4. BODY — chunky blob ==========
    const bodyRadius = bw * this.style.visuals.bodyCornerRadius;
    this.body.roundRect(-bw / 2, r.bodyBottom - bh, bw, bh, bodyRadius);
    this.body.fill(primary);

    // ========== 5. ACCENT — clothing stripe ==========
    const accentW = bw * 0.6;
    const accentH = 8 * sc;
    const accentY = r.bodyBottom - bh + bh * 0.2;
    this.accentDetail.roundRect(-accentW / 2, accentY, accentW, accentH, 3 * sc);
    this.accentDetail.fill(accent);

    // ========== 6. ARMS — thick sausage limbs, ±12° ==========
    this.leftArm.roundRect(-r.armW / 2, 0, r.armW, r.armH, r.armR);
    this.leftArm.fill(primary);
    this.leftArm.x = -r.armX;
    this.leftArm.y = r.armY;
    this.leftArm.rotation = -0.21; // ~-12 degrees
    this.rightArm.roundRect(-r.armW / 2, 0, r.armW, r.armH, r.armR);
    this.rightArm.fill(primary);
    this.rightArm.x = r.armX;
    this.rightArm.y = r.armY;
    this.rightArm.rotation = 0.21; // ~+12 degrees

    // ========== 7. HEAD — oversized circle ==========
    this.head.circle(0, r.headCenterY, r.headR);
    this.head.fill(primary);

    // ========== 8. EYES — white sclera + black pupils ==========
    const eyeSize = 8 * sc;
    const pupilSize = 4 * sc;
    const eyeSpacing = r.headR * 0.35;
    const eyeY = r.headCenterY - r.headR * 0.08;
    this.drawChunkyEyes(eyeSpacing, eyeY, eyeSize, pupilSize, accent);

    // ========== 9. WEAPON — on leading hand ==========
    const weaponW = 8 * sc;
    const weaponH = 22 * sc;
    this.weapon.roundRect(-weaponW / 2, r.armH * 0.6, weaponW, weaponH, 3 * sc);
    this.weapon.fill(accent);
    this.weapon.x = r.armX;
    this.weapon.y = r.armY;
    this.weapon.rotation = 0.21;

    // ========== 10. DOMINANT ACCESSORY ==========
    this.drawDominantAccessory(this.config.dominant_accessory ?? null, r, accent, primary);
  }

  private drawDominantAccessory(
    type: DominantAccessory | string | null,
    r: {
      sc: number; bw: number; bh: number; headR: number;
      footW: number; footH: number; footR: number;
      legW: number; legH: number; legR: number;
      armW: number; armH: number; armR: number;
      legSpacing: number; totalLegsAndFeet: number;
      bodyBottom: number; headOverlap: number; headCenterY: number;
      armX: number; armY: number;
    },
    accent: number,
    primary: number,
  ): void {
    if (!type) return;

    const { sc, bw, bh, headR, headCenterY, bodyBottom, armH, armX, armY } = r;
    const headTop = headCenterY - headR;

    // Behind-body accessories
    switch (type) {
      case 'wings': {
        const wingW = bw * 0.8;
        const wingH = bh * 1.2;
        const wingY = bodyBottom - bh * 0.6;
        // Left wing
        this.accessoryBehind.moveTo(-bw * 0.3, wingY);
        this.accessoryBehind.lineTo(-bw * 0.3 - wingW, wingY - wingH * 0.3);
        this.accessoryBehind.lineTo(-bw * 0.15, wingY + wingH * 0.5);
        this.accessoryBehind.closePath();
        this.accessoryBehind.fill({ color: accent, alpha: 0.7 });
        // Right wing
        this.accessoryBehind.moveTo(bw * 0.3, wingY);
        this.accessoryBehind.lineTo(bw * 0.3 + wingW, wingY - wingH * 0.3);
        this.accessoryBehind.lineTo(bw * 0.15, wingY + wingH * 0.5);
        this.accessoryBehind.closePath();
        this.accessoryBehind.fill({ color: accent, alpha: 0.7 });
        break;
      }
      case 'cape_large': {
        const capeW = bw * 0.9;
        const capeH = bh * 1.5;
        const capeTop = bodyBottom - bh * 0.8;
        this.accessoryBehind.moveTo(-capeW / 2, capeTop);
        this.accessoryBehind.lineTo(capeW / 2, capeTop);
        this.accessoryBehind.lineTo(capeW * 0.35, capeTop + capeH);
        this.accessoryBehind.lineTo(-capeW * 0.35, capeTop + capeH);
        this.accessoryBehind.closePath();
        this.accessoryBehind.fill({ color: accent, alpha: 0.6 });
        break;
      }
      case 'spikes_back': {
        const spikeCount = 5;
        const spikeH = bh * 0.5;
        const startY = bodyBottom - bh;
        for (let i = 0; i < spikeCount; i++) {
          const sy = startY + (bh / spikeCount) * i;
          const tipX = -bw * 0.5 - spikeH * (0.6 + Math.random() * 0.4);
          this.accessoryBehind.moveTo(-bw * 0.35, sy);
          this.accessoryBehind.lineTo(tipX, sy - spikeH * 0.15);
          this.accessoryBehind.lineTo(-bw * 0.35, sy + bh / spikeCount * 0.6);
          this.accessoryBehind.closePath();
          this.accessoryBehind.fill({ color: accent, alpha: 0.65 });
        }
        break;
      }
      case 'aura': {
        // Glowing energy rings behind the body
        const auraR1 = bw * 0.7;
        const auraR2 = bw * 0.9;
        const auraCY = bodyBottom - bh * 0.5;
        this.accessoryBehind.ellipse(0, auraCY, auraR2, bh * 0.8);
        this.accessoryBehind.fill({ color: accent, alpha: 0.12 });
        this.accessoryBehind.ellipse(0, auraCY, auraR1, bh * 0.6);
        this.accessoryBehind.fill({ color: accent, alpha: 0.18 });
        break;
      }
    }

    // Front accessories (drawn after head)
    switch (type) {
      case 'wizard_hat': {
        const hatH = headR * 1.8;
        const hatBaseW = headR * 1.6;
        // Brim
        this.accessoryFront.ellipse(0, headTop + 2 * sc, hatBaseW * 0.7, 4 * sc);
        this.accessoryFront.fill(accent);
        // Cone
        this.accessoryFront.moveTo(0, headTop - hatH);
        this.accessoryFront.lineTo(hatBaseW * 0.5, headTop + 2 * sc);
        this.accessoryFront.lineTo(-hatBaseW * 0.5, headTop + 2 * sc);
        this.accessoryFront.closePath();
        this.accessoryFront.fill(accent);
        break;
      }
      case 'horns': {
        const hornH = headR * 1.4;
        const hornW = headR * 0.35;
        // Left horn
        this.accessoryFront.moveTo(-headR * 0.5, headTop + headR * 0.2);
        this.accessoryFront.lineTo(-headR * 0.8 - hornW, headTop - hornH);
        this.accessoryFront.lineTo(-headR * 0.3, headTop + headR * 0.1);
        this.accessoryFront.closePath();
        this.accessoryFront.fill(accent);
        // Right horn
        this.accessoryFront.moveTo(headR * 0.5, headTop + headR * 0.2);
        this.accessoryFront.lineTo(headR * 0.8 + hornW, headTop - hornH);
        this.accessoryFront.lineTo(headR * 0.3, headTop + headR * 0.1);
        this.accessoryFront.closePath();
        this.accessoryFront.fill(accent);
        break;
      }
      case 'antenna': {
        const antennaH = headR * 1.6;
        const ballR = 4 * sc;
        this.accessoryFront.rect(-1.5 * sc, headTop - antennaH, 3 * sc, antennaH);
        this.accessoryFront.fill({ color: accent, alpha: 0.8 });
        this.accessoryFront.circle(0, headTop - antennaH, ballR);
        this.accessoryFront.fill({ color: 0xffffcc, alpha: 0.9 });
        break;
      }
      case 'halo': {
        const haloR = headR * 1.1;
        const haloY = headTop - headR * 0.3;
        this.accessoryFront.ellipse(0, haloY, haloR, 4 * sc);
        this.accessoryFront.fill({ color: 0xffdd44, alpha: 0.7 });
        // Inner cutout effect
        this.accessoryFront.ellipse(0, haloY, haloR * 0.7, 2.5 * sc);
        this.accessoryFront.fill({ color: primary, alpha: 0.0 });
        break;
      }
      case 'shoulder_plates': {
        const plateW = bw * 0.35;
        const plateH = bh * 0.25;
        const plateY = bodyBottom - bh * 0.85;
        // Left plate
        this.accessoryFront.roundRect(-bw / 2 - plateW * 0.6, plateY, plateW, plateH, 4 * sc);
        this.accessoryFront.fill(accent);
        // Right plate
        this.accessoryFront.roundRect(bw / 2 - plateW * 0.4, plateY, plateW, plateH, 4 * sc);
        this.accessoryFront.fill(accent);
        break;
      }
      case 'scarf_trail': {
        const scarfW = 6 * sc;
        const scarfLen = bh * 1.3;
        const scarfY = headCenterY + headR * 0.5;
        // Wrap around neck
        this.accessoryFront.roundRect(-headR * 0.6, scarfY, headR * 1.2, 6 * sc, 3 * sc);
        this.accessoryFront.fill(accent);
        // Trailing end
        this.accessoryFront.moveTo(-headR * 0.6, scarfY + 3 * sc);
        this.accessoryFront.lineTo(-headR * 0.6 - bw * 0.4, scarfY + scarfLen);
        this.accessoryFront.lineTo(-headR * 0.6 - bw * 0.4 + scarfW, scarfY + scarfLen * 0.85);
        this.accessoryFront.lineTo(-headR * 0.4, scarfY + 6 * sc);
        this.accessoryFront.closePath();
        this.accessoryFront.fill({ color: accent, alpha: 0.75 });
        break;
      }
      case 'giant_weapon': {
        const gwW = 10 * sc;
        const gwH = armH * 1.8;
        this.accessoryFront.roundRect(-gwW / 2, 0, gwW, gwH, 3 * sc);
        this.accessoryFront.fill(accent);
        // Crossguard
        this.accessoryFront.roundRect(-gwW * 1.2, gwH * 0.15, gwW * 2.4, 4 * sc, 2 * sc);
        this.accessoryFront.fill(accent);
        this.accessoryFront.x = armX;
        this.accessoryFront.y = armY;
        this.accessoryFront.rotation = 0.21;
        break;
      }
      case 'visor': {
        const visorW = headR * 1.8;
        const visorH = headR * 0.35;
        const visorY = headCenterY - headR * 0.1;
        this.accessoryFront.roundRect(-visorW / 2, visorY, visorW, visorH, 3 * sc);
        this.accessoryFront.fill({ color: accent, alpha: 0.85 });
        break;
      }
      case 'mask': {
        const maskW = headR * 1.5;
        const maskH = headR * 0.8;
        const maskY = headCenterY - maskH * 0.4;
        this.accessoryFront.roundRect(-maskW / 2, maskY, maskW, maskH, 5 * sc);
        this.accessoryFront.fill({ color: accent, alpha: 0.8 });
        // Eye slits
        const slitW = maskW * 0.2;
        const slitH = maskH * 0.25;
        const slitY = maskY + maskH * 0.25;
        this.accessoryFront.roundRect(-headR * 0.35 - slitW / 2, slitY, slitW, slitH, 2 * sc);
        this.accessoryFront.fill({ color: 0x000000, alpha: 0.9 });
        this.accessoryFront.roundRect(headR * 0.35 - slitW / 2, slitY, slitW, slitH, 2 * sc);
        this.accessoryFront.fill({ color: 0x000000, alpha: 0.9 });
        break;
      }
    }
  }

  /** Chunky eyes: white sclera + black pupil, with expression offsets */
  private drawChunkyEyes(
    spacing: number, cy: number,
    eyeSize: number, pupilSize: number,
    _accentColor: number,
  ): void {
    this.leftEye.clear();
    this.rightEye.clear();

    let lyOff = 0, ryOff = 0;
    let lScale = 1, rScale = 1;
    let pupilColor = 0x111111;

    switch (this.currentExpression) {
      case 'angry':
        lyOff = -1; ryOff = 1; break;
      case 'greedy':
        lScale = 1.2; rScale = 1.2; pupilColor = 0x332200; break;
      case 'scared':
        lScale = 1.4; rScale = 1.4; lyOff = -2; ryOff = -2; break;
      case 'unhinged':
        lScale = 1.5; rScale = 0.7; ryOff = 2; break;
      default: break;
    }

    // Left eye — white sclera
    this.leftEye.circle(-spacing, cy + lyOff, eyeSize * lScale);
    this.leftEye.fill(0xffffff);
    // Left pupil
    this.leftEye.circle(-spacing + 1, cy + lyOff, pupilSize * lScale);
    this.leftEye.fill(pupilColor);

    // Right eye — white sclera
    this.rightEye.circle(spacing, cy + ryOff, eyeSize * rScale);
    this.rightEye.fill(0xffffff);
    // Right pupil
    this.rightEye.circle(spacing + 1, cy + ryOff, pupilSize * rScale);
    this.rightEye.fill(pupilColor);
  }

  private drawClassic(): void {
    const s = this.sizeParams;
    const primary = this.hexToNum(this.config.color_palette.primary);
    const secondary = this.hexToNum(this.config.color_palette.secondary);
    const accent = this.hexToNum(this.config.color_palette.accent);

    // Clear all (including new chunky parts)
    this.shadow.clear();
    this.leftFoot.clear();
    this.rightFoot.clear();
    this.accentDetail.clear();
    this.accessoryBehind.clear();
    this.accessoryFront.clear();
    this.head.clear();
    this.body.clear();
    this.leftArm.clear();
    this.rightArm.clear();
    this.leftLeg.clear();
    this.rightLeg.clear();
    this.weapon.clear();
    this.leftEye.clear();
    this.rightEye.clear();
    // Reset rotations for classic mode
    this.leftArm.rotation = 0;
    this.rightArm.rotation = 0;
    this.weapon.rotation = 0;
    this.leftArm.x = 0;
    this.leftArm.y = 0;
    this.rightArm.x = 0;
    this.rightArm.y = 0;
    this.weapon.x = 0;
    this.weapon.y = 0;

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
    if (this.config.silhouette) {
      const r = this.getRigDimensions();
      const eyeSize = 8 * r.sc;
      const pupilSize = 4 * r.sc;
      const eyeSpacing = r.headR * 0.35;
      const eyeY = r.headCenterY - r.headR * 0.08;
      const accent = this.hexToNum(this.config.color_palette.accent);
      this.drawChunkyEyes(eyeSpacing, eyeY, eyeSize, pupilSize, accent);
    } else {
      const s = this.sizeParams;
      const accent = this.hexToNum(this.config.color_palette.accent);
      this.drawEyes(s, accent);
    }
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
    const isSil = !!this.config.silhouette;
    if (isSil) {
      return this.getRigDimensions().bw + 10;
    }
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
    const isSilBounds = !!this.config.silhouette;
    const boundsW = isSilBounds ? this.getRigDimensions().bw : this.sizeParams.bodyWidth;
    const halfW = boundsW / 2 + 10;
    if (this.x < halfW) this.x = halfW;
    if (this.x > arenaWidth - halfW) this.x = arenaWidth - halfW;

    // Update container position
    this.container.x = this.x;
    this.container.y = this.y;

    // Idle bob animation
    const isSil = !!this.config.silhouette;
    if (this.state === 'idle' || this.state === 'walking') {
      const { idleAmplitude, idleSpeed, bobLimbDamping, centerOfMassOffsetY } = this.style.motion;
      const bob = Math.sin(this.animFrame * idleSpeed + this.idlePhase) * idleAmplitude;
      const comY = centerOfMassOffsetY;
      const headBob = bob * 1.4;
      this.body.y = bob + comY;
      this.head.y = headBob + comY;
      this.leftEye.y = headBob + comY;
      this.rightEye.y = headBob + comY;
      this.accentDetail.y = bob + comY;
      if (isSil) {
        const r = this.getRigDimensions();
        this.leftArm.y = r.armY + bob * bobLimbDamping + comY;
        this.rightArm.y = r.armY + bob * bobLimbDamping + comY;
        this.weapon.y = r.armY + bob * bobLimbDamping + comY;
      } else {
        this.leftArm.y = bob * 0.5;
        this.rightArm.y = bob * 0.5;
        this.weapon.y = bob;
      }
      // Sprite idle bob
      if (this.useSprite && this.spriteObj) {
        this.spriteObj.y = bob;
      }
    }

    // Attack animation (arm swing)
    if (this.state === 'attacking') {
      if (isSil) {
        const swing = -this.style.motion.attackSwingAngle;
        this.rightArm.rotation = swing;
        this.weapon.rotation = swing;
      } else {
        const swing = -20;
        this.rightArm.y = swing;
        this.weapon.y = swing;
      }
      // Sprite squash on attack
      if (this.useSprite && this.spriteObj) {
        this.spriteObj.scale.x = this.spriteObj.scale.y * 1.15;
        this.spriteObj.scale.y = this.spriteObj.scale.y * 0.9;
      }
    } else {
      if (isSil) {
        // Reset arm rotation when not attacking
        this.rightArm.rotation = 0.21;
        this.weapon.rotation = 0.21;
      }
      // Restore sprite scale when not attacking
      if (this.useSprite && this.spriteObj) {
        const r = this.getRigDimensions();
        const targetH = r.bh + r.totalLegsAndFeet + r.headR * 2;
        const baseScale = targetH / (this.spriteObj.texture?.height || 1);
        this.spriteObj.scale.set(baseScale);
      }
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
    if (this.expressionTimer !== null) clearTimeout(this.expressionTimer);
    this.expressionTimer = setTimeout(() => {
      this.expressionTimer = null;
      if (this.state !== 'dead') {
        this.setExpression(this.config.eye_expression);
      }
    }, 500);

    if (this.hp <= 0) {
      this.state = 'dead';
      // Death fade — no flash
      gsap.to(this.container, { alpha: 0, duration: 0.4 });
      if (this.useSprite && this.spriteObj) {
        gsap.to(this.spriteObj, { alpha: 0, duration: 0.4 });
      }
    } else {
      // Hit flash — white tint then restore
      this.flashWhite();
    }
  }

  private flashWhite(): void {
    // Cancel any pending restore from a previous flash
    if (this.flashTimer !== null) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
    if (this.flashOverlay) {
      this.container.removeChild(this.flashOverlay);
      this.flashOverlay.destroy();
      this.flashOverlay = null;
    }

    // Create white overlay rect covering the full fighter silhouette
    const r = this.getRigDimensions();
    const overlay = new Graphics();
    overlay.rect(-r.bw / 2, -(r.bh + r.totalLegsAndFeet + r.headR * 2), r.bw, r.bh + r.totalLegsAndFeet + r.headR * 2);
    overlay.fill({ color: 0xffffff, alpha: 0.6 });
    this.container.addChild(overlay);
    this.flashOverlay = overlay;

    // Remove after 80ms
    this.flashTimer = setTimeout(() => {
      if (this.flashOverlay) {
        this.container.removeChild(this.flashOverlay);
        this.flashOverlay.destroy();
        this.flashOverlay = null;
      }
      this.flashTimer = null;
    }, 80);
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
    this.cleanupTimers();
    this.setExpression(this.config.eye_expression);
    this.container.x = startX;
    this.container.y = startY;
    this.container.scale.x = facing;
    this.container.alpha = 1;
  }

  /** Clean up pending timers and flash overlay */
  private cleanupTimers(): void {
    if (this.flashTimer !== null) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
    if (this.expressionTimer !== null) {
      clearTimeout(this.expressionTimer);
      this.expressionTimer = null;
    }
    if (this.flashOverlay) {
      this.container.removeChild(this.flashOverlay);
      this.flashOverlay.destroy();
      this.flashOverlay = null;
    }
  }
}
