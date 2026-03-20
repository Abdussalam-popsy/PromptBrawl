import { Fighter } from './Fighter';
import { type InputState } from './Controls';

export class AIOpponent {
  private retreatTimer: number = 0;
  private actionCooldown: number = 0;
  private chaosTimer: number = 0;

  getInput(ai: Fighter, player: Fighter): InputState {
    const input: InputState = {
      left: false,
      right: false,
      jump: false,
      lightAttack: false,
      heavyAttack: false,
      special: false,
    };

    if (ai.state === 'dead' || ai.state === 'hurt') return input;

    const dist = Math.abs(ai.x - player.x);
    const dir = player.x > ai.x ? 1 : -1;

    // Cooldown between actions
    if (this.actionCooldown > 0) {
      this.actionCooldown--;
      return input;
    }

    // Retreat after taking damage
    if (this.retreatTimer > 0) {
      this.retreatTimer--;
      if (dir === 1) input.left = true;
      else input.right = true;
      return input;
    }

    // Chaos-driven random behavior
    const chaosLevel = ai.config.stats.chaos;
    if (this.chaosTimer <= 0 && Math.random() < chaosLevel * 0.02) {
      this.chaosTimer = 20 + Math.random() * 30;
      // Random action
      const action = Math.random();
      if (action < 0.3) {
        input.jump = true;
        input.lightAttack = true;
      } else if (action < 0.5) {
        input.special = true;
      } else {
        // Random direction
        if (Math.random() > 0.5) input.left = true;
        else input.right = true;
      }
      return input;
    }
    if (this.chaosTimer > 0) this.chaosTimer--;

    // Use special when ready and in range
    if (ai.specialCooldown <= 0 && dist < 400) {
      input.special = true;
      this.actionCooldown = 30;
      return input;
    }

    // Close range: heavy attack
    if (dist < 150 && ai.canAttack()) {
      input.heavyAttack = true;
      this.actionCooldown = 20;
      return input;
    }

    // Medium range: light attack
    if (dist < 300 && ai.canAttack()) {
      input.lightAttack = true;
      this.actionCooldown = 10;
      return input;
    }

    // Far: approach
    if (dist > 300) {
      if (dir === 1) input.right = true;
      else input.left = true;

      // Jump occasionally when approaching
      if (Math.random() < 0.02 && ai.grounded) {
        input.jump = true;
      }
    }

    return input;
  }

  onDamageTaken(): void {
    this.retreatTimer = 30 + Math.random() * 20;
  }
}
