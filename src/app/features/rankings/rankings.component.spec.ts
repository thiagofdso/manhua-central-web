import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { RankingsComponent } from './rankings.component';
import { RankingService } from '../../core/services/ranking.service';
import { AuthService } from '../../core/auth/auth.service';
import { LibraryService } from '../../core/services/library.service';
import { RankedManhua } from '../../core/models/ranking.model';

describe('RankingsComponent', () => {
  let component: RankingsComponent;
  let fixture: ComponentFixture<RankingsComponent>;
  let rankingServiceSpy: jasmine.SpyObj<RankingService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let libraryServiceSpy: jasmine.SpyObj<LibraryService>;
  let router: Router;

  const mockRankings: RankedManhua[] = [
    {
      rank: 1,
      score: 4.88,
      canonical: {
        id: 1,
        slug: 'solo-leveling',
        title: 'Solo Leveling',
        primaryDomain: 'asurascans.com',
        urlTemplate: 'https://asurascans.com/{chapter}',
        isHiatus: false,
        bayesianRating: 4.88,
        totalVotes: 120,
        totalViews: 50000,
        createdAt: '',
        updatedAt: ''
      }
    },
    {
      rank: 2,
      score: 4.75,
      canonical: {
        id: 2,
        slug: 'overgeared',
        title: 'Overgeared',
        primaryDomain: 'ravenscans.org',
        urlTemplate: 'https://ravenscans.org/{chapter}',
        isHiatus: false,
        bayesianRating: 4.75,
        totalVotes: 95,
        totalViews: 35000,
        createdAt: '',
        updatedAt: ''
      }
    }
  ];

  beforeEach(async () => {
    rankingServiceSpy = jasmine.createSpyObj('RankingService', ['getRankings', 'submitRating', 'getUserRating']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    libraryServiceSpy = jasmine.createSpyObj('LibraryService', ['addToLibrary']);

    rankingServiceSpy.getRankings.and.returnValue(of(mockRankings));
    rankingServiceSpy.getUserRating.and.returnValue(of({ canonicalManhuaId: 1, score: 5 }));
    authServiceSpy.isAuthenticated.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [RankingsComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RankingService, useValue: rankingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LibraryService, useValue: libraryServiceSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(RankingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load top_rated rankings on init', () => {
    expect(component).toBeTruthy();
    expect(rankingServiceSpy.getRankings).toHaveBeenCalledWith('top_rated', 20);
    expect(component.rankings().length).toBe(2);
    expect(component.rankings()[0].canonical.title).toBe('Solo Leveling');
  });

  it('should switch tab and load new rankings', () => {
    component.switchTab('daily');
    expect(component.activeTab()).toBe('daily');
    expect(rankingServiceSpy.getRankings).toHaveBeenCalledWith('daily', 20);
  });

  it('should submit rating when user is authenticated', () => {
    const updated = { ...mockRankings[0].canonical, bayesianRating: 4.90, totalVotes: 121 };
    rankingServiceSpy.submitRating.and.returnValue(of(updated));

    component.onRate(1, 5);

    expect(rankingServiceSpy.submitRating).toHaveBeenCalledWith(1, 5);
    expect(component.userRatings()[1]).toBe(5);
  });

  it('should redirect to login when unauthenticated user attempts to rate', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    component.onRate(1, 5);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(rankingServiceSpy.submitRating).not.toHaveBeenCalled();
  });

  it('should add item to library when authenticated', () => {
    libraryServiceSpy.addToLibrary.and.returnValue(of({
      id: 'lib-1',
      userId: 'u1',
      canonicalManhuaId: 1,
      currentChapter: 1,
      isFavorite: false,
      customOrder: 1,
      createdAt: '',
      updatedAt: 1
    }));

    component.addToLibrary(mockRankings[0].canonical);

    expect(libraryServiceSpy.addToLibrary).toHaveBeenCalledWith({
      canonicalManhuaId: 1,
      currentChapter: 1,
      isFavorite: false
    });
    expect(component.addedToLibrary()[1]).toBeTrue();
  });
});
