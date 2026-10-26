export interface ImportDomain {
  domain: string;
  name: string;
  supported: boolean;
}

export interface ImportAnnotatedItem {
  title: string;
  slug: string;
  urlTemplate: string;
  coverUrl: string;
  lastChapter?: number;
  primaryDomain: string;
  synopsis?: string;
  alreadyInCatalog: boolean;
  alreadyInLibrary: boolean;
}

export interface ImportBrowseResponse {
  domain: string;
  page: number;
  totalPages: number;
  items: ImportAnnotatedItem[];
}

export interface ImportResult {
  status: string;
  importedCount: number;
  addedToLibraryCount: number;
}
