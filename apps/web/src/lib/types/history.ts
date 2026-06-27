export interface History {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  teaser: string;
  genre: string;
  estimatedDurationMinutes: number;
  isFree: boolean;
  coverImageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface HistoryDetail extends History {
  opening: string;
  objective: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
