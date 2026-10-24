import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RankingService } from '../../core/services/ranking.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/services/library.service';
import { RankedManhua, RankingType } from '../../core/models/ranking.model';
import { CanonicalManhua } from '../../core/models/catalog.model';
import { StarRatingComponent } from '../../shared/components/star-rating.component';

@Component({
  selector: 'app-rankings',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, StarRatingComponent],
  template: `
    <div class="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <!-- Header / App Shell Navigation -->
      <header class="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center space-x-3 cursor-pointer" routerLink="/catalog">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <path d="M8 7h8"/>
                <path d="M8 11h6"/>
              </svg>
            </div>
            <span class="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Manhua Manager
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">PRO</span>
            </span>
          </div>

          <nav class="flex items-center space-x-4">
            <a routerLink="/catalog" routerLinkActive="text-brand-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition-colors">
              Catálogo
            </a>
            <a routerLink="/rankings" routerLinkActive="text-brand-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition-colors">
              Rankings
            </a>
            <ng-container *ngIf="isAuthenticated(); else loginLink">
              <a routerLink="/library" routerLinkActive="text-brand-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition-colors">
                Biblioteca
              </a>
              <a routerLink="/profile" routerLinkActive="text-brand-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition-colors">
                Perfil
              </a>
            </ng-container>
            <ng-template #loginLink>
              <a routerLink="/login" class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors min-h-[36px] flex items-center">
                Entrar
              </a>
            </ng-template>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1 w-full">
        <!-- Hero Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Comunidade Ativa
            </span>
            <span class="text-xs text-slate-400">Atualizado em tempo real</span>
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Rankings & Destaques
          </h1>
          <p class="mt-2 text-sm text-slate-400 max-w-2xl">
            Descubra as obras mais populares e os títulos mais bem avaliados pela comunidade com média ponderada Bayesiana (1 a 5 estrelas).
          </p>
        </div>

        <!-- Ranking Filter Tabs -->
        <div class="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-4">
          <button
            type="button"
            (click)="switchTab('top_rated')"
            [class]="getTabClass('top_rated')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Melhor Votados (★ 1-5)
          </button>
          <button
            type="button"
            (click)="switchTab('daily')"
            [class]="getTabClass('daily')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Mais Lidos Hoje
          </button>
          <button
            type="button"
            (click)="switchTab('weekly')"
            [class]="getTabClass('weekly')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Mais Lidos na Semana
          </button>
          <button
            type="button"
            (click)="switchTab('all_time')"
            [class]="getTabClass('all_time')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            Top Geral
          </button>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-24 text-slate-400">
            <svg class="w-8 h-8 animate-spin text-brand-500 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            <p class="text-sm">Carregando leaderboards...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && rankings().length === 0) {
          <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div class="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <h3 class="text-base font-semibold text-white">Nenhuma obra ranqueada</h3>
            <p class="mt-1 text-xs text-slate-400">Seja o primeiro a ler capítulos ou avaliar uma obra com 1 a 5 estrelas!</p>
          </div>
        }

        <!-- Rankings List -->
        @if (!loading() && rankings().length > 0) {
          <div class="space-y-4">
            @for (item of rankings(); track item.canonical.id) {
              <div 
                class="group bg-slate-900/60 border rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                [ngClass]="getCardBorderClass(item.rank)"
              >
                <!-- Left: Rank Badge + Cover + Info -->
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  <!-- Rank Badge -->
                  <div [class]="getRankBadgeClass(item.rank)">
                    @if (item.rank === 1) { 🥇 }
                    @else if (item.rank === 2) { 🥈 }
                    @else if (item.rank === 3) { 🥉 }
                    @else { #{{ item.rank }} }
                  </div>

                  <!-- Cover Thumbnail -->
                  <a [routerLink]="['/catalog', item.canonical.slug]" class="shrink-0 relative overflow-hidden rounded-xl border border-slate-800 w-16 h-22 sm:w-20 sm:h-28 bg-slate-800">
                    @if (item.canonical.coverUrl) {
                      <img 
                        [src]="item.canonical.coverUrl" 
                        [alt]="item.canonical.title" 
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-slate-600">
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      </div>
                    }
                  </a>

                  <!-- Info & Rating -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                        {{ item.canonical.primaryDomain }}
                      </span>
                      @if (item.canonical.lastChapter) {
                        <span class="text-[10px] font-medium text-slate-400">
                          Cap. {{ item.canonical.lastChapter }}
                        </span>
                      }
                    </div>

                    <a [routerLink]="['/catalog', item.canonical.slug]" class="text-base sm:text-lg font-bold text-white hover:text-brand-400 transition-colors line-clamp-1">
                      {{ item.canonical.title }}
                    </a>

                    <!-- Metric Row -->
                    <div class="mt-2 flex flex-wrap items-center gap-3">
                      <!-- Star Rating Component (1-5 Scale) -->
                      <app-star-rating
                        [rating]="item.canonical.bayesianRating"
                        [totalVotes]="item.canonical.totalVotes"
                        [userRating]="userRatings()[item.canonical.id] || null"
                        [interactive]="true"
                        size="sm"
                        (rate)="onRate(item.canonical.id, $event)"
                      />

                      <!-- Views Counter -->
                      <div class="flex items-center gap-1 text-xs text-slate-400">
                        <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>{{ item.canonical.totalViews | number }} views</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Action Buttons -->
                <div class="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <a
                    [routerLink]="['/reader', item.canonical.slug, 1]"
                    class="flex-1 sm:flex-none text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                  >
                    <svg class="w-3.5 h-3.5 text-brand-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Ler
                  </a>

                  <button
                    type="button"
                    (click)="addToLibrary(item.canonical)"
                    [disabled]="addingId() === item.canonical.id || addedToLibrary()[item.canonical.id]"
                    [class]="getLibraryButtonClass(item.canonical.id)"
                  >
                    @if (addedToLibrary()[item.canonical.id]) {
                      <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Na Biblioteca
                    } @else if (addingId() === item.canonical.id) {
                      <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Salvando...
                    } @else {
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      + Biblioteca
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `
})
export class RankingsComponent implements OnInit {
  activeTab = signal<RankingType>('top_rated');
  rankings = signal<RankedManhua[]>([]);
  loading = signal<boolean>(false);
  addingId = signal<number | null>(null);
  addedToLibrary = signal<Record<number, boolean>>({});
  userRatings = signal<Record<number, number>>({});

