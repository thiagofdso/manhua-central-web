import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'relative inline-block'
  },
  template: `
    <!-- Bell Button -->
    <button
      type="button"
      (click)="toggleDropdown()"
      class="relative p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Central de Notificações"
      [attr.aria-expanded]="isOpen()">
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <!-- Unread Badge -->
      @if (notificationService.unreadCount() > 0) {
        <span class="absolute top-1 right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
          {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
        </span>
      }
    </button>

    <!-- Dropdown Panel -->
    @if (isOpen()) {
      <!-- Backdrop to close -->
      <div class="fixed inset-0 z-40" (click)="closeDropdown()"></div>

      <div class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-slate-700/60 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-slate-100">Notificações</h3>
            @if (notificationService.unreadCount() > 0) {
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                {{ notificationService.unreadCount() }} novas
              </span>
            }
          </div>

          @if (notificationService.notifications().length > 0) {
            <button
              type="button"
              (click)="clearAll()"
              class="text-xs text-slate-400 hover:text-rose-400 transition-colors">
              Limpar todas
            </button>
          }
        </div>

        <!-- Notification List -->
        <div class="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
          @if (notificationService.notifications().length === 0) {
            <div class="p-8 text-center text-slate-400">
              <svg class="w-10 h-10 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p class="text-sm font-medium">Nenhuma novidade por enquanto</p>
              <p class="text-xs text-slate-500 mt-1">Os novos capítulos das obras da sua biblioteca aparecerão aqui!</p>
            </div>
          } @else {
            @for (notif of notificationService.notifications(); track notif.id) {
              <div
                (click)="openNotification(notif)"
                class="flex items-start gap-3 p-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors group relative"
                [ngClass]="{ 'bg-slate-800/30': !notif.isRead }">
                
                <!-- Manhua Cover Thumb or Icon -->
                <div class="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/50">
                  @if (notif.manhuaCoverUrl) {
                    <img [src]="notif.manhuaCoverUrl" [alt]="notif.title" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                      📖
                    </div>
                  }
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <h4 class="text-xs font-semibold text-slate-200 truncate group-hover:text-primary transition-colors">
                      {{ notif.title }}
                    </h4>
                    @if (!notif.isRead) {
                      <span class="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
                    }
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {{ notif.body }}
                  </p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                      Cap. {{ notif.chapter }}
                    </span>
                    <span class="text-[10px] text-slate-500">
                      {{ formatTime(notif.createdAt) }}
                    </span>
                  </div>
                </div>

                <!-- Dismiss Button -->
                <button
                  type="button"
                  (click)="dismissItem($event, notif.id)"
                  class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 transition-opacity"
                  title="Descartar">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            }
          }
        </div>
      </div>
    }
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal<boolean>(false);
  private pollInterval?: any;

  ngOnInit(): void {
    this.notificationService.loadNotifications().subscribe({
      error: () => {}
    });

    // Refresh every 60 seconds
    this.pollInterval = setInterval(() => {
      this.notificationService.fetchUnreadCount().subscribe({
        error: () => {}
      });
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.notificationService.loadNotifications().subscribe({
        error: () => {}
      });
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  openNotification(notif: AppNotification): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe({
        error: () => {}
      });
    }
    this.closeDropdown();

    if (notif.manhuaSlug) {
      this.router.navigate(['/reader', notif.manhuaSlug, notif.chapter]);
    }
  }

  dismissItem(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.dismiss(id).subscribe({
      error: () => {}
    });
  }

  clearAll(): void {
    this.notificationService.dismissAll().subscribe({
      error: () => {}
    });
  }

  formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  }
}
