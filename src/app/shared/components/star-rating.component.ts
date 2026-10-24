import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-flex items-center gap-2" role="group" aria-label="Avaliação por estrelas">
      <div 
        class="inline-flex items-center gap-1"
        (mouseleave)="onMouseLeave()"
      >
        @for (star of stars; track star) {
          <button
            type="button"
            [attr.data-star]="star"
            [disabled]="!interactive()"
            (click)="onSelect(star)"
            (mouseenter)="onMouseEnter(star)"
            [attr.aria-label]="'Avaliar com ' + star + ' de 5 estrelas'"
            [class]="getButtonClass(star)"
          >
            <svg
              [class]="getStarClass(star)"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        }
      </div>

      @if (showValue()) {
        <div class="flex items-center gap-1 text-xs">
          <span class="font-bold text-amber-400">
            {{ rating() > 0 ? (rating() | number:'1.2-2') : '—' }}
          </span>
          @if (totalVotes() !== null && totalVotes()! > 0) {
            <span class="text-slate-400">({{ totalVotes() }})</span>
          }
          @if (userRating()) {
            <span class="ml-1 text-[11px] font-medium text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">
              Seu voto: ★{{ userRating() }}
            </span>
          }
        </div>
      }
    </div>
  `
})
export class StarRatingComponent {
  rating = input<number>(0);
  userRating = input<number | null>(null);
  totalVotes = input<number | null>(null);
  interactive = input<boolean>(true);
  size = input<'sm' | 'md' | 'lg'>('md');
  showValue = input<boolean>(true);

  rate = output<number>();

  hoverScore = signal<number>(0);
  readonly stars = [1, 2, 3, 4, 5];

  onMouseEnter(star: number): void {
    if (this.interactive()) {
      this.hoverScore.set(star);
    }
  }

  onMouseLeave(): void {
    if (this.interactive()) {
      this.hoverScore.set(0);
    }
  }

  onSelect(star: number): void {
    if (this.interactive()) {
      this.rate.emit(star);
    }
  }

  getButtonClass(star: number): string {
    const base = 'p-1 rounded transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500/50';
    if (!this.interactive()) {
      return `${base} cursor-default`;
    }
    return `${base} cursor-pointer hover:scale-110 active:scale-95`;
  }

  getStarClass(star: number): string {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    const s = sizeClasses[this.size()] || sizeClasses.md;

    // If hovering, preview hoverScore
    const currentEffective = this.hoverScore() > 0 ? this.hoverScore() : Math.round(this.rating());
    const isFilled = star <= currentEffective;

    if (isFilled) {
      return `${s} text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]`;
    }

    return `${s} text-slate-600 fill-slate-800/80 stroke-slate-500`;
  }
}
