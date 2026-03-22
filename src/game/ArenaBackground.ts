import { Container, Graphics } from 'pixi.js';
import { type BackgroundConfig, FALLBACK_BACKGROUND } from '../ai/fighterConfig';

export class ArenaBackground {
  readonly container: Container;
  private readonly graphics: Graphics;
  private readonly config: BackgroundConfig;
  private width: number;
  private height: number;
  private groundY: number;

  constructor(
    config: BackgroundConfig | undefined,
    width: number,
    height: number,
    groundY: number,
  ) {
    this.config = config ?? FALLBACK_BACKGROUND;
    this.width = width;
    this.height = height;
    this.groundY = groundY;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    this.draw();
  }

  private hexToNum(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff;
    const ag = (a >> 8) & 0xff;
    const ab = a & 0xff;
    const br = (b >> 16) & 0xff;
    const bg = (b >> 8) & 0xff;
    const bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const blue = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | blue;
  }

  private draw(): void {
    this.graphics.clear();

    const skyColor = this.hexToNum(this.config.sky_color);
    const midColor = this.hexToNum(this.config.mid_color);
    const groundColor = this.hexToNum(this.config.ground_color);

    // Sky band: top 50% — gradient from sky_color to mid_color
    const skyEnd = this.groundY * 0.5;
    const skySteps = 16;
    for (let i = 0; i < skySteps; i++) {
      const t = i / skySteps;
      const color = this.lerpColor(skyColor, midColor, t * 0.5);
      const stepH = skyEnd / skySteps;
      this.graphics.rect(0, i * stepH, this.width, stepH + 1);
      this.graphics.fill(color);
    }

    // Midground band: middle 20% (50%-70% of groundY)
    const midStart = skyEnd;
    const midEnd = this.groundY * 0.7;
    const midSteps = 8;
    for (let i = 0; i < midSteps; i++) {
      const t = i / midSteps;
      const color = this.lerpColor(midColor, groundColor, t * 0.6);
      const stepH = (midEnd - midStart) / midSteps;
      this.graphics.rect(0, midStart + i * stepH, this.width, stepH + 1);
      this.graphics.fill(color);
    }

    // Ground band: bottom 30% of sky area (70%-100% of groundY) + below ground
    const gndStart = midEnd;
    const gndSteps = 8;
    for (let i = 0; i < gndSteps; i++) {
      const t = i / gndSteps;
      const darkerGround = this.lerpColor(groundColor, 0x000000, t * 0.2);
      const stepH = (this.groundY - gndStart) / gndSteps;
      this.graphics.rect(0, gndStart + i * stepH, this.width, stepH + 1);
      this.graphics.fill(darkerGround);
    }

    // Ground floor below groundY
    this.graphics.rect(0, this.groundY, this.width, this.height - this.groundY);
    this.graphics.fill(groundColor);

    // Ground line
    this.graphics.rect(0, this.groundY, this.width, 3);
    const lighterGround = this.lerpColor(groundColor, 0xffffff, 0.3);
    this.graphics.fill(lighterGround);

    // Ground texture
    for (let i = 0; i < 6; i++) {
      const ly = this.groundY + 20 + i * 15;
      if (ly < this.height) {
        this.graphics.rect(0, ly, this.width, 1);
        this.graphics.fill({ color: groundColor, alpha: 0.4 });
      }
    }

    // Environment elements — flat silhouette shapes in the midground
    this.drawElements(midColor);
  }

  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  private drawElements(midColor: number): void {
    const elements = this.config.elements;
    if (!elements || elements.length === 0) return;

    const silColor = this.darkenColor(midColor, 0.6);
    const baseY = this.groundY;
    const count = elements.length;
    const sectionW = this.width / (count + 1);

    for (let i = 0; i < count; i++) {
      const tag = elements[i].toLowerCase();
      const cx = sectionW * (i + 1);
      this.drawElementShape(tag, cx, baseY, sectionW * 0.6, silColor);
    }
  }

  private drawElementShape(
    tag: string, cx: number, baseY: number,
    maxW: number, color: number,
  ): void {
    const g = this.graphics;

    if (tag.includes('building') || tag.includes('tower') || tag.includes('skyscraper')) {
      // Tall rectangle with antenna
      const w = maxW * 0.3;
      const h = maxW * 0.9;
      g.rect(cx - w / 2, baseY - h, w, h);
      g.fill({ color, alpha: 0.5 });
      // Antenna
      g.rect(cx - 1, baseY - h - maxW * 0.15, 2, maxW * 0.15);
      g.fill({ color, alpha: 0.4 });
    } else if (tag.includes('tree') || tag.includes('palm') || tag.includes('forest')) {
      // Triangle canopy on thin trunk
      const trunkW = maxW * 0.06;
      const trunkH = maxW * 0.3;
      g.rect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH);
      g.fill({ color, alpha: 0.5 });
      // Canopy — circle
      const canopyR = maxW * 0.18;
      g.circle(cx, baseY - trunkH - canopyR * 0.6, canopyR);
      g.fill({ color, alpha: 0.45 });
    } else if (tag.includes('mountain') || tag.includes('hill') || tag.includes('volcano')) {
      // Triangle peak
      const halfW = maxW * 0.4;
      const h = maxW * 0.6;
      g.moveTo(cx, baseY - h);
      g.lineTo(cx + halfW, baseY);
      g.lineTo(cx - halfW, baseY);
      g.closePath();
      g.fill({ color, alpha: 0.4 });
    } else if (tag.includes('rock') || tag.includes('boulder') || tag.includes('stone')) {
      // Squat rounded rect
      const w = maxW * 0.25;
      const h = maxW * 0.15;
      g.roundRect(cx - w / 2, baseY - h, w, h, h * 0.4);
      g.fill({ color, alpha: 0.5 });
    } else if (tag.includes('light') || tag.includes('lamp') || tag.includes('lantern')) {
      // Thin pole with glowing circle
      g.rect(cx - 1.5, baseY - maxW * 0.5, 3, maxW * 0.5);
      g.fill({ color, alpha: 0.4 });
      g.circle(cx, baseY - maxW * 0.5, 5);
      g.fill({ color: 0xffffcc, alpha: 0.3 });
    } else if (tag.includes('fence') || tag.includes('wall') || tag.includes('barrier')) {
      // Low horizontal rect
      const w = maxW * 0.6;
      const h = maxW * 0.08;
      g.rect(cx - w / 2, baseY - h - maxW * 0.02, w, h);
      g.fill({ color, alpha: 0.4 });
    } else if (tag.includes('cactus')) {
      // Vertical rect with two stubs
      const w = maxW * 0.06;
      const h = maxW * 0.35;
      g.rect(cx - w / 2, baseY - h, w, h);
      g.fill({ color, alpha: 0.5 });
      g.rect(cx + w / 2, baseY - h * 0.7, w * 0.8, h * 0.2);
      g.fill({ color, alpha: 0.5 });
      g.rect(cx - w / 2 - w * 0.8, baseY - h * 0.5, w * 0.8, h * 0.2);
      g.fill({ color, alpha: 0.5 });
    } else {
      // Generic — small rounded blob
      const w = maxW * 0.2;
      const h = maxW * 0.12;
      g.roundRect(cx - w / 2, baseY - h, w, h, h * 0.5);
      g.fill({ color, alpha: 0.35 });
    }
  }

  resize(width: number, height: number, groundY: number): void {
    this.width = width;
    this.height = height;
    this.groundY = groundY;
    this.draw();
  }
}
