export interface ChapterImage {
  index: number;
  url: string;
  proxyUrl: string;
}

export interface ChapterImagesResponse {
  canonicalManhuaId: number;
  slug: string;
  title: string;
  chapter: number;
  lastChapter?: number;
  totalImages: number;
  images: ChapterImage[];
  isOffline?: boolean;
}
