export interface AppNotification {
  id: string;
  userId: string;
  canonicalManhuaId: number;
  chapter: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  manhuaSlug?: string;
  manhuaCoverUrl?: string;
}
