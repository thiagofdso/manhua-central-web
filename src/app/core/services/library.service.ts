import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UserLibrary,
  AddToLibraryDTO,
  UpdateProgressDTO,
  ToggleFavoriteDTO,
  ReorderLibraryDTO
} from '../models/library.model';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/library`;

  // Reactive state
  readonly library = signal<UserLibrary[]>([]);

  // Computed signals
  readonly favorites = computed(() => this.library().filter(item => item.isFavorite));
  readonly regulars = computed(() => this.library().filter(item => !item.isFavorite));

  getLibrary(): Observable<UserLibrary[]> {
    return this.http.get<UserLibrary[]>(this.baseUrl).pipe(
      tap(items => this.library.set(items || []))
    );
  }

  addToLibrary(dto: AddToLibraryDTO): Observable<UserLibrary> {
    return this.http.post<UserLibrary>(this.baseUrl, dto).pipe(
      tap(newItem => {
        this.library.update(items => {
          const filtered = items.filter(i => i.id !== newItem.id);
          if (newItem.isFavorite) {
            return [newItem, ...filtered];
          }
          const favs = filtered.filter(i => i.isFavorite);
          const nonFavs = filtered.filter(i => !i.isFavorite);
          return [...favs, newItem, ...nonFavs];
        });
      })
    );
  }

  updateProgress(id: string, currentChapter: number): Observable<UserLibrary> {
    const payload: UpdateProgressDTO = { currentChapter };
    return this.http.patch<UserLibrary>(`${this.baseUrl}/${id}/progress`, payload).pipe(
      tap(updatedItem => {
        this.library.update(items => {
          const preservedCanonical = items.find(i => i.id === id)?.canonicalManhua;
          const merged: UserLibrary = {
            ...updatedItem,
            canonicalManhua: updatedItem.canonicalManhua || preservedCanonical
          };
          const remaining = items.filter(i => i.id !== id);
          if (merged.isFavorite) {
            return [merged, ...remaining];
          } else {
            const favs = remaining.filter(i => i.isFavorite);
            const nonFavs = remaining.filter(i => !i.isFavorite);
            return [...favs, merged, ...nonFavs];
          }
        });
      })
    );
  }

  toggleFavorite(id: string, isFavorite: boolean): Observable<UserLibrary> {
    const payload: ToggleFavoriteDTO = { isFavorite };
    return this.http.patch<UserLibrary>(`${this.baseUrl}/${id}/favorite`, payload).pipe(
      tap(updatedItem => {
        this.library.update(items => {
          const preservedCanonical = items.find(i => i.id === id)?.canonicalManhua;
          const merged: UserLibrary = {
            ...updatedItem,
            canonicalManhua: updatedItem.canonicalManhua || preservedCanonical
          };
          const remaining = items.filter(i => i.id !== id);
          if (merged.isFavorite) {
            return [merged, ...remaining];
          } else {
            const favs = remaining.filter(i => i.isFavorite);
            const nonFavs = remaining.filter(i => !i.isFavorite);
            return [...favs, merged, ...nonFavs];
          }
        });
      })
    );
  }

  reorderLibrary(itemIds: string[]): Observable<{ message: string }> {
    const payload: ReorderLibraryDTO = { itemIds };
    return this.http.put<{ message: string }>(`${this.baseUrl}/reorder`, payload).pipe(
      tap(() => {
        this.library.update(items => {
          const map = new Map(items.map(i => [i.id, i]));
          const reordered: UserLibrary[] = [];
          for (const id of itemIds) {
            const found = map.get(id);
            if (found) {
              reordered.push(found);
              map.delete(id);
            }
          }
          for (const item of map.values()) {
            reordered.push(item);
          }
          return reordered;
        });
      })
    );
  }

  removeFromLibrary(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.library.update(items => items.filter(i => i.id !== id));
      })
    );
  }

  isInLibrary(canonicalId: number): boolean {
    return this.library().some(item => item.canonicalManhuaId === canonicalId);
  }

  getLibraryItemByCanonicalId(canonicalId: number): UserLibrary | undefined {
    return this.library().find(item => item.canonicalManhuaId === canonicalId);
  }
}
