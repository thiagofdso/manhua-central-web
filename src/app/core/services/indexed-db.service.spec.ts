import { TestBed } from '@angular/core/testing';
import { IndexedDbService, OfflineChapter } from './indexed-db.service';

describe('IndexedDbService', () => {
  let service: IndexedDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IndexedDbService]
    });
    service = TestBed.inject(IndexedDbService);
  });

  afterEach(async () => {
    await service.clearAllDownloads();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and retrieve an offline chapter with image Blobs (RN-05.3 & ADR-0011)', async () => {
    const dummyBlob = new Blob(['mock binary image content'], { type: 'image/jpeg' });
    const chapter: OfflineChapter = {
      id: 'overgeared_1',
      canonicalManhuaId: 1,
      slug: 'overgeared',
      title: 'Overgeared',
      chapter: 1,
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

    await service.saveChapter(chapter);

    const isDownloaded = await service.isChapterDownloaded('overgeared', 1);
    expect(isDownloaded).toBeTrue();

    const retrieved = await service.getChapter('overgeared', 1);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.slug).toBe('overgeared');
    expect(retrieved?.chapter).toBe(1);
    expect(retrieved?.images.length).toBe(1);
    expect(retrieved?.images[0].blob.size).toBe(dummyBlob.size);
  });

  it('should list all downloaded chapters for a manhua slug', async () => {
    const dummyBlob = new Blob(['sample data'], { type: 'image/jpeg' });
    const ch1: OfflineChapter = {
      id: 'solo_1',
      canonicalManhuaId: 2,
      slug: 'solo',
      title: 'Solo Leveling',
      chapter: 1,
      downloadedAt: Date.now(),
      totalImages: 1,
      totalSizeBytes: dummyBlob.size,
      images: [{ index: 1, url: 'url1', blob: dummyBlob }]
    };
    const ch2: OfflineChapter = {
      id: 'solo_2',
      canonicalManhuaId: 2,
      slug: 'solo',
      title: 'Solo Leveling',
      chapter: 2,
      downloadedAt: Date.now(),
      totalImages: 1,
      totalSizeBytes: dummyBlob.size,
      images: [{ index: 1, url: 'url2', blob: dummyBlob }]
    };

    await service.saveChapter(ch1);
    await service.saveChapter(ch2);

    const list = await service.getDownloadedChaptersBySlug('solo');
    expect(list.length).toBe(2);
    expect(list.map(c => c.chapter)).toEqual([1, 2]);
  });

  it('should explicitly delete a chapter when requested (RN-05.4)', async () => {
    const dummyBlob = new Blob(['data'], { type: 'image/jpeg' });
    const ch: OfflineChapter = {
      id: 'del_test_1',
      canonicalManhuaId: 3,
      slug: 'del_test',
      title: 'Delete Test',
      chapter: 1,
      downloadedAt: Date.now(),
      totalImages: 1,
      totalSizeBytes: dummyBlob.size,
      images: [{ index: 1, url: 'u', blob: dummyBlob }]
    };

    await service.saveChapter(ch);
    expect(await service.isChapterDownloaded('del_test', 1)).toBeTrue();

    await service.deleteChapter('del_test', 1);
    expect(await service.isChapterDownloaded('del_test', 1)).toBeFalse();
  });
});
