export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  lightAttack: boolean;
  heavyAttack: boolean;
  special: boolean;
}

export class Controls {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();

  // On-screen button triggers (consumed once per frame)
  private buttonTriggers: Set<string> = new Set();

  // Touch D-pad state (continuous hold)
  private touchLeft: boolean = false;
  private touchRight: boolean = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.keys.has(e.key)) {
      this.justPressed.add(e.key);
    }
    this.keys.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key);
  };

  /** Called by on-screen buttons to inject an attack input */
  triggerButton(action: 'lightAttack' | 'heavyAttack' | 'special' | 'jump'): void {
    this.buttonTriggers.add(action);
  }

  /** Called by touch D-pad to set continuous movement */
  setTouchDirection(direction: 'left' | 'right', active: boolean): void {
    if (direction === 'left') this.touchLeft = active;
    if (direction === 'right') this.touchRight = active;
  }

  getP1Input(): InputState {
    return {
      left: this.keys.has('a') || this.keys.has('A') || this.keys.has('ArrowLeft') || this.touchLeft,
      right: this.keys.has('d') || this.keys.has('D') || this.keys.has('ArrowRight') || this.touchRight,
      jump: this.justPressed.has('w') || this.justPressed.has('W') || this.justPressed.has('ArrowUp') || this.buttonTriggers.has('jump'),
      lightAttack: this.justPressed.has(' ') || this.buttonTriggers.has('lightAttack'),
      heavyAttack: this.justPressed.has('f') || this.justPressed.has('F') || this.buttonTriggers.has('heavyAttack'),
      special: this.justPressed.has('g') || this.justPressed.has('G') || this.buttonTriggers.has('special'),
    };
  }

  clearJustPressed(): void {
    this.justPressed.clear();
    this.buttonTriggers.clear();
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
