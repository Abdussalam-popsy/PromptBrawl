import { config as dotenvConfig } from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Ably from 'ably';

dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.error('[ably-token] ABLY_API_KEY is not set');
    return res.status(500).json({ error: 'ABLY_API_KEY not configured' });
  }

  const clientId = (req.query.clientId as string) || `user-${Date.now()}`;

  try {
    const ably = new Ably.Rest({ key: apiKey });
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: { '*': ['publish', 'subscribe', 'presence'] },
    });
    return res.status(200).json(tokenRequest);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ably-token] Failed to create token: ${msg}`);
    return res.status(500).json({ error: msg });
  }
}
