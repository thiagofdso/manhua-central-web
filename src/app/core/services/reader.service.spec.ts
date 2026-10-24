import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReaderService } from './reader.service';
import { ChapterImagesResponse } from '../models/reader.model';
import { environment } from '../../../environments/environment';

describe('ReaderService', () => {
  let service: ReaderService;
  let httpTesting: HttpTestingController;
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
    TestBed.configureTestingModule({
      providers: [
        ReaderService,
        provideHttpClient(),
        provideHttpClientTesting()
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

  it('should fetch chapter images with query params', () => {
    service.getChapterImages('solo-leveling', 10).subscribe(res => {
      expect(res.slug).toBe('solo-leveling');
      expect(res.chapter).toBe(10);
      expect(res.images.length).toBe(2);
    });

    const req = httpTesting.expectOne(`${baseUrl}/chapter-images?slug=solo-leveling&chapter=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
