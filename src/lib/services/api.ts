import type {
    Drama,
    Episode,
    QualityOption,
    DramaDetailResponse,
    EpisodeResponse,
    PlayResponse,
    CategoryType
} from '$lib/types';
import { fixUrl, parseRating, parseYear } from '$lib/utils/helpers';

// API base URL (through Vercel proxy)
const API_BASE = '/api';

/**
 * Normalize drama data from various API response formats
 */
function normalizeDrama(data: DramaDetailResponse): Drama {
    return {
        bookId: data.bookId || data.bookid || '',
        bookName: data.bookName || data.bookname || 'Unknown',
        cover: fixUrl(data.coverWap || data.cover || data.coverUrl),
        introduction: data.introduction || data.description || '',
        rating: parseRating(data.rating || data.score),
        genres: data.genres || data.tags || [],
        status: data.finished === false || data.status === 'Ongoing' ? 'Ongoing' : 'Completed',
        year: parseYear(data.year || data.releaseYear),
        latestEpisode: data.latestChapter || data.chapterCount || data.totalChapter || 0,
        chapterCount: data.chapterCount || data.totalChapter,
        viewCount: data.viewCount || data.playCount,
        cornerLabel: data.cornerLabel
    };
}

/**
 * Normalize episode data
 */
function normalizeEpisode(data: EpisodeResponse, index: number): Omit<Episode, 'videoUrl' | 'qualityOptions'> {
    return {
        chapterId: data.chapterId || data.chapterid || data.id || `ep-${index}`,
        chapterIndex: data.chapterIndex || data.index || index,
        chapterName: data.chapterName || data.name || data.title || `Episode ${index + 1}`,
        cover: fixUrl(data.cover || data.coverUrl)
    };
}

/**
 * Extract video URLs from play response
 */
function extractVideoUrls(data: PlayResponse): QualityOption[] {
    const options: QualityOption[] = [];

    // Try cdnList first
    if (data.cdnList && data.cdnList.length > 0) {
        const cdn = data.cdnList[0];
        if (cdn.videoPathList) {
            cdn.videoPathList.forEach((path, idx) => {
                const url = path.videoPath || path.path || path.url;
                if (url) {
                    options.push({
                        quality: path.definition || path.quality || 720,
                        videoUrl: fixUrl(url),
                        isDefault: idx === 0
                    });
                }
            });
        }
    }

    // Fallback to direct URL
    if (options.length === 0) {
        const url = data.videoUrl || data.url;
        if (url) {
            options.push({
                quality: 720,
                videoUrl: fixUrl(url),
                isDefault: true
            });
        }
    }

    // Sort by quality (prefer 720p as default)
    return options.sort((a, b) => {
        if (a.quality === 720) return -1;
        if (b.quality === 720) return 1;
        return a.quality - b.quality;
    });
}

/**
 * Fetch with error handling
 */
async function fetchApi<T>(endpoint: string, provider: 'primary' | 'secondary' = 'primary'): Promise<T> {
    const url = `${API_BASE}/${endpoint}${endpoint.includes('?') ? '&' : '?'}provider=${provider}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// ============= PUBLIC API FUNCTIONS =============

/**
 * Get drama details by ID
 */
export async function getDramaDetail(bookId: string): Promise<Drama> {
    const data = await fetchApi<DramaDetailResponse>(`detail?bookId=${bookId}`);
    return normalizeDrama(data);
}

/**
 * Get all episodes for a drama
 */
export async function getAllEpisodes(bookId: string): Promise<Array<Omit<Episode, 'videoUrl' | 'qualityOptions'>>> {
    const data = await fetchApi<EpisodeResponse[]>(`allepisode?bookId=${bookId}`);

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((ep, idx) => normalizeEpisode(ep, idx));
}

/**
 * Get video stream URL for an episode
 */
export async function getStreamUrl(bookId: string, episode: number): Promise<QualityOption[]> {
    const data = await fetchApi<PlayResponse>(`play?bookId=${bookId}&episode=${episode}`);
    return extractVideoUrls(data);
}

/**
 * Get trending dramas
 */
export async function getTrending(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('trending');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get popular dramas
 */
export async function getPopular(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('populersearch');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get latest dramas
 */
export async function getLatest(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('latest');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get personalized recommendations
 */
export async function getForYou(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('foryou');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get VIP content with pagination
 */
export async function getVip(page = 1): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>(`vip?page=${page}`);

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get Indonesian dubbed content
 */
export async function getDubIndo(classify = 'all', page = 1): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>(`dubindo?classify=${classify}&page=${page}`);

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Search dramas
 */
export async function searchDramas(query: string): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>(`search?query=${encodeURIComponent(query)}`);

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get dramas by category type
 */
export async function getDramasByCategory(type: CategoryType, page = 1): Promise<Drama[]> {
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
