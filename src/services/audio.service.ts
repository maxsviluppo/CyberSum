
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private ambientInterval: any = null;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Suono tipo serratura meccanica - tonfo con variazioni
  playReelStop() {
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const variation = Math.random() * 0.3 + 0.85;

    // Primo tonfo (parte meccanica) - VOLUME AUMENTATO
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80 * variation, now);
    osc1.frequency.exponentialRampToValueAtTime(40 * variation, now + 0.08);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Secondo tonfo (click metallico) - VOLUME AUMENTATO
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(120 * variation, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(60 * variation, now + 0.1);

    gain2.gain.setValueAtTime(0.3, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.1);
  }

  private playDistantBeep() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playDoorSwoosh() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  startAmbientSounds() {
    if (this.ambientInterval) return;
    this.ambientInterval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) this.playDistantBeep();
      else if (rand < 0.5) this.playDoorSwoosh();
    }, 8000 + Math.random() * 7000);
  }

  stopAmbientSounds() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  // Manteniamo solo il suono di successo per la vittoria
  playSuccess() {
    this.init();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // Accordo di vittoria più discreto
    const frequencies = [523.25, 659.25, 783.99];

    frequencies.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (i * 0.08));
      gain.gain.setValueAtTime(0, now + (i * 0.08));
      gain.gain.linearRampToValueAtTime(0.25, now + (i * 0.08) + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.08) + 0.4);
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      osc.start(now + (i * 0.08));
      osc.stop(now + (i * 0.08) + 0.5);
    });
  }
}
