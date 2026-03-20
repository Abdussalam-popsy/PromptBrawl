import { config as dotenvConfig } from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Load .env.local for local dev — no-ops in production where env is set via Vercel dashboard
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const SYSTEM_PROMPT = `You are a fighting game designer. Convert character descriptions into fighters using a predefined template system. Output ONLY valid JSON matching the schema exactly. No markdown, no code fences, no explanation — just the JSON object.

Stats must sum to exactly 24. Each stat must be between 1 and 10.
size_variant must be one of: light, medium, heavy
eye_expression must be one of: neutral, angry, greedy, scared, unhinged

move_loadout fields must come from these lists ONLY:
light_attack: punch, kick, claw_swipe, tail_whip, headbutt
heavy_attack: body_slam, ground_pound, spinning_strike, lunge
special: coin_rain, fire_burst, ice_spike, bubble_shield, dash_strike, heal_pulse, shockwave, teleport_strike
projectile_sprite: coins, fire, ice, bubbles, bones, stars, rocks, lightning

If the prompt is vague, invent something rich and funny.
If specific, be faithful and creative.
Victory lines must match the character personality — be witty and entertaining.

color_palette values must be valid hex color strings like "#ff4400".

Output schema:
{
  "name": string,
  "personality": string,
  "victory_line": string,
  "size_variant": "light" | "medium" | "heavy",
  "stats": { "speed": number, "damage": number, "defense": number, "chaos": number },
  "color_palette": { "primary": string, "secondary": string, "accent": string },
  "move_loadout": { "light_attack": string, "heavy_attack": string, "special": string, "projectile_sprite": string },
  "eye_expression": "neutral" | "angry" | "greedy" | "scared" | "unhinged"
}`;

const LIGHT_ATTACKS = ['punch', 'kick', 'claw_swipe', 'tail_whip', 'headbutt'];
const HEAVY_ATTACKS = ['body_slam', 'ground_pound', 'spinning_strike', 'lunge'];
const SPECIALS = ['coin_rain', 'fire_burst', 'ice_spike', 'bubble_shield', 'dash_strike', 'heal_pulse', 'shockwave', 'teleport_strike'];
const PROJECTILES = ['coins', 'fire', 'ice', 'bubbles', 'bones', 'stars', 'rocks', 'lightning'];

const FALLBACK = {
  name: 'Default Dan',
  personality: 'A generic fighter who showed up because the AI had a bad day',
  victory_line: 'I win by default. Literally.',
  size_variant: 'medium',
  stats: { speed: 6, damage: 6, defense: 6, chaos: 6 },
  color_palette: { primary: '#666666', secondary: '#999999', accent: '#cccccc' },
  move_loadout: { light_attack: 'punch', heavy_attack: 'body_slam', special: 'shockwave', projectile_sprite: 'rocks' },
  eye_expression: 'neutral',
};

interface FighterJSON {
  name: string;
  personality: string;
  victory_line: string;
  size_variant: string;
  stats: { speed: number; damage: number; defense: number; chaos: number };
  color_palette: { primary: string; secondary: string; accent: string };
  move_loadout: { light_attack: string; heavy_attack: string; special: string; projectile_sprite: string };
  eye_expression: string;
}

