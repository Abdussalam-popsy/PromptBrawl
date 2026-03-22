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

export type DominantAccessory =
  | "wizard_hat"
  | "horns"
  | "wings"
  | "cape_large"
  | "shoulder_plates"
  | "antenna"
  | "scarf_trail"
  | "giant_weapon"
  | "halo"
  | "spikes_back"
  | "visor"
  | "mask"
  | "aura";

export const DOMINANT_ACCESSORIES: DominantAccessory[] = [
  "wizard_hat", "horns", "wings", "cape_large", "shoulder_plates",
  "antenna", "scarf_trail", "giant_weapon", "halo", "spikes_back",
  "visor", "mask", "aura",
];

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
  dominant_accessory?: DominantAccessory | null;
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

  // Clamp strings — fallback if missing
  if (typeof c.name !== "string" || !c.name) c.name = "Unknown Fighter";
  if (typeof c.personality !== "string") c.personality = "Mysterious";
  if (typeof c.victory_line !== "string") c.victory_line = "I win!";

  if (!["light", "medium", "heavy"].includes(c.size_variant as string))
    c.size_variant = "medium";
  if (
    !["neutral", "angry", "greedy", "scared", "unhinged"].includes(
      c.eye_expression as string,
    )
  )
    c.eye_expression = "neutral";

  // Clamp stats — never reject
  const stats = c.stats as Record<string, unknown> | undefined;
  if (!stats || typeof stats !== "object") {
    c.stats = { speed: 6, damage: 6, defense: 6, chaos: 6 };
  } else {
    if (typeof stats.speed !== "number") stats.speed = 6;
    if (typeof stats.damage !== "number") stats.damage = 6;
    if (typeof stats.defense !== "number") stats.defense = 6;
    if (typeof stats.chaos !== "number") stats.chaos = 6;
    stats.speed = Math.min(10, Math.max(1, Math.round(stats.speed as number)));
    stats.damage = Math.min(10, Math.max(1, Math.round(stats.damage as number)));
    stats.defense = Math.min(10, Math.max(1, Math.round(stats.defense as number)));
    stats.chaos = Math.min(10, Math.max(1, Math.round(stats.chaos as number)));

    // Force sum to 24 by adjusting the largest stat
    const sum = (stats.speed as number) + (stats.damage as number) + (stats.defense as number) + (stats.chaos as number);
    if (sum !== 24) {
      const diff = 24 - sum;
      const fields: ('speed' | 'damage' | 'defense' | 'chaos')[] = ['speed', 'damage', 'defense', 'chaos'];
      // Sort by value descending — adjust the largest stat
      fields.sort((a, b) => (stats[b] as number) - (stats[a] as number));
      const adjusted = Math.min(10, Math.max(1, (stats[fields[0]] as number) + diff));
      stats[fields[0]] = adjusted;
    }
  }

  // Clamp color_palette
  const palette = c.color_palette as Record<string, unknown> | undefined;
  if (!palette || typeof palette !== "object") {
    c.color_palette = { primary: "#666666", secondary: "#999999", accent: "#cccccc" };
  } else {
    if (typeof palette.primary !== "string") palette.primary = "#666666";
    if (typeof palette.secondary !== "string") palette.secondary = "#999999";
    if (typeof palette.accent !== "string") palette.accent = "#cccccc";
  }

  // Clamp move_loadout
  const moves = c.move_loadout as Record<string, unknown> | undefined;
  if (!moves || typeof moves !== "object") {
    c.move_loadout = { light_attack: "punch", heavy_attack: "body_slam", special: "shockwave", projectile_sprite: "rocks" };
  } else {
    if (!LIGHT_ATTACKS.includes(moves.light_attack as LightAttack)) moves.light_attack = "punch";
    if (!HEAVY_ATTACKS.includes(moves.heavy_attack as HeavyAttack)) moves.heavy_attack = "body_slam";
    if (!SPECIALS.includes(moves.special as Special)) moves.special = "shockwave";
    if (!PROJECTILES.includes(moves.projectile_sprite as ProjectileSprite)) moves.projectile_sprite = "rocks";
  }

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

  // Validate optional dominant_accessory (soft — null out invalid values)
  if (c.dominant_accessory != null) {
    if (typeof c.dominant_accessory !== 'string' || !DOMINANT_ACCESSORIES.includes(c.dominant_accessory as DominantAccessory)) {
      c.dominant_accessory = null;
    }
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
