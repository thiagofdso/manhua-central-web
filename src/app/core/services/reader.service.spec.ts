import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReaderService } from './reader.service';
import { ChapterImagesResponse } from '../models/reader.model';
import { environment } from '../../../environments/environment';
import { IndexedDbService, OfflineChapter } from './indexed-db.service';

describe('ReaderService', () => {
  let service: ReaderService;
  let httpTesting: HttpTestingController;
  let indexedDbSpy: jasmine.SpyObj<IndexedDbService>;
  const baseUrl = `${environment.apiUrl}/reader`;

  const mockResponse: ChapterImagesResponse = {
    canonicalManhuaId: 1,
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    chapter: 10,
    lastChapter: 200,
    totalImages: 2,
    images: [
      {
        index: 1,
        url: 'https://images.unsplash.com/photo-1',
        proxyUrl: '/api/reader/proxy-image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1'
      },
      {
        index: 2,
        url: 'https://images.unsplash.com/photo-2',
        proxyUrl: '/api/reader/proxy-image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-2'
      }
    ]
  };

  beforeEach(() => {
    indexedDbSpy = jasmine.createSpyObj('IndexedDbService', ['getChapter']);
    indexedDbSpy.getChapter.and.returnValue(Promise.resolve(null));

    TestBed.configureTestingModule({
      providers: [
        ReaderService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IndexedDbService, useValue: indexedDbSpy }
      ]
    });
    service = TestBed.inject(ReaderService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch chapter images via network when offline chapter is not found', (done) => {
    service.getChapterImages('solo-leveling', 10).subscribe(res => {
      expect(res.slug).toBe('solo-leveling');
      expect(res.chapter).toBe(10);
      expect(res.images.length).toBe(2);
      done();
    });

    // Handle microtask for IDB promise before HTTP request is made
    setTimeout(() => {
      const req = httpTesting.expectOne(`${baseUrl}/chapter-images?slug=solo-leveling&chapter=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    }, 10);
  });

  it('should return offline chapter immediately without HTTP call when found in IndexedDB (RN-05.3)', (done) => {
    const dummyBlob = new Blob(['sample-img'], { type: 'image/jpeg' });
    const offlineCh: OfflineChapter = {
      id: 'solo-leveling_10',
      canonicalManhuaId: 1,
      slug: 'solo-leveling',
      title: 'Solo Leveling',
      chapter: 10,
      downloadedAt: Date.now(),
      totalImages: 1,
      totalSizeBytes: dummyBlob.size,
      images: [
        {
          index: 1,
          url: 'https://example.com/panel1.jpg',
          blob: dummyBlob
        }
      ]
    };
    indexedDbSpy.getChapter.and.returnValue(Promise.resolve(offlineCh));

    service.getChapterImages('solo-leveling', 10).subscribe(res => {
      expect(res.isOffline).toBeTrue();
      expect(res.slug).toBe('solo-leveling');
      expect(res.chapter).toBe(10);
      expect(res.images.length).toBe(1);
      // No HTTP request should have been made
      httpTesting.expectNone(`${baseUrl}/chapter-images?slug=solo-leveling&chapter=10`);
      done();
    });
  });
});
