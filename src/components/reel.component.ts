import { Component, input, output, signal, computed, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../services/audio.service';

@Component({
  selector: 'app-reel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center">
      <!-- Outer Glass Frame -->
      <div 
        #viewport
        class="reel-outer-frame relative w-[111px] md:w-[159px] h-56 md:h-72 bg-black rounded-[1.5rem] border border-orange-500/10 select-none overflow-hidden touch-none"
        [class.animate-overload]="isWinning()"
        (mousedown)="onDragStart($event)"
        (touchstart)="onDragStart($event)"
      >
        <!-- Maschere di Profondità (Vignettatura 3D) -->
        <div class="absolute inset-0 z-40 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,1)]"></div>
        <div class="absolute top-0 left-0 w-full h-1/4 z-30 pointer-events-none bg-gradient-to-b from-black via-black/70 to-transparent"></div>
        <div class="absolute bottom-0 left-0 w-full h-1/4 z-30 pointer-events-none bg-gradient-to-t from-black via-black/70 to-transparent"></div>

        <!-- Riflesso Vetro Dinamico -->
        <div 
          class="absolute inset-0 z-45 pointer-events-none bg-gradient-to-tr from-transparent via-orange-500/5 to-transparent opacity-20"
          [style.transform]="'translateY(' + (currentRotation() % 100) / 5 + 'px)'"
        ></div>
        
        <!-- Laser di Allineamento Centrale (Mirino) -->
        <div class="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2 z-35 pointer-events-none border-y border-orange-500/20 bg-orange-500/5 shadow-[0_0_50px_rgba(234,88,12,0.1)] transition-all duration-500"
             [ngClass]="{'border-orange-500': isWinning(), 'bg-orange-500/15': isWinning()}">
        </div>

        <!-- 3D Scrolling Drum -->
        <div class="absolute inset-0 flex items-center justify-center z-20" style="perspective: 1500px;">
          <div 
            class="drum relative w-full h-16 flex items-center justify-center"
            [style.transform-style]="'preserve-3d'"
            [style.transform]="'rotateX(' + currentRotation() + 'deg)'"
            [style.transition]="isDragging() ? 'none' : 'transform 0.8s cubic-bezier(0.15, 0.85, 0.35, 1.15)'"
          >
            @for (num of displayNumbers(); track $index) {
              @let angle = $index * angleStep;
              @let dist = getAngularDist($index);
              @let isActive = dist < 15;
              
              <div 
                class="absolute inset-0 flex items-center justify-center font-orbitron font-bold backface-hidden transition-all duration-300"
                [style.transform]="'rotateX(' + angle + 'deg) translateZ(' + radius + 'px)'"
                [style.color]="isActive ? '#fff7ed' : '#5a2305'"
                [style.text-shadow]="isActive ? '0 0 10px #fb923c, 0 0 20px #ea580c, 0 0 40px rgba(234,88,12,0.4)' : 'none'"
                [style.filter]="getFilter(dist)"
                [style.opacity]="getOpacity(dist)"
                [style.font-size]="'3.2rem'"
              >
                {{ num }}
              </div>
            }
          </div>
        </div>

        <!-- Glow Interno Profondo -->
        <div class="absolute inset-0 z-0 bg-orange-950/10 blur-[100px] transition-opacity duration-1000"
             [style.opacity]="isWinning() ? '0.8' : '0.2'"></div>
      </div>
      
      <!-- Dettaglio Meccanico Base -->
      <div class="w-16 h-1 bg-orange-500/20 rounded-full mt-3 shadow-[0_0_15px_rgba(249,115,22,0.3)] border-b border-orange-500/10"></div>
    </div>
  `,
  styles: [`
    .backface-hidden { backface-visibility: hidden; }
    .reel-outer-frame {
      box-shadow: 
        0 30px 60px rgba(0,0,0,0.95),
        inset 0 0 100px rgba(0,0,0,1);
      cursor: ns-resize;
    }
    .drum {
      will-change: transform;
    }
  `]
})
export class ReelComponent {
  range = input<number[]>([]);
  isWinning = input<boolean>(false);
  onValueChange = output<number>();

  @ViewChild('viewport') viewport!: ElementRef;

  isDragging = signal(false);
  currentRotation = signal(0);
  velocity = signal(0);

  private audioService = inject(AudioService);
  private lastY = 0;
  private startY = 0;
  private startRotation = 0;
  private lastTimestamp = 0;

  public readonly segmentCount = 12;
  public readonly angleStep = 30;
  public readonly radius = 120; // Aumentato raggio per miglior fit spaziale

  displayNumbers = computed(() => {
    const r = this.range();
    if (r.length === 0) return Array(this.segmentCount).fill('0');
    return Array.from({ length: this.segmentCount }, (_, i) => r[i % r.length]);
  });

  onDragStart(event: MouseEvent | TouchEvent) {
    if (this.isWinning()) return;

    this.isDragging.set(true);
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.startY = clientY;
    this.lastY = clientY;
    this.startRotation = this.currentRotation();
    this.lastTimestamp = performance.now();

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging()) return;

      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const now = performance.now();
      const dt = now - this.lastTimestamp;
      const dy = currentY - this.lastY;

      if (dt > 0) {
        this.velocity.set(Math.abs(dy / dt));
      }

      const deltaY = currentY - this.startY;
      const rotationDelta = -deltaY * 0.42; // Sensibilità calibrata
      this.currentRotation.set(this.startRotation + rotationDelta);

      this.lastY = currentY;
      this.lastTimestamp = now;
    };

    const onEnd = () => {
      if (!this.isDragging()) return;
      this.isDragging.set(false);
      this.velocity.set(0);
      this.snapToNearest();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }

  private snapToNearest() {
    const rotation = this.currentRotation();
    const snappedAngle = Math.round(rotation / this.angleStep) * this.angleStep;
    this.currentRotation.set(snappedAngle);

    const index = (Math.round(-snappedAngle / this.angleStep) % this.segmentCount + this.segmentCount) % this.segmentCount;

    setTimeout(() => {
      // this.audioService.playReelStop(); // DISABLED REEL SOUND
      const r = this.range();
      if (r.length > 0) {
        this.onValueChange.emit(r[index % r.length]);
      }
    }, 150);
  }

  getAngularDist(index: number) {
    const drumRot = this.currentRotation();
    const itemAngle = index * this.angleStep;
    let dist = (drumRot + itemAngle) % 360;
    if (dist < -180) dist += 360;
    if (dist > 180) dist -= 360;
    return Math.abs(dist);
  }

  getOpacity(dist: number) {
    if (dist < 15) return 1;
    if (dist < 95) return Math.max(0, 1 - (dist / 110));
    return 0;
  }

  getFilter(dist: number) {
    const v = this.velocity();
    // Blur ultra-light come richiesto
    const blurAmount = Math.min(v * 1.2, 1.4);

    // Glow stratificato Arancio-Bianco
    const glow = dist < 15
      ? (this.isWinning()
        ? 'drop-shadow(0 0 30px #fff) drop-shadow(0 0 60px #fb923c)'
        : 'drop-shadow(0 0 12px rgba(251,146,60,0.8)) drop-shadow(0 0 25px rgba(234,88,12,0.5))')
      : 'none';

    const blur = v > 0.08 ? `blur(${blurAmount}px)` : 'none';

    return `${glow} ${blur}`;
  }
}
