import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChapterImagesResponse, ChapterImage } from '../models/reader.model';
import { IndexedDbService } from './indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class ReaderService {
  private http = inject(HttpClient);
  private indexedDb = inject(IndexedDbService);
  private readonly baseUrl = `${environment.apiUrl}/reader`;

  /**
   * RN-05.3: Offline-First Priority.
   * Checks local IndexedDB storage before issuing any external network HTTP request.
   */
  getChapterImages(slug: string, chapter: number): Observable<ChapterImagesResponse> {
    return from(this.indexedDb.getChapter(slug, chapter)).pipe(
      switchMap((offlineCh) => {
        if (offlineCh && offlineCh.images.length > 0) {
          const images: ChapterImage[] = offlineCh.images.map((img) => {
            let blobUrl = img.url;
            if (typeof window !== 'undefined' && typeof URL !== 'undefined' && img.blob) {
              blobUrl = URL.createObjectURL(img.blob);
            }
            return {
              index: img.index,
              url: img.url,
              proxyUrl: blobUrl
            };
          });

          const response: ChapterImagesResponse = {
            canonicalManhuaId: offlineCh.canonicalManhuaId,
            slug: offlineCh.slug,
            title: offlineCh.title,
            chapter: offlineCh.chapter,
            totalImages: offlineCh.totalImages,
            images,
            isOffline: true
          };

          return of(response);
        }

        // Fallback to network request if not available offline
        const params = new HttpParams()
          .set('slug', slug)
          .set('chapter', chapter.toString());

        return this.http.get<ChapterImagesResponse>(`${this.baseUrl}/chapter-images`, { params });
      })
    );
  }
}
