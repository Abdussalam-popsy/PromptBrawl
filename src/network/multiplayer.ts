import * as Ably from 'ably';
import { type FighterConfig } from '../ai/fighterConfig';
import {
  type StateMessage,
  type ActionMessage,
  type GameMessage,
  isStale,
} from './syncProtocol';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export class MultiplayerSession {
  private client: Ably.Realtime | null = null;
  private channel: Ably.RealtimeChannel | null = null;
  private lastReceivedSeq: number = -1;
  private seq: number = 0;

  roomCode: string = '';
  isHost: boolean = false;
  clientId: string = '';

  // Callbacks
  onPeerJoined: (() => void) | null = null;
  onPeerLeft: (() => void) | null = null;
  onFighterConfig: ((config: FighterConfig) => void) | null = null;
  onGameStart: (() => void) | null = null;
  onState: ((state: StateMessage) => void) | null = null;
  onAction: ((action: ActionMessage) => void) | null = null;
  onConnectionChange: ((status: ConnectionStatus) => void) | null = null;

  async connect(clientId: string): Promise<void> {
    this.clientId = clientId;

    // Fetch token from server
    const response = await fetch(`/api/ably-token?clientId=${encodeURIComponent(clientId)}`);
    if (!response.ok) {
      throw new Error(`Token fetch failed: ${response.status}`);
    }
    const tokenRequest = await response.json();

    this.client = new Ably.Realtime({
      authCallback: (_, callback) => {
        callback(null, tokenRequest);
      },
      clientId,
    });

    // Monitor connection state
    this.client.connection.on('connected', () => {
      this.onConnectionChange?.('connected');
    });
    this.client.connection.on('disconnected', () => {
      this.onConnectionChange?.('disconnected');
    });
    this.client.connection.on('failed', () => {
      this.onConnectionChange?.('disconnected');
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      if (!this.client) return reject(new Error('No client'));
      this.client.connection.once('connected', () => resolve());
      this.client.connection.once('failed', (err) =>
        reject(new Error(`Connection failed: ${err?.reason?.message ?? 'unknown'}`))
      );
    });
  }

  async createRoom(): Promise<string> {
    if (!this.client) throw new Error('Not connected');

    this.roomCode = generateRoomCode();
    this.isHost = true;
    this.channel = this.client.channels.get(`room:${this.roomCode}`);

    this.subscribeToMessages();
    this.subscribeToPresence();

    await this.channel.presence.enter({ role: 'host' });
    return this.roomCode;
  }

  async joinRoom(code: string): Promise<void> {
    if (!this.client) throw new Error('Not connected');

    this.roomCode = code.toUpperCase();
    this.isHost = false;
    this.channel = this.client.channels.get(`room:${this.roomCode}`);

    this.subscribeToMessages();
    this.subscribeToPresence();

    await this.channel.presence.enter({ role: 'guest' });

    // Notify host that guest joined
    await this.channel.publish('game', JSON.stringify({ type: 'player_joined' }));
  }

  private subscribeToMessages(): void {
    if (!this.channel) return;

    this.channel.subscribe('game', (message) => {
      try {
        const data = JSON.parse(message.data as string) as GameMessage;
        // Ignore our own messages
        if (message.clientId === this.clientId) return;

        switch (data.type) {
          case 'player_joined':
            this.onPeerJoined?.();
            break;
          case 'fighter_ready':
            this.onFighterConfig?.(data.fighter);
            break;
          case 'state':
            if (!isStale(data.seq, this.lastReceivedSeq)) {
              this.lastReceivedSeq = data.seq;
              this.onState?.(data);
            }
            break;
          case 'attack':
            this.onAction?.(data);
            break;
          case 'game_start':
            this.onGameStart?.();
            break;
        }
      } catch (err) {
        console.error('[multiplayer] Failed to parse message:', err);
      }
    });
  }

  private subscribeToPresence(): void {
    if (!this.channel) return;

    this.channel.presence.subscribe('leave', (member) => {
      if (member.clientId !== this.clientId) {
        this.onPeerLeft?.();
      }
    });
  }

  sendGameStart(): void {
    const msg: GameMessage = { type: 'game_start' };
    this.channel?.publish('game', JSON.stringify(msg));
  }

  sendFighterConfig(config: FighterConfig): void {
    const msg: GameMessage = { type: 'fighter_ready', fighter: config };
    this.channel?.publish('game', JSON.stringify(msg));
  }

  sendState(state: Omit<StateMessage, 'type' | 'seq'>): void {
    const msg: StateMessage = {
      ...state,
      type: 'state',
      seq: this.seq++,
    };
    this.channel?.publish('game', JSON.stringify(msg));
  }

  sendAction(attack: 'light' | 'heavy' | 'special'): void {
    const msg: ActionMessage = { type: 'attack', attack };
    this.channel?.publish('game', JSON.stringify(msg));
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.presence.leave();
      this.channel.detach();
      this.channel = null;
    }
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.lastReceivedSeq = -1;
    this.seq = 0;
  }
}
