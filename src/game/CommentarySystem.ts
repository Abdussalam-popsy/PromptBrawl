export class CommentarySystem {
  private audioContext: AudioContext | null = null;
  private clips: Map<string, AudioBuffer> = new Map();
  private hasPlayed: Map<string, boolean> = new Map();
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async loadFromConfig(
    fighterName: string,
    commentary: Record<string, string> | null | undefined,
  ): Promise<void> {
    if (!commentary) return;

    const ctx = this.getContext();

    for (const [key, base64] of Object.entries(commentary)) {
      if (typeof base64 !== 'string' || base64.length === 0) continue;
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const buffer = await ctx.decodeAudioData(bytes.buffer);
        this.clips.set(`${fighterName}:${key}`, buffer);
      } catch (err) {
        console.warn(`[Commentary] Failed to decode ${fighterName}:${key}`, err);
      }
    }
  }

  play(fighterName: string, clipKey: string): void {
    const fullKey = `${fighterName}:${clipKey}`;
    const buffer = this.clips.get(fullKey);
    if (!buffer) return;

    // Don't replay same clip in same fight
    if (this.hasPlayed.get(fullKey)) return;

    // Don't overlap — queue gets lost, just skip
    if (this.isPlaying) return;

    try {
      const ctx = this.getContext();
      // Resume context if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      this.hasPlayed.set(fullKey, true);
      this.isPlaying = true;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
      };
      this.currentSource = source;
      source.start(0);
    } catch (err) {
      console.warn(`[Commentary] Playback failed for ${fullKey}`, err);
      this.isPlaying = false;
    }
  }

  playDelayed(fighterName: string, clipKey: string, delayMs: number): void {
    setTimeout(() => this.play(fighterName, clipKey), delayMs);
  }

  reset(): void {
    this.hasPlayed.clear();
    this.isPlaying = false;
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (_) { /* already ended */ }
      this.currentSource = null;
    }
  }

  destroy(): void {
    this.reset();
    this.clips.clear();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const commentary = new CommentarySystem();
