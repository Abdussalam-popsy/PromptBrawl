export interface MoveDefinition {
  name: string;
  type: 'light' | 'heavy' | 'special';
  multiplier: number;
  range: number;
  startup: number;    // ms before hit connects
  recovery: number;   // ms after hit before next action
  cooldown: number;   // ms (only for special)
  knockback: number;
  isProjectile: boolean;
  projectileSpeed?: number;
}

export const LIGHT_ATTACK_DEFS: Record<string, MoveDefinition> = {
  punch: {
    name: 'Punch', type: 'light', multiplier: 1.0,
    range: 80, startup: 50, recovery: 200, cooldown: 0, knockback: 3, isProjectile: false,
  },
  kick: {
    name: 'Kick', type: 'light', multiplier: 1.0,
    range: 90, startup: 60, recovery: 220, cooldown: 0, knockback: 4, isProjectile: false,
  },
  claw_swipe: {
    name: 'Claw Swipe', type: 'light', multiplier: 1.1,
    range: 75, startup: 40, recovery: 180, cooldown: 0, knockback: 2, isProjectile: false,
  },
  tail_whip: {
    name: 'Tail Whip', type: 'light', multiplier: 0.9,
    range: 100, startup: 70, recovery: 250, cooldown: 0, knockback: 5, isProjectile: false,
  },
  headbutt: {
    name: 'Headbutt', type: 'light', multiplier: 1.2,
    range: 60, startup: 80, recovery: 300, cooldown: 0, knockback: 6, isProjectile: false,
  },
};

export const HEAVY_ATTACK_DEFS: Record<string, MoveDefinition> = {
  body_slam: {
    name: 'Body Slam', type: 'heavy', multiplier: 1.8,
    range: 90, startup: 300, recovery: 400, cooldown: 0, knockback: 10, isProjectile: false,
  },
  ground_pound: {
    name: 'Ground Pound', type: 'heavy', multiplier: 1.8,
    range: 120, startup: 350, recovery: 450, cooldown: 0, knockback: 12, isProjectile: false,
  },
  spinning_strike: {
    name: 'Spinning Strike', type: 'heavy', multiplier: 1.8,
    range: 100, startup: 280, recovery: 380, cooldown: 0, knockback: 8, isProjectile: false,
  },
  lunge: {
    name: 'Lunge', type: 'heavy', multiplier: 1.8,
    range: 140, startup: 250, recovery: 350, cooldown: 0, knockback: 7, isProjectile: false,
  },
};

export const SPECIAL_DEFS: Record<string, MoveDefinition> = {
  coin_rain: {
    name: 'Coin Rain', type: 'special', multiplier: 2.0,
    range: 300, startup: 200, recovery: 500, cooldown: 5000, knockback: 5, isProjectile: true, projectileSpeed: 6,
  },
  fire_burst: {
    name: 'Fire Burst', type: 'special', multiplier: 2.2,
    range: 250, startup: 150, recovery: 400, cooldown: 5000, knockback: 8, isProjectile: true, projectileSpeed: 8,
  },
  ice_spike: {
    name: 'Ice Spike', type: 'special', multiplier: 1.8,
    range: 280, startup: 180, recovery: 450, cooldown: 5000, knockback: 6, isProjectile: true, projectileSpeed: 7,
  },
  bubble_shield: {
    name: 'Bubble Shield', type: 'special', multiplier: 0,
    range: 0, startup: 100, recovery: 300, cooldown: 7000, knockback: 0, isProjectile: false,
  },
  dash_strike: {
    name: 'Dash Strike', type: 'special', multiplier: 2.0,
    range: 200, startup: 100, recovery: 350, cooldown: 5000, knockback: 10, isProjectile: false,
  },
  heal_pulse: {
    name: 'Heal Pulse', type: 'special', multiplier: -15, // heals 15 HP
    range: 0, startup: 200, recovery: 500, cooldown: 8000, knockback: 0, isProjectile: false,
  },
  shockwave: {
    name: 'Shockwave', type: 'special', multiplier: 1.5,
    range: 350, startup: 250, recovery: 500, cooldown: 5000, knockback: 15, isProjectile: true, projectileSpeed: 10,
  },
  teleport_strike: {
    name: 'Teleport Strike', type: 'special', multiplier: 2.5,
    range: 400, startup: 50, recovery: 600, cooldown: 6000, knockback: 5, isProjectile: false,
  },
};

export const PROJECTILE_COLORS: Record<string, number> = {
  coins: 0xffd700,
  fire: 0xff4400,
  ice: 0x44ccff,
  bubbles: 0x88ddff,
  bones: 0xeeeecc,
  stars: 0xffff44,
  rocks: 0x886644,
  lightning: 0xffff00,
};

export function getMoveDef(moveType: 'light' | 'heavy' | 'special', moveName: string): MoveDefinition {
  switch (moveType) {
    case 'light': return LIGHT_ATTACK_DEFS[moveName] ?? LIGHT_ATTACK_DEFS.punch;
    case 'heavy': return HEAVY_ATTACK_DEFS[moveName] ?? HEAVY_ATTACK_DEFS.body_slam;
    case 'special': return SPECIAL_DEFS[moveName] ?? SPECIAL_DEFS.shockwave;
  }
}
