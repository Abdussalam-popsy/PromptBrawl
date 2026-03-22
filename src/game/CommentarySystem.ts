export class CommentarySystem {
  private audioContext: AudioContext | null = null;
  private clips: Map<string, AudioBuffer> = new Map();
  private hasPlayed: Map<string, boolean> = new Map();
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private loadPromise: Promise<void> = Promise.resolve();
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /** Warm up AudioContext — call from a user gesture handler (click/tap) */
  warmUp(): void {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  async loadFromConfig(
    fighterName: string,
    commentary: Record<string, string> | null | undefined,
  ): Promise<void> {
    if (!commentary) return;

    // Chain onto existing load so playDelayed can await all loads
    this.loadPromise = this.loadPromise.then(async () => {
      const ctx = this.getContext();

      for (const [key, base64] of Object.entries(commentary)) {
        if (typeof base64 !== 'string' || base64.length === 0) continue;
        try {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          // Copy buffer to avoid detached ArrayBuffer issues
          const copy = bytes.buffer.slice(0);
          const buffer = await ctx.decodeAudioData(copy);
          this.clips.set(`${fighterName}:${key}`, buffer);
        } catch (err) {
          console.warn(`[Commentary] Failed to decode ${fighterName}:${key}`, err);
        }
      }
    });

    return this.loadPromise;
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
        ctx.resume().catch(() => {});
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
    const id = setTimeout(async () => {
      // Wait for all loads to finish before attempting playback
      await this.loadPromise;
      this.play(fighterName, clipKey);
    }, delayMs);
    this.pendingTimeouts.push(id);
  }

  reset(): void {
    this.hasPlayed.clear();
    this.isPlaying = false;
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch (_) { /* already ended */ }
      this.currentSource = null;
    }
  }

  /** Generate and play TTS in real-time via /api/speak endpoint */
  async playImmediate(text: string): Promise<void> {
    if (this.isPlaying) return;

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        console.warn('[Commentary] /api/speak failed:', res.status);
        return;
      }
      const { audio } = await res.json();
      if (!audio) return;

      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

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
      console.warn('[Commentary] playImmediate failed:', err);
      this.isPlaying = false;
    }
  }

  destroy(): void {
    this.reset();
    // Cancel all pending delayed playbacks
    this.pendingTimeouts.forEach(id => clearTimeout(id));
    this.pendingTimeouts = [];
    this.clips.clear();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const commentary = new CommentarySystem();
