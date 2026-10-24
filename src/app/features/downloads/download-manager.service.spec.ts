import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DownloadManagerService } from './download-manager.service';
import { IndexedDbService } from '../../core/services/indexed-db.service';

describe('DownloadManagerService', () => {
  let service: DownloadManagerService;
  let httpMock: HttpTestingController;
  let indexedDbSpy: jasmine.SpyObj<IndexedDbService>;

  beforeEach(() => {
    indexedDbSpy = jasmine.createSpyObj('IndexedDbService', ['saveChapter', 'isChapterDownloaded']);
    indexedDbSpy.saveChapter.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DownloadManagerService,
        { provide: IndexedDbService, useValue: indexedDbSpy }
      ]
    });

    service = TestBed.inject(DownloadManagerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should enqueue batch download tasks and call backend batch API', () => {
    const mockBatchResponse = {
      canonicalManhuaId: 1,
      slug: 'overgeared',
      title: 'Overgeared',
      start: 1,
      end: 2,
      totalChapters: 2,
      chapters: [
        {
          chapter: 1,
          success: true,
          images: [{ index: 1, url: 'https://example.com/1.jpg', proxyUrl: '/api/proxy?url=1' }]
        },
        {
          chapter: 2,
          success: true,
          images: [{ index: 1, url: 'https://example.com/2.jpg', proxyUrl: '/api/proxy?url=2' }]
        }
      ]
    };

    service.startBatchDownload(1, 'overgeared', 'Overgeared', 1, 2);

    const req = httpMock.expectOne('/api/reader/batch?canonicalId=1&start=1&end=2');
    expect(req.request.method).toBe('GET');
    req.flush(mockBatchResponse);

    const tasks = service.tasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].id).toBe('overgeared_1');
    expect(tasks[1].id).toBe('overgeared_2');
  });

  it('should cancel active task via AbortController (RN-05.5)', () => {
    const mockBatchResponse = {
      canonicalManhuaId: 1,
      slug: 'overgeared',
      title: 'Overgeared',
      start: 1,
      end: 1,
      totalChapters: 1,
      chapters: [
        {
          chapter: 1,
          success: true,
          images: [{ index: 1, url: 'https://example.com/1.jpg', proxyUrl: '/api/proxy?url=1' }]
        }
      ]
    };

    service.startBatchDownload(1, 'overgeared', 'Overgeared', 1, 1);
    const req = httpMock.expectOne('/api/reader/batch?canonicalId=1&start=1&end=1');
    req.flush(mockBatchResponse);

    service.cancelTask('overgeared_1');
    const task = service.tasks().find(t => t.id === 'overgeared_1');
    expect(task?.status).toBe('cancelled');
  });
});
