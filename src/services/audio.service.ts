
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private ambientInterval: any = null;
  private isMuted = false;

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbientSounds();
      this.stopHomeMusic();
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend();
      }
    } else {
      this.init(); // Ensure context exists
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      // Audio resumption management is left to the component (Home vs Game)
    }
    return this.isMuted;
  }

  isAudioMuted() {
    return this.isMuted;
  }

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Suono tipo serratura meccanica - tonfo con variazioni
  // Suono personalizzato per lo stop del rullo (file WAV)
  async playReelStop() {
    if (this.isMuted) return; // Mute check
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('clic2eco.wav');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.6; // Volume regolabile

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.warn('Errore riproduzione audio rullo:', error);
    }
  }

  // Suono click generico per i pulsanti (clic_eco.wav)
  async playButtonClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('clic_eco.wav');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.4; // Volume leggermente più basso per i click UI

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.warn('Errore riproduzione click:', error);
    }
  }

  // Suono Intro (intro.wav)
  async playIntro() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('intro.wav');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.7; // Volume per intro

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.warn('Errore riproduzione intro:', error);
    }
  }

  // --- Reel Spin Sounds ---

  async playLeftReelSpin() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('giro-rullo-1.wav');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.6;

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.error('Errore riproduzione giro rullo sinistra (giro-rullo-1.wav):', error);
    }
  }

  async playRightReelSpin() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('giro-rullo-2.wav');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.6;

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.error('Errore riproduzione giro rullo destra (giro-rullo-2.wav):', error);
    }
  }

  // --- Home Music ---
  private homeMusicSource: AudioBufferSourceNode | null = null;
  private homeMusicGain: GainNode | null = null;

  async startHomeMusic() {
    if (this.isMuted || this.homeMusicSource) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('home-music.m4a');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      this.homeMusicSource = this.audioCtx.createBufferSource();
      this.homeMusicSource.buffer = audioBuffer;
      this.homeMusicSource.loop = true;

      this.homeMusicGain = this.audioCtx.createGain();
      this.homeMusicGain.gain.value = 0.45; // Ridotto volume del 5% (da 0.50)

      this.homeMusicSource.connect(this.homeMusicGain);
      this.homeMusicGain.connect(this.audioCtx.destination);

      this.homeMusicSource.start(0);
      console.log('Home music started successfully');
    } catch (error) {
      console.error('Errore riproduzione home music (home-music.m4a):', error);
      this.homeMusicSource = null;
    }
  }

  stopHomeMusic() {
    if (this.homeMusicSource) {
      try {
        this.homeMusicSource.stop();
        this.homeMusicSource.disconnect();
        if (this.homeMusicGain) this.homeMusicGain.disconnect();
      } catch (e) { }
      this.homeMusicSource = null;
      this.homeMusicGain = null;
    }
  }

  // --- Generatore Atmosfera Spaziale (Deep Space Drone) ---
  private ambienceNodes: AudioNode[] = [];

  startAmbientSounds() {
    if (this.isMuted || this.ambienceNodes.length > 0) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const t = ctx.currentTime;

    // 1. Rumore di fondo (Deep Rumble)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 120; // Molto basso e cupo

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15; // Volume background

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(t);
    this.ambienceNodes.push(noiseSrc, noiseFilter, noiseGain);

    // 2. Oscillatore Basso 1 (Drone)
    const osc1 = ctx.createOscillator();
    osc1.frequency.value = 55; // La
    const gain1 = ctx.createGain();
    gain1.gain.value = 0.05;

    // LFO per modulare leggermente il volume
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain1.gain);
    lfo.start(t);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    this.ambienceNodes.push(osc1, gain1, lfo, lfoGain);

    // 3. Oscillatore Basso 2 (Detuned Interference)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 56; // Leggermente sfasato per battimento
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.03;

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t);
    this.ambienceNodes.push(osc2, gain2);
  }

  stopAmbientSounds() {
    this.ambienceNodes.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) { }
    });
    this.ambienceNodes = [];
  }

  // Suono di successo per la vittoria (upgrade.mp3)
  async playSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('upgrade.mp3');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.8; // Volume per la vittoria

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.warn('Errore riproduzione suono vittoria (upgrade.mp3):', error);
      // Fallback in caso di errore (piccolo beep)
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.connect(g);
        g.connect(this.audioCtx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
      }
    }
  }
}
