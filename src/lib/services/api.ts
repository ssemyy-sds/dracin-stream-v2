import type {
    Drama,
    Episode,
    QualityOption,
    DramaDetailResponse,
    EpisodeResponse,
    CategoryType
} from '$lib/types';
import { fixUrl, parseRating, parseYear } from '$lib/utils/helpers';

// API base URL (through Vercel proxy)
const API_BASE = '/api';

/**
 * Normalize drama data from various API response formats
 */
function normalizeDrama(data: any): Drama {
    // Handle genres/tags
    let genres: string[] = [];
    if (data.tags && Array.isArray(data.tags)) {
        genres = data.tags.map((t: any) => typeof t === 'string' ? t : t.tagName || '').filter(Boolean);
    } else if (data.tagNameList && Array.isArray(data.tagNameList)) {
        genres = data.tagNameList;
    } else if (data.genres && Array.isArray(data.genres)) {
        genres = data.genres;
    }

    // Parse viewCount
    let viewCount = data.viewCount || data.playCount;
    if (typeof viewCount === 'string') {
        const match = viewCount.match(/(\d+\.?\d*)(M|K)?/i);
        if (match) {
            let num = parseFloat(match[1]);
            if (match[2]?.toUpperCase() === 'M') num *= 1000000;
            if (match[2]?.toUpperCase() === 'K') num *= 1000;
            viewCount = Math.round(num);
        }
    }

    return {
        bookId: data.bookId || data.bookid || data.id || '',
        bookName: data.bookName || data.bookname || data.name || 'Unknown',
        cover: fixUrl(data.coverWap || data.cover || data.coverUrl || ''),
        introduction: data.introduction || data.description || '',
        rating: parseRating(data.rating || data.score),
        genres,
        status: data.finished === false || data.status === 'Ongoing' ? 'Ongoing' : 'Completed',
        year: parseYear(data.year || data.releaseYear || 0),
        latestEpisode: data.latestChapter || data.chapterCount || data.totalChapter || 0,
        chapterCount: data.chapterCount || data.totalChapter,
        viewCount,
        cornerLabel: data.cornerLabel || data.cornerName
    };
}

/**
 * Normalize episode data
 */
function normalizeEpisode(data: any, index: number): Omit<Episode, 'videoUrl' | 'qualityOptions'> {
    return {
        chapterId: data.chapterId || data.chapterid || data.id || `ep-${index}`,
        chapterIndex: data.chapterIndex || data.index || index,
        chapterName: data.chapterName || data.name || data.title || `Episode ${index + 1}`,
        cover: fixUrl(data.cover || data.coverUrl || '')
    };
}

/**
 * Fetch with error handling
 */
