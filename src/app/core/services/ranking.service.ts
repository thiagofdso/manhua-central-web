import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RankedManhua, RankingType, UserRatingResponse } from '../models/ranking.model';
import { CanonicalManhua } from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getRankings(type: RankingType = 'top_rated', limit: number = 20): Observable<RankedManhua[]> {
    const params = new HttpParams()
      .set('type', type)
      .set('limit', limit.toString());

    return this.http.get<RankedManhua[]>(`${this.baseUrl}/rankings`, { params });
  }

  submitRating(canonicalManhuaId: number, score: number): Observable<CanonicalManhua> {
    return this.http.post<CanonicalManhua>(`${this.baseUrl}/ratings`, {
      canonicalManhuaId,
      score
    });
  }

  getUserRating(canonicalManhuaId: number): Observable<UserRatingResponse> {
    return this.http.get<UserRatingResponse>(`${this.baseUrl}/ratings/me/${canonicalManhuaId}`);
  }

  recordView(canonicalManhuaId: number): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/reader/view`, {
      canonicalManhuaId
    });
  }
}
