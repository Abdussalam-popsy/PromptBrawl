import Ably from 'ably';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.ABLY_API_KEY;
  console.log('[ably-token] ABLY_API_KEY present:', !!apiKey, 'starts with:', apiKey?.slice(0, 10));

  if (!apiKey) {
    return res.status(500).json({ error: 'ABLY_API_KEY not set' });
  }

  try {
    const client = new Ably.Rest(apiKey);
    const clientId = (req.query.clientId as string) || 'anonymous';
    const token = await client.auth.createTokenRequest({ clientId });
    return res.status(200).json(token);
  } catch (err) {
    console.error('[ably-token] Error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
