import { type FighterConfig, validateFighterConfig, FALLBACK_FIGHTER } from './fighterConfig';

const API_URL = '/api/generate-fighter';

export async function generateFighter(prompt: string): Promise<FighterConfig> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.error('API error:', response.status);
      return FALLBACK_FIGHTER;
    }

    const data = await response.json() as Record<string, unknown>;

    // Surface server-side errors to browser console
    if (data._error) {
      console.error('[generateFighter] Server error:', data._error);
    }

    if (validateFighterConfig(data)) {
      return data;
    }

    console.error('[generateFighter] Invalid fighter config from API:', data);
    return FALLBACK_FIGHTER;
  } catch (err) {
    console.error('Failed to generate fighter:', err);
    return FALLBACK_FIGHTER;
  }
}

const AI_PROMPTS = [
  'A mysterious shadow ninja who speaks in riddles',
  'An over-caffeinated office worker who fights with staplers',
  'A retired pirate who misses the sea',
  'A sentient cactus with anger issues',
  'A disco dancer from the 70s who never stopped grooving',
  'A librarian who weaponized silence',
  'A conspiracy theorist hamster',
  'A grandma who learned martial arts from YouTube',
];

export function getRandomAIPrompt(): string {
  return AI_PROMPTS[Math.floor(Math.random() * AI_PROMPTS.length)];
}
