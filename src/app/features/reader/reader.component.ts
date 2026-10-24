import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReaderService } from '../../core/services/reader.service';
import { LibraryService } from '../../core/services/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { ChapterImagesResponse } from '../../core/models/reader.model';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#05080f] text-slate-100 flex flex-col relative">
      <!-- Floating Top Navigation Bar -->
      <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 transition-all duration-300">
        <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <!-- Back Link -->
          <a
            [routerLink]="['/catalog', slug()]"
            class="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Voltar aos detalhes da obra"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="hidden sm:inline">Voltar</span>
          </a>

          <!-- Chapter Title & Info -->
          <div class="text-center min-w-0 flex-1 px-4">
            <h1 class="text-xs sm:text-sm font-bold text-white truncate">
              {{ response()?.title || slug() }}
            </h1>
            <div class="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <span>Capítulo {{ currentChapter() }}</span>
              <span *ngIf="response()?.lastChapter" class="text-slate-600">•</span>
              <span *ngIf="response()?.lastChapter">de {{ response()?.lastChapter }}</span>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center space-x-2">
            <button
              type="button"
              (click)="toggleFullscreen()"
              class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tela Cheia (Atalho: F)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Reader Area -->
      <main class="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center py-4 px-2 sm:px-0">
        <!-- Loading State -->
        <div *ngIf="loading()" class="py-32 flex flex-col items-center justify-center text-slate-400">
          <div class="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium">Carregando painéis do capítulo {{ currentChapter() }}...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="p-8 bg-red-950/40 border border-red-800/80 rounded-2xl text-center max-w-md mx-auto my-16">
          <p class="text-red-300 text-sm font-medium mb-4">{{ error() }}</p>
          <a
            [routerLink]="['/catalog', slug()]"
            class="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Voltar aos Detalhes
          </a>
        </div>

        <!-- Webtoon Continuous Strip (Zero Gaps, 60fps) -->
        <div
          *ngIf="!loading() && response() && response()!.images.length > 0"
          class="w-full flex flex-col items-center select-none"
        >
          <div
            *ngFor="let img of response()!.images; trackBy: trackByIndex"
            class="w-full flex justify-center bg-[#090d16] min-h-[300px] relative"
          >
            <img
              [src]="img.proxyUrl"
              [alt]="'Painel ' + img.index"
              data-testid="reader-panel"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              class="w-full h-auto block object-contain shadow-2xl transition-opacity duration-300"
            />
          </div>
        </div>

        <!-- Chapter End Banner -->
        <div
          *ngIf="!loading() && response()"
          class="w-full max-w-xl mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl"
        >
          <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-white mb-1">Fim do Capítulo {{ currentChapter() }}</h3>
          <p class="text-xs text-slate-400 mb-6">
            {{ isMaxChapter() ? 'Você chegou ao último capítulo lançado desta obra!' : 'Avançar para o próximo capítulo?' }}
          </p>

          <div class="flex items-center justify-center gap-3">
            <button
              type="button"
              (click)="prevChapter()"
              [disabled]="currentChapter() <= 1"
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors min-h-[44px]"
            >
              ← Anterior
            </button>

            <button
              type="button"
              (click)="nextChapter()"
              [disabled]="isMaxChapter()"
              class="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors min-h-[44px]"
            >
              Próximo Capítulo →
            </button>
          </div>
        </div>
      </main>

      <!-- Floating Bottom Control Pill -->
      <nav class="sticky bottom-4 z-40 max-w-md mx-auto w-full px-4 pointer-events-none">
        <div class="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl p-2 flex items-center justify-between gap-2">
          <!-- Previous Chapter Button -->
          <button
            type="button"
            (click)="prevChapter()"
            [disabled]="currentChapter() <= 1"
            class="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Capítulo Anterior (Seta Esquerda)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Current Chapter Display -->
          <div class="text-center px-2 flex-1">
            <div class="text-xs font-extrabold text-white">Capítulo {{ currentChapter() }}</div>
            <div *ngIf="response()?.lastChapter" class="text-[9px] text-slate-400">
              {{ isMaxChapter() ? 'Último Disponível' : 'de ' + response()?.lastChapter }}
            </div>
          </div>

          <!-- Next Chapter Button (RN-03.2) -->
          <button
            type="button"
            (click)="nextChapter()"
            [disabled]="isMaxChapter()"
            class="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Próximo Capítulo (Seta Direita)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div class="h-5 w-px bg-slate-800"></div>

          <!-- Scroll to Top -->
          <button
            type="button"
            (click)="scrollToTop()"
            class="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Voltar ao Topo"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  `
})
export class ReaderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readerService = inject(ReaderService);
  private libraryService = inject(LibraryService);
  private authService = inject(AuthService);

  private routeSub?: Subscription;

  slug = signal<string>('');
  currentChapter = signal<number>(1);
  response = signal<ChapterImagesResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  isMaxChapter = computed(() => {
    const r = this.response();
    if (!r || !r.lastChapter) return false;
    return this.currentChapter() >= r.lastChapter;
  });

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.nextChapter();
    } else if (event.key === 'ArrowLeft') {
      this.prevChapter();
    } else if (event.key === 'f' || event.key === 'F') {
      this.toggleFullscreen();
    }
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const slug = params['slug'] || this.route.snapshot.paramMap.get('slug') || '';
      const ch = parseInt(params['chapter'] || this.route.snapshot.paramMap.get('chapter') || '1', 10);

      this.slug.set(slug);
      this.currentChapter.set(isNaN(ch) || ch < 1 ? 1 : ch);
      this.loadChapter();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadChapter(): void {
    this.loading.set(true);
    this.error.set(null);

    this.readerService.getChapterImages(this.slug(), this.currentChapter()).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
        this.updateDocumentTitle(res.title, res.chapter);
        this.syncReadingProgress(res.canonicalManhuaId, res.chapter);
        window.scrollTo({ top: 0, behavior: 'instant' });
      },
      error: (err) => {
        if (err.status === 400 && err.error?.error?.includes('exceeds')) {
          this.error.set(`Capítulo ${this.currentChapter()} não encontrado (ultrapassa o último capítulo disponível).`);
        } else {
          this.error.set('Não foi possível carregar as imagens do capítulo.');
        }
        this.loading.set(false);
      }
    });
  }

  private updateDocumentTitle(title: string, chapter: number): void {
    if (typeof document !== 'undefined') {
      document.title = `${title} - Cap. ${chapter} | Manhua Manager Pro`;
    }
  }

  private syncReadingProgress(canonicalId: number, chapter: number): void {
    // If authenticated, sync with user library (RN-03.3)
    if (this.authService.isAuthenticated()) {
      const libraryItem = this.libraryService.getLibraryItemByCanonicalId(canonicalId);
      if (libraryItem) {
        this.libraryService.updateProgress(libraryItem.id, chapter).subscribe();
      }
    }
  }

  nextChapter(): void {
    if (this.isMaxChapter()) {
      return;
    }
    const next = this.currentChapter() + 1;
    this.router.navigate(['/reader', this.slug(), next]);
  }

  prevChapter(): void {
    if (this.currentChapter() <= 1) {
      return;
    }
    const prev = this.currentChapter() - 1;
    this.router.navigate(['/reader', this.slug(), prev]);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFullscreen(): void {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
