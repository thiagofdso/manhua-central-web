import { Injectable } from '@angular/core';

export interface OfflineImage {
  index: number;
  url: string;
  blob: Blob;
  objectUrl?: string;
}

export interface OfflineChapter {
  id: string; // `${slug}_${chapter}`
  canonicalManhuaId: number;
  slug: string;
  title: string;
  chapter: number;
  downloadedAt: number;
  totalImages: number;
  totalSizeBytes: number;
  images: OfflineImage[];
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private readonly dbName = 'manhua_offline_db';
  private readonly storeName = 'downloaded_chapters';
  private readonly dbVersion = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('slug', 'slug', { unique: false });
          store.createIndex('canonicalManhuaId', 'canonicalManhuaId', { unique: false });
          store.createIndex('chapter', 'chapter', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Saves or updates an offline chapter with full binary Blobs.
   * RN-05.4 / ADR-0011: Retained perpetually until user commands deletion.
   */
  async saveChapter(chapter: OfflineChapter): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      // Clean transient objectUrls before saving to IDB
      const sanitizedChapter: OfflineChapter = {
        ...chapter,
        images: chapter.images.map(img => ({
          index: img.index,
          url: img.url,
          blob: img.blob
        }))
      };

      const req = store.put(sanitizedChapter);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves a specific chapter from offline storage.
   */
  async getChapter(slug: string, chapter: number): Promise<OfflineChapter | null> {
    const db = await this.getDB();
    const id = `${slug}_${chapter}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result as OfflineChapter | undefined;
        resolve(result || null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fast existence check for offline-first reading (RN-05.3).
   */
  async isChapterDownloaded(slug: string, chapter: number): Promise<boolean> {
    const ch = await this.getChapter(slug, chapter);
    return ch !== null;
  }

  /**
   * Lists all chapters downloaded for a given manhua slug, sorted by chapter number.
   */
  async getDownloadedChaptersBySlug(slug: string): Promise<OfflineChapter[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('slug');
      const req = index.getAll(IDBKeyRange.only(slug));

      req.onsuccess = () => {
        const results = (req.result as OfflineChapter[]) || [];
        results.sort((a, b) => a.chapter - b.chapter);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves all offline chapters stored across all manhuas.
   */
  async getAllDownloadedChapters(): Promise<OfflineChapter[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve((req.result as OfflineChapter[]) || []);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Deletes a single downloaded chapter upon explicit user command (RN-05.4).
   */
  async deleteChapter(slug: string, chapter: number): Promise<void> {
    const db = await this.getDB();
    const id = `${slug}_${chapter}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Deletes all downloaded chapters of a specific manhua upon user command.
   */
  async deleteManhuaDownloads(slug: string): Promise<void> {
    const chapters = await this.getDownloadedChaptersBySlug(slug);
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      for (const ch of chapters) {
        store.delete(ch.id);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Global clear of all offline chapters upon user command.
   */
  async clearAllDownloads(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Calculates total disk storage utilized by offline chapters.
   */
  async getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; chapterCount: number }> {
    const chapters = await this.getAllDownloadedChapters();
    const usedBytes = chapters.reduce((sum, ch) => sum + (ch.totalSizeBytes || 0), 0);

    let quotaBytes = 500 * 1024 * 1024; // 500 MB default
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) quotaBytes = est.quota;
      } catch {
        // Fallback to default quota
      }
    }

    return {
      usedBytes,
      quotaBytes,
      chapterCount: chapters.length
    };
  }
}
