import { CanonicalManhua } from './catalog.model';

export type RankingType = 'top_rated' | 'daily' | 'weekly' | 'all_time';

export interface RankedManhua {
  rank: number;
  score: number;
  canonical: CanonicalManhua;
}

export interface RatingDTO {
  canonicalManhuaId: number;
  score: number; // 1 to 5
}

export interface UserRatingResponse {
  canonicalManhuaId: number;
  score: number | null;
}
