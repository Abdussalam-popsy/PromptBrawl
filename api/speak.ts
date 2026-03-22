import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body ?? {};
  if (!text || typeof text !== 'string' || text.length > 500) {
    return res.status(400).json({ error: 'Invalid or missing text (max 500 chars)' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  const voiceId = '2EiwWnXFnvU5JabPnv8n'; // Clyde

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });

    if (!ttsRes.ok) {
      console.error('[speak] ElevenLabs error:', ttsRes.status, await ttsRes.text());
      return res.status(502).json({ error: 'TTS generation failed' });
    }

    const arrayBuffer = await ttsRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({ audio: base64 });
  } catch (err) {
    console.error('[speak] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
