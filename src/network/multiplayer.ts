// Multiplayer stub — Phase 2 implementation with Ably
// This file provides the interface for future WebSocket multiplayer

export interface MultiplayerRoom {
  roomCode: string;
  isHost: boolean;
}

export function createRoom(): Promise<MultiplayerRoom> {
  // Phase 2: Ably integration
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  return Promise.resolve({ roomCode: code, isHost: true });
}

export function joinRoom(_code: string): Promise<MultiplayerRoom> {
  // Phase 2: Ably integration
  return Promise.resolve({ roomCode: _code, isHost: false });
}
