import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CatalogDetailComponent } from './catalog-detail.component';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/services/library.service';
import { RankingService } from '../../core/services/ranking.service';
import { CanonicalManhua } from '../../core/models/catalog.model';

describe('CatalogDetailComponent', () => {
  let component: CatalogDetailComponent;
  let fixture: ComponentFixture<CatalogDetailComponent>;
  let mockCatalogService: jasmine.SpyObj<CatalogService>;
  let mockLibraryService: jasmine.SpyObj<LibraryService>;
  let mockRankingService: jasmine.SpyObj<RankingService>;

  const mockManhua: CanonicalManhua = {
    id: 1,
    slug: 'overgeared',
    title: 'Overgeared',
    alternativeTitles: 'Tempal',
    synopsis: 'Shin Youngwoo becomes the legendary blacksmith Grid!',
    coverUrl: 'https://cdn.asurascans.com/covers/overgeared.webp',
    primaryDomain: 'asurascans.com',
    urlTemplate: 'https://asurascans.com/comics/overgeared/chapter/{chapter}',
    lastChapter: 344,
    isHiatus: false,
    bayesianRating: 9.52,
    totalVotes: 1450,
    totalViews: 280000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockCatalogService = jasmine.createSpyObj('CatalogService', ['getBySlug']);
    mockCatalogService.getBySlug.and.returnValue(of(mockManhua));

    mockLibraryService = jasmine.createSpyObj('LibraryService', ['getLibrary', 'addToLibrary', 'isInLibrary']);
    mockLibraryService.isInLibrary.and.returnValue(false);
    mockLibraryService.getLibrary.and.returnValue(of([]));

    mockRankingService = jasmine.createSpyObj('RankingService', ['getUserRating', 'submitRating']);
    mockRankingService.getUserRating.and.returnValue(of({ canonicalManhuaId: 1, score: null }));

    await TestBed.configureTestingModule({
      imports: [CatalogDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => 'overgeared' } }
          }
        },
        { provide: CatalogService, useValue: mockCatalogService },
        { provide: LibraryService, useValue: mockLibraryService },
        { provide: RankingService, useValue: mockRankingService },
        { provide: AuthService, useValue: { isAuthenticated: () => false, currentUser: signal(null) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load manhua details on init', () => {
    expect(component).toBeTruthy();
    expect(mockCatalogService.getBySlug).toHaveBeenCalledWith('overgeared');
    expect(component.manhua()?.title).toBe('Overgeared');
    expect(component.manhua()?.lastChapter).toBe(344);
  });

  it('should generate chapters list up to lastChapter', () => {
    const chapters = component.chapters();
    expect(chapters.length).toBe(344);
    expect(chapters[0]).toBe(1);
    expect(chapters[343]).toBe(344);
  });

  it('should submit rating when onRate is called by authenticated user', () => {
    spyOn(component, 'isAuthenticated').and.returnValue(true);
    mockRankingService.submitRating.and.returnValue(of({
      ...mockManhua,
      bayesianRating: 4.95,
      totalVotes: 1451
    }));

    component.onRate(5);

    expect(mockRankingService.submitRating).toHaveBeenCalledWith(1, 5);
    expect(component.userRating()).toBe(5);
    expect(component.manhua()?.bayesianRating).toBe(4.95);
  });
});
