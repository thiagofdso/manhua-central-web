import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { LibraryComponent } from './library.component';
import { LibraryService } from '../../core/services/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserLibrary } from '../../core/models/library.model';
import { signal } from '@angular/core';

describe('LibraryComponent', () => {
  let component: LibraryComponent;
  let fixture: ComponentFixture<LibraryComponent>;
  let libraryServiceSpy: jasmine.SpyObj<LibraryService>;

  const mockFavorite: UserLibrary = {
    id: 'lib-1',
    userId: 'user-1',
    canonicalManhuaId: 1,
    currentChapter: 10,
    isFavorite: true,
    customOrder: 0,
    createdAt: '2026-10-23T00:00:00Z',
    updatedAt: 1729700000,
    canonicalManhua: {
      id: 1,
      title: 'Solo Leveling',
      slug: 'solo-leveling',
      synopsis: 'Sung Jin-woo',
      coverUrl: 'https://images.unsplash.com/photo-1',
      primaryDomain: 'asurascans.com',
      urlTemplate: 'https://asurascans.com/manga/solo-leveling/{chapter}',
      lastChapter: 200,
      isHiatus: false,
      bayesianRating: 9.8,
      totalVotes: 1000,
      totalViews: 50000,
      createdAt: '2026-10-23T00:00:00Z',
      updatedAt: '2026-10-23T00:00:00Z'
    }
  };

  const mockRegular: UserLibrary = {
    id: 'lib-2',
    userId: 'user-1',
    canonicalManhuaId: 2,
    currentChapter: 50,
    isFavorite: false,
    customOrder: 0,
    createdAt: '2026-10-23T00:00:00Z',
    updatedAt: 1729700000,
    canonicalManhua: {
      id: 2,
      title: 'Omniscient Reader',
      slug: 'omniscient-reader',
      synopsis: 'Dokja',
      coverUrl: 'https://images.unsplash.com/photo-2',
      primaryDomain: 'ravenscans.org',
      urlTemplate: 'https://ravenscans.org/manga/omniscient-reader/{chapter}',
      lastChapter: 50, // Reached ceiling!
      isHiatus: false,
      bayesianRating: 9.5,
      totalVotes: 800,
      totalViews: 40000,
      createdAt: '2026-10-23T00:00:00Z',
      updatedAt: '2026-10-23T00:00:00Z'
    }
  };

  beforeEach(async () => {
    libraryServiceSpy = jasmine.createSpyObj('LibraryService', [
      'getLibrary',
      'updateProgress',
      'toggleFavorite',
      'reorderLibrary',
      'removeFromLibrary'
    ], {
      library: signal<UserLibrary[]>([mockFavorite, mockRegular]),
      favorites: signal<UserLibrary[]>([mockFavorite]),
      regulars: signal<UserLibrary[]>([mockRegular])
    });

    libraryServiceSpy.getLibrary.and.returnValue(of([mockFavorite, mockRegular]));
    libraryServiceSpy.updateProgress.and.returnValue(of({ ...mockFavorite, currentChapter: 11 }));
    libraryServiceSpy.toggleFavorite.and.returnValue(of({ ...mockFavorite, isFavorite: false }));
    libraryServiceSpy.reorderLibrary.and.returnValue(of({ message: 'Library reordered successfully' }));
    libraryServiceSpy.removeFromLibrary.and.returnValue(of({ message: 'Library item deleted successfully' }));

    const authServiceMock = {
      isAuthenticated: () => true,
      currentUser: signal({ id: 'user-1', email: 'test@example.com', name: 'Tester' })
    };

    await TestBed.configureTestingModule({
      imports: [LibraryComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load library items', () => {
    expect(component).toBeTruthy();
    expect(libraryServiceSpy.getLibrary).toHaveBeenCalled();
  });

  it('should display favorites and regulars in separate lists (RN-04.1)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const favoriteTitles = compiled.querySelectorAll('[data-testid="favorite-item"]');
    const regularTitles = compiled.querySelectorAll('[data-testid="regular-item"]');

    expect(favoriteTitles.length).toBe(1);
    expect(regularTitles.length).toBe(1);
  });

  it('should increment chapter progress when not reaching lastChapter (RN-03.3)', () => {
    component.incrementChapter(mockFavorite);
    expect(libraryServiceSpy.updateProgress).toHaveBeenCalledWith('lib-1', 11);
  });

  it('should block increment when currentChapter reaches lastChapter (RN-03.2)', () => {
    component.incrementChapter(mockRegular);
    expect(libraryServiceSpy.updateProgress).not.toHaveBeenCalled();
    expect(component.errorBanner()).toContain('último capítulo');
  });

  it('should decrement chapter progress down to minimum 1', () => {
    component.decrementChapter(mockFavorite);
    expect(libraryServiceSpy.updateProgress).toHaveBeenCalledWith('lib-1', 9);
  });

  it('should toggle favorite status (RN-04.2)', () => {
    component.toggleFavorite(mockFavorite);
    expect(libraryServiceSpy.toggleFavorite).toHaveBeenCalledWith('lib-1', false);
  });

  it('should remove item from library after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.removeItem(mockFavorite);
    expect(libraryServiceSpy.removeFromLibrary).toHaveBeenCalledWith('lib-1');
  });
});
