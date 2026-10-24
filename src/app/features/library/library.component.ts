import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LibraryService } from '../../core/services/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserLibrary } from '../../core/models/library.model';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-dark-950 text-slate-100 pb-20">
      <!-- App Shell Header -->
      <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner">
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
            <a routerLink="/library" routerLinkActive="text-brand-400 font-semibold" class="text-sm text-brand-400 font-semibold transition-colors">
              Biblioteca
            </a>
            <a routerLink="/profile" routerLinkActive="text-brand-400 font-semibold" class="text-sm text-slate-300 hover:text-white transition-colors">
              Perfil
            </a>
          </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <!-- Hero Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Minha Biblioteca
            </h1>
            <p class="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Organize seus manhuas favoritos, acompanhe capítulos e reordene suas leituras com drag-and-drop.
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <a
              routerLink="/catalog"
              class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-2 min-h-[44px]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Explorar Mais Obras</span>
            </a>
          </div>
        </div>

        <!-- Temporary Error/Warning Banner -->
        <div
          *ngIf="errorBanner()"
          class="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-200 text-sm animate-fade-in"
        >
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ errorBanner() }}</span>
          </div>
          <button (click)="errorBanner.set(null)" class="text-amber-400 hover:text-white p-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex flex-col items-center justify-center py-24 text-slate-400">
          <div class="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium">Carregando sua biblioteca pessoal...</p>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="!loading() && totalCount() === 0"
          class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl my-12"
        >
          <div class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Sua biblioteca está vazia</h3>
          <p class="text-sm text-slate-400 mb-6 leading-relaxed">
            Você ainda não adicionou nenhuma obra à sua biblioteca. Explore nosso catálogo canônico para começar suas leituras.
          </p>
          <a
            routerLink="/catalog"
            class="inline-flex items-center px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/25 min-h-[44px]"
          >
            Navegar no Catálogo
          </a>
        </div>

        <!-- Populated Library Layout -->
        <div *ngIf="!loading() && totalCount() > 0" class="space-y-10">

          <!-- Section 1: Favoritas (Golden Rule RN-04.1) -->
          <div class="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-7 backdrop-blur">
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center space-x-3">
                <span class="text-amber-400 text-xl font-bold flex items-center gap-1.5">
                  ★ Obras Favoritas
                </span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  {{ favoritesList().length }}
                </span>
              </div>
              <span class="text-xs text-amber-300/70 hidden sm:inline-block">
                Prioridade máxima no topo da sua lista
              </span>
            </div>

            <!-- Empty Favorites State -->
            <div *ngIf="favoritesList().length === 0" class="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <p class="text-sm text-slate-400">
                Você ainda não favoritou nenhuma obra. Clique no ícone de estrela ★ em qualquer obra para fixá-la aqui no topo.
              </p>
            </div>

            <!-- Favorites Drag & Drop List -->
            <div
              *ngIf="favoritesList().length > 0"
              cdkDropList
              (cdkDropListDropped)="onDropFavorites($event)"
              class="space-y-3"
            >
              <div
                *ngFor="let item of favoritesList()"
                cdkDrag
                data-testid="favorite-item"
                class="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md group"
              >
                <!-- Drag Handle & Manhua Info -->
                <div class="flex items-center space-x-4 min-w-0 flex-1">
                  <!-- Drag Handle -->
                  <div
                    cdkDragHandle
                    class="cursor-grab active:cursor-grabbing p-1.5 text-slate-600 hover:text-slate-300 rounded-lg transition-colors flex-shrink-0"
                    title="Arrastar para reordenar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>

                  <!-- Cover Poster -->
                  <div class="w-12 h-16 rounded-xl overflow-hidden bg-dark-950 border border-slate-800 flex-shrink-0 relative">
                    <img
                      *ngIf="item.canonicalManhua?.coverUrl"
                      [src]="item.canonicalManhua?.coverUrl"
                      [alt]="item.canonicalManhua?.title"
                      referrerpolicy="no-referrer"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Title & Domain -->
                  <div class="min-w-0 flex-1">
                    <a
                      [routerLink]="['/catalog', item.canonicalManhua?.slug]"
                      class="text-sm sm:text-base font-bold text-white hover:text-brand-300 truncate block transition-colors"
                    >
                      {{ item.canonicalManhua?.title || 'Obra Canônica' }}
                    </a>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {{ item.canonicalManhua?.primaryDomain }}
                      </span>
                      <span *ngIf="item.canonicalManhua?.lastChapter" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        Total: {{ item.canonicalManhua?.lastChapter }} caps
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Progress Stepper & Actions -->
                <div class="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
                  <!-- Stepper (RN-03.2 & RN-03.3) -->
                  <div class="flex items-center space-x-2 bg-dark-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      (click)="decrementChapter(item)"
                      [disabled]="item.currentChapter <= 1"
                      class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-sm transition-colors"
                      title="Capítulo Anterior"
                    >
                      -
                    </button>

                    <a
                      [routerLink]="['/reader', item.canonicalManhua?.slug, item.currentChapter]"
                      class="text-center px-1 hover:text-brand-300 transition-colors cursor-pointer"
                      title="Abrir no Leitor"
                    >
                      <div class="text-xs font-extrabold text-white hover:text-brand-300">Cap. {{ item.currentChapter }}</div>
                      <div *ngIf="item.canonicalManhua?.lastChapter" class="text-[9px] text-slate-500">
                        de {{ item.canonicalManhua?.lastChapter }}
                      </div>
                    </a>

                    <button
                      type="button"
                      (click)="incrementChapter(item)"
                      [disabled]="isMaxChapter(item)"
                      class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-sm transition-colors"
                      title="Próximo Capítulo"
                    >
                      +
                    </button>
                  </div>

                  <!-- Star Toggle (RN-04.2) -->
                  <button
                    type="button"
                    (click)="toggleFavorite(item)"
                    class="p-2.5 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remover dos favoritos"
                  >
                    ★
                  </button>

                  <!-- Delete from Library -->
                  <button
                    type="button"
                    (click)="removeItem(item)"
                    class="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remover da biblioteca"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Todas as Obras (Regular Items) -->
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7">
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center space-x-3">
                <span class="text-white text-xl font-bold tracking-tight">
                  Outras Obras em Leitura
                </span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  {{ regularsList().length }}
                </span>
              </div>
              <span class="text-xs text-slate-500 hidden sm:inline-block">
                Arraste para definir sua ordem personalizada
              </span>
            </div>

            <!-- Empty Regulars State -->
            <div *ngIf="regularsList().length === 0" class="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <p class="text-sm text-slate-400">
                Todas as suas obras atuais estão na lista de favoritas acima.
              </p>
            </div>

            <!-- Regulars Drag & Drop List -->
            <div
              *ngIf="regularsList().length > 0"
              cdkDropList
              (cdkDropListDropped)="onDropRegulars($event)"
              class="space-y-3"
            >
              <div
                *ngFor="let item of regularsList()"
                cdkDrag
                data-testid="regular-item"
                class="bg-dark-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm group"
              >
                <!-- Drag Handle & Manhua Info -->
                <div class="flex items-center space-x-4 min-w-0 flex-1">
                  <!-- Drag Handle -->
                  <div
                    cdkDragHandle
                    class="cursor-grab active:cursor-grabbing p-1.5 text-slate-600 hover:text-slate-300 rounded-lg transition-colors flex-shrink-0"
                    title="Arrastar para reordenar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>

                  <!-- Cover Poster -->
                  <div class="w-12 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative">
                    <img
                      *ngIf="item.canonicalManhua?.coverUrl"
                      [src]="item.canonicalManhua?.coverUrl"
                      [alt]="item.canonicalManhua?.title"
                      referrerpolicy="no-referrer"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Title & Domain -->
                  <div class="min-w-0 flex-1">
                    <a
                      [routerLink]="['/catalog', item.canonicalManhua?.slug]"
                      class="text-sm sm:text-base font-bold text-white hover:text-brand-300 truncate block transition-colors"
                    >
                      {{ item.canonicalManhua?.title || 'Obra Canônica' }}
                    </a>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {{ item.canonicalManhua?.primaryDomain }}
                      </span>
                      <span *ngIf="item.canonicalManhua?.lastChapter" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        Total: {{ item.canonicalManhua?.lastChapter }} caps
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Progress Stepper & Actions -->
                <div class="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
                  <!-- Stepper (RN-03.2 & RN-03.3) -->
                  <div class="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      (click)="decrementChapter(item)"
                      [disabled]="item.currentChapter <= 1"
                      class="w-8 h-8 rounded-lg bg-dark-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-sm transition-colors"
                      title="Capítulo Anterior"
                    >
                      -
                    </button>

                    <a
                      [routerLink]="['/reader', item.canonicalManhua?.slug, item.currentChapter]"
                      class="text-center px-1 hover:text-brand-300 transition-colors cursor-pointer"
                      title="Abrir no Leitor"
                    >
                      <div class="text-xs font-extrabold text-white hover:text-brand-300">Cap. {{ item.currentChapter }}</div>
                      <div *ngIf="item.canonicalManhua?.lastChapter" class="text-[9px] text-slate-500">
                        de {{ item.canonicalManhua?.lastChapter }}
                      </div>
                    </a>

                    <button
                      type="button"
                      (click)="incrementChapter(item)"
                      [disabled]="isMaxChapter(item)"
                      class="w-8 h-8 rounded-lg bg-dark-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-sm transition-colors"
                      title="Próximo Capítulo"
                    >
                      +
                    </button>
                  </div>

                  <!-- Star Toggle (RN-04.2) -->
                  <button
                    type="button"
                    (click)="toggleFavorite(item)"
                    class="p-2.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Adicionar aos favoritos"
                  >
                    ☆
                  </button>

                  <!-- Delete from Library -->
                  <button
                    type="button"
                    (click)="removeItem(item)"
                    class="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remover da biblioteca"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class LibraryComponent implements OnInit {
  private libraryService = inject(LibraryService);
  private authService = inject(AuthService);

  loading = signal<boolean>(false);
  errorBanner = signal<string | null>(null);

  // Reactive signals reflecting local state
  favoritesList = signal<UserLibrary[]>([]);
  regularsList = signal<UserLibrary[]>([]);

  totalCount = computed(() => this.favoritesList().length + this.regularsList().length);

  ngOnInit(): void {
    this.loadLibrary();
  }

  loadLibrary(): void {
    this.loading.set(true);
    this.libraryService.getLibrary().subscribe({
      next: (items) => {
        this.syncLocalLists(items);
        this.loading.set(false);
      },
      error: () => {
        this.errorBanner.set('Não foi possível carregar sua biblioteca. Tente novamente mais tarde.');
        this.loading.set(false);
      }
    });
  }

  private syncLocalLists(items: UserLibrary[]): void {
    this.favoritesList.set(items.filter(i => i.isFavorite));
    this.regularsList.set(items.filter(i => !i.isFavorite));
  }

  isMaxChapter(item: UserLibrary): boolean {
    const last = item.canonicalManhua?.lastChapter;
    return !!(last && item.currentChapter >= last);
  }

  incrementChapter(item: UserLibrary): void {
    if (this.isMaxChapter(item)) {
      this.errorBanner.set(`Esta obra já está no último capítulo disponível (${item.canonicalManhua?.lastChapter}).`);
      return;
    }
    const nextChapter = item.currentChapter + 1;
    this.libraryService.updateProgress(item.id, nextChapter).subscribe({
      next: () => {
        this.errorBanner.set(null);
        this.loadLibrary();
      },
      error: (err) => {
        if (err.status === 400 && err.error?.error?.includes('exceeds')) {
          this.errorBanner.set('Não é possível ultrapassar o último capítulo da obra.');
        } else {
          this.errorBanner.set('Erro ao atualizar progresso de leitura.');
        }
      }
    });
  }

  decrementChapter(item: UserLibrary): void {
    if (item.currentChapter <= 1) {
      return;
    }
    const prevChapter = item.currentChapter - 1;
    this.libraryService.updateProgress(item.id, prevChapter).subscribe({
      next: () => {
        this.errorBanner.set(null);
        this.loadLibrary();
      },
      error: () => {
        this.errorBanner.set('Erro ao atualizar progresso de leitura.');
      }
    });
  }

  toggleFavorite(item: UserLibrary): void {
    const targetStatus = !item.isFavorite;
    this.libraryService.toggleFavorite(item.id, targetStatus).subscribe({
      next: () => {
        this.loadLibrary();
      },
      error: () => {
        this.errorBanner.set('Erro ao alterar status de favorito.');
      }
    });
  }

  onDropFavorites(event: CdkDragDrop<UserLibrary[]>): void {
    const list = [...this.favoritesList()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.favoritesList.set(list);
    this.persistFullOrder();
  }

  onDropRegulars(event: CdkDragDrop<UserLibrary[]>): void {
    const list = [...this.regularsList()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.regularsList.set(list);
    this.persistFullOrder();
  }

  private persistFullOrder(): void {
    // Golden rule: favorites always come before regulars
    const fullOrderIds = [
      ...this.favoritesList().map(i => i.id),
      ...this.regularsList().map(i => i.id)
    ];

    this.libraryService.reorderLibrary(fullOrderIds).subscribe({
      error: () => {
        this.errorBanner.set('Erro ao salvar nova ordenação.');
        this.loadLibrary();
      }
    });
  }

  removeItem(item: UserLibrary): void {
    const title = item.canonicalManhua?.title || 'esta obra';
    if (!confirm(`Tem certeza que deseja remover "${title}" da sua biblioteca?`)) {
      return;
    }

    this.libraryService.removeFromLibrary(item.id).subscribe({
      next: () => {
        this.loadLibrary();
      },
      error: () => {
        this.errorBanner.set('Erro ao remover obra da biblioteca.');
      }
    });
  }
}
