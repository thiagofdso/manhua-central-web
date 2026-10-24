import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../core/services/notification.service';
import { of } from 'rxjs';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let notificationService: NotificationService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create and toggle dropdown panel', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBeFalse();

    component.toggleDropdown();
    expect(component.isOpen()).toBeTrue();

    component.closeDropdown();
    expect(component.isOpen()).toBeFalse();
  });

  it('should navigate to reader and mark as read when notification is clicked', () => {
    spyOn(notificationService, 'markAsRead').and.returnValue(of({ success: true }));

    const notif = {
      id: 'notif-123',
      userId: 'u-1',
      canonicalManhuaId: 10,
      chapter: 42,
      title: 'Solo Leveling',
      body: 'Capítulo 42 lançado',
      isRead: false,
      createdAt: new Date().toISOString(),
      manhuaSlug: 'solo-leveling'
    };

    component.openNotification(notif);

    expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-123');
    expect(router.navigate).toHaveBeenCalledWith(['/reader', 'solo-leveling', 42]);
    expect(component.isOpen()).toBeFalse();
  });
});
