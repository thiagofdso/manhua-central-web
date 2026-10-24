import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DownloadManagerService } from './download-manager.service';
import { IndexedDbService, OfflineChapter } from '../../core/services/indexed-db.service';
import { CanonicalManhua } from '../../core/models/catalog.model';

@Component({
  selector: 'app-downloads-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div 
          class="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-scale-up"
          style="max-height: 90vh;"
        >
          <!-- Header -->
          <div class="p-6 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shadow-lg shadow-brand-500/10">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white tracking-tight">Downloads Offline</h3>
                <p class="text-xs text-slate-400 truncate max-w-xs">{{ manhua().title }}</p>
              </div>
            </div>

            <button
              type="button"
              (click)="onClose()"
              class="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto space-y-6">
            <!-- Range Selector Card -->
            <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Faixa de Capítulos</span>
                @if (manhua().lastChapter) {
                  <span class="text-xs text-brand-400 font-semibold">Teto: Cap. {{ manhua().lastChapter }}</span>
                }
              </div>

              <!-- Inputs -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-400 mb-1.5 font-medium">Do Capítulo</label>
                  <input
                    type="number"
                    [min]="1"
                    [max]="manhua().lastChapter || 9999"
                    [ngModel]="startChapter()"
                    (ngModelChange)="startChapter.set($event)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label class="block text-xs text-slate-400 mb-1.5 font-medium">Até o Capítulo</label>
                  <input
                    type="number"
                    [min]="startChapter()"
                    [max]="manhua().lastChapter || 9999"
                    [ngModel]="endChapter()"
                    (ngModelChange)="endChapter.set($event)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <!-- Quick Presets -->
              <div class="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  (click)="setPreset(5)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                >
                  +5 Caps
                </button>
                <button
                  type="button"
                  (click)="setPreset(10)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                >
                  +10 Caps
                </button>
                <button
                  type="button"
                  (click)="setPreset(25)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
                >
                  +25 Caps
                </button>
                <button
                  type="button"
                  (click)="setPresetMax()"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-brand-300 border border-brand-500/30 transition-colors cursor-pointer"
                >
                  Máx (50 Caps)
                </button>
              </div>

              <!-- Error Message -->
              @if (errorMsg()) {
                <div class="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-400">
                  {{ errorMsg() }}
                </div>
              }
            </div>

            <!-- Downloaded Chapters in IndexedDB -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Capítulos Salvos Localmente ({{ downloadedChapters().length }})
                </h4>
                @if (downloadedChapters().length > 0) {
                  <button
                    type="button"
                    (click)="deleteAllForManhua()"
                    class="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                  >
                    Excluir todos da obra
                  </button>
                }
              </div>

              @if (downloadedChapters().length === 0) {
                <p class="text-xs text-slate-500 italic py-2">Nenhum capítulo desta obra baixado ainda.</p>
              } @else {
                <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  @for (ch of downloadedChapters(); track ch.id) {
                    <div class="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white">Capítulo {{ ch.chapter }}</span>
                        <span class="text-[11px] text-slate-400">({{ ch.totalImages }} imgs • {{ formatBytes(ch.totalSizeBytes) }})</span>
                      </div>
                      <button
                        type="button"
                        (click)="deleteSingleChapter(ch.chapter)"
                        class="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Excluir do dispositivo"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-5 bg-slate-850/80 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="onClose()"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="startDownload()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all cursor-pointer min-h-[42px] flex items-center gap-2"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar {{ calculateTotalToDownload() }} Capítulo(s)
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DownloadsDialogComponent implements OnInit {
  manhua = input.required<CanonicalManhua>();
  isOpen = input<boolean>(false);
  close = output<void>();

  private downloadManager = inject(DownloadManagerService);
  private indexedDb = inject(IndexedDbService);

  startChapter = signal<number>(1);
  endChapter = signal<number>(10);
  downloadedChapters = signal<OfflineChapter[]>([]);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.refreshDownloadedChapters();
  }

  async refreshDownloadedChapters(): Promise<void> {
    const list = await this.indexedDb.getDownloadedChaptersBySlug(this.manhua().slug);
    this.downloadedChapters.set(list);
  }

  setPreset(count: number): void {
    const start = this.startChapter();
    let end = start + count - 1;
    if (this.manhua().lastChapter && end > this.manhua().lastChapter!) {
      end = this.manhua().lastChapter!;
    }
    this.endChapter.set(end);
    this.errorMsg.set(null);
  }

  setPresetMax(): void {
    const start = this.startChapter();
    let end = start + 49;
    if (this.manhua().lastChapter && end > this.manhua().lastChapter!) {
      end = this.manhua().lastChapter!;
    }
    this.endChapter.set(end);
    this.errorMsg.set(null);
  }

  calculateTotalToDownload(): number {
    const total = this.endChapter() - this.startChapter() + 1;
    return total > 0 ? total : 0;
  }

  startDownload(): void {
    const start = Number(this.startChapter());
    const end = Number(this.endChapter());

    if (start < 1 || end < start) {
      this.errorMsg.set('Faixa inválida: o capítulo inicial deve ser ≥ 1 e menor ou igual ao final.');
      return;
    }

    if (end - start + 1 > 50) {
      this.errorMsg.set('Limite máximo de 50 capítulos por requisição (RN-05.1).');
      return;
    }

    if (this.manhua().lastChapter && end > this.manhua().lastChapter!) {
      this.errorMsg.set(`O capítulo final (${end}) excede o teto lançado (${this.manhua().lastChapter!}).`);
      return;
    }

    this.downloadManager.startBatchDownload(
      this.manhua().id,
      this.manhua().slug,
      this.manhua().title,
      start,
      end
    );

    this.onClose();
  }

  async deleteSingleChapter(chapter: number): Promise<void> {
    await this.indexedDb.deleteChapter(this.manhua().slug, chapter);
    await this.refreshDownloadedChapters();
  }

  async deleteAllForManhua(): Promise<void> {
    await this.indexedDb.deleteManhuaDownloads(this.manhua().slug);
    await this.refreshDownloadedChapters();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onClose(): void {
    this.errorMsg.set(null);
    this.close.emit();
  }
}
