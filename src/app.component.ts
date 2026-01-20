import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReelComponent } from './components/reel.component';
import { AudioService } from './services/audio.service';
import { AIService } from './services/ai.service';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: string;
  dy: string;
  dur: string;
  del: string;
  size: string;
  color: 'orange' | 'white';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReelComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:fullscreenchange)': 'onFullscreenChange()',
    '(document:webkitfullscreenchange)': 'onFullscreenChange()',
    '(document:mozfullscreenchange)': 'onFullscreenChange()',
    '(document:MSFullscreenChange)': 'onFullscreenChange()'
  }
})
export class AppComponent {
  private audioService = inject(AudioService);
  private aiService = inject(AIService);

  view = signal<'menu' | 'playing'>('menu');
  gameState = signal<'idle' | 'checking' | 'result'>('idle');
  currentLevel = signal<number>(1);
  targetSum = signal<number>(0);
  numbers1 = signal<number[]>([]);
  numbers2 = signal<number[]>([]);

  reel1Val = signal<number | null>(null);
  reel2Val = signal<number | null>(null);
  isWinner = signal(false);
  aiMessage = signal("AWAITING_INPUT...");
  isFullscreen = signal(false);
  winMessage = signal('');

  targetParticles = signal<Particle[]>(this.generateParticles(15));
  glitchingLed = signal<'target' | 'reel' | 'display' | null>(null);

  constructor() {
    this.generateChallenge();
    this.startLedGlitches();
  }

  private startLedGlitches() {
    setInterval(() => {
      const leds: Array<'target' | 'reel' | 'display' | null> = ['target', 'reel', 'display'];
      const randomLed = leds[Math.floor(Math.random() * leds.length)];
      this.glitchingLed.set(randomLed);
      setTimeout(() => this.glitchingLed.set(null), 2000 + Math.random() * 3000);
    }, 6000 + Math.random() * 8000);
  }

  private generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dx: `${(Math.random() - 0.5) * 60}px`,
      dy: `${(Math.random() - 0.5) * 60 - 40}px`,
      dur: `${3 + Math.random() * 4}s`,
      del: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 2}px`,
      color: Math.random() > 0.4 ? 'orange' : 'white'
    }));
  }

  onFullscreenChange() {
    const doc = document as any;
    const isFull = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    this.isFullscreen.set(isFull);
  }

  async toggleFullscreen() {
    const doc = document as any;
    const docEl = document.documentElement as any;

    const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
    const exitFS = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
    const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    try {
      if (!fsElement) {
        if (requestFS) {
          await requestFS.call(docEl);
        }
      } else {
        if (exitFS) {
          await exitFS.call(doc);
        }
      }
    } catch (err) {
      console.warn('Fullscreen interaction failed or was denied by the environment:', err);
    }
  }

  startGame() {
    this.currentLevel.set(1);
    this.generateChallenge();
    this.view.set('playing');
    this.audioService.startAmbientSounds();
  }

  resetGame() {
    this.currentLevel.set(1);
    this.generateChallenge();
    this.aiMessage.set("SESSION_REBOOTED_LEVEL_01");
  }

  returnToMenu() {
    this.view.set('menu');
    this.audioService.stopAmbientSounds();
  }

  generateChallenge() {
    const level = this.currentLevel();
    const min = 10 + (level * 2);
    const max = 25 + (level * 4);
    const target = Math.floor(Math.random() * (max - min)) + min;
    this.targetSum.set(target);

    const sol1 = Math.floor(Math.random() * (target - 2)) + 1;
    const sol2 = target - sol1;

    const genSet = (sol: number) => {
      const s = new Set<number>([sol]);
      const distractorRange = target + 15 + (level * 5);
      while (s.size < 12) {
        s.add(Math.floor(Math.random() * distractorRange));
      }
      return this.shuffle(Array.from(s));
    };

    this.numbers1.set(genSet(sol1));
    this.numbers2.set(genSet(sol2));

    this.reel1Val.set(null);
    this.reel2Val.set(null);
    this.isWinner.set(false);
    this.gameState.set('idle');
    this.aiMessage.set("SCANNING_FOR_FRAGMENTS...");
  }

  private shuffle(array: number[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  async onReelChange(val: number, reelIdx: number) {
    if (this.isWinner()) return;

    if (reelIdx === 1) this.reel1Val.set(val);
    else this.reel2Val.set(val);

    const v1 = this.reel1Val();
    const v2 = this.reel2Val();

    if (v1 !== null && v2 !== null) {
      const sum = v1 + v2;
      const target = this.targetSum();

      this.gameState.set('checking');
      await new Promise(r => setTimeout(r, 800));

      if (sum === target) {
        this.executeWinSequence(v1, v2, target);
      } else {
        this.gameState.set('result');
      }
    } else {
      this.gameState.set('idle');
    }
  }

  private async executeWinSequence(v1: number, v2: number, target: number) {
    this.isWinner.set(true);
    this.audioService.playSuccess();
    this.winMessage.set('Sync successfully established');

    setTimeout(() => {
      const nextLevel = this.currentLevel() + 1;
      this.winMessage.set(`ACCESSING SECTOR: DATA_CORE_${nextLevel < 10 ? '0' : ''}${nextLevel}`);
    }, 2500);

    setTimeout(() => {
      this.currentLevel.update(l => l + 1);
      this.generateChallenge();
    }, 4500);
  }
}
