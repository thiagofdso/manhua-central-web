import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadManagerService, DownloadTask } from './download-manager.service';
import { IndexedDbService } from '../../core/services/indexed-db.service';

@Component({
  selector: 'app-active-downloads-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Floating Trigger Bubble (when drawer is closed) -->
    @if (!manager.isDrawerOpen() && manager.tasks().length > 0) {
      <button
        type="button"
        (click)="manager.openDrawer()"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 border border-slate-700 text-white shadow-2xl hover:border-brand-500 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer min-h-[44px]"
        aria-label="Abrir painel de downloads"
      >
        <div class="relative">
          <svg class="w-5 h-5 text-brand-400" [class.animate-bounce]="manager.activeCount() > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          @if (manager.activeCount() > 0) {
            <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          }
        </div>
        <span class="text-xs font-bold text-slate-200">
          @if (manager.activeCount() > 0) {
            {{ manager.activeCount() }} download(s) em andamento
          } @else {
            {{ manager.completedCount() }} capítulo(s) salvo(s)
          }
        </span>
      </button>
    }

    <!-- Expanded Drawer Panel -->
    @if (manager.isDrawerOpen()) {
      <aside 
        class="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md bg-slate-900/95 border border-slate-700 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-slide-up"
        style="max-height: 80vh;"
      >
        <!-- Header -->
        <div class="p-4 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Fila de Downloads</h3>
              <p class="text-[11px] text-slate-400">
                {{ manager.activeCount() }} ativo(s) • {{ manager.completedCount() }} concluído(s)
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            @if (manager.activeCount() > 0) {
              <button
                type="button"
                (click)="manager.cancelAll()"
                class="px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Cancelar todos os downloads em andamento"
              >
                Cancelar Todos
              </button>
            }
            <button
              type="button"
              (click)="manager.closeDrawer()"
              class="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar painel"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Storage Status Bar (ADR-0011) -->
        <div class="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            Espaço Offline: <strong class="text-slate-200">{{ formatBytes(usedStorage()) }}</strong>
          </span>
          <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Retenção Perpétua
          </span>
        </div>

        <!-- Task List -->
        <div class="p-3 overflow-y-auto space-y-2.5 flex-1 max-h-96">
          @for (task of manager.tasks(); track task.id) {
            <div class="p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-white truncate">{{ task.title }}</span>
                    <span class="text-[11px] font-semibold text-brand-300 bg-brand-500/20 px-1.5 py-0.2 rounded border border-brand-500/30">
                      Cap. {{ task.chapter }}
                    </span>
                  </div>
                  @if (task.error) {
                    <p class="text-[10px] text-rose-400 mt-0.5 truncate">{{ task.error }}</p>
                  }
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <span [class]="getStatusBadgeClass(task.status)">
                    @switch (task.status) {
                      @case ('downloading') { {{ task.progressPercent }}% }
                      @case ('queued') { Na fila }
                      @case ('completed') { Salvo }
                      @case ('cancelled') { Cancelado }
                      @case ('failed') { Falhou }
                    }
                  </span>

                  @if (task.status === 'downloading' || task.status === 'queued') {
                    <button
                      type="button"
                      (click)="manager.cancelTask(task.id)"
                      class="w-6 h-6 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Cancelar este capítulo"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  }
                </div>
              </div>

              <!-- Progress bar -->
              @if (task.status === 'downloading') {
                <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    class="bg-gradient-to-r from-brand-500 to-indigo-400 h-1.5 rounded-full transition-all duration-200"
                    [style.width.%]="task.progressPercent"
                  ></div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            (click)="manager.clearCompletedTasks()"
            class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Limpar concluídos da lista
          </button>
          <span class="text-[10px] text-slate-500">IndexedDB Local</span>
        </div>
      </aside>
    }
  `
})
export class ActiveDownloadsDrawerComponent implements OnInit {
  manager = inject(DownloadManagerService);
  private indexedDb = inject(IndexedDbService);

  usedStorage = signal<number>(0);

  ngOnInit(): void {
    this.refreshStorage();
  }

  async refreshStorage(): Promise<void> {
    const est = await this.indexedDb.getStorageEstimate();
    this.usedStorage.set(est.usedBytes);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getStatusBadgeClass(status: string): string {
    const base = 'text-[10px] font-bold px-2 py-0.5 rounded-full border';
    switch (status) {
      case 'downloading':
        return `${base} bg-brand-500/20 text-brand-300 border-brand-500/40 animate-pulse`;
      case 'completed':
        return `${base} bg-emerald-500/20 text-emerald-300 border-emerald-500/30`;
      case 'failed':
        return `${base} bg-rose-500/20 text-rose-300 border-rose-500/30`;
      case 'cancelled':
        return `${base} bg-slate-700/40 text-slate-400 border-slate-700`;
      default:
        return `${base} bg-amber-500/15 text-amber-300 border-amber-500/30`;
    }
  }
}
