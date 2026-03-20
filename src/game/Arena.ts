import { Container, Graphics } from 'pixi.js';

export class Arena {
  container: Container;
  groundY: number;
  width: number;
  height: number;

  private background: Graphics;
  private ground: Graphics;
  private p1Marker: Graphics;
  private p2Marker: Graphics;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.groundY = height * 0.75;
    this.container = new Container();

    this.background = new Graphics();
    this.ground = new Graphics();
    this.p1Marker = new Graphics();
    this.p2Marker = new Graphics();

    this.container.addChild(this.background);
    this.container.addChild(this.ground);
    this.container.addChild(this.p1Marker);
    this.container.addChild(this.p2Marker);

    this.drawArena();
  }

  private drawArena(): void {
    // Sky gradient (using layered rects)
    const gradientSteps = 20;
    for (let i = 0; i < gradientSteps; i++) {
      const t = i / gradientSteps;
      const r = Math.floor(10 + t * 15);
      const g = Math.floor(10 + t * 20);
      const b = Math.floor(30 + t * 40);
      const color = (r << 16) | (g << 8) | b;
      const stepH = this.groundY / gradientSteps;
      this.background.rect(0, i * stepH, this.width, stepH + 1);
      this.background.fill(color);
    }

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * this.width;
      const sy = Math.random() * this.groundY * 0.6;
      const size = Math.random() * 2 + 0.5;
      const brightness = Math.floor(150 + Math.random() * 105);
      this.background.circle(sx, sy, size);
      this.background.fill((brightness << 16) | (brightness << 8) | brightness);
    }

    // City silhouette in background
    this.drawCitySilhouette();

    // Ground
    this.ground.rect(0, this.groundY, this.width, this.height - this.groundY);
    this.ground.fill(0x1a1a2e);

    // Ground line / edge
    this.ground.rect(0, this.groundY, this.width, 3);
    this.ground.fill(0x4444aa);

    // Ground texture lines
    for (let i = 0; i < 8; i++) {
      const ly = this.groundY + 20 + i * 15;
      this.ground.rect(0, ly, this.width, 1);
      this.ground.fill({ color: 0x222244, alpha: 0.4 });
    }

    // Spawn markers
    const markerWidth = 60;
    const p1X = this.width * 0.3;
    const p2X = this.width * 0.7;

    this.p1Marker.rect(p1X - markerWidth / 2, this.groundY - 2, markerWidth, 4);
    this.p1Marker.fill({ color: 0x4488ff, alpha: 0.6 });

    this.p2Marker.rect(p2X - markerWidth / 2, this.groundY - 2, markerWidth, 4);
    this.p2Marker.fill({ color: 0xff4444, alpha: 0.6 });
  }

  private drawCitySilhouette(): void {
    const buildings = [
      { x: 0, w: 80, h: 120 },
      { x: 70, w: 50, h: 180 },
      { x: 110, w: 70, h: 90 },
      { x: 170, w: 40, h: 220 },
      { x: 200, w: 90, h: 150 },
      { x: 280, w: 60, h: 200 },
      { x: 330, w: 80, h: 130 },
      { x: 400, w: 50, h: 250 },
      { x: 440, w: 70, h: 160 },
      { x: 500, w: 100, h: 190 },
      { x: 590, w: 60, h: 140 },
      { x: 640, w: 80, h: 210 },
      { x: 710, w: 50, h: 170 },
      { x: 750, w: 90, h: 230 },
      { x: 830, w: 70, h: 120 },
      { x: 890, w: 60, h: 200 },
      { x: 940, w: 80, h: 150 },
      { x: 1010, w: 50, h: 180 },
      { x: 1050, w: 70, h: 240 },
      { x: 1110, w: 90, h: 130 },
      { x: 1190, w: 60, h: 190 },
      { x: 1240, w: 80, h: 160 },
    ];

    // Dark silhouette layer
    for (const b of buildings) {
      const bx = (b.x / 1300) * this.width;
      const bw = (b.w / 1300) * this.width;
      const bh = (b.h / 600) * this.groundY;
      this.background.rect(bx, this.groundY - bh, bw, bh);
      this.background.fill(0x0a0a1a);
    }

    // Glowing windows
    for (const b of buildings) {
      const bx = (b.x / 1300) * this.width;
      const bw = (b.w / 1300) * this.width;
      const bh = (b.h / 600) * this.groundY;
      const windowSize = 3;
      const gap = 10;
      for (let wx = bx + 5; wx < bx + bw - 5; wx += gap) {
        for (let wy = this.groundY - bh + 10; wy < this.groundY - 5; wy += gap) {
          if (Math.random() > 0.4) {
            const color = Math.random() > 0.7 ? 0xffaa44 : 0x4466aa;
            this.background.rect(wx, wy, windowSize, windowSize);
            this.background.fill({ color, alpha: 0.6 + Math.random() * 0.4 });
          }
        }
      }
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.groundY = height * 0.75;
    this.background.clear();
    this.ground.clear();
    this.p1Marker.clear();
    this.p2Marker.clear();
    this.drawArena();
  }

  get p1SpawnX(): number {
    return this.width * 0.3;
  }

  get p2SpawnX(): number {
    return this.width * 0.7;
  }
}
