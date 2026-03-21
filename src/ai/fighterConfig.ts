export type SizeVariant = "light" | "medium" | "heavy";

export type EyeExpression =
  | "neutral"
  | "angry"
  | "greedy"
  | "scared"
  | "unhinged";

export type LightAttack =
  | "punch"
  | "kick"
  | "claw_swipe"
  | "tail_whip"
  | "headbutt";
export type HeavyAttack =
  | "body_slam"
  | "ground_pound"
  | "spinning_strike"
  | "lunge";
export type Special =
  | "coin_rain"
  | "fire_burst"
  | "ice_spike"
  | "bubble_shield"
  | "dash_strike"
  | "heal_pulse"
  | "shockwave"
  | "teleport_strike";
export type ProjectileSprite =
  | "coins"
  | "fire"
  | "ice"
  | "bubbles"
  | "bones"
  | "stars"
  | "rocks"
  | "lightning";

export interface FighterStats {
  speed: number;
  damage: number;
  defense: number;
  chaos: number;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface MoveLoadout {
  light_attack: LightAttack;
  heavy_attack: HeavyAttack;
  special: Special;
  projectile_sprite: ProjectileSprite;
}

export interface FighterConfig {
  name: string;
  personality: string;
  victory_line: string;
  size_variant: SizeVariant;
  stats: FighterStats;
  color_palette: ColorPalette;
  move_loadout: MoveLoadout;
  eye_expression: EyeExpression;
}

export const LIGHT_ATTACKS: LightAttack[] = [
  "punch",
  "kick",
  "claw_swipe",
  "tail_whip",
  "headbutt",
];
export const HEAVY_ATTACKS: HeavyAttack[] = [
  "body_slam",
  "ground_pound",
  "spinning_strike",
  "lunge",
];
export const SPECIALS: Special[] = [
  "coin_rain",
  "fire_burst",
  "ice_spike",
  "bubble_shield",
  "dash_strike",
  "heal_pulse",
  "shockwave",
  "teleport_strike",
];
export const PROJECTILES: ProjectileSprite[] = [
  "coins",
  "fire",
  "ice",
  "bubbles",
  "bones",
  "stars",
  "rocks",
  "lightning",
];

export function validateFighterConfig(
  config: unknown,
): config is FighterConfig {
  if (!config || typeof config !== "object") return false;
  const c = config as Record<string, unknown>;

  if (typeof c.name !== "string" || !c.name) return false;
  if (typeof c.personality !== "string") return false;
  if (typeof c.victory_line !== "string") return false;

  if (!["light", "medium", "heavy"].includes(c.size_variant as string))
    return false;
  if (
    !["neutral", "angry", "greedy", "scared", "unhinged"].includes(
      c.eye_expression as string,
    )
  )
    return false;

  const stats = c.stats as Record<string, unknown>;
  if (!stats || typeof stats !== "object") return false;
  const { speed, damage, defense, chaos } = stats;
  if (
    typeof speed !== "number" ||
    typeof damage !== "number" ||
    typeof defense !== "number" ||
    typeof chaos !== "number"
  )
    return false;
  if (speed + damage + defense + chaos !== 24) return false;
  if (speed < 1 || damage < 1 || defense < 1 || chaos < 1) return false;

  const palette = c.color_palette as Record<string, unknown>;
  if (
    !palette ||
    typeof palette.primary !== "string" ||
    typeof palette.secondary !== "string" ||
    typeof palette.accent !== "string"
  )
    return false;

  const moves = c.move_loadout as Record<string, unknown>;
  if (!moves) return false;
  if (!LIGHT_ATTACKS.includes(moves.light_attack as LightAttack)) return false;
  if (!HEAVY_ATTACKS.includes(moves.heavy_attack as HeavyAttack)) return false;
  if (!SPECIALS.includes(moves.special as Special)) return false;
  if (!PROJECTILES.includes(moves.projectile_sprite as ProjectileSprite))
    return false;

  return true;
}

export const FALLBACK_FIGHTER: FighterConfig = {
  name: "Default Dan",
  personality: "A generic fighter who showed up because the AI had a bad day",
  victory_line: "I win by default. Literally.",
  size_variant: "medium",
  stats: { speed: 6, damage: 6, defense: 6, chaos: 6 },
  color_palette: {
    primary: "#E0E0E0",
    secondary: "#21E2FF",
    accent: "#FF2D7B",
  },
  move_loadout: {
    light_attack: "punch",
    heavy_attack: "body_slam",
    special: "shockwave",
    projectile_sprite: "rocks",
  },
  eye_expression: "neutral",
};
