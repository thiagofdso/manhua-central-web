import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';

  notifications = signal<AppNotification[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  loadNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl).pipe(
      tap(items => {
        const list = items || [];
        this.notifications.set(list);
        const unread = list.filter(n => !n.isRead).length;
        this.unreadCount.set(unread);
      })
    );
  }

  fetchUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`).pipe(
      tap(res => this.unreadCount.set(res.unreadCount))
    );
  }

  markAsRead(id: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  dismiss(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const item = this.notifications().find(n => n.id === id);
        this.notifications.update(list => list.filter(n => n.id !== id));
        if (item && !item.isRead) {
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      })
    );
  }

  dismissAll(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(this.apiUrl).pipe(
      tap(() => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      })
    );
  }
}
