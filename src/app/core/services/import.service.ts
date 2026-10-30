import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportDomain, ImportBrowseResponse, ImportAnnotatedItem, ImportResult } from '../models/import.model';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/import';

  getDomains(): Observable<ImportDomain[]> {
    return this.http.get<ImportDomain[]>(`${this.baseUrl}/domains`);
  }

  browse(domain: string, query?: string, page: number = 1): Observable<ImportBrowseResponse> {
    let params = new HttpParams()
      .set('domain', domain)
      .set('page', page.toString());

    if (query && query.trim()) {
      params = params.set('q', query.trim());
    }

    return this.http.get<ImportBrowseResponse>(`${this.baseUrl}/browse`, { params });
  }

  importWorks(items: ImportAnnotatedItem[]): Observable<ImportResult> {
    return this.http.post<ImportResult>(this.baseUrl, { items });
  }
}
