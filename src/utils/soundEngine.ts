import { AudioScale, AudioWaveform } from '../types/algorithm';

export type SoundEventKind = 'access' | 'compare' | 'swap' | 'verify';

// C major pentatonic semitone offsets across octaves
const PENTATONIC_OFFSETS = [0, 2, 4, 7, 9];

class SoundOfSortingWebAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  private enabled = true;
  private volume = 0.45;
  private waveform: AudioWaveform = 'triangle';
  private scale: AudioScale = 'bingmann';
  private sustainMs = 55;

  private activeVoices = 0;
  private readonly maxVoices = 8;
  private lastPlayedAt = 0;
  private lastFreqHz = 0;
  private lastNoteTime = 0;

  private initGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      const ctx = new AudioCtx();

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3400;
      filter.Q.value = 0.7;

      const masterGain = ctx.createGain();
      masterGain.gain.value = this.volume;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.08;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;

      filter.connect(masterGain);
      masterGain.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(ctx.destination);

      this.ctx = ctx;
      this.filter = filter;
      this.masterGain = masterGain;
      this.compressor = compressor;
      this.analyser = analyser;
    }

    return this.ctx;
  }

  /**
   * Must be invoked synchronously inside user click/touch handlers so browsers
   * unlock Web Audio playback immediately (especially inside iframes).
   */
  public unlock(): void {
    const ctx = this.initGraph();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (val) this.unlock();
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.015);
    }
  }

  public setWaveform(wf: AudioWaveform): void {
    this.waveform = wf;
  }

  public setScale(scale: AudioScale): void {
    this.scale = scale;
  }

  public setSustainMs(ms: number): void {
    this.sustainMs = Math.max(20, Math.min(160, ms));
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getLastFrequency(): { hz: number; active: boolean } {
    const active = performance.now() - this.lastNoteTime < Math.max(120, this.sustainMs + 80);
    return { hz: active ? Math.round(this.lastFreqHz) : 0, active };
  }

  private mapValueToFrequency(normalizedValue: number, kind: SoundEventKind): number {
    const x = Math.max(0, Math.min(1, normalizedValue));

    if (kind === 'verify') {
      // Bright ascending Sound of Sorting verification sweep (180 Hz -> 1320 Hz)
      return 180 + x * 1140;
    }

    switch (this.scale) {
      case 'bingmann': {
        // Authentic Timo Bingmann Sound of Sorting quadratic pitch curve
        return 120 + 1200 * x * x;
      }
      case 'linear': {
        return 140 + x * 1160;
      }
      case 'pentatonic': {
        // 3 octaves of C major pentatonic (15 musical notes, C3 to C6)
        const totalNotes = 16;
        const step = Math.min(totalNotes - 1, Math.floor(x * totalNotes));
        const octave = Math.floor(step / PENTATONIC_OFFSETS.length);
        const semitone = octave * 12 + PENTATONIC_OFFSETS[step % PENTATONIC_OFFSETS.length];
        const midi = 48 + semitone; // C3 = 48
        return 440 * Math.pow(2, (midi - 69) / 12);
      }
      case 'chromatic': {
        // 3 octaves chromatic scale (C3 to C6)
        const midi = 48 + Math.round(x * 36);
        return 440 * Math.pow(2, (midi - 69) / 12);
      }
    }
  }

  public playTone(
    normalizedValue: number,
    kind: SoundEventKind = 'access',
    secondaryNormalizedValue?: number | null
  ): void {
    if (!this.enabled || this.volume <= 0.005) return;

    const nowMs = performance.now();
    const minIntervalMs = kind === 'verify' ? 14 : 16;
    if (nowMs - this.lastPlayedAt < minIntervalMs) return;
    if (this.activeVoices >= this.maxVoices) return;

    const ctx = this.initGraph();
    if (!ctx || !this.filter) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    this.lastPlayedAt = nowMs;
    const freq = this.mapValueToFrequency(normalizedValue, kind);
    this.lastFreqHz = freq;
    this.lastNoteTime = nowMs;

    const durSec = (kind === 'verify' ? Math.max(45, this.sustainMs) : this.sustainMs) / 1000;
    this.triggerVoice(ctx, freq, durSec, kind, 1.0);

    // Subtle harmonic companion tone on swaps / dual-element comparisons
    if (
      secondaryNormalizedValue !== undefined &&
      secondaryNormalizedValue !== null &&
      this.activeVoices < this.maxVoices - 1
    ) {
      const secFreq = this.mapValueToFrequency(secondaryNormalizedValue, kind);
      if (Math.abs(secFreq - freq) > 15) {
        this.triggerVoice(ctx, secFreq, durSec * 0.85, kind, 0.55);
      }
    }
  }

  private triggerVoice(
    ctx: AudioContext,
    freq: number,
    durSec: number,
    kind: SoundEventKind,
    weight: number
  ): void {
    if (!this.filter) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = kind === 'verify' ? 'sine' : this.waveform;
    osc.frequency.setValueAtTime(freq, now);

    // Slight pitch articulation on swaps for tactile clarity
    if (kind === 'swap') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 1.03), now + durSec * 0.6);
    }

    const attackSec = 0.004;
    const peakGain = (kind === 'verify' ? 0.52 : kind === 'swap' ? 0.48 : 0.42) * weight;

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peakGain, now + attackSec);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

    osc.connect(env);
    env.connect(this.filter);

    this.activeVoices++;
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      osc.disconnect();
      env.disconnect();
    };

    osc.start(now);
    osc.stop(now + durSec + 0.015);
  }

  /**
   * Plays a crisp ascending 6-note Web Audio arpeggio so the user can test
   * waveform, scale, sustain, and volume immediately.
   */
  public playTestArpeggio(): void {
    this.unlock();
    const ctx = this.initGraph();
    if (!ctx || !this.filter) return;

    const steps = [0.05, 0.24, 0.43, 0.62, 0.81, 1.0];
    const durSec = Math.max(0.075, this.sustainMs / 1000);

    steps.forEach((norm, idx) => {
      const startAt = ctx.currentTime + idx * 0.07;
      const freq = this.mapValueToFrequency(norm, 'access');
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = this.waveform;
      osc.frequency.setValueAtTime(freq, startAt);

      env.gain.setValueAtTime(0.0001, startAt);
      env.gain.linearRampToValueAtTime(0.5, startAt + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, startAt + durSec);

      osc.connect(env);
      env.connect(this.filter!);

      osc.start(startAt);
      osc.stop(startAt + durSec + 0.02);

      if (idx === steps.length - 1) {
        this.lastFreqHz = freq;
        this.lastNoteTime = performance.now() + idx * 70;
      }
    });
  }
}

export const soundEngine = new SoundOfSortingWebAudio();
