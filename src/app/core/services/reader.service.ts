import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChapterImagesResponse } from '../models/reader.model';

@Injectable({
  providedIn: 'root'
})
export class ReaderService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reader`;

  getChapterImages(slug: string, chapter: number): Observable<ChapterImagesResponse> {
    const params = new HttpParams()
      .set('slug', slug)
      .set('chapter', chapter.toString());

    return this.http.get<ChapterImagesResponse>(`${this.baseUrl}/chapter-images`, { params });
  }
}
