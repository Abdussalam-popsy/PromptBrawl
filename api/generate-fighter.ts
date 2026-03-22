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

BACKGROUND: Infer the background from the character's home world, origin, or lore — NOT just their appearance.
Examples: SpongeBob → Bikini Bottom (underwater, sandy floor). A samurai → feudal Japanese castle (misty, stone walls). A robot → neon factory (industrial, glowing). A wizard → enchanted forest (magical, mossy).
Pick sky_color, ground_color, mid_color as hex colors that evoke that environment.
elements: 2-3 short visual landmark descriptions for the environment.
atmosphere: a short mood/theme descriptor.

SILHOUETTE: Choose a body_shape and proportions that match the character's build.
- Square/circle for stocky characters, rectangle_tall for lean ones, rectangle_wide for bulky/fat, triangle for top-heavy.
- body_width and body_height: 40-120 pixels each.
- head_shape: circle (default), square (robotic/boxy), triangle (pointy/alien), none (headless).
- head_size: 20-60 pixels.
- limb_style: normal (standard), stubby (short limbs — kids, round characters), long (lanky, spindly), none (blob/ghost/no limbs).
- color_primary: main body fill hex. color_outline: outline/glow hex.
- scale: 0.8-1.4 for small vs large characters.

ACCESSORY SELECTION — This is the most important visual decision.
Pick exactly ONE dominant_accessory that makes this character instantly recognisable. Think: what is the single most iconic visual detail a child would draw first?

RULES:
- Always pick the most iconic feature, never generic ones
- If the character has a famous face covering → mask or visor
- If the character has a famous hat → wizard_hat
- If the character has wings or a cape as their PRIMARY trait → wings or cape_large
- If nothing else fits → pick the closest available option

EXAMPLES — use these as your guide:
- SpongeBob → mask (square face patch effect)
- Mr. Krabs → giant_weapon (claw)
- Ninja / Snake Eyes / Scorpion → mask
- Batman → shoulder_plates (armor, no cape — cape is not readable)
- Wizard / Gandalf / Dumbledore → wizard_hat
- Superman / superhero → aura (energy presence)
- Angel → wings
- Demon / Devil → horns
- Darth Vader → mask + black (use mask)
- Samurai → giant_weapon
- Pirate → giant_weapon (sword)
- Robot / Cyborg → visor
- Ghost / Spirit → aura
- King / Queen / Crown character → wizard_hat (closest to crown)
- Athlete / Boxer → shoulder_plates
- Animal character with ears → horns (closest to ears)
- Invisible Man / Mystery character → visor

AVAILABLE OPTIONS (pick only from this list):
wizard_hat, horns, antenna, halo, shoulder_plates, scarf_trail, giant_weapon, visor, mask, wings, cape_large, spikes_back, aura

IMPORTANT: Never leave dominant_accessory null unless the prompt is literally a plain human with no iconic feature.
Always assign something. Iconic > accurate > generic.

Output schema:
{
  "name": string,
  "personality": string,
  "victory_line": string,
  "size_variant": "light" | "medium" | "heavy",
  "stats": { "speed": number, "damage": number, "defense": number, "chaos": number },
  "color_palette": { "primary": string, "secondary": string, "accent": string },
  "move_loadout": { "light_attack": string, "heavy_attack": string, "special": string, "projectile_sprite": string },
  "eye_expression": "neutral" | "angry" | "greedy" | "scared" | "unhinged",
  "background": { "name": string, "sky_color": string, "ground_color": string, "mid_color": string, "elements": string[], "atmosphere": string },
  "silhouette": { "body_shape": "square"|"rectangle_tall"|"rectangle_wide"|"circle"|"triangle", "body_width": number, "body_height": number, "head_shape": "circle"|"square"|"triangle"|"none", "head_size": number, "limb_style": "normal"|"stubby"|"long"|"none", "color_primary": string, "color_outline": string, "scale": number },
  "dominant_accessory": "wizard_hat"|"horns"|"wings"|"cape_large"|"shoulder_plates"|"antenna"|"scarf_trail"|"giant_weapon"|"halo"|"spikes_back"|"visor"|"mask"|"aura"|null
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
  background: { name: 'Default Arena', sky_color: '#0a0a1e', ground_color: '#1a1a2e', mid_color: '#151530', elements: ['distant buildings', 'dim streetlights'], atmosphere: 'urban night' },
  silhouette: { body_shape: 'square', body_width: 60, body_height: 60, head_shape: 'circle', head_size: 30, limb_style: 'normal', color_primary: '#666666', color_outline: '#999999', scale: 1.0 },
  dominant_accessory: null,
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
  background?: { name: string; sky_color: string; ground_color: string; mid_color: string; elements: string[]; atmosphere: string };
  silhouette?: { body_shape: string; body_width: number; body_height: number; head_shape: string; head_size: number; limb_style: string; color_primary: string; color_outline: string; scale: number };
  dominant_accessory?: string | null;
}

