import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RankingService } from './ranking.service';
import { RankedManhua, UserRatingResponse } from '../models/ranking.model';
import { CanonicalManhua } from '../models/catalog.model';

describe('RankingService', () => {
  let service: RankingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RankingService]
    });

    service = TestBed.inject(RankingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch rankings with default type and limit', () => {
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
      }
    ];

    service.getRankings('top_rated', 10).subscribe((rankings) => {
      expect(rankings.length).toBe(1);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[0].score).toBe(4.88);
      expect(rankings[0].canonical.title).toBe('Solo Leveling');
    });

    const req = httpMock.expectOne('/api/rankings?type=top_rated&limit=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockRankings);
  });

  it('should submit a 1-5 star user rating', () => {
    const mockManhua: Partial<CanonicalManhua> = {
      id: 1,
      title: 'Solo Leveling',
      bayesianRating: 4.90,
      totalVotes: 121
    };

    service.submitRating(1, 5).subscribe((manhua) => {
      expect(manhua.bayesianRating).toBe(4.90);
      expect(manhua.totalVotes).toBe(121);
    });

    const req = httpMock.expectOne('/api/ratings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ canonicalManhuaId: 1, score: 5 });
    req.flush(mockManhua);
  });

  it('should get current user rating for a manhua', () => {
    const mockResponse: UserRatingResponse = {
      canonicalManhuaId: 1,
      score: 5
    };

    service.getUserRating(1).subscribe((resp) => {
      expect(resp.score).toBe(5);
    });

    const req = httpMock.expectOne('/api/ratings/me/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should record a view for chapter tracking', () => {
    service.recordView(1).subscribe((resp) => {
      expect(resp.status).toBe('recorded');
    });

    const req = httpMock.expectOne('/api/reader/view');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ canonicalManhuaId: 1 });
    req.flush({ status: 'recorded' });
  });
});
