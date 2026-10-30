import { Component, OnInit, OnDestroy, DestroyRef, EventEmitter, Output, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ImportService } from '../../core/services/import.service';
import { AuthService } from '../../core/auth/auth.service';
import { ImportDomain, ImportAnnotatedItem } from '../../core/models/import.model';
import { getProxiedCoverUrl, handleCoverError } from '../../core/utils/image.util';

@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      (click)="onBackdropClick($event)"
      (keydown.escape)="close(false)"
      tabindex="-1"
    >
      <div
        class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>📥</span>
              Importar Obras de Plataformas Externas
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Explore e importe manhuas para o catálogo canônico e para a sua biblioteca pessoal.
            </p>
          </div>
          <button
            type="button"
            (click)="close(false)"
            aria-label="Fechar modal"
            class="w-10 h-10 rounded-full bg-dark-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center border border-slate-800 cursor-pointer min-h-[44px] min-w-[44px]"
          >
            ✕
          </button>
        </div>

        <!-- Filter & Search Controls -->
        <div class="p-6 border-b border-slate-800/80 bg-slate-900/50 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Domain Selector -->
            <div>
              <label for="importDomain" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Plataforma Fonte:
              </label>
              <select
                id="importDomain"
                [ngModel]="selectedDomain()"
                (ngModelChange)="onDomainChange($event)"
                class="w-full bg-dark-850 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors cursor-pointer"
              >
                <option *ngFor="let d of domains()" [value]="d.domain">
                  {{ d.name }} ({{ d.domain }})
                </option>
              </select>
            </div>

            <!-- Search Input -->
            <div class="sm:col-span-2">
              <label for="importSearch" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Pesquisar por título:
              </label>
              <div class="flex gap-2">
                <input
                  id="importSearch"
                  type="text"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  (keydown.enter)="onSearch()"
                  placeholder="Ex: Solo Leveling, Martial Peak..."
                  class="flex-1 bg-dark-850 border border-slate-800 text-white placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  (click)="onSearch()"
                  class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700/80 min-h-[44px] cursor-pointer"
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>

          <!-- Filter Tabs & Bulk Selection Bar -->
          <div *ngIf="items().length > 0" class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-850 border border-slate-800 px-4 py-2.5 rounded-xl">
            <!-- Filter by Status -->
            <div class="flex items-center space-x-1.5 text-xs">
              <span class="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Filtro:</span>
              <button
                type="button"
                (click)="onFilterStatusChange('all')"
                [class]="filterStatus() === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50'"
                class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Todas ({{ items().length }})
              </button>
              <button
                type="button"
                (click)="onFilterStatusChange('new')"
                [class]="filterStatus() === 'new' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50'"
                class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Novas
              </button>
              <button
                type="button"
                (click)="onFilterStatusChange('in_catalog')"
                [class]="filterStatus() === 'in_catalog' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50'"
                class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                No Catálogo
              </button>
            </div>

            <!-- Bulk Selection Checkbox -->
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <label class="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-300 min-h-[32px]">
                <input
                  type="checkbox"
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500/40"
                />
                <span>Selecionar todas</span>
              </label>
              <span class="text-xs font-semibold text-brand-400">
                {{ selectedItems().size }} selecionada(s)
              </span>
            </div>
          </div>
        </div>

        <!-- Works List (Scrollable Area) -->
        <div class="p-6 flex-1 overflow-y-auto space-y-2.5 min-h-[240px] max-h-[380px]">
          <p *ngIf="syncing()" role="status" class="text-xs text-brand-300 py-2">Atualizando obras e capas da plataforma. Os resultados aparecerão automaticamente.</p>
          <p *ngIf="warning()" role="status" class="text-xs text-amber-300 py-2">{{ warning() }}</p>
          <!-- Loading State -->
          <div *ngIf="loading()" class="py-16 flex flex-col items-center justify-center text-slate-400">
            <div class="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-3"></div>
            <p class="text-xs font-medium">Buscando obras na plataforma...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="!loading() && error()" class="p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-red-200 text-xs flex items-center justify-between gap-3">
            <span>{{ error() }}</span>
            <a
              *ngIf="!isUserAuthenticated()"
              routerLink="/login"
              (click)="close(false)"
              class="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              Fazer Login
            </a>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading() && !syncing() && !error() && displayedItems().length === 0" class="py-16 text-center text-slate-400">
            <p class="text-sm font-semibold text-slate-300">Nenhuma obra encontrada nesta página com este filtro</p>
            <p class="text-xs mt-1 text-slate-500">Tente alternar o filtro ou buscar por outro termo.</p>
          </div>

          <!-- Items Rows -->
          <div
            *ngFor="let item of displayedItems()"
            class="bg-dark-850/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 flex items-center gap-3.5 transition-colors"
          >
            <!-- Checkbox -->
            <label class="flex items-center justify-center p-2 cursor-pointer min-h-[44px] min-w-[44px]">
              <input
                type="checkbox"
                [checked]="isSelected(item)"
                [disabled]="item.alreadyInLibrary"
                (change)="toggleSelection(item)"
                class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-brand-600 focus:ring-brand-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </label>

            <!-- Cover Thumbnail -->
            <div class="w-12 h-16 rounded-lg bg-dark-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
              <img
                *ngIf="item.coverUrl"
                [src]="getCoverUrl(item.coverUrl)"
                (error)="onImageError($event, item.coverUrl)"
                [alt]="item.title"
                loading="lazy"
                referrerpolicy="no-referrer"
                class="w-full h-full object-cover"
              />
              <span *ngIf="!item.coverUrl" class="cover-fallback text-[9px] text-slate-500 font-semibold text-center px-1" role="status">
                {{ item.coverState === 'pending' ? 'Capa na fila' : item.coverState === 'processing' ? 'Baixando capa' : item.coverState === 'failed' ? 'Capa indisponível' : 'Sem capa' }}
              </span>
            </div>

            <!-- Info & Badges -->
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-white truncate" [title]="item.title">
                {{ item.title }}
              </h3>
              <div class="flex flex-wrap items-center gap-2 mt-1.5">
                <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/50">
                  {{ item.primaryDomain }}
                </span>
                <span *ngIf="item.lastChapter" class="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[10px] font-semibold">
                  Cap. {{ item.lastChapter }}
                </span>
                <span *ngIf="item.alreadyInLibrary" class="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[10px] font-semibold">
                  ✓ Na sua biblioteca
                </span>
                <span *ngIf="item.alreadyInCatalog && !item.alreadyInLibrary" class="px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-400 border border-sky-800/60 text-[10px] font-semibold">
                  No Catálogo
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination & Footer Actions -->
        <div class="px-6 py-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <!-- Pagination -->
          <div *ngIf="totalPages() > 1" class="flex items-center space-x-2">
            <button
              type="button"
              [disabled]="page() <= 1 || loading()"
              (click)="onPageChange(page() - 1)"
              class="px-3 py-1.5 bg-dark-850 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs rounded-lg border border-slate-800 transition-colors min-h-[36px]"
            >
              ◀ Anterior
            </button>
            <span class="text-xs text-slate-400">
              Página <strong class="text-white">{{ page() }}</strong> de <strong class="text-white">{{ totalPages() }}</strong>
            </span>
            <button
              type="button"
              [disabled]="page() >= totalPages() || loading()"
              (click)="onPageChange(page() + 1)"
              class="px-3 py-1.5 bg-dark-850 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs rounded-lg border border-slate-800 transition-colors min-h-[36px]"
            >
              Próxima ▶
            </button>
          </div>
          <div *ngIf="totalPages() <= 1"></div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              (click)="close(false)"
              class="px-4 py-2.5 rounded-xl bg-dark-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors border border-slate-800 min-h-[44px] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              [disabled]="selectedItems().size === 0 || importing()"
              (click)="submitImport()"
              class="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors shadow-lg shadow-brand-500/20 min-h-[44px] cursor-pointer flex items-center justify-center gap-2"
            >
              <span *ngIf="importing()" class="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              <span>Importar ({{ selectedItems().size }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ImportDialogComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private requestVersion = 0;
  syncing = signal(false);
  warning = signal<string | null>(null);

  ngOnDestroy(): void {
    clearTimeout(this.refreshTimer);
    this.requestVersion++;
  }
  getCoverUrl = getProxiedCoverUrl;
  onImageError = handleCoverError;
  private importService = inject(ImportService);
  private authService = inject(AuthService);

  @Output() closed = new EventEmitter<boolean>();

  domains = signal<ImportDomain[]>([]);
  selectedDomain = signal<string>('asurascans.com');
  searchQuery = signal<string>('');
  items = signal<ImportAnnotatedItem[]>([]);
  selectedItems = signal<Map<string, ImportAnnotatedItem>>(new Map());

  page = signal<number>(1);
  totalPages = signal<number>(1);
  loading = signal<boolean>(false);
  importing = signal<boolean>(false);
  error = signal<string | null>(null);

  filterStatus = signal<'all' | 'new' | 'in_catalog'>('all');

  displayedItems = computed(() => {
    const status = this.filterStatus();
    const list = this.items();
    if (status === 'new') {
      return list.filter(i => !i.alreadyInLibrary);
    }
    if (status === 'in_catalog') {
      return list.filter(i => i.alreadyInCatalog);
    }
    return list;
  });

  onFilterStatusChange(status: 'all' | 'new' | 'in_catalog'): void {
    this.filterStatus.set(status);
  }

  ngOnInit(): void {
    this.loadDomains();
  }

  loadDomains(): void {
    this.importService.getDomains().subscribe({
      next: (domains) => {
        this.domains.set(domains);
        if (domains.length > 0) {
          this.selectedDomain.set(domains[0].domain);
          this.loadWorks();
        }
      },
      error: () => {
        this.error.set('Falha ao carregar lista de plataformas suportadas.');
      }
    });
  }

  loadWorks(background = false): void {
    clearTimeout(this.refreshTimer);
    const version = ++this.requestVersion;
    if (!background) this.loading.set(true);
    this.error.set(null);

    this.importService.browse(this.selectedDomain(), this.searchQuery(), this.page()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (version !== this.requestVersion) return;
        this.syncing.set(!!res.syncing);
        this.warning.set(res.warning || null);
        this.items.set(res.items);
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
        if (res.syncing) this.refreshTimer = setTimeout(() => this.loadWorks(true), 3000);
      },
      error: (err) => {
        if (version !== this.requestVersion) return;
        this.error.set(err?.error?.error || 'Falha ao buscar obras da plataforma.');
        this.loading.set(false);
      }
    });
  }

  onDomainChange(domain: string): void {
    this.selectedDomain.set(domain);
    this.page.set(1);
    this.loadWorks();
  }

  onSearch(): void {
    this.page.set(1);
    this.loadWorks();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.page.set(newPage);
      this.loadWorks();
    }
  }

  isSelected(item: ImportAnnotatedItem): boolean {
    return this.selectedItems().has(item.slug || item.title);
  }

  toggleSelection(item: ImportAnnotatedItem): void {
    if (item.alreadyInLibrary) return;
    const key = item.slug || item.title;
    const map = new Map(this.selectedItems());
    if (map.has(key)) {
      map.delete(key);
    } else {
      map.set(key, item);
    }
    this.selectedItems.set(map);
  }

  isAllSelected(): boolean {
    const selectable = this.displayedItems().filter(i => !i.alreadyInLibrary);
    if (selectable.length === 0) return false;
    return selectable.every(i => this.isSelected(i));
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const map = new Map(this.selectedItems());
    const selectable = this.displayedItems().filter(i => !i.alreadyInLibrary);

    if (checked) {
      selectable.forEach(i => map.set(i.slug || i.title, i));
    } else {
      selectable.forEach(i => map.delete(i.slug || i.title));
    }
    this.selectedItems.set(map);
  }

  isUserAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  submitImport(): void {
    const itemsToImport = Array.from(this.selectedItems().values());
    if (itemsToImport.length === 0) return;

    if (!this.authService.isAuthenticated()) {
      this.error.set('É necessário estar conectado à sua conta para importar obras para a biblioteca.');
      return;
    }

    this.importing.set(true);
    this.error.set(null);

    this.importService.importWorks(itemsToImport).subscribe({
      next: () => {
        this.importing.set(false);
        this.close(true);
      },
      error: (err) => {
        this.importing.set(false);
        this.error.set(err?.error?.error || 'Erro ao importar obras selecionadas.');
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close(false);
    }
  }

  close(imported: boolean): void {
    this.closed.emit(imported);
  }
}
