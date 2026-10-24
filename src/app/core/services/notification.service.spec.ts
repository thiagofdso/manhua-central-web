import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { AppNotification } from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch notifications and update signal', () => {
    const mockNotifications: AppNotification[] = [
      {
        id: 'n-1',
        userId: 'u-1',
        canonicalManhuaId: 10,
        chapter: 50,
        title: 'Novo Capítulo de Solo Leveling!',
        body: 'O capítulo 50 já está disponível para leitura.',
        isRead: false,
        createdAt: new Date().toISOString(),
        manhuaSlug: 'solo-leveling'
      }
    ];

    service.loadNotifications().subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].chapter).toBe(50);
    });

    const req = httpMock.expectOne('/api/notifications');
    expect(req.request.method).toBe('GET');
    req.flush(mockNotifications);

    expect(service.notifications().length).toBe(1);
    expect(service.unreadCount()).toBe(1);
  });

  it('should mark notification as read and decrement unread counter', () => {
    service.notifications.set([
      {
        id: 'n-1',
        userId: 'u-1',
        canonicalManhuaId: 10,
        chapter: 50,
        title: 'Novo Capítulo',
        body: 'Capítulo 50',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);
    service.unreadCount.set(1);

    service.markAsRead('n-1').subscribe(res => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne('/api/notifications/n-1/read');
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true });

    expect(service.unreadCount()).toBe(0);
    expect(service.notifications()[0].isRead).toBeTrue();
  });
});
