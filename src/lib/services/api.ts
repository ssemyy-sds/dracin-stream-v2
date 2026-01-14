import type {
    Drama,
    Episode,
    QualityOption,
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
        // Handle object array [{ tagName: "Action" }] or string array
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
            const unit = match[2]?.toUpperCase();
            if (unit === 'M') num *= 1000000;
            if (unit === 'K') num *= 1000;
            viewCount = Math.round(num);
        }
    }

    // Handle bookId variants
    const bookId = data.id || data.bookId || data.bookid || '';

    // Handle bookName variants
    const bookName = data.name || data.bookName || data.bookname || 'Unknown';

    // Handle cover variants
    const cover = fixUrl(data.cover || data.coverWap || data.coverUrl || '');

    // Handle introduction variants
    const introduction = data.introduction || data.description || '';

    // Handle corner label
    const cornerLabel = data.cornerName || data.cornerLabel;

    return {
        bookId: String(bookId),
        bookName,
        cover,
        introduction,
        rating: parseRating(data.rating || data.score),
        genres,
        status: data.finished === false || data.status === 'Ongoing' ? 'Ongoing' : 'Completed',
        year: parseYear(data.year || data.releaseYear || 0),
        latestEpisode: data.latestChapter || data.chapterCount || data.totalChapter || 0,
        chapterCount: data.chapterCount || data.totalChapter,
        viewCount: Number(viewCount) || 0,
        cornerLabel
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

    const url = `${API_BASE}/${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // The secondary API responses often have a { data: ... } wrapper
    // But sometimes we need the whole object (like for download/${bookId})
    // For list endpoints (home, recommend), it usually returns { data: [ ... ] } or just [ ... ]
    // We'll let the caller handle specific structures if needed, but here's a generic unwrap if it's a simple data wrapper
    if (result && typeof result === 'object' && 'data' in result && !result.info) {
        // Special case: if it has 'info' it's likely the download endpoint which we need both info and data from
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
    try {
        // Fetch from download/${bookId} to get info and episodes
        const downloadData = await fetchApi<any>(`download/${bookId}`);

        let dramaInfo = null;

        if (downloadData && downloadData.info) {
            dramaInfo = downloadData.info;
        }

        // To ensure we have full metadata (sometimes missing in download info), 
        // we can try to fetch from search if info is sparse, but for now let's rely on info
        // and if it's missing crucial fields, the UI might handle it or we can do a fallback search.
        // However, per instructions, we map id->bookId, name->bookName etc.

        if (dramaInfo) {
            // Apply normalization
            const drama = normalizeDrama(dramaInfo);
            // Ensure chapterCount is correct from data length if available
            if (downloadData.data && Array.isArray(downloadData.data)) {
                drama.chapterCount = downloadData.data.length;
                drama.latestEpisode = downloadData.data.length;
            }
            return drama;
        }

        return normalizeDrama({ id: bookId, name: 'Unknown' });
    } catch (e) {
        console.error('getDramaDetail error:', e);
        return normalizeDrama({ id: bookId });
    }
}

/**
 * Get all episodes for a drama
 */
export async function getAllEpisodes(bookId: string): Promise<Array<Omit<Episode, 'videoUrl' | 'qualityOptions'>>> {
    try {
        const data = await fetchApi<any>(`download/${bookId}`);

        // Episodes are in data.data
        let chapters = [];
        if (data && Array.isArray(data.data)) {
            chapters = data.data;
        } else if (Array.isArray(data)) {
            chapters = data;
        }

        if (chapters.length > 0) {
            return chapters.map((ep: any, idx: number) => normalizeEpisode(ep, idx));
        }

        return [];
    } catch (e) {
        console.error('getAllEpisodes error:', e);
        return [];
    }
}

/**
 * Get video stream URL for an episode
 */
export async function getStreamUrl(bookId: string, episodeNum: number): Promise<QualityOption[]> {
    try {
        const data = await fetchApi<any>(`download/${bookId}`);

        // Find episode
        let chapters = [];
        if (data && Array.isArray(data.data)) {
            chapters = data.data;
        }

        if (chapters.length === 0) return [];

        // Find by chapterIndex (1-based usually) or just index
        // The API usually returns chapterIndex matching the episode number
        const episode = chapters.find((ch: any) => ch.chapterIndex === episodeNum) || chapters[episodeNum - 1];

        if (!episode) return [];

        const url = episode.videoPath || episode.url || episode.path;
        if (url) {
            return [{
                quality: 720, // Default to 720 as generic
                videoUrl: fixUrl(url),
                isDefault: true
            }];
        }

        return [];
    } catch (e) {
        console.error('getStreamUrl error:', e);
        return [];
    }
}

/**
 * Get trending dramas -> map to Home
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
 * Get personalized recommendations -> map to Recommend
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
        return [];
    } catch (e) {
        console.error('getVip error:', e);
        return [];
    }
}

/**
 * Get Indonesian dubbed content -> map to Home
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
        if (Array.isArray(data)) return data.map(normalizeDrama);
        // If data is wrapped
        if (data && (data as any).list && Array.isArray((data as any).list)) {
            return (data as any).list.map(normalizeDrama);
        }
        return [];
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
