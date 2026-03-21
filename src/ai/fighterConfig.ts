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

export type BodyShape = "square" | "rectangle_tall" | "rectangle_wide" | "circle" | "triangle";
export type HeadShape = "circle" | "square" | "triangle" | "none";
export type LimbStyle = "normal" | "stubby" | "long" | "none";

export interface BackgroundConfig {
  name: string;
  sky_color: string;
  ground_color: string;
  mid_color: string;
  elements: string[];
  atmosphere: string;
}

export interface SilhouetteConfig {
  body_shape: BodyShape;
  body_width: number;
  body_height: number;
  head_shape: HeadShape;
  head_size: number;
  limb_style: LimbStyle;
  color_primary: string;
  color_outline: string;
  scale: number;
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
  background?: BackgroundConfig;
  silhouette?: SilhouetteConfig;
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

  // Validate optional background (soft validation — clamp/ignore bad values)
  if (c.background && typeof c.background === 'object') {
    const bg = c.background as Record<string, unknown>;
    if (typeof bg.name !== 'string') bg.name = 'Unknown Arena';
    if (typeof bg.sky_color !== 'string') bg.sky_color = '#1a1a2e';
    if (typeof bg.ground_color !== 'string') bg.ground_color = '#1a1a2e';
    if (typeof bg.mid_color !== 'string') bg.mid_color = '#2a2a3e';
    if (!Array.isArray(bg.elements)) bg.elements = [];
    if (typeof bg.atmosphere !== 'string') bg.atmosphere = 'neutral';
  }

  // Validate optional silhouette (soft validation — clamp values)
  if (c.silhouette && typeof c.silhouette === 'object') {
    const sil = c.silhouette as Record<string, unknown>;
    const validBodyShapes = ['square', 'rectangle_tall', 'rectangle_wide', 'circle', 'triangle'];
    const validHeadShapes = ['circle', 'square', 'triangle', 'none'];
    const validLimbStyles = ['normal', 'stubby', 'long', 'none'];
    if (!validBodyShapes.includes(sil.body_shape as string)) sil.body_shape = 'square';
    if (typeof sil.body_width !== 'number') sil.body_width = 60;
    if (typeof sil.body_height !== 'number') sil.body_height = 60;
    sil.body_width = Math.max(40, Math.min(120, sil.body_width as number));
    sil.body_height = Math.max(40, Math.min(120, sil.body_height as number));
    if (!validHeadShapes.includes(sil.head_shape as string)) sil.head_shape = 'circle';
    if (typeof sil.head_size !== 'number') sil.head_size = 30;
    sil.head_size = Math.max(20, Math.min(60, sil.head_size as number));
    if (!validLimbStyles.includes(sil.limb_style as string)) sil.limb_style = 'normal';
    if (typeof sil.color_primary !== 'string') sil.color_primary = '#666666';
    if (typeof sil.color_outline !== 'string') sil.color_outline = '#ffffff';
    if (typeof sil.scale !== 'number') sil.scale = 1.0;
    sil.scale = Math.max(0.8, Math.min(1.4, sil.scale as number));
  }

  return true;
}

export const FALLBACK_BACKGROUND: BackgroundConfig = {
  name: 'Default Arena',
  sky_color: '#0a0a1e',
  ground_color: '#1a1a2e',
  mid_color: '#151530',
  elements: ['distant buildings', 'dim streetlights'],
  atmosphere: 'urban night',
};

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