function validate(data: FighterJSON): string | null {
  if (!data.name) return 'missing name';
  if (!data.personality) return 'missing personality';
  if (!data.victory_line) return 'missing victory_line';
  if (!['light', 'medium', 'heavy'].includes(data.size_variant)) return `invalid size_variant: ${data.size_variant}`;
  if (!['neutral', 'angry', 'greedy', 'scared', 'unhinged'].includes(data.eye_expression)) return `invalid eye_expression: ${data.eye_expression}`;

  if (!data.stats) return 'missing stats';
  const { speed, damage, defense, chaos } = data.stats;
  if ([speed, damage, defense, chaos].some(v => typeof v !== 'number' || v < 1 || v > 10)) return `stats out of range: ${JSON.stringify(data.stats)}`;
  if (speed + damage + defense + chaos !== 24) return `stats sum to ${speed + damage + defense + chaos}, expected 24`;

  if (!data.move_loadout) return 'missing move_loadout';
  if (!LIGHT_ATTACKS.includes(data.move_loadout.light_attack)) return `invalid light_attack: ${data.move_loadout.light_attack}`;
  if (!HEAVY_ATTACKS.includes(data.move_loadout.heavy_attack)) return `invalid heavy_attack: ${data.move_loadout.heavy_attack}`;
  if (!SPECIALS.includes(data.move_loadout.special)) return `invalid special: ${data.move_loadout.special}`;
  if (!PROJECTILES.includes(data.move_loadout.projectile_sprite)) return `invalid projectile_sprite: ${data.move_loadout.projectile_sprite}`;

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key upfront
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[generate-fighter] ANTHROPIC_API_KEY is not set');
    return res.status(200).json({ ...FALLBACK, _error: 'ANTHROPIC_API_KEY is not set in environment variables' });
  }
  console.log(`[generate-fighter] API key loaded: ${apiKey.substring(0, 10)}...`);

  // Parse prompt
  const body = req.body as { prompt?: string } | undefined;
  const prompt = body?.prompt;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.error('[generate-fighter] Empty or missing prompt');
    return res.status(200).json({ ...FALLBACK, _error: 'Empty or missing prompt in request body' });
  }
  if (prompt.length > 500) {
    console.error(`[generate-fighter] Prompt too long: ${prompt.length}`);
    return res.status(200).json({ ...FALLBACK, _error: `Prompt too long: ${prompt.length} chars (max 500)` });
  }

  const trimmedPrompt = prompt.trim();

  // Initialize Anthropic client inside handler
  let Anthropic: typeof import('@anthropic-ai/sdk').default;
  try {
    Anthropic = (await import('@anthropic-ai/sdk')).default;
  } catch (initErr) {
    const msg = `Failed to import Anthropic SDK: ${initErr instanceof Error ? initErr.message : String(initErr)}`;
    console.error(`[generate-fighter] ${msg}`);
    return res.status(200).json({ ...FALLBACK, _error: msg });
  }

  const client = new Anthropic({ apiKey });

  // Call Claude API
  let rawText: string;
  try {
    console.log(`[generate-fighter] Calling Claude with prompt: "${trimmedPrompt.substring(0, 80)}..."`);
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: trimmedPrompt }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      const msg = `Claude returned no text content. Content blocks: ${JSON.stringify(message.content.map(b => b.type))}`;
      console.error(`[generate-fighter] ${msg}`);
      return res.status(200).json({ ...FALLBACK, _error: msg });
    }
    rawText = textBlock.text;
    console.log(`[generate-fighter] Claude raw response (first 200 chars): ${rawText.substring(0, 200)}`);
  } catch (apiErr) {
    const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
    const errName = apiErr instanceof Error ? apiErr.constructor.name : 'Unknown';
    const msg = `Claude API call failed [${errName}]: ${errMsg}`;
    console.error(`[generate-fighter] ${msg}`);
    return res.status(200).json({ ...FALLBACK, _error: msg });
  }

  // Parse JSON from response
  let parsed: FighterJSON;
  try {
    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    parsed = JSON.parse(jsonStr) as FighterJSON;
  } catch (jsonErr) {
    const msg = `Failed to parse Claude response as JSON: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}. Raw: ${rawText.substring(0, 300)}`;
    console.error(`[generate-fighter] ${msg}`);
    return res.status(200).json({ ...FALLBACK, _error: msg });
  }

  // Validate
  const validationError = validate(parsed);
  if (validationError) {
    const msg = `Validation failed: ${validationError}. Parsed: ${JSON.stringify(parsed).substring(0, 300)}`;
    console.error(`[generate-fighter] ${msg}`);
    return res.status(200).json({ ...FALLBACK, _error: msg });
  }

  console.log(`[generate-fighter] Success: generated "${parsed.name}"`);
  return res.status(200).json(parsed);
}
