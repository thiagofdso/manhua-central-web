import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LibraryService } from './library.service';
import { UserLibrary, AddToLibraryDTO } from '../models/library.model';
import { environment } from '../../../environments/environment';

describe('LibraryService', () => {
  let service: LibraryService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/library`;

  const mockLibrary: UserLibrary[] = [
    {
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
        synopsis: 'Hunter Sung Jin-woo',
        coverUrl: 'https://images.unsplash.com/photo-1',
        primaryDomain: 'asurascans.com',
        urlTemplate: 'https://asurascans.com/manga/solo-leveling/{chapter}',
        isHiatus: false,
        bayesianRating: 9.8,
        totalVotes: 1000,
        totalViews: 50000,
        createdAt: '2026-10-23T00:00:00Z',
        updatedAt: '2026-10-23T00:00:00Z'
      }
    },
    {
      id: 'lib-2',
      userId: 'user-1',
      canonicalManhuaId: 2,
      currentChapter: 5,
      isFavorite: false,
      customOrder: 0,
      createdAt: '2026-10-23T00:00:00Z',
      updatedAt: 1729700000,
      canonicalManhua: {
        id: 2,
        title: 'Omniscient Reader',
        slug: 'omniscient-reader',
        synopsis: 'Dokja',
        coverUrl: 'https://images.unsplash.com/photo-3',
        primaryDomain: 'ravenscans.org',
        urlTemplate: 'https://ravenscans.org/manga/omniscient-reader/{chapter}',
        isHiatus: false,
        bayesianRating: 9.5,
        totalVotes: 800,
        totalViews: 40000,
        createdAt: '2026-10-23T00:00:00Z',
        updatedAt: '2026-10-23T00:00:00Z'
      }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LibraryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(LibraryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch library and separate favorites from regular items', () => {
    service.getLibrary().subscribe(items => {
      expect(items.length).toBe(2);
      expect(service.favorites().length).toBe(1);
      expect(service.favorites()[0].id).toBe('lib-1');
      expect(service.regulars().length).toBe(1);
      expect(service.regulars()[0].id).toBe('lib-2');
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockLibrary);
  });

  it('should add an item to library and update reactive signals', () => {
    const dto: AddToLibraryDTO = {
      canonicalManhuaId: 3,
      currentChapter: 1,
      isFavorite: false
    };

    const newItem: UserLibrary = {
      id: 'lib-3',
      userId: 'user-1',
      canonicalManhuaId: 3,
      currentChapter: 1,
      isFavorite: false,
      customOrder: 1,
      createdAt: '2026-10-23T00:00:00Z',
      updatedAt: 1729700000
    };

    service.addToLibrary(dto).subscribe(item => {
      expect(item.id).toBe('lib-3');
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(newItem);
  });

  it('should update reading progress (RN-03.3)', () => {
    service.updateProgress('lib-1', 11).subscribe(item => {
      expect(item.currentChapter).toBe(11);
    });

    const req = httpTesting.expectOne(`${baseUrl}/lib-1/progress`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ currentChapter: 11 });
    req.flush({ ...mockLibrary[0], currentChapter: 11 });
  });

  it('should toggle favorite status (RN-04.2)', () => {
    service.toggleFavorite('lib-2', true).subscribe(item => {
      expect(item.isFavorite).toBeTrue();
    });

    const req = httpTesting.expectOne(`${baseUrl}/lib-2/favorite`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isFavorite: true });
    req.flush({ ...mockLibrary[1], isFavorite: true });
  });

  it('should reorder library items (RN-04.3)', () => {
    const itemIds = ['lib-1', 'lib-2'];
    service.reorderLibrary(itemIds).subscribe(res => {
      expect(res.message).toBe('Library reordered successfully');
    });

    const req = httpTesting.expectOne(`${baseUrl}/reorder`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ itemIds });
    req.flush({ message: 'Library reordered successfully' });
  });

  it('should remove item from library', () => {
    service.removeFromLibrary('lib-2').subscribe(res => {
      expect(res.message).toBe('Library item deleted successfully');
    });

    const req = httpTesting.expectOne(`${baseUrl}/lib-2`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Library item deleted successfully' });
  });
});
