import { type FighterConfig } from '../ai/fighterConfig';
import { type FighterState } from '../game/Fighter';

export const SYNC_RATE_MS = 50; // 20fps

export interface StateMessage {
  type: 'state';
  seq: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: FighterState;
  hp: number;
  specialCooldown: number;
  shieldActive: boolean;
}

export interface ActionMessage {
  type: 'attack';
  attack: 'light' | 'heavy' | 'special';
}

export interface FighterConfigMessage {
  type: 'fighter_ready';
  fighter: FighterConfig;
}

export interface PlayerJoinedMessage {
  type: 'player_joined';
}

export interface GameStartMessage {
  type: 'game_start';
}

export type GameMessage =
  | StateMessage
  | ActionMessage
  | FighterConfigMessage
  | PlayerJoinedMessage
  | GameStartMessage;

/** Drop messages with seq <= lastSeq (stale) */
export function isStale(seq: number, lastSeq: number): boolean {
  return seq <= lastSeq;
}
