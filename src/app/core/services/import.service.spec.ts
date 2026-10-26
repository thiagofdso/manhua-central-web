import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImportService } from './import.service';

describe('ImportService', () => {
  let service: ImportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImportService]
    });
    service = TestBed.inject(ImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch supported domains', () => {
    const mockDomains = [
      { domain: 'asurascans.com', name: 'Asura Scans', supported: true },
      { domain: 'ravenscans.org', name: 'RavenScans', supported: true }
    ];

    service.getDomains().subscribe(domains => {
      expect(domains.length).toBe(2);
      expect(domains[0].domain).toBe('asurascans.com');
    });

    const req = httpMock.expectOne('/api/import/domains');
    expect(req.request.method).toBe('GET');
    req.flush(mockDomains);
  });

  it('should browse works from domain', () => {
    service.browse('asurascans.com', 'solo', 1).subscribe(res => {
      expect(res.domain).toBe('asurascans.com');
      expect(res.items.length).toBe(1);
      expect(res.items[0].title).toBe('Solo Leveling');
    });

    const req = httpMock.expectOne('/api/import/browse?domain=asurascans.com&page=1&q=solo');
    expect(req.request.method).toBe('GET');
    req.flush({
      domain: 'asurascans.com',
      page: 1,
      totalPages: 1,
      items: [
        {
          title: 'Solo Leveling',
          slug: 'solo-leveling',
          urlTemplate: 'https://...',
          coverUrl: 'https://...',
          primaryDomain: 'asurascans.com',
          alreadyInCatalog: false,
          alreadyInLibrary: false
        }
      ]
    });
  });

  it('should post items for batch import', () => {
    const items = [
      {
        title: 'Solo Leveling',
        slug: 'solo-leveling',
        urlTemplate: 'https://...',
        coverUrl: 'https://...',
        primaryDomain: 'asurascans.com',
        alreadyInCatalog: false,
        alreadyInLibrary: false
      }
    ];

    service.importWorks(items).subscribe(res => {
      expect(res.status).toBe('ok');
      expect(res.importedCount).toBe(1);
    });

    const req = httpMock.expectOne('/api/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ items });
    req.flush({ status: 'ok', importedCount: 1, addedToLibraryCount: 1 });
  });
});
