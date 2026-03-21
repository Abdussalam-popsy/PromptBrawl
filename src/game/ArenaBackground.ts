import { Container, Graphics } from 'pixi.js';
import { type BackgroundConfig, FALLBACK_BACKGROUND } from '../ai/fighterConfig';

export class ArenaBackground {
  readonly container: Container;
  private readonly graphics: Graphics;
  private readonly config: BackgroundConfig;

  constructor(
    config: BackgroundConfig | undefined,
    private width: number,
    private height: number,
    private groundY: number,
  ) {
    this.config = config ?? FALLBACK_BACKGROUND;
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
  }

  resize(width: number, height: number, groundY: number): void {
    this.width = width;
    this.height = height;
    this.groundY = groundY;
    this.draw();
  }
}