async function fetchApi<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const queryParams = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
    );

    // We strictly use the proxy which is now hardcoded to the secondary API
    // We don't need to send 'provider' anymore as the proxy ignores it, but it doesn't hurt.
    const url = `${API_BASE}/${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Handle wrapper: { success: true, data: [...] } if present
    if (result && typeof result === 'object' && 'data' in result && !Array.isArray(result)) {
        return result.data as T;
    }

    return result as T;
}

// ============= PUBLIC API FUNCTIONS =============

/**
 * Get home data (featured dramas)
 */
export async function getHome(page = 1): Promise<Drama[]> {
    try {
        const data = await fetchApi<any[]>('home', { page });
        if (!Array.isArray(data)) return [];
        return data.map(normalizeDrama);
    } catch (e) {
        console.error('getHome error:', e);
        return [];
    }
}

/**
 * Get recommended dramas
 */
export async function getRecommend(page = 1): Promise<Drama[]> {
    try {
        const data = await fetchApi<any[]>('recommend', { page });
        if (!Array.isArray(data)) return [];
        return data.map(normalizeDrama);
    } catch (e) {
        console.error('getRecommend error:', e);
        return [];
    }
}

/**
 * Get drama details by ID
 */
export async function getDramaDetail(bookId: string): Promise<Drama> {
    // The secondary API uses 'chapters/{bookId}' for details + chapters
    // Or sometimes just 'detail'? 
    // Todo.md says: Call `chapters/${bookId}` and return normalized data.
    const data = await fetchApi<any>(`chapters/${bookId}`);
    return normalizeDrama(data);
}

/**
 * Get all episodes for a drama
 */
export async function getAllEpisodes(bookId: string): Promise<Array<Omit<Episode, 'videoUrl' | 'qualityOptions'>>> {
    // Call 'chapters/{bookId}'
    const data = await fetchApi<any>(`chapters/${bookId}`);

    let chapters = [];
    if (Array.isArray(data)) {
        chapters = data;
    } else if (data) {
        if (Array.isArray(data.chapters)) chapters = data.chapters;
        else if (Array.isArray(data.episodes)) chapters = data.episodes;
        else if (Array.isArray(data.list)) chapters = data.list;
    }

    if (chapters.length > 0) {
        return chapters.map((ep: any, idx: number) => normalizeEpisode(ep, idx));
    }

    // Fallback: Generate based on chapterCount if available but no list
    const count = data?.chapterCount || data?.totalChapter || 0;
    if (count > 0) {
        return Array.from({ length: count }, (_, i) => ({
            chapterId: `${i + 1}`,
            chapterIndex: i + 1,
            chapterName: `Episode ${i + 1}`,
            cover: fixUrl(data.cover || '')
        }));
    }

    return [];
}

/**
 * Get video stream URL for an episode
 */
export async function getStreamUrl(bookId: string, episodeNum: number): Promise<QualityOption[]> {
    try {
        const data = await fetchApi<any>(`chapters/${bookId}`);

        // Find episode
        let chapters = [];
        if (Array.isArray(data)) chapters = data;
        else if (data && Array.isArray(data.chapters)) chapters = data.chapters;
        else if (data && Array.isArray(data.episodes)) chapters = data.episodes;

        // If empty or not found, try to see if it's a single video response
        if (chapters.length === 0 && data?.videoPath) {
            return [{
                quality: 720,
                videoUrl: fixUrl(data.videoPath),
                isDefault: true
            }];
        }

        const episodeIndex = Math.max(0, episodeNum - 1);
        const episode = chapters[episodeIndex];

        if (!episode) return [];

        // Check for videoPath in episode
        const url = episode.videoPath || episode.url || episode.path;
        if (url) {
            return [{
                quality: 720, // Default 720
                videoUrl: fixUrl(url),
                isDefault: true
            }];
        }

        // If we still have cdnList logic from old API, we can keep it just in case
        if (episode.cdnList) {
            // ... extractVideoUrls logic would go here if needed, but secondary API seems to use videoPath
        }

        return [];
    } catch (e) {
        console.error('getStreamUrl error:', e);
        return [];
    }
}

/**
 * Get trending dramas -> map to Home/Recommend
 */
export async function getTrending(): Promise<Drama[]> {
    return getHome();
}

/**
 * Get popular dramas -> map to Recommend
 */
export async function getPopular(): Promise<Drama[]> {
    return getRecommend();
}

/**
 * Get latest dramas -> map to Home
 */
export async function getLatest(): Promise<Drama[]> {
    return getHome();
}

/**
 * Get personalized recommendations
 */
export async function getForYou(): Promise<Drama[]> {
    return getRecommend();
}

/**
 * Get VIP content
 */
export async function getVip(page = 1): Promise<Drama[]> {
    try {
        const data = await fetchApi<any[]>('vip', { page });

        if (Array.isArray(data)) {
            return data.map(normalizeDrama);
        }

        // Handle nested structure if any (legacy from primary API, likely not needed for secondary but safe to keep check)
        if (data && (data as any).columnVoList) {
            // ...
        }

        return [];
    } catch (e) {
        console.error('getVip error:', e);
        return [];
    }
}

/**
 * Get Indonesian dubbed content
 * Secondary API might not have this, fallback to Home
 */
export async function getDubIndo(classify = 'all', page = 1): Promise<Drama[]> {
    return getHome(page);
}

/**
 * Search dramas
 */
export async function searchDramas(query: string): Promise<Drama[]> {
    try {
        const data = await fetchApi<any[]>('search', { keyword: query });
        if (!Array.isArray(data)) return [];
        return data.map(normalizeDrama);
    } catch (e) {
        console.error('searchDramas error:', e);
        return [];
    }
}

/**
 * Get Categories
 */
export interface Category {
    id: number;
    name: string;
    replaceName?: string;
}

export async function getCategories(): Promise<Category[]> {
    try {
        const data = await fetchApi<Category[]>('categories');
        if (!Array.isArray(data)) return [];
        return data;
    } catch (e) {
        return [];
    }
}

/**
 * Get Dramas by category (or type)
 */
export async function getDramasByCategory(type: CategoryType | string, page = 1): Promise<Drama[]> {
    // If type is a number (category ID)
    if (!isNaN(Number(type))) {
        return getCategory(Number(type), page);
    }

    switch (type) {
        case 'trending':
            return getTrending();
        case 'foryou':
            return getForYou();
        case 'latest':
            return getLatest();
        case 'vip':
            return getVip(page);
        case 'dubindo':
            return getDubIndo('all', page);
        case 'populersearch':
            return getPopular();
        default:
            return getTrending();
    }
}

export async function getCategory(categoryId: number, page = 1): Promise<Drama[]> {
    try {
        const data = await fetchApi<any[]>('categories', { categoryId, page });
        if (!Array.isArray(data)) return [];
        return data.map(normalizeDrama);
    } catch (e) {
        return [];
    }
}
