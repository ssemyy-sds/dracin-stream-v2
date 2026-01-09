// Drama interfaces
export interface Drama {
    bookId: string;
    bookName: string;
    cover: string;
    introduction: string;
    rating: number;
    genres: string[];
    status: 'Ongoing' | 'Completed';
    year: number;
    latestEpisode: number;
    chapterCount?: number;
    viewCount?: number;
    cornerLabel?: string;
}

// Video quality option
export interface QualityOption {
    quality: number;      // 720, 1080, etc.
    videoUrl: string;
    isDefault?: boolean;
}

// Episode interface
export interface Episode {
    chapterId: string;
    chapterIndex: number;
    chapterName: string;
    cover?: string;
    videoUrl: string;     // Default quality URL
    qualityOptions: QualityOption[];
}

// Favorite item extends Drama with timestamp
export interface FavoriteItem extends Drama {
    addedAt: number;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

// Drama detail response from API
export interface DramaDetailResponse {
    bookId?: string;
    bookid?: string;
    bookName?: string;
    bookname?: string;
    cover?: string;
    coverWap?: string;
    coverUrl?: string;
    introduction?: string;
    description?: string;
    rating?: number;
    score?: number;
    genres?: string[];
    tags?: string[];
    status?: string;
    finished?: boolean;
    year?: number;
    releaseYear?: number;
    chapterCount?: number;
    totalChapter?: number;
    latestChapter?: number;
    viewCount?: number;
    playCount?: number;
    cornerLabel?: string;
}

// Episode list response
export interface EpisodeResponse {
    chapterId?: string;
    chapterid?: string;
    id?: string;
    chapterIndex?: number;
    index?: number;
    chapterName?: string;
    name?: string;
    title?: string;
    cover?: string;
    coverUrl?: string;
    cdnList?: CdnItem[];
}

// Play response with CDN list
export interface PlayResponse {
    cdnList?: CdnItem[];
    videoUrl?: string;
    url?: string;
}

export interface CdnItem {
    cdnType?: string;
    cdnDomain?: string;
    videoPathList?: VideoPath[];
}

export interface VideoPath {
    definition?: number;
    quality?: number;
    videoPath?: string;
    path?: string;
    url?: string;
}

// Category types
export type CategoryType = 'trending' | 'foryou' | 'latest' | 'vip' | 'dubindo' | 'populersearch';
