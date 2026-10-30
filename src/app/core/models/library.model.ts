import { CanonicalManhua } from './catalog.model';

export interface UserLibrary {
  id: string;
  userId: string;
  canonicalManhuaId: number;
  currentChapter: number;
  isFavorite: boolean;
  customOrder: number;
  createdAt: string;
  updatedAt: number;
  canonicalManhua?: CanonicalManhua;
}

export interface AddToLibraryDTO {
  canonicalManhuaId: number;
  currentChapter?: number;
  isFavorite?: boolean;
}

export interface UpdateProgressDTO {
  currentChapter: number;
}

export interface ToggleFavoriteDTO {
  isFavorite: boolean;
}

export interface ReorderLibraryDTO {
  itemIds: string[];
}
