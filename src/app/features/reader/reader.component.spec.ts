import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { ReaderComponent } from './reader.component';
import { ReaderService } from '../../core/services/reader.service';
import { LibraryService } from '../../core/services/library.service';
import { AuthService } from '../../core/auth/auth.service';
import { ChapterImagesResponse } from '../../core/models/reader.model';

describe('ReaderComponent', () => {
  let component: ReaderComponent;
  let fixture: ComponentFixture<ReaderComponent>;
  let readerServiceSpy: jasmine.SpyObj<ReaderService>;
  let libraryServiceSpy: jasmine.SpyObj<LibraryService>;
  let router: Router;

  const mockChapter: ChapterImagesResponse = {
    canonicalManhuaId: 1,
    slug: 'overgeared',
    title: 'Overgeared',
    chapter: 10,
    lastChapter: 50,
    totalImages: 3,
    images: [
      { index: 1, url: 'https://images.unsplash.com/panel-1', proxyUrl: '/api/reader/proxy-image?url=panel1' },
      { index: 2, url: 'https://images.unsplash.com/panel-2', proxyUrl: '/api/reader/proxy-image?url=panel2' },
      { index: 3, url: 'https://images.unsplash.com/panel-3', proxyUrl: '/api/reader/proxy-image?url=panel3' }
    ]
  };

  beforeEach(async () => {
    readerServiceSpy = jasmine.createSpyObj('ReaderService', ['getChapterImages']);
    readerServiceSpy.getChapterImages.and.returnValue(of(mockChapter));

    libraryServiceSpy = jasmine.createSpyObj('LibraryService', ['getLibraryItemByCanonicalId', 'updateProgress'], {
      library: signal([])
    });

    const authServiceMock = {
      isAuthenticated: () => true,
      currentUser: signal({ id: 'user-1', email: 'test@example.com' })
    };

    await TestBed.configureTestingModule({
      imports: [ReaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ slug: 'overgeared', chapter: '10' }),
            snapshot: { paramMap: { get: (k: string) => k === 'slug' ? 'overgeared' : '10' } }
          }
        },
        { provide: ReaderService, useValue: readerServiceSpy },
        { provide: LibraryService, useValue: libraryServiceSpy },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ReaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load chapter images', () => {
    expect(component).toBeTruthy();
    expect(readerServiceSpy.getChapterImages).toHaveBeenCalledWith('overgeared', 10);
    expect(component.response()?.images.length).toBe(3);
  });

  it('should render all webtoon image panels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const imgElements = compiled.querySelectorAll('img[data-testid="reader-panel"]');
    expect(imgElements.length).toBe(3);
  });

  it('should navigate to next chapter when available', () => {
    component.nextChapter();
    expect(router.navigate).toHaveBeenCalledWith(['/reader', 'overgeared', 11]);
  });

  it('should block navigation to next chapter when at lastChapter (RN-03.2)', () => {
    // Set to last chapter
    component.currentChapter.set(50);
    component.response.set({ ...mockChapter, chapter: 50, lastChapter: 50 });
    component.nextChapter();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.isMaxChapter()).toBeTrue();
  });

  it('should navigate to previous chapter', () => {
    component.prevChapter();
    expect(router.navigate).toHaveBeenCalledWith(['/reader', 'overgeared', 9]);
  });

  it('should block navigation to previous chapter when at chapter 1', () => {
    component.currentChapter.set(1);
    component.response.set({ ...mockChapter, chapter: 1 });
    component.prevChapter();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle keyboard shortcuts for navigation', () => {
    // Right arrow -> next
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(router.navigate).toHaveBeenCalledWith(['/reader', 'overgeared', 11]);

    // Left arrow -> prev
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(router.navigate).toHaveBeenCalledWith(['/reader', 'overgeared', 9]);
  });
});