  constructor(
    private rankingService: RankingService,
    private authService: AuthService,
    private libraryService: LibraryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRankings();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  switchTab(tab: RankingType): void {
    this.activeTab.set(tab);
    this.loadRankings();
  }

  loadRankings(): void {
    this.loading.set(true);
    this.rankingService.getRankings(this.activeTab(), 20).subscribe({
      next: (items) => {
        this.rankings.set(items || []);
        this.loading.set(false);
        // Load user ratings if authenticated
        if (this.isAuthenticated() && items) {
          items.forEach((item) => {
            this.rankingService.getUserRating(item.canonical.id).subscribe({
              next: (res) => {
                if (res && res.score !== null) {
                  this.userRatings.update((prev) => ({ ...prev, [item.canonical.id]: res.score! }));
                }
              }
            });
          });
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onRate(manhuaId: number, score: number): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.rankingService.submitRating(manhuaId, score).subscribe({
      next: (updatedManhua) => {
        this.userRatings.update((prev) => ({ ...prev, [manhuaId]: score }));
        // Update item in list
        this.rankings.update((items) =>
          items.map((item) => {
            if (item.canonical.id === manhuaId) {
              return {
                ...item,
                canonical: {
                  ...item.canonical,
                  bayesianRating: updatedManhua.bayesianRating,
                  totalVotes: updatedManhua.totalVotes
                }
              };
            }
            return item;
          })
        );
      }
    });
  }

  addToLibrary(manhua: CanonicalManhua): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.addingId.set(manhua.id);
    this.libraryService.addToLibrary({
      canonicalManhuaId: manhua.id,
      currentChapter: 1,
      isFavorite: false
    }).subscribe({
      next: () => {
        this.addingId.set(null);
        this.addedToLibrary.update((prev) => ({ ...prev, [manhua.id]: true }));
      },
      error: () => {
        this.addingId.set(null);
      }
    });
  }

  getTabClass(tab: RankingType): string {
    const isActive = this.activeTab() === tab;
    const base = 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[42px]';
    if (isActive) {
      return `${base} bg-brand-600 text-white shadow-lg shadow-brand-600/25 border border-brand-500`;
    }
    return `${base} bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800`;
  }

  getRankBadgeClass(rank: number): string {
    const base = 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border';
    if (rank === 1) {
      return `${base} bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/10`;
    }
    if (rank === 2) {
      return `${base} bg-slate-300/15 border-slate-400/40 text-slate-200`;
    }
    if (rank === 3) {
      return `${base} bg-amber-700/20 border-amber-700/40 text-amber-500`;
    }
    return `${base} bg-slate-800/60 border-slate-800 text-slate-400`;
  }

  getCardBorderClass(rank: number): string {
    if (rank === 1) return 'border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.06)]';
    if (rank === 2) return 'border-slate-400/30';
    if (rank === 3) return 'border-amber-700/30';
    return 'border-slate-800/80';
  }

  getLibraryButtonClass(id: number): string {
    const isAdded = this.addedToLibrary()[id];
    const base = 'flex-1 sm:flex-none text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[38px]';
    if (isAdded) {
      return `${base} bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default`;
    }
    return `${base} bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20`;
  }
}
