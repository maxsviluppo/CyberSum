
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
  private isLoadingHomeMusic = false;
  private stopRequested = false;

  async startHomeMusic() {
    if (this.isMuted || this.homeMusicSource || this.isLoadingHomeMusic) return;

    this.isLoadingHomeMusic = true;
    this.stopRequested = false;

    this.init();
    if (!this.audioCtx) {
      this.isLoadingHomeMusic = false;
      return;
    }

    try {
      const response = await fetch('home-music.m4a');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      if (this.stopRequested) return; // Abort if stopped during fetch

      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      if (this.stopRequested) return; // Abort if stopped during decode

      this.homeMusicSource = this.audioCtx.createBufferSource();
      this.homeMusicSource.buffer = audioBuffer;
      this.homeMusicSource.loop = true;

      this.homeMusicGain = this.audioCtx.createGain();
      this.homeMusicGain.gain.value = 0.45;

      this.homeMusicSource.connect(this.homeMusicGain);
      this.homeMusicGain.connect(this.audioCtx.destination);

      this.homeMusicSource.start(0);
      console.log('Home music started successfully');
    } catch (error) {
      console.error('Errore riproduzione home music (home-music.m4a):', error);
      this.homeMusicSource = null;
    } finally {
      this.isLoadingHomeMusic = false;
    }
  }

  stopHomeMusic() {
    this.stopRequested = true;
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

  async startAmbientSounds() {
    if (this.isMuted || this.ambienceNodes.length > 0) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('fondo.wav');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.5; // Volume regolabile per il fondo

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
      this.ambienceNodes.push(source, gainNode);
    } catch (error) {
      console.error('Errore riproduzione suono fondo (fondo.wav):', error);
    }
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

  // Suono di successo per la vittoria (ungradelink.mp3)
  async playSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('ungradelink.mp3');
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
      console.warn('Errore riproduzione suono vittoria (ungradelink.mp3):', error);
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

  // Suono per la fase di sincronizzazione (link link.wav)
  async playLinkSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const response = await fetch('link link.wav');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0.7;

      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.start(0);
    } catch (error) {
      console.warn('Errore riproduzione suono link (link link.wav):', error);
    }
  }
}