/** Clamp and fix — never reject. Returns null (success) always. */
function validate(data: FighterJSON): string | null {
  if (!data.name) data.name = 'Unknown Fighter';
  if (!data.personality) data.personality = 'Mysterious';
  if (!data.victory_line) data.victory_line = 'I win!';
  if (!['light', 'medium', 'heavy'].includes(data.size_variant)) data.size_variant = 'medium';
  if (!['neutral', 'angry', 'greedy', 'scared', 'unhinged'].includes(data.eye_expression)) data.eye_expression = 'neutral';

  if (!data.stats) {
    data.stats = { speed: 6, damage: 6, defense: 6, chaos: 6 };
  } else {
    const s = data.stats;
    if (typeof s.speed !== 'number') s.speed = 6;
    if (typeof s.damage !== 'number') s.damage = 6;
    if (typeof s.defense !== 'number') s.defense = 6;
    if (typeof s.chaos !== 'number') s.chaos = 6;
    s.speed = Math.min(10, Math.max(1, Math.round(s.speed)));
    s.damage = Math.min(10, Math.max(1, Math.round(s.damage)));
    s.defense = Math.min(10, Math.max(1, Math.round(s.defense)));
    s.chaos = Math.min(10, Math.max(1, Math.round(s.chaos)));

    // Force sum to 24 by adjusting the largest stat
    const sum = s.speed + s.damage + s.defense + s.chaos;
    if (sum !== 24) {
      const diff = 24 - sum;
      const fields: ('speed' | 'damage' | 'defense' | 'chaos')[] = ['speed', 'damage', 'defense', 'chaos'];
      fields.sort((a, b) => s[b] - s[a]);
      s[fields[0]] = Math.min(10, Math.max(1, s[fields[0]] + diff));
    }
  }

  if (!data.move_loadout) {
    data.move_loadout = { light_attack: 'punch', heavy_attack: 'body_slam', special: 'shockwave', projectile_sprite: 'rocks' };
  } else {
    if (!LIGHT_ATTACKS.includes(data.move_loadout.light_attack)) data.move_loadout.light_attack = 'punch';
    if (!HEAVY_ATTACKS.includes(data.move_loadout.heavy_attack)) data.move_loadout.heavy_attack = 'body_slam';
    if (!SPECIALS.includes(data.move_loadout.special)) data.move_loadout.special = 'shockwave';
    if (!PROJECTILES.includes(data.move_loadout.projectile_sprite)) data.move_loadout.projectile_sprite = 'rocks';
  }

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
  const body = req.body as { prompt?: string; playerIndex?: number } | undefined;
  const prompt = body?.prompt;
  const isP1 = (body?.playerIndex ?? 1) !== 2;

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
      max_tokens: 2048,
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

  // Generate commentary audio via ElevenLabs TTS (non-blocking — never breaks fighter gen)
  let commentary: Record<string, string> | null = null;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsKey && parsed.name) {
    try {
      const voiceId = '2EiwWnXFnvU5JabPnv8n'; // Clyde
      const lines: Record<string, string> = {
        intro: `${parsed.name} enters the arena!`,
        special: `${parsed.name} unleashes their special move!`,
        low_health: `${parsed.name} is on the ropes! One more hit could end it!`,
        victory: `${parsed.victory_line || parsed.name + ' wins!'}`,
      };

      const ttsResults = await Promise.allSettled(
        Object.entries(lines).map(async ([key, text]) => {
          const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'xi-api-key': elevenLabsKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg',
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_monolingual_v1',
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          });
          if (!ttsRes.ok) throw new Error(`TTS ${key}: ${ttsRes.status}`);
          const arrayBuf = await ttsRes.arrayBuffer();
          const base64 = Buffer.from(arrayBuf).toString('base64');
          return { key, base64 };
        })
      );

      commentary = {};
      for (const result of ttsResults) {
        if (result.status === 'fulfilled') {
          commentary[result.value.key] = result.value.base64;
        }
      }
      // If no clips succeeded, null out
      if (Object.keys(commentary).length === 0) commentary = null;
      else console.log(`[generate-fighter] Commentary generated: ${Object.keys(commentary).join(', ')}`);
    } catch (ttsErr) {
      console.warn(`[generate-fighter] Commentary generation failed (non-fatal):`, ttsErr);
      commentary = null;
    }
  }

  // Generate sprite image via fal.ai (non-blocking — never breaks fighter gen)
  let sprite_url: string | null = null;
  const falKey = process.env.FAL_API_KEY;
  if (falKey && parsed.name) {
    try {
      const [spriteResult] = await Promise.allSettled([
        fetch('https://fal.run/fal-ai/nano-banana-pro', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `${parsed.name} as a fighting game character, flat vector illustration, transparent background, full body, ${isP1 ? 'facing right' : 'facing left'}, bold colors, clean lines`,
            num_images: 1,
            aspect_ratio: '1:1',
            output_format: 'png',
            resolution: '1K',
            limit_generations: true,
          }),
        }).then(async (r) => {
          if (!r.ok) throw new Error(`fal.ai ${r.status}`);
          return r.json();
        }),
      ]);
      if (spriteResult.status === 'fulfilled') {
        const images = spriteResult.value?.images;
        sprite_url = images?.[0]?.url ?? null;
        if (sprite_url) {
          console.log(`[generate-fighter] Sprite generated: ${sprite_url.substring(0, 80)}...`);
          // Remove background via birefnet
          try {
            const bgRemovalResponse = await fetch('https://fal.run/fal-ai/birefnet', {
              method: 'POST',
              headers: {
                'Authorization': `Key ${falKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image_url: sprite_url,
                model: 'General Use (Light)',
              }),
            });
            if (bgRemovalResponse.ok) {
              const bgData = await bgRemovalResponse.json();
              const cleanUrl = bgData?.image?.url ?? null;
              if (cleanUrl) {
                console.log(`[generate-fighter] BG removed: ${cleanUrl.substring(0, 80)}...`);
                sprite_url = cleanUrl;
              }
            }
          } catch (bgErr) {
            console.warn('[generate-fighter] BG removal failed (non-fatal):', bgErr);
          }
        }
      }
    } catch (falErr) {
      console.warn('[generate-fighter] Sprite generation failed (non-fatal):', falErr);
    }
  }

  return res.status(200).json({ ...parsed, commentary, sprite_url });
}
